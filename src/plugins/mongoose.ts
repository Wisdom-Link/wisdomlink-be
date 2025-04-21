import fp from 'fastify-plugin'
import mongoose from 'mongoose'

export default fp(async (fastify) => {
  fastify.log.info('📦 正在加载 Mongoose 插件...')

  const uri = process.env.MONGO_URI
  if (!uri) {
    throw new Error('❌ MONGO_URI 未定义！请检查 .env 文件')
  }

  try {
    await mongoose.connect(uri)
    fastify.log.info('✅ Mongoose 连接成功！')
    
    // 可选：把 mongoose 实例挂载到 fastify 上
    fastify.decorate('mongoose', mongoose)
  } catch (err) {
    fastify.log.error('❌ Mongoose 连接失败:', err)
    throw err
  }
})
