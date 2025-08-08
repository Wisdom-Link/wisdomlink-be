import Thread from '../models/thread'
import User from '../models/user'
import { FastifyInstance } from 'fastify'

let fastify: FastifyInstance
export function setFastifyInstance(f: FastifyInstance) {
  fastify = f
  
  // 检查 ES 连接和线程索引
  checkThreadIndexes();
}

async function checkThreadIndexes() {
  try {
    if (!fastify.elasticsearch) {
      fastify.log.warn('Elasticsearch 客户端未初始化');
      return;
    }
    
    // 检查线程索引是否存在
    const threadIndexExists = await fastify.elasticsearch.indices.exists({ index: 'threads' });
    fastify.log.info('threads 索引状态:', { exists: threadIndexExists });
    
    if (!threadIndexExists) {
      fastify.log.info('创建 threads 索引');
      await fastify.elasticsearch.indices.create({
        index: 'threads',
        body: {
          mappings: {
            properties: {
              content: { type: 'text' },
              username: { type: 'keyword' },
              userAvatar: { type: 'keyword' },
              community: { type: 'keyword' },
              location: { type: 'text' },
              tags: { type: 'keyword' },
              createdAt: { type: 'date' },
              userId: { type: 'keyword' }
            }
          }
        }
      });
    }
  } catch (error: any) {
    fastify.log.error('检查 threads 索引失败:', {
      errorMessage: error.message,
      errorType: error.constructor.name
    });
  }
}

export async function saveThread(data: any) {
  const { content, username, community, location, tags, createdAt, userAvatar } = data
  
  // 验证必需字段
  if (!content || !username || !community) {
    throw new Error('帖子内容、用户名和社区不能为空')
  }
  
  // 查找用户，验证用户是否存在
  const user = await User.findOne({ username })
  if (!user) {
    throw new Error('用户不存在')
  }
  
  // 创建帖子
  const thread = new Thread({
    content,
    user: user._id,
    username,
    userAvatar: userAvatar || user.avatar || '', // 优先使用前端传来的头像，其次用用户默认头像
    community,
    location: location || '',
    tags: tags || [],
    createdAt: createdAt ? new Date(createdAt) : new Date() // 使用前端传来的时间或当前时间
  })
  
  await thread.save()
  
  // 更新用户的 posts 数组
  await User.findByIdAndUpdate(user._id, {
    $push: { posts: thread._id }
  })
  
  // 同步到 ES - 不包含 _id 字段
  try {
    if (!fastify.elasticsearch) {
      fastify.log.warn('ES 客户端未初始化，跳过同步');
      return thread;
    }
    
    const threadDoc = {
      content: thread.content,
      username: thread.username,
      userAvatar: thread.userAvatar,
      community: thread.community,
      location: thread.location,
      tags: thread.tags,
      createdAt: thread.createdAt,
      userId: user._id.toString()
    };
    
    await fastify.elasticsearch.index({
      index: 'threads',
      id: thread._id.toString(),
      document: threadDoc
    });
    
    fastify.log.info('ES 同步成功:', { threadId: thread._id.toString() });
  } catch (error: any) {
    fastify.log.error('ES 同步失败:', {
      errorMessage: error.message,
      errorType: error.constructor.name,
      statusCode: error.statusCode,
      threadId: thread._id.toString()
    });
  }
  
  return thread
}

export async function getThreadByContent(content: string) {
  try {
    // 用 ES 搜索
    const result = await fastify.elasticsearch.search({
      index: 'threads',
      query: {
        match: { content }
      }
    });
    
    if (result.hits.hits.length > 0) {
      return result.hits.hits[0]._source;
    }
  } catch (error) {
    fastify.log.error('ES 查询失败，回退到 MongoDB:', error);
  }
  
  // 回退到 MongoDB
  const thread = await Thread.findOne({ content }).lean();
  if (!thread) throw new Error('帖子不存在');
  return {
    ...thread,
    _id: thread._id.toString(),
    userId: thread.user.toString()
  };
}

export async function deleteThreadById(_id: string) {
  // 先查找帖子以获取用户信息
  const thread = await Thread.findById(_id);
  if (!thread) {
    throw new Error('帖子不存在');
  }
  
  // 删除帖子
  const result = await Thread.deleteOne({ _id })
  if (result.deletedCount === 0) throw new Error('帖子删除失败')
  
  // 从用户的posts数组中移除
  await User.findByIdAndUpdate(thread.user, {
    $pull: { posts: _id }
  });
  
  // 从 ES 删除
  try {
    await fastify.elasticsearch.delete({
      index: 'threads',
      id: _id
    });
    fastify.log.info('ES 删除成功:', _id);
  } catch (error) {
    fastify.log.error('ES 删除失败:', error);
  }
  
  return true
}

export async function getThreadsByCommunity(community: string) {
  try {
    if (!fastify.elasticsearch) {
      throw new Error('ES unavailable');
    }
    
    const result = await fastify.elasticsearch.search({
      index: 'threads',
      body: {
        query: {
          term: { community: community }
        },
        size: 1000
      }
    });
    
    if (result.hits.hits.length > 0) {
      fastify.log.info('ES 社区查询成功:', { 
        community, 
        hitCount: result.hits.hits.length 
      });
      return result.hits.hits.map((hit: any) => ({
        _id: hit._id,
        ...hit._source
      }));
    }
  } catch (error: any) {
    fastify.log.error('ES 社区查询失败，回退到 MongoDB:', {
      errorMessage: error.message,
      community
    });
  }
  
  // 回退到 MongoDB
  const threads = await Thread.find({ community }).lean();
  return threads.map((thread: any) => ({
    ...thread,
    _id: thread._id.toString(),
    userId: thread.user.toString()
  }));
}

