import { FastifyPluginAsync } from 'fastify';
import { deleteUserByUsername } from '../../services/userService';

const deleteUserRoute: FastifyPluginAsync = async (fastify) => {
  fastify.delete('/deleteUser', async (request, reply) => {
    try {
      const { username } = request.body as { username?: string };
      if (!username) {
        return reply.status(400).send({ message: '缺少用户名' });
      }
      await deleteUserByUsername(username);
      reply.send({ message: '用户删除成功' });
    } catch (error: any) {
      fastify.log.error(error);
      reply.status(404).send({ message: error.message || '服务器错误' });
    }
  });
};

export default deleteUserRoute;

