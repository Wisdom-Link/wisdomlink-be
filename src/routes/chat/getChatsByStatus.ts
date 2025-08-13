import { FastifyPluginAsync } from 'fastify';
import { getChatsByConditions, getChatStatsForUser } from '../../services/chatService';

const getChatsByStatusRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/getChatsByStatus', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { status, role, debug } = request.query as { 
        status?: 'ongoing' | 'completed'; 
        role?: 'questioner' | 'answerer';
        debug?: string;
      };
      const user = (request as any).user;
      
      if (!user) {
        return reply.status(401).send({ 
          message: '用户未认证',
          code: 'UNAUTHORIZED'
        });
      }

      // 获取用户名，如果没有username则通过userId查找
      let username = user.username || user.name;
      if (!username && user.userId) {
        try {
          const User = require('../../models/user').default;
          const userDoc = await User.findById(user.userId).select('username').lean();
          if (userDoc) {
            username = userDoc.username;
          }
        } catch (error) {
          fastify.log.error('查找用户名失败:', error);
        }
      }

      fastify.log.info('=== 路由层用户信息 ===', {
        user: {
          id: user.id || user._id || user.userId,
          username: username,
          originalUser: user
        },
        query: { status, role, debug }
      });

      // 参数验证
      if (status && !['ongoing', 'completed'].includes(status)) {
        return reply.status(400).send({ 
          message: '状态参数无效，必须是 ongoing 或 completed',
          code: 'INVALID_STATUS'
        });
      }

      if (role && !['questioner', 'answerer'].includes(role)) {
        return reply.status(400).send({ 
          message: '角色参数无效，必须是 questioner 或 answerer',
          code: 'INVALID_ROLE'
        });
      }

      // 如果有debug参数，返回用户统计信息
      if (debug === 'true') {
        if (!username) {
          return reply.status(400).send({
            success: false,
            message: '无法获取用户名',
            code: 'MISSING_USERNAME'
          });
        }
        const stats = await getChatStatsForUser(username);
        return reply.status(200).send({
          success: true,
          debug: true,
          userStats: stats,
          user: {
            id: user.id || user._id || user.userId,
            username: username
          }
        });
      }

      // 使用合并后的函数
      const chats = await getChatsByConditions(user, { status, role });
      
      reply.status(200).send({
        success: true,
        data: chats,
        total: chats.length,
        filters: {
          status: status || 'all',
          role: role || 'all'
        },
        user: {
          id: user.id || user._id || user.userId,
          username: username
        }
      });
    } catch (error: any) {
      fastify.log.error('获取对话列表错误详情:', {
        errorMessage: error.message,
        errorStack: error.stack,
        errorCode: error.code,
        errorType: error.constructor.name,
        requestQuery: request.query,
        user: {
          id: (request as any).user?.id,
          username: (request as any).user?.username
        }
      });
      
      // 根据错误类型返回不同的响应
      if (error.message?.includes('Elasticsearch')) {
        return reply.status(503).send({ 
          success: false,
          message: '搜索服务暂时不可用，请稍后重试',
          code: 'ELASTICSEARCH_ERROR',
          details: error.message
        });
      }
      
      if (error.message?.includes('MongoDB') || error.message?.includes('Database')) {
        return reply.status(503).send({ 
          success: false,
          message: '数据库服务暂时不可用，请稍后重试',
          code: 'DATABASE_ERROR',
          details: error.message
        });
      }
      
      if (error.code === 'ECONNREFUSED') {
        return reply.status(503).send({ 
          success: false,
          message: '服务连接失败，请稍后重试',
          code: 'CONNECTION_ERROR',
          details: error.message
        });
      }
      
      // 默认错误响应
      reply.status(500).send({ 
        success: false,
        message: error.message || '获取对话列表失败',
        code: 'SERVER_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });
};

export default getChatsByStatusRoute;
