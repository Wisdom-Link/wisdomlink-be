import { FastifyPluginAsync } from 'fastify';
import { evaluateUser } from '../../services/chatService';

interface EvaluateUserBody {
  username: string;
  rating: 'excellent' |  'average' | 'poor';
}

const evaluateUserRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post('/evaluateUser', { 
    onRequest: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        properties: {
          username: { type: 'string' },
          rating: { 
            type: 'string', 
            enum: ['excellent', 'average', 'poor'] 
          }
        },
        required: ['username', 'rating']
      }
    }
  }, async (request, reply) => {
    try {
      const { username, rating } = request.body as EvaluateUserBody;
      
      const result = await evaluateUser({ username, rating });
      
      reply.status(200).send({
        success: true,
        message: '评价成功',
        data: result
      });
    } catch (error: any) {
      fastify.log.error('用户评价错误:', error);
      
      if (error.message.includes('不存在')) {
        return reply.status(404).send({
          success: false,
          message: error.message,
          code: 'USER_NOT_FOUND'
        });
      }
      
      reply.status(500).send({
        success: false,
        message: error.message || '评价失败',
        code: 'SERVER_ERROR'
      });
    }
  });
};

export default evaluateUserRoute;
