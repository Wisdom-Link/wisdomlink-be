import { FastifyPluginAsync } from 'fastify'
import { searchThread } from '../../services/threadService'

const searchThreadRoute: FastifyPluginAsync = async (fastify) => {

  // 根据关键词搜索帖子内容和标签
  fastify.get('/searchThread', async (request, reply) => {
    const { q } = request.query as { q: string }
    if (!q) {
      return reply.status(400).send({ error: '缺少查询参数 q' })
    }
    const result = await searchThread(q)
    reply.status(200).send(result)
  })
}

export default searchThreadRoute
