import { FastifyPluginAsync } from 'fastify';
import { saveThread } from '../../services/threadService';

const saveThreadRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post('/saveThread', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const thread = await saveThread(request.body);
      reply.status(200).send({ message: '帖子保存成功', thread });
    } catch (error: any) {
      fastify.log.error('保存帖子失败:', error);
      reply.status(500).send({ 
        message: '保存帖子失败', 
        error: error.message || error,
        details: error.code ? { code: error.code, keyPattern: error.keyPattern } : undefined
      });
    }
  });
};

export default saveThreadRoute;
