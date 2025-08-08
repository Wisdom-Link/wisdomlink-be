import { FastifyPluginAsync } from 'fastify'
import { deleteThreadById } from '../../services/threadService'

const deleteThreadRoute: FastifyPluginAsync = async (fastify) => {
  fastify.delete('/deleteThreadById', { 
    onRequest: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        properties: {
          _id: { type: 'string' }
        },
        required: ['_id']
      }
    }
  }, async (request, reply) => {
    try {
      const { _id } = request.body as { _id: string }
      if (!_id) {
        fastify.log.warn('删除帖子缺少 _id')
        return reply.status(400).send({ 
          success: false,
          message: '缺少 _id 参数',
          code: 'MISSING_THREAD_ID'
        })
      }
      
      await deleteThreadById(_id)
      
      reply.status(200).send({ 
        success: true,
        message: '帖子删除成功' 
      })
    } catch (error: any) {
      fastify.log.error('帖子删除失败:', error)
      
      if (error.message === '帖子不存在') {
        return reply.status(404).send({ 
          success: false,
          message: error.message,
          code: 'THREAD_NOT_FOUND'
        })
      }
      
      reply.status(500).send({ 
        success: false,
        message: error.message || '删除帖子失败',
        code: 'SERVER_ERROR'
      })
    }
  })
}

export default deleteThreadRoute
