import { FastifyPluginAsync } from 'fastify';
import { ChatId } from '../../types/chat';
import Chat from '../../models/chat';

const getChatRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/getChat', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      // chatId 从 query 获取
      const { chatId } = request.query as ChatId;

      if (!chatId) {
        return reply.status(400).send({ message: '缺少 chatId' });
      }

      const chat = await Chat.findOne({ chatId }).populate('userIds', 'username avatar').lean();

      if (!chat) {
        return reply.status(404).send({ message: '对话不存在' });
      }

      reply.send(chat);
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ message: '服务器错误' });
    }
  });
};

export default getChatRoute;
