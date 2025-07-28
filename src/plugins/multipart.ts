import fp from 'fastify-plugin'
import fastifyMultipart from '@fastify/multipart'

export default fp(async (fastify) => {
  fastify.log.info('📦 正在加载 Multipart 插件...')

  try {
    await fastify.register(fastifyMultipart, {
      limits: {
        fileSize: 5 * 1024 * 1024 // 限制文件大小为 5MB
      }
    })
    fastify.log.info('✅ Multipart 插件加载成功！')
  } catch (err) {
    fastify.log.error('❌ Multipart 插件加载失败:', err)
    throw err
  }
})
