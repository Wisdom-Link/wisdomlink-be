import { FastifyPluginAsync } from 'fastify';
import { saveChat } from '../../services/chatService';
import { Chat as ChatType } from '../../types/chat';

const saveChatRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post('/saveChat', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const chat = await saveChat(request.body as ChatType);
      reply.send({ message: '对话保存成功', chat, _id: chat._id });
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ message: '服务器错误' });
    }
  });
};

export default saveChatRoute;
