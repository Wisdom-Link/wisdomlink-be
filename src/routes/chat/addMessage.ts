import { FastifyPluginAsync } from 'fastify';
import { addMessageToChat } from '../../services/chatService';

interface AddMessageBody {
  chatId: string;
  content: string;
  senderUsername?: string; // 可选，优先从认证信息获取
}

const addMessageRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post('/addMessage', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { chatId, content, senderUsername } = request.body as AddMessageBody;
      const user = (request as any).user;
      const actualSenderUsername = senderUsername || user?.username || user?.name;
      
      if (!chatId || !content) {
        return reply.status(400).send({
          success: false,
          message: '缺少必要参数 chatId 或 content',
          code: 'MISSING_PARAMETERS'
        });
      }
      
      if (!actualSenderUsername) {
        return reply.status(401).send({
          success: false,
          message: '无法获取发送者用户名',
          code: 'UNAUTHORIZED'
        });
      }
      
      const updatedChat = await addMessageToChat(chatId, actualSenderUsername, content);
      
      reply.status(200).send({
        success: true,
        message: '消息发送成功',
        data: {
          chatId: updatedChat._id,
          messageCount: updatedChat.messages.length,
          lastMessage: updatedChat.messages[updatedChat.messages.length - 1]
        }
      });
    } catch (error: any) {
      fastify.log.error('添加消息错误:', error);
      
      if (error.message === '对话不存在') {
        return reply.status(404).send({
          success: false,
          message: error.message,
          code: 'CHAT_NOT_FOUND'
        });
      }
      
      if (error.message === '无权限向此对话发送消息' || error.message === '对话已结束，无法发送消息') {
        return reply.status(403).send({
          success: false,
          message: error.message,
          code: 'PERMISSION_DENIED'
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


export default addMessageRoute;
