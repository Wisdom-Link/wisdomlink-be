import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import swagger from '@fastify/swagger'
import swaggerUI from '@fastify/swagger-ui'
import userRoutes from './routes/user'
import dotenv from 'dotenv'

dotenv.config()

// 检查环境变量
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required in the .env file')
}
if (!process.env.PORT) {
  throw new Error('PORT is required in the .env file')
}

const app = Fastify()

// 注册 CORS 插件
app.register(cors)

// 注册 JWT 插件
app.register(jwt, { secret: process.env.JWT_SECRET })

// 注册 Swagger 插件
app.register(swagger, {
  swagger: {
    info: {
      title: 'WisdomLink API',
      description: '后端接口文档',
      version: '1.0.0',
    },
    tags: [
      { name: 'user', description: '用户相关接口' },
    ],
  },
})
app.register(swaggerUI, {
  routePrefix: '/docs',
})

// 注册路由
app.register(userRoutes, { prefix: '/api/user' })

// 启动服务器
const port = Number(process.env.PORT) || 3000
app.listen({ port }, (err, address) => {
  if (err) {
    app.log.error(err)
    process.exit(1)
  }
  console.log(`🚀 Server ready at ${address}`)
})
