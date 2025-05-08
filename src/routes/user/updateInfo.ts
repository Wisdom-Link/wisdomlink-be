import { FastifyPluginAsync } from 'fastify';
import { updateInfo } from '../../types/user';
import User from '../../models/user';

const updateInfoRoute: FastifyPluginAsync = async (fastify) => {
  fastify.put<{
    Body: updateInfo;
  }>('/updateInfo', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = (request.user as any)?.userId;

      if (!userId) {
        return reply.status(401).send({ message: '未登录或 token 无效' });
      }

      const { username, motto, gender, avatar, taps } = request.body;

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          username,
          motto,
          gender,
          avatar,
          taps,
        },
        { new: true, lean: true } // new: true 表示返回更新后的文档
      );

      if (!updatedUser) {
        return reply.status(404).send({ message: '用户不存在' });
      }

      const result: updateInfo = {
        username: updatedUser.username || '',
        motto: updatedUser.motto || '',
        gender: updatedUser.gender || 'unknown',
        taps: updatedUser.taps || [],
        avatar: updatedUser.avatar || '',
      };

      reply.send(result);
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ message: '服务器错误' });
    }
  });
};

export default updateInfoRoute;
