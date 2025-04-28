import { FastifyPluginAsync } from 'fastify';
import Thread from '../../models/thread';

const deleteThreadRoute: FastifyPluginAsync = async (fastify) => {
  fastify.delete('/deleteThread', async (request, reply) => {
    try {
      const { threadId } = request.body as { threadId: string };

      if (!threadId) {
        return reply.status(400).send({ message: '缺少 threadId' });
      }

      const result = await Thread.deleteOne({ threadId });

      if (result.deletedCount === 0) {
        return reply.status(404).send({ message: '帖子不存在' });
      }

      reply.send({ message: '帖子删除成功' });
    } catch (error) {
      reply.status(500).send({ message: '删除帖子失败', error });
    }
  });
};

export default deleteThreadRoute;
