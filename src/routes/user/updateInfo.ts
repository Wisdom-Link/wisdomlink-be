import { FastifyPluginAsync } from 'fastify'
import { updateInfo } from '../../types/user'
import { updateUserInfo } from '../../services/userService'

const updateInfoRoute: FastifyPluginAsync = async (fastify) => {
  fastify.put<{ Body: updateInfo }>('/updateInfo', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = (request.user as any)?.userId
      if (!userId) {
        return reply.status(401).send({ message: '未登录或 token 无效' })
      }
      const updatedUser = await updateUserInfo(userId, request.body)
      const result: updateInfo = {
        username: updatedUser.username || '',
        motto: updatedUser.motto || '',
        taps: updatedUser.taps || [],
        avatar: updatedUser.avatar || '',
      }
      reply.status(200).send(result)
    } catch (error: any) {
      fastify.log.error(error)
      reply.status(500).send({ message: error.message || '服务器错误' })
    }
  })
}

export default updateInfoRoute
