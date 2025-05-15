import Thread from '../models/thread'
import { FastifyInstance } from 'fastify'

let fastify: FastifyInstance
export function setFastifyInstance(f: FastifyInstance) {
  fastify = f
}

export async function saveThread(data: any) {
  const thread = new Thread(data)
  await thread.save()
  // 同步到 ES
  await fastify.elasticsearch.index({
    index: 'threads',
    id: thread._id.toString(),
    document: thread.toObject()
  })
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

// 帖子搜索
export async function searchThread(q: string) {
  const result = await fastify.elasticsearch.search({
    index: 'threads',
    query: {
      multi_match: {
        query: q,
        fields: ['content', 'tags', 'subject']
      }
    }
  })
  return result.hits.hits.map((hit: any) => hit._source)
}
