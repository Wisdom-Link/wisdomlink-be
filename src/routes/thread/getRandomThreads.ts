import { FastifyPluginAsync } from 'fastify';
import { getRandomThreads } from '../../services/threadService';

const getRandomThreadsRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/getRandomThreads',{ onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { count } = request.query as { count?: string };
      const threadCount = count ? parseInt(count, 10) : 5;
      
      if (threadCount <= 0 || threadCount > 50) {
        return reply.status(400).send({ message: '数量参数无效，应在1-50之间' });
      }
      
      const threads = await getRandomThreads(threadCount);
      reply.status(200).send(threads);
    } catch (error: any) {
      fastify.log.error(error);
      reply.status(500).send({ message: error.message || '服务器错误' });
    }
  });
};

export default getRandomThreadsRoute;
