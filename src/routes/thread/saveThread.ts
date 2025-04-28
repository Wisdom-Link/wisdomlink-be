import { FastifyPluginAsync } from 'fastify';
import Thread from '../../models/thread';

const saveThreadRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post('/saveThread', async (request, reply) => {
    try {
      // 从请求体获取帖子属性
      const { threadId, subject, content, userId, createdAt, location, tags } = request.body as any;

      // 创建帖子文档
      const thread = new Thread({
        threadId,
        subject,
        content,
        userId,
        createdAt,
        location,
        tags
      });

      // 保存到数据库
      await thread.save();

      reply.status(201).send({ message: '帖子保存成功', thread });
    } catch (error) {
      reply.status(500).send({ message: '保存帖子失败', error });
    }
  });
};

export default saveThreadRoute;
