import { FastifyPluginAsync } from 'fastify'
import { UserRegisterBody } from '../../types/user'
import { registerUser } from '../../services/userService'

const registerRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post<{ Body: UserRegisterBody }>('/register', async (request, reply) => {
    try {
      await registerUser(request.body)
      reply.send({ message: '注册成功' })
    } catch (error: any) {
      fastify.log.error(error)
      reply.status(400).send({ message: error.message || '注册失败' })
    }
  })
}

export default registerRoute
