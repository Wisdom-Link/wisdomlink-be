import { FastifyPluginAsync } from 'fastify';
import Thread from '../../models/thread';

const getThreadRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/getThread', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { threadId } = request.query as { threadId?: string };

      if (!threadId) {
        return reply.status(400).send({ message: '缺少 threadId' });
      }

      const thread = await Thread.findOne({ threadId }).lean();

      if (!thread) {
        return reply.status(404).send({ message: '帖子不存在' });
      }

      reply.send(thread);
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ message: '服务器错误' });
    }
  });
};

export default getThreadRoute;
