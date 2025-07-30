import { FastifyPluginAsync } from 'fastify';
import { getThreadsByUsername } from '../../services/threadService';

const getThreadRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/getThread', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { username } = request.query as { username?: string };
      if (!username) {
        return reply.status(400).send({ message: '缺少 username' });
      }
      const threads = await getThreadsByUsername(username);
      reply.status(200).send(threads);
    } catch (error: any) {
      fastify.log.error(error);
      reply.status(404).send({ message: error.message || '服务器错误' });
    }
  });
};

export default getThreadRoute;
