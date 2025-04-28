import { FastifyPluginAsync } from 'fastify'
import bcrypt from 'bcrypt'
import User from '../../models/user' 
// import jwt from 'jsonwebtoken' // 如果你后续需要生成 token，可以加上

const loginRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post('/login', async (request, reply) => {
    try {
      const { username, password } = request.body as { username: string; password: string }

      if (!username || !password) {
        return reply.status(400).send({ message: '用户名和密码不能为空' })
      }

      // 查找用户
      const user = await User.findOne({ username })
      if (!user) {
        return reply.status(404).send({ message: '用户不存在' })
      }

      // 验证密码
      const isMatch = await bcrypt.compare(password, user.password)
      if (!isMatch) {
        return reply.status(401).send({ message: '密码错误' })
      }

      // 登录成功（可选：生成 token）
      const token = fastify.jwt.sign(
        { userId: user._id },
        { expiresIn: '30d' } // 30 天有效期
      );
      
      return reply.send({
        message: '登录成功',
        user: {
          id: user._id,
          username: user.username,
        },
        token // 如果你后续要支持 token 登录
      })
    } catch (err) {
      request.log.error(err)
      return reply.status(500).send({ message: '服务器错误' })
    }
  })
}

export default loginRoute

