import Chat from '../models/chat'
import mongoose from 'mongoose'
import { Chat as ChatType } from '../types/chat'
import { FastifyInstance } from 'fastify'

let fastify: FastifyInstance
export function setFastifyInstance(f: FastifyInstance) {
  fastify = f
  
  // 临时修复：删除有问题的索引
  fixChatIndexes();
  
  // 检查 ES 连接
  checkElasticsearchConnection();
}

async function checkElasticsearchConnection() {
  try {
    if (!fastify.elasticsearch) {
      fastify.log.warn('Elasticsearch 客户端未初始化');
      return;
    }
    
    const health = await fastify.elasticsearch.cluster.health();
    fastify.log.info('Elasticsearch 连接状态:', {
      status: health.status,
      cluster_name: health.cluster_name,
      number_of_nodes: health.number_of_nodes
    });
    
    // 检查索引是否存在
    const chatIndexExists = await fastify.elasticsearch.indices.exists({ index: 'chats' });
    fastify.log.info('chats 索引状态:', { exists: chatIndexExists });
    
    if (!chatIndexExists) {
      fastify.log.info('创建 chats 索引');
      await fastify.elasticsearch.indices.create({
        index: 'chats',
        body: {
          mappings: {
            properties: {
              questionUsername: { type: 'keyword' },
              answerUsername: { type: 'keyword' },
              content: { type: 'text' },
              community: { type: 'keyword' },
              tags: { type: 'keyword' },
              status: { type: 'keyword' },
              createdAt: { type: 'date' },
              updatedAt: { type: 'date' }
            }
          }
        }
      });
    }
  } catch (error: any) {
    fastify.log.error('Elasticsearch 连接检查失败:', {
      errorMessage: error.message,
      errorType: error.constructor.name,
      errorCode: error.code
    });
  }
}

async function fixChatIndexes() {
  try {
    // 尝试删除有问题的索引
    await Chat.collection.dropIndex('chatId_1');
    fastify.log.info('成功删除有问题的 chatId 索引');
  } catch (error: any) {
    if (error.code === 27) {
      fastify.log.info('chatId 索引不存在，无需删除');
    } else {
      fastify.log.error('删除 chatId 索引失败:', error);
    }
  }
}

export async function saveChat(chatData: ChatType) {
  let chat = chatData._id ? await Chat.findById(chatData._id) : null
  
  // 验证必需字段
  if (!chatData.questionUsername || !chatData.answerUsername || !chatData.community) {
    throw new Error('提问者用户名、回答者用户名和社区不能为空');
  }
  
  // 根据用户名查找用户ID
  const User = require('../models/user').default;
  const [questioner, answerer] = await Promise.all([
    User.findOne({ username: chatData.questionUsername }),
    User.findOne({ username: chatData.answerUsername })
  ]);
  
  if (!questioner) {
    throw new Error(`提问者用户不存在: ${chatData.questionUsername}`);
  }
  if (!answerer) {
    throw new Error(`回答者用户不存在: ${chatData.answerUsername}`);
  }
  
  const messages = await Promise.all(
    chatData.messages.map(async msg => {
      const sender = await User.findOne({ username: msg.senderUsername });
      if (!sender) {
        throw new Error(`消息发送者用户不存在: ${msg.senderUsername}`);
      }
      return {
        senderId: sender._id,
        senderUsername: msg.senderUsername,
        content: msg.content,
        timestamp: msg.timestamp || new Date()
      };
    })
  );
  
  if (chat) {
    chat.questionUserId = questioner._id
    chat.questionUsername = chatData.questionUsername
    chat.answerUserId = answerer._id
    chat.answerUsername = chatData.answerUsername
    chat.content = chatData.content || ''
    chat.community = chatData.community
    chat.tags = chatData.tags || []
    chat.status = chatData.status || chat.status || 'ongoing'
    chat.set('messages', messages, { strict: true })
    await chat.save()
  } else {
    chat = new Chat({
      questionUserId: questioner._id,
      questionUsername: chatData.questionUsername,
      answerUserId: answerer._id,
      answerUsername: chatData.answerUsername,
      content: chatData.content || '',
      community: chatData.community,
      tags: chatData.tags || [],
      status: chatData.status || 'ongoing',
      messages
    })
    await chat.save()
  }
  // 同步到 ES - 移除 _id 字段
  try {
    if (!fastify.elasticsearch) {
      fastify.log.warn('ES 客户端未初始化，跳过同步');
      return chat;
    }
    
    const chatDoc = chat.toObject() as any;
    delete chatDoc._id;
    delete chatDoc.__v;
    
    await fastify.elasticsearch.index({
      index: 'chats',
      id: chat._id.toString(),
      document: chatDoc
    });
    
    fastify.log.info('ES 同步成功:', { chatId: chat._id.toString() });
  } catch (error: any) {
    fastify.log.error('ES 同步失败:', {
      errorMessage: error.message,
      errorType: error.constructor.name,
      statusCode: error.statusCode,
      chatId: chat._id.toString()
    });
  }
  
  return chat
}

