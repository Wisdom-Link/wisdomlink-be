import { FastifyPluginAsync } from 'fastify'
import { loginUser } from '../../services/userService'

const loginRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post('/login', async (request, reply) => {
    try {
      const { username, password } = request.body as { username: string; password: string }
      if (!username || !password) {
        return reply.status(400).send({ message: '用户名和密码不能为空' })
      }
      const user = await loginUser(username, password)
      const token = fastify.jwt.sign(
        { userId: user._id },
        { expiresIn: '30d' }
      )
      return reply.status(200).send({
        message: '登录成功',
        user: {
          id: user._id,
          username: user.username,
        },
        token
      })
    } catch (err: any) {
      request.log.error(err)
      return reply.status(400).send({ message: err.message || '服务器错误' })
    }
  })
}

export default loginRoute

