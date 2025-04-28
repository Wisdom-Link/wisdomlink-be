import { FastifyPluginAsync } from 'fastify';
import User from '../../models/user';

const deleteUserRoute: FastifyPluginAsync = async (fastify) => {
  fastify.delete('/deleteUser', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      // 从请求体中获取用户名
      const { username } = request.body as { username?: string };

      if (!username) {
        return reply.status(400).send({ message: '缺少用户名' });
      }

      const deleted = await User.findOneAndDelete({ username });

      if (!deleted) {
        return reply.status(404).send({ message: '用户不存在' });
      }

      reply.send({ message: '用户删除成功' });
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ message: '服务器错误' });
    }
  });
};

export default deleteUserRoute;