export async function getChatById(_id: string) {
  try {
    if (!fastify.elasticsearch) {
      fastify.log.warn('ES 客户端未初始化，直接使用 MongoDB');
      throw new Error('ES unavailable');
    }
    
    const result = await fastify.elasticsearch.get({
      index: 'chats',
      id: _id
    });
    
    if (result && result.found) {
      fastify.log.info('ES 查询成功:', { chatId: _id });
      return result._source;
    }
  } catch (error: any) {
    fastify.log.error('ES 查询失败，回退到 MongoDB:', {
      errorMessage: error.message,
      errorType: error.constructor.name,
      statusCode: error.statusCode,
      chatId: _id
    });
  }
  
  // 回退到 MongoDB，并populate用户信息
  const chat = await Chat.findById(_id)
    .populate('questionUserId', 'username avatar email')
    .populate('answerUserId', 'username avatar email')
    .populate('messages.senderId', 'username avatar')
    .lean();
    
  if (!chat) throw new Error('对话不存在');
  return chat;
}

// 合并后的通用查询函数
export async function getChatsByConditions(
  user: any, 
  options: {
    status?: 'ongoing' | 'completed';
    role?: 'questioner' | 'answerer';
    community?: string;
  } = {}
) {
  let username = user.username || user.name;
  const { status, role, community } = options;
  
  // 如果没有username但有userId，通过userId查找username
  if (!username && user.userId) {
    try {
      const User = require('../models/user').default;
      const userDoc = await User.findById(user.userId).select('username').lean();
      if (userDoc) {
        username = userDoc.username;
        console.log('=== 通过userId找到username ===', { userId: user.userId, username });
      } else {
        console.log('=== 未找到用户 ===', { userId: user.userId });
        throw new Error('用户不存在');
      }
    } catch (error: any) {
      console.error('=== 查找用户失败 ===', { userId: user.userId, error: error.message });
      throw new Error('获取用户信息失败');
    }
  }
  
  if (!username) {
    console.log('=== 无法获取用户名 ===', { user });
    throw new Error('无法获取用户信息');
  }
  
  console.log('=== 开始获取对话列表 ===', { 
    username, 
    status, 
    role,
    community,
    hasES: !!fastify.elasticsearch,
    userObject: user,
    resolvedUsername: username
  });
  
  // 直接跳到 MongoDB 查询进行调试
  try {
    console.log('=== 跳过 ES，直接使用 MongoDB 调试 ===');
    
    // 先检查数据库中的总对话数
    const totalChats = await Chat.countDocuments();
    console.log('=== 数据库总对话数 ===', totalChats);
    
    // 检查所有对话的样本数据
    const allChats = await Chat.find({
      questionUsername: username
    })
      .select('questionUsername answerUsername community status createdAt')
      .limit(5)
      .lean();
    
    console.log('=== 数据库中的对话样本 ===');
    allChats.forEach((chat, index) => {
      console.log(`Chat ${index + 1}:`, {
        id: chat._id.toString(),
        questionUsername: chat.questionUsername,
        answerUsername: chat.answerUsername,
        community: chat.community,
        status: chat.status,
        createdAt: chat.createdAt
      });
    });
    
    // 检查特定用户的对话
    const userChats = await Chat.find({
      $or: [
        { questionUsername: username },
        { answerUsername: username }
      ]
    })
    .select('questionUsername answerUsername community status createdAt')
    .limit(10)
    .lean();
    
    console.log('=== 用户相关对话 ===', `用户: ${username}, 数量: ${userChats.length}`);
    userChats.forEach((chat, index) => {
      console.log(`用户对话 ${index + 1}:`, {
        id: chat._id.toString(),
        questionUsername: chat.questionUsername,
        answerUsername: chat.answerUsername,
        community: chat.community,
        status: chat.status,
        isQuestioner: chat.questionUsername === username,
        isAnswerer: chat.answerUsername === username
      });
    });
    
    // 现在构建实际查询
    const query: any = {};
    
    // 构建 MongoDB 查询条件
    if (status) {
      query.status = status;
    }
    
    if (community) {
      query.community = community;
    }
    
    if (role === 'questioner') {
      query.questionUsername = username;
    } else if (role === 'answerer') {
      query.answerUsername = username;
    } else {
      query.$or = [
        { questionUsername: username },
        { answerUsername: username }
      ];
    }
    
    console.log('=== 最终查询条件 ===', JSON.stringify(query, null, 2));
    console.log('查询参数:', { username, status, role, community });
    
    const chats = await Chat.find(query)
      .select('-messages')
      .sort({ updatedAt: -1 })
      .limit(100)
      .lean();

    console.log('=== 查询结果 ===', `结果数量: ${chats.length}`);
    chats.slice(0, 3).forEach((chat, index) => {
      console.log(`结果 ${index + 1}:`, {
        id: chat._id.toString(),
        questionUsername: chat.questionUsername,
        answerUsername: chat.answerUsername,
        community: chat.community,
        status: chat.status,
        tags: chat.tags || [],
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt
      });
    });

    return chats.map((chat: any) => {
      const isQuestioner = chat.questionUsername === username;
      
      return {
        _id: chat._id.toString(),
        content: chat.content,
        community: chat.community,
        tags: chat.tags || [],
        status: chat.status,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
        role: isQuestioner ? 'questioner' : 'answerer',
        partnerUsername: isQuestioner ? chat.answerUsername : chat.questionUsername,
        messageCount: 0
      };
    });
  } catch (mongoError: any) {
    console.error('=== MongoDB 查询失败 ===', {
      errorMessage: mongoError.message,
      errorName: mongoError.name,
      errorCode: mongoError.code,
      queryParams: { username, status, role, community }
    });
    throw new Error(`数据库查询失败: ${mongoError.message}`);
  }
}

