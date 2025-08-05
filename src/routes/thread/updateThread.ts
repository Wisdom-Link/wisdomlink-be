import { FastifyPluginAsync } from 'fastify';
import { updateThread } from '../../services/threadService';

interface UpdateThreadBody {
  content?: string;
  community?: string;
  location?: string;
  tags?: string[];
  username?: string; // 添加 username 字段
}

interface UpdateThreadParams {
  threadId: string;
}

const updateThreadRoute: FastifyPluginAsync = async (fastify) => {
  fastify.put('/updateThread/:threadId', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { threadId } = request.params as UpdateThreadParams;
      const { content, community, location, tags, username } = request.body as UpdateThreadBody;
      
      // 直接使用前端传递的用户名
      const requestUsername = username;
      
      // 调试日志
      fastify.log.info('更新帖子请求:', { 
        threadId, 
        requestUsername
      });
      
      // 参数验证
      if (!threadId) {
        return reply.status(400).send({ 
          message: '缺少 threadId 参数',
          code: 'MISSING_THREAD_ID'
        });
      }
      
      if (!requestUsername) {
        return reply.status(400).send({ 
          message: '缺少用户名',
          code: 'MISSING_USERNAME'
        });
      }
      
      // 验证更新数据
      if (!content && !community && location === undefined && !tags) {
        return reply.status(400).send({ 
          message: '至少需要提供一个要更新的字段',
          code: 'NO_UPDATE_DATA'
        });
      }
      
      // 内容长度验证
      if (content && (content.length < 1 || content.length > 5000)) {
        return reply.status(400).send({ 
          message: '帖子内容长度应在1-5000字符之间',
          code: 'INVALID_CONTENT_LENGTH'
        });
      }
      
      // 标签数量验证
      if (tags && tags.length > 10) {
        return reply.status(400).send({ 
          message: '标签数量不能超过10个',
          code: 'TOO_MANY_TAGS'
        });
      }
      
      const updateData = { content, community, location, tags };
      const updatedThread = await updateThread(threadId, updateData, requestUsername);
      
      reply.status(200).send({
        success: true,
        message: '帖子更新成功',
        data: updatedThread
      });
    } catch (error: any) {
      fastify.log.error('更新帖子错误:', error);
      
      if (error.message === '帖子不存在') {
        return reply.status(404).send({
          success: false,
          message: error.message,
          code: 'THREAD_NOT_FOUND'
        });
      }
      
      if (error.message === '无权限修改此帖子') {
        return reply.status(403).send({
          success: false,
          message: error.message,
          code: 'PERMISSION_DENIED'
        });
      }
      
      if (error.message === '至少需要提供一个要更新的字段') {
        return reply.status(400).send({
          success: false,
          message: error.message,
          code: 'NO_UPDATE_DATA'
        });
      }
      
      reply.status(500).send({ 
        success: false,
        message: error.message || '服务器错误',
        code: 'SERVER_ERROR'
      });
    }
  });
};


export default updateThreadRoute;
