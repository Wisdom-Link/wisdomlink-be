import { FastifyPluginAsync } from 'fastify';
import { userInfo } from '../../types/user';
import User from '../../models/user';

const updateInfoRoute: FastifyPluginAsync = async (fastify) => {
  fastify.put<{
    Body: userInfo;
  }>('/updateInfo', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = (request.user as any)?.userId;

      if (!userId) {
        return reply.status(401).send({ message: '未登录或 token 无效' });
      }

      const { username, motto, gender, avatar, taps, level, questionCount, answerCount, highQualityAnswerCount } = request.body;

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          username,
          motto,
          gender,
          avatar,
          taps,
          level,
          questionCount,
          answerCount,
          highQualityAnswerCount
        },
        { new: true, lean: true } // new: true 表示返回更新后的文档
      );

      if (!updatedUser) {
        return reply.status(404).send({ message: '用户不存在' });
      }

      const result: userInfo = {
        username: updatedUser.username || '',
        motto: updatedUser.motto || '',
        gender: updatedUser.gender || 'unknown',
        taps: updatedUser.taps || [],
        level: updatedUser.level || 1,
        avatar: updatedUser.avatar || '',
        questionCount: updatedUser.questionCount || 0,
        answerCount: updatedUser.answerCount || 0,
        highQualityAnswerCount: updatedUser.highQualityAnswerCount || 0
      };

      reply.send(result);
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ message: '服务器错误' });
    }
  });
};

export default updateInfoRoute;
