import { FastifyPluginAsync } from 'fastify';
import Thread from '../../models/thread';

const deleteThreadRoute: FastifyPluginAsync = async (fastify) => {
  fastify.delete('/deleteThread',{ onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { _id } = request.body as { _id: string };

      if (!_id) {
        return reply.status(400).send({ message: '缺少 _id' });
      }

      const result = await Thread.deleteOne({ _id });

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
