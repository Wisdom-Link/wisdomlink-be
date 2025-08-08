import { FastifyPluginAsync } from 'fastify';
import { getChatWithUserDetails } from '../../services/chatService';

const getChatWithDetailsRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/getChatWithDetails', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { chatId } = request.query as { chatId?: string };
      if (!chatId) {
        return reply.status(400).send({ 
          message: '缺少 chatId 参数',
          code: 'MISSING_CHAT_ID'
        });
      }
      
      const chat = await getChatWithUserDetails(chatId);
      
      reply.status(200).send({
        success: true,
        data: chat
      });
    } catch (error: any) {
      fastify.log.error('获取对话详情错误:', error);
      
      if (error.message === '对话不存在') {
        return reply.status(404).send({
          success: false,
          message: error.message,
          code: 'CHAT_NOT_FOUND'
        });
      }
      
      reply.status(500).send({ 
        success: false,
        message: error.message || '服务器错误',
        code: 'SERVER_ERROR'
      });
    }
  });
};

export default getChatWithDetailsRoute;
