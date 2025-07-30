import Chat from '../models/chat'
import mongoose from 'mongoose'
import { Chat as ChatType } from '../types/chat'
import { FastifyInstance } from 'fastify'

let fastify: FastifyInstance
export function setFastifyInstance(f: FastifyInstance) {
  fastify = f
}

export async function saveChat(chatData: ChatType) {
  let chat = chatData._id ? await Chat.findById(chatData._id) : null
  const messages = chatData.messages.map(msg => ({
    sender: new mongoose.Types.ObjectId(msg.sender),
    content: msg.content,
    timestamp: msg.timestamp || new Date()
  }))
  if (chat) {
    chat.imageUrl = chatData.imageUrl || chat.imageUrl
    chat.questionUserId = new mongoose.Types.ObjectId(chatData.questionUserId)
    chat.answerUserId = new mongoose.Types.ObjectId(chatData.answerUserId)
    chat.tap = chatData.tap || ''
    chat.subject = chatData.subject || ''
    chat.status = chatData.status || chat.status || 'ongoing'
    chat.set('messages', messages, { strict: true })
    await chat.save()
  } else {
    chat = new Chat({
      imageUrl: chatData.imageUrl,
      questionUserId: new mongoose.Types.ObjectId(chatData.questionUserId),
      answerUserId: new mongoose.Types.ObjectId(chatData.answerUserId),
      tap: chatData.tap || '',
      subject: chatData.subject || '',
      status: chatData.status || 'ongoing',
      messages
    })
    await chat.save()
  }
  // 同步到 ES
  await fastify.elasticsearch.index({
    index: 'chats',
    id: chat._id.toString(),
    document: chat.toObject()
  })
  return chat
}

export async function getChatById(_id: string) {
  // 用 ES 查找
  const result = await fastify.elasticsearch.get({
    index: 'chats',
    id: _id
  }).catch(() => null)
  if (!result || !result.found) throw new Error('对话不存在')
  return result._source
}

// chat 搜索
export async function searchChat(q: string) {
  const result = await fastify.elasticsearch.search({
    index: 'chats',
    query: {
      multi_match: {
        query: q,
        fields: ['subject', 'tap', 'messages.content']
      }
    }
  })
  return result.hits.hits.map((hit: any) => hit._source)
}

export async function getChatsByStatus(userId: string, status: 'ongoing' | 'completed') {
  try {
    const result = await fastify.elasticsearch.search({
      index: 'chats',
      query: {
        bool: {
          must: [
            { term: { status } },
            {
              bool: {
                should: [
                  { term: { questionUserId: userId } },
                  { term: { answerUserId: userId } }
                ]
              }
            }
          ]
        }
      },
      sort: [{ updatedAt: { order: 'desc' } }],
      size: 100
    });
    return result.hits.hits.map((hit: any) => hit._source);
  } catch (error) {
    fastify.log.error('获取对话列表失败:', error);
    // 回退到 MongoDB
    const query = {
      status,
      $or: [
        { questionUserId: new mongoose.Types.ObjectId(userId) },
        { answerUserId: new mongoose.Types.ObjectId(userId) }
      ]
    };
    const chats = await Chat.find(query).sort({ updatedAt: -1 }).limit(100);
    return chats;
  }
}

export async function updateChatStatus(chatId: string, status: 'ongoing' | 'completed') {
  const chat = await Chat.findByIdAndUpdate(
    chatId,
    { status },
    { new: true }
  );
  if (!chat) {
    throw new Error('对话不存在');
  }
  
  // 同步到 ES
  try {
    await fastify.elasticsearch.update({
      index: 'chats',
      id: chatId,
      doc: { status }
    });
  } catch (error) {
    fastify.log.error('ES 状态更新失败:', error);
  }
  
  return chat;
}
