import { FastifyPluginAsync } from 'fastify';
import { getChatById } from '../../services/chatService';

const getChatRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/getChat', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { _id } = request.query as { _id?: string };
      if (!_id) {
        return reply.status(400).send({ message: '缺少 _id' });
      }
      const chat = await getChatById(_id);
      reply.send(chat);
    } catch (error: any) {
      fastify.log.error(error);
      reply.status(404).send({ message: error.message || '服务器错误' });
    }
  });
};

export default getChatRoute;
