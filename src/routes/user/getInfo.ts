import { FastifyPluginAsync } from 'fastify';
import { userInfo } from '../../types/user';
import User from '../../models/user'; 

const getInfoRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/getInfo', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      // 假设你用 JWT 解码后，把用户 id 存在了 request.user.id
      const userId = (request.user as any)?.userId; // ✅ 字段要一致
      console.log('🌟 userId from request.user:', (request.user as any)?.userId)

      if (!userId) {
        return reply.status(401).send({ message: '未登录或 token 无效' });
      }

      const user = await User.findById(userId).lean();

      if (!user) {
        return reply.status(404).send({ message: '用户不存在' });
      }

      const result: userInfo = {
        username: user.username,
        motto: user.motto || '',
        gender: user.gender,
        taps: user.taps,
        level: user.level || 1,
        avatar: user.avatar || '',
        questionCount: user.questionCount || 0,
        answerCount: user.answerCount || 0,
        highQualityAnswerCount: user.highQualityAnswerCount || 0
      };

      reply.send(result);
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ message: '服务器错误' });
    }
  });
};

export default getInfoRoute;

