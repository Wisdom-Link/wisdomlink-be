// src/routes/user.routes.ts

import { FastifyInstance } from 'fastify'

export default async function userRoutes(app: FastifyInstance) {
  app.get('/profile', async (request, reply) => {
    // 假设是获取用户信息
    return { message: '用户信息' }
  })

  app.post('/login', async (request, reply) => {
    // 登录接口示例
    return { message: '登录成功' }
  })
}
