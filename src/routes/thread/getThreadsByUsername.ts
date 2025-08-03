import { FastifyPluginAsync } from 'fastify';
import { getThreadsByUsername } from '../../services/threadService';

const getThreadRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/getThreadsByUsername', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { username } = request.query as { username?: string };
      if (!username) {
        return reply.status(400).send({ 
          success: false,
          message: '缺少 username 参数' 
        });
      }
      
      fastify.log.info(`查询用户 ${username} 的帖子`);
      const threads = await getThreadsByUsername(username);
      
      reply.status(200).send({
        success: true,
        data: threads,
        total: threads.length
      });
    } catch (error: any) {
      fastify.log.error('获取用户帖子失败:', error);
      reply.status(500).send({ 
        success: false,
        message: error.message || '服务器错误' 
      });
    }
  });
};

export default getThreadRoute;