// 帖子关键词搜索（只搜内容和标签）
export async function searchThread(q: string) {
  try {
    if (!fastify.elasticsearch) {
      throw new Error('ES unavailable');
    }
    
    const result = await fastify.elasticsearch.search({
      index: 'threads',
      body: {
        query: {
          multi_match: {
            query: q,
            fields: ['content', 'tags']
          }
        }
      }
    });
    
    if (result.hits.hits.length > 0) {
      fastify.log.info('ES 搜索成功:', { 
        query: q, 
        hitCount: result.hits.hits.length 
      });
      return result.hits.hits.map((hit: any) => ({
        _id: hit._id,
        ...hit._source
      }));
    }
  } catch (error: any) {
    fastify.log.error('ES 搜索失败，回退到 MongoDB:', {
      errorMessage: error.message,
      query: q
    });
  }
  
  // 回退到 MongoDB
  const threads = await Thread.find({
    $or: [
      { content: { $regex: q, $options: 'i' } },
      { tags: { $in: [new RegExp(q, 'i')] } }
    ]
  }).lean();
  
  return threads.map((thread: any) => ({
    ...thread,
    _id: thread._id.toString(),
    userId: thread.user.toString()
  }));
}

export async function getThreadsByUsername(username: string) {
  try {
    if (!fastify.elasticsearch) {
      throw new Error('ES unavailable');
    }
    
    const result = await fastify.elasticsearch.search({
      index: 'threads',
      body: {
        query: {
          term: { username: username }
        },
        size: 1000
      }
    });
    
    if (result.hits.hits.length > 0) {
      fastify.log.info('ES 用户查询成功:', { 
        username, 
        hitCount: result.hits.hits.length 
      });
      return result.hits.hits.map((hit: any) => ({
        _id: hit._id,
        ...hit._source
      }));
    }
  } catch (error: any) {
    fastify.log.error('ES 用户查询失败，回退到 MongoDB:', {
      errorMessage: error.message,
      username
    });
  }
  
  // 回退到 MongoDB
  const threads = await Thread.find({ username }).lean();
  return threads.map((thread: any) => ({
    ...thread,
    _id: thread._id.toString(),
    userId: thread.user.toString()
  }));
}

export async function getRandomThreads(count: number = 5) {
  try {
    if (!fastify.elasticsearch) {
      throw new Error('ES unavailable');
    }
    
    const result = await fastify.elasticsearch.search({
      index: 'threads',
      body: {
        query: {
            function_score: {
                query: { match_all: {} },
                functions: [
                    { random_score: {} }
                ]
            }
        },
        size: count
      }
    });
    
    if (result.hits.hits.length > 0) {
      fastify.log.info('ES 随机查询成功:', { 
        count, 
        hitCount: result.hits.hits.length 
      });
      return result.hits.hits.map((hit: any) => ({
        _id: hit._id,
        ...hit._source
      }));
    }
  } catch (error: any) {
    fastify.log.error('ES 随机查询失败，回退到 MongoDB:', {
      errorMessage: error.message,
      count
    });
  }
  
  // 回退到 MongoDB 随机查询
  const threads = await Thread.aggregate([
    { $sample: { size: count } }
  ]);
  
  return threads.map((thread: any) => ({
    ...thread,
    _id: thread._id.toString(),
    userId: thread.user.toString()
  }));
}

export async function updateThread(threadId: string, updateData: any, requestUsername: string) {
  const { content, community, location, tags } = updateData;
  
  // 验证必需字段
  if (!content && !community && !location && !tags) {
    throw new Error('至少需要提供一个要更新的字段');
  }
  
  // 查找帖子
  const thread = await Thread.findById(threadId);
  if (!thread) {
    throw new Error('帖子不存在');
  }
  
  // 验证权限：只有帖子作者可以修改
  if (thread.username !== requestUsername) {
    throw new Error('无权限修改此帖子');
  }
  
  // 构建更新对象
  const updateObj: any = {};
  if (content) updateObj.content = content;
  if (community) updateObj.community = community;
  if (location !== undefined) updateObj.location = location;
  if (tags) updateObj.tags = tags;
  
  // 更新帖子
  const updatedThread = await Thread.findByIdAndUpdate(
    threadId,
    updateObj,
    { new: true }
  );

  if (!updatedThread) {
    throw new Error('帖子更新失败，未找到对应帖子');
  }
  
  // 同步到 ES
  try {
    const threadDoc = {
      content: updatedThread.content,
      username: updatedThread.username,
      userAvatar: updatedThread.userAvatar,
      community: updatedThread.community,
      location: updatedThread.location,
      tags: updatedThread.tags,
      createdAt: updatedThread.createdAt,
      userId: updatedThread.user.toString()
      // 移除 _id 字段
    };
    
    await fastify.elasticsearch.update({
      index: 'threads',
      id: threadId,
      doc: threadDoc
    });
    
    fastify.log.info('帖子 ES 更新成功:', threadId);
  } catch (error) {
    fastify.log.error('帖子 ES 更新失败:', error);
    // ES 更新失败不影响主要功能
  }
  
  return updatedThread;
}
