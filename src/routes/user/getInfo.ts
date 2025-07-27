import { FastifyPluginAsync } from 'fastify'
import { getUserInfo } from '../../services/userService'
import { userInfo } from '../../types/user'

const getInfoRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/getInfo', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = (request.user as any)?.userId
      if (!userId) {
        return reply.status(401).send({ message: '未登录或 token 无效' })
      }
      const user = await getUserInfo(userId) as any
      const result: userInfo = {
        username: user.username,
        motto: user.motto || '',
        taps: user.taps,
        level: user.level || 1,
        avatar: user.avatar || '',
        questionCount: user.questionCount || 0,
        answerCount: user.answerCount || 0,
        highQualityAnswerCount: user.highQualityAnswerCount || 0
      }
      reply.status(200).send(result)
    } catch (error: any) {
      fastify.log.error(error)
      reply.status(500).send({ message: error.message || '服务器错误' })
    }
  })
}

export default getInfoRoute

