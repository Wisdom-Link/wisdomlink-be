import fp from 'fastify-plugin'
import { MongoClient } from 'mongodb'

export default fp(async (fastify) => {
  fastify.log.info('📦 正在加载 Mongo 插件...')

  const uri = process.env.MONGO_URI
  if (!uri) {
    throw new Error('❌ MONGO_URI 未定义！请检查 .env 文件')
  }

  try {
    const client = new MongoClient(uri)
    await client.connect()

    fastify.log.info('✅ 本地 MongoDB 连接成功！')
    fastify.decorate('db', client.db()) // 挂载到 fastify 实例上
  } catch (err) {
    console.error('❌ MongoDB 连接失败:', err)
  }
})