// 新增：根据社区获取对话
export async function getChatsByCommunity(community: string) {
  try {
    if (!fastify.elasticsearch) {
      throw new Error('ES unavailable');
    }
    
    const result = await fastify.elasticsearch.search({
      index: 'chats',
      body: {
        query: {
          term: { community }
        },
        sort: [{ updatedAt: { order: 'desc' } }],
        size: 1000,
        _source: {
          excludes: ['messages']
        }
      }
    });
    
    if (result.hits.hits.length > 0) {
      fastify.log.info('ES 社区对话查询成功:', { 
        community, 
        hitCount: result.hits.hits.length 
      });
      return result.hits.hits.map((hit: any) => ({
        _id: hit._id,
        ...hit._source
      }));
    }
  } catch (error: any) {
    fastify.log.error('ES 社区对话查询失败，回退到 MongoDB:', {
      errorMessage: error.message,
      community
    });
  }
  
  // 回退到 MongoDB
  const chats = await Chat.find({ community })
    .select('-messages')
    .sort({ updatedAt: -1 })
    .limit(1000)
    .lean();
    
  return chats.map((chat: any) => ({
    ...chat,
    _id: chat._id.toString()
  }));
}

// 为了向后兼容，保留原有函数作为简单的包装器
export async function getChatsByStatus(user: any, status: 'ongoing' | 'completed') {
  return getChatsByConditions(user, { status });
}

export async function getChatsByUserRole(user: any, role: 'questioner' | 'answerer', status?: 'ongoing' | 'completed') {
  return getChatsByConditions(user, { role, status });
}

export async function updateChatStatus(chatId: string, status: 'ongoing' | 'completed') {
  // 先获取完整的对话数据
  const existingChat = await Chat.findById(chatId);
  if (!existingChat) {
    throw new Error('对话不存在');
  }
  
  // 只更新状态字段
  const chat = await Chat.findByIdAndUpdate(
    chatId,
    { status },
    { new: true }
  );
  
  // 同步到 ES - 使用增量更新
  try {
    await fastify.elasticsearch.update({
      index: 'chats',
      id: chatId,
      doc: { 
        status,
        updatedAt: new Date()
      }
    });
    fastify.log.info(`ES 状态更新成功: ${chatId} -> ${status}`);
  } catch (error) {
    fastify.log.error('ES 状态更新失败:', error);
    
    // 如果 ES 更新失败，尝试重新索引整个文档
    try {
      if (chat) {
        const chatDoc = chat.toObject() as any;
        delete chatDoc._id;
        delete chatDoc.__v;
        
        await fastify.elasticsearch.index({
          index: 'chats',
          id: chatId,
          document: chatDoc
        });
        fastify.log.info(`ES 重新索引成功: ${chatId}`);
      }
    } catch (reindexError) {
      fastify.log.error('ES 重新索引也失败:', reindexError);
    }
  }
  
  return chat;
}

