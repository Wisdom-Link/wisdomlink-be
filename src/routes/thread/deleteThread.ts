import { FastifyPluginAsync } from 'fastify'
import { deleteThreadById } from '../../services/threadService'

const deleteThreadRoute: FastifyPluginAsync = async (fastify) => {
  fastify.delete('/deleteThread', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { _id } = request.body as { _id: string }
      if (!_id) {
        fastify.log.warn('删除帖子缺少 _id')
        return reply.status(400).send({ message: '缺少 _id' })
      }
      await deleteThreadById(_id)
      reply.status(200).send({ message: '帖子删除成功' })
    } catch (error: any) {
      fastify.log.error('帖子删除失败:', error)
      reply.status(404).send({ message: error.message || '删除帖子失败' })
    }
  })
}

export default deleteThreadRoute
