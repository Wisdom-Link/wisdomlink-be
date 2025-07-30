import { FastifyPluginAsync } from 'fastify';
import { getChatsByStatus } from '../../services/chatService';

const getChatsByStatusRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/getChatsByStatus', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { status } = request.query as { status?: 'ongoing' | 'completed' };
      const userId = (request as any).user?.id;
      
      if (!status || !['ongoing', 'completed'].includes(status)) {
        return reply.status(400).send({ 
          message: '状态参数无效，必须是 ongoing 或 completed',
          code: 'INVALID_STATUS'
        });
      }
      
      if (!userId) {
        return reply.status(401).send({ 
          message: '用户未认证',
          code: 'UNAUTHORIZED'
        });
      }
      
      const chats = await getChatsByStatus(userId, status);
      
      reply.status(200).send({
        success: true,
        data: chats,
        total: chats.length,
        status
      });
    } catch (error: any) {
      fastify.log.error('获取对话列表错误:', error);
      reply.status(500).send({ 
        success: false,
        message: error.message || '服务器错误',
        code: 'SERVER_ERROR'
      });
    }
  });
};

export default getChatsByStatusRoute;
