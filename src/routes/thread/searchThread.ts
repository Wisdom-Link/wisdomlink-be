import { FastifyPluginAsync } from 'fastify'
import { searchThread } from '../../services/threadService'

const searchThreadRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/searchThread', async (request, reply) => {
    const { q } = request.query as { q: string }
    if (!q) {
      return reply.status(400).send({ error: '缺少查询参数 q' })
    }
    const result = await searchThread(q)
    reply.send(result)
  })
}

export default searchThreadRoute
