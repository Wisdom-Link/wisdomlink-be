import Thread from '../models/thread'
import User from '../models/user'
import { FastifyInstance } from 'fastify'

let fastify: FastifyInstance
export function setFastifyInstance(f: FastifyInstance) {
  fastify = f
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
  
  // 同步到 ES
  try {
    const threadDoc = {
      content: thread.content,
      username: thread.username,
      userAvatar: thread.userAvatar,
      community: thread.community,
      location: thread.location,
      tags: thread.tags,
      createdAt: thread.createdAt,
      userId: user._id.toString(),
      _id: thread._id.toString()
    };
    
    await fastify.elasticsearch.index({
      index: 'threads',
      id: thread._id.toString(),
      document: threadDoc
    });
    console.log('ES 同步成功:', threadDoc);
  } catch (error) {
    console.error('ES 同步失败:', error)
    // ES 同步失败不影响主要功能
  }
  
  return thread
}

export async function getThreadByContent(content: string) {
  // 用 ES 搜索
  const result = await fastify.elasticsearch.search({
    index: 'threads',
    query: {
      match: { content }
    }
  })
  if (!result.hits.hits.length) throw new Error('帖子不存在')
  return result.hits.hits[0]._source
}

export async function deleteThreadById(_id: string) {
  const result = await Thread.deleteOne({ _id })
  if (result.deletedCount === 0) throw new Error('帖子不存在')
  // 从 ES 删除
  await fastify.elasticsearch.delete({
    index: 'threads',
    id: _id
  }).catch(() => {})
  return true
}

export async function getThreadsByCommunity(community: string) {
  const result = await fastify.elasticsearch.search({
    index: 'threads',
    query: {
      term: { community }
    },
    size: 1000 // 可根据实际需求调整
  })
  return result.hits.hits.map((hit: any) => hit._source)
}

// 帖子关键词搜索（只搜内容和标签）
export async function searchThread(q: string) {
  const result = await fastify.elasticsearch.search({
    index: 'threads',
    query: {
      multi_match: {
        query: q,
        fields: ['content', 'tags']
      }
    }
  })
  return result.hits.hits.map((hit: any) => hit._source)
}

export async function getThreadsByUsername(username: string) {
  const result = await fastify.elasticsearch.search({
    index: 'threads',
    query: {
      term: { username }
    },
    size: 1000 // 可根据实际需求调整
  });
  return result.hits.hits.map((hit: any) => hit._source);
}

export async function getRandomThreads(count: number = 5) {
  try {
    const result = await fastify.elasticsearch.search({
      index: 'threads',
      query: {
        function_score: {
          query: { match_all: {} },
          functions: [
            { random_score: {} }
          ]
        }
      },
      size: count
    });
    return result.hits.hits.map((hit: any) => hit._source);
  } catch (error) {
    fastify.log.error('随机获取帖子失败:', error);
    throw new Error('获取随机帖子失败');
  }
}
