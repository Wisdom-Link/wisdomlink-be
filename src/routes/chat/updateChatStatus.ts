import { FastifyPluginAsync } from 'fastify';
import { updateChatStatus } from '../../services/chatService';

const updateChatStatusRoute: FastifyPluginAsync = async (fastify) => {
  fastify.put('/updateChatStatus', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { chatId, status } = request.body as { 
        chatId?: string; 
        status?: 'ongoing' | 'completed' 
      };
      
      if (!chatId) {
        return reply.status(400).send({ 
          message: '缺少 chatId 参数',
          code: 'MISSING_CHAT_ID'
        });
      }
      
      if (!status || !['ongoing', 'completed'].includes(status)) {
        return reply.status(400).send({ 
          message: '状态参数无效，必须是 ongoing 或 completed',
          code: 'INVALID_STATUS'
        });
      }
      
      const chat = await updateChatStatus(chatId, status);
      
      reply.status(200).send({
        success: true,
        message: '对话状态更新成功',
        data: chat
      });
    } catch (error: any) {
      fastify.log.error('更新对话状态错误:', error);
      
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

export default updateChatStatusRoute;
