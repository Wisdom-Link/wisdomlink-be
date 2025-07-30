import { FastifyPluginAsync } from 'fastify'
import {  getThreadsByCommunity } from '../../services/threadService'

const threadsByCommunityRoute: FastifyPluginAsync = async (fastify) => {
  // 根据社区获取全部帖子
  fastify.get('/threadsByCommunity', async (request, reply) => {
    const { community } = request.query as { community: string }
    if (!community) {
      return reply.status(400).send({ error: '缺少社区参数 community' })
    }
    const result = await getThreadsByCommunity(community)
    reply.status(200).send(result)
  })
}

export default threadsByCommunityRoute
