import { FastifyPluginAsync } from 'fastify';
import { getChatsByCommunity } from '../../services/chatService';

const getChatsByCommunityRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/getChatsByCommunity', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { community } = request.query as { community?: string };
      
      if (!community) {
        return reply.status(400).send({ 
          success: false,
          message: '缺少 community 参数',
          code: 'MISSING_COMMUNITY'
        });
      }
      
      const chats = await getChatsByCommunity(community);
      
      reply.status(200).send({
        success: true,
        data: chats,
        total: chats.length,
        community
      });
    } catch (error: any) {
      fastify.log.error('获取社区对话错误:', error);
      reply.status(500).send({ 
        success: false,
        message: error.message || '服务器错误',
        code: 'SERVER_ERROR'
      });
    }
  });
};

export default getChatsByCommunityRoute;
