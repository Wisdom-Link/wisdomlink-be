import { FastifyPluginAsync } from 'fastify';
import { getThreadByContent } from '../../services/threadService';

const getThreadRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/getThread', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { content } = request.query as { content?: string };
      if (!content) {
        return reply.status(400).send({ message: '缺少 content' });
      }
      const thread = await getThreadByContent(content);
      reply.status(200).send(thread);
    } catch (error: any) {
      fastify.log.error(error);
      reply.status(404).send({ message: error.message || '服务器错误' });
    }
  });
};

export default getThreadRoute;