// 新增：专门用于添加消息的增量更新函数
export async function addMessageToChat(chatId: string, senderUsername: string, content: string) {
  const chat = await Chat.findById(chatId);
  if (!chat) {
    throw new Error('对话不存在');
  }
  
  // 根据用户名查找用户ID
  const User = require('../models/user').default;
  const sender = await User.findOne({ username: senderUsername });
  if (!sender) {
    throw new Error('发送者用户不存在');
  }
  
  const senderId = sender._id.toString();
  
  // 验证发送者是对话参与者（通过ID验证）
  const isParticipant = chat.questionUserId.toString() === senderId || 
                       chat.answerUserId.toString() === senderId;
  if (!isParticipant) {
    throw new Error('无权限向此对话发送消息');
  }
  
  // 检查对话状态
  if (chat.status === 'completed') {
    throw new Error('对话已结束，无法发送消息');
  }
  
  const newMessage = {
    senderId: new mongoose.Types.ObjectId(senderId),
    senderUsername,
    content,
    timestamp: new Date()
  };
  
  // 使用 $push 操作符进行增量更新
  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    { 
      $push: { messages: newMessage },
      updatedAt: new Date()
    },
    { new: true }
  );
  
  // ES 增量更新 - 只更新消息数组和更新时间
  if (!updatedChat) {
    throw new Error('更新对话失败');
  }
  try {
    await fastify.elasticsearch.update({
      index: 'chats',
      id: chatId,
      doc: {
        messages: updatedChat.messages,
        updatedAt: updatedChat.updatedAt
      }
    });
    fastify.log.info(`ES 消息更新成功: ${chatId}`);
  } catch (error) {
    fastify.log.error('ES 消息更新失败:', error);
    
    // 回退：重新索引整个文档
    try {
      const chatDoc = updatedChat.toObject() as any;
      delete chatDoc._id;
      delete chatDoc.__v;
      
      await fastify.elasticsearch.index({
        index: 'chats',
        id: chatId,
        document: chatDoc
      });
      fastify.log.info(`ES 重新索引成功: ${chatId}`);
    } catch (reindexError) {
      fastify.log.error('ES 重新索引失败:', reindexError);
    }
  }
  
  return updatedChat;
}

// 获取用户完整的对话信息（包含用户详情）
export async function getChatWithUserDetails(chatId: string) {
  const chat = await Chat.findById(chatId)
    .populate('questionUserId', 'username avatar email bio')
    .populate('answerUserId', 'username avatar email bio')
    .populate('messages.senderId', 'username avatar')
    .lean();
    
  if (!chat) {
    throw new Error('对话不存在');
  }
  
  return chat;
}

// 新增：获取用户的详细统计信息
export async function getChatStatsForUser(username: string) {
  try {
    const stats = {
      totalChats: await Chat.countDocuments({
        $or: [
          { questionUsername: username },
          { answerUsername: username }
        ]
      }),
      asQuestioner: await Chat.countDocuments({ questionUsername: username }),
      asAnswerer: await Chat.countDocuments({ answerUsername: username }),
      ongoing: await Chat.countDocuments({
        $or: [
          { questionUsername: username },
          { answerUsername: username }
        ],
        status: 'ongoing'
      }),
      completed: await Chat.countDocuments({
        $or: [
          { questionUsername: username },
          { answerUsername: username }
        ],
        status: 'completed'
      })
    };
    
    fastify.log.info('=== 用户对话统计 ===', { username, stats });
    return stats;
  } catch (error: any) {
    fastify.log.error('=== 获取用户统计失败 ===', { username, error: error.message });
    throw error;
  }
}

// 删除复杂的评价逻辑，替换为简单的计数更新
export async function evaluateUser(data: {
  username: string;
  rating: 'excellent' | 'good' | 'average' | 'poor';
}) {
  const { username, rating } = data;
  
  // 查找用户
  const User = require('../models/user').default;
  const user = await User.findOne({ username });
  if (!user) {
    throw new Error(`用户不存在: ${username}`);
  }
  
  // 更新用户计数
  const updateData: any = {
    $inc: { answerCount: 1 }
  };
  
  // 如果是优秀评价，同时增加高质量回答计数
  if (rating === 'excellent') {
    updateData.$inc.highQualityAnswerCount = 1;
  }
  
  const updatedUser = await User.findByIdAndUpdate(user._id, updateData, { new: true });
  
  fastify.log.info('用户评价更新成功:', {
    username,
    rating,
    newAnswerCount: updatedUser.answerCount,
    newHighQualityCount: updatedUser.highQualityAnswerCount
  });
  
  return {
    message: `用户 ${username} 的计数已更新`,
    stats: {
      answerCount: updatedUser.answerCount,
      highQualityAnswerCount: updatedUser.highQualityAnswerCount,
      isExcellent: rating === 'excellent'
    }
  };
}