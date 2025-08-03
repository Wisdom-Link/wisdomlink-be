import { FastifyPluginAsync } from 'fastify';
import { getChatsByStatus, getChatsByUserRole } from '../../services/chatService';

const getChatsByStatusRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/getChatsByStatus', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { status, role } = request.query as { 
        status?: 'ongoing' | 'completed'; 
        role?: 'questioner' | 'answerer';
      };
      const user = (request as any).user;
      
      if (!user) {
        return reply.status(401).send({ 
          message: '用户未认证',
          code: 'UNAUTHORIZED'
        });
      }

      let chats;
      
      if (role) {
        // 根据角色获取对话
        if (!['questioner', 'answerer'].includes(role)) {
          return reply.status(400).send({ 
            message: '角色参数无效，必须是 questioner 或 answerer',
            code: 'INVALID_ROLE'
          });
        }
        
        chats = await getChatsByUserRole(user, role, status);
      } else if (status) {
        // 根据状态获取所有参与的对话
        if (!['ongoing', 'completed'].includes(status)) {
          return reply.status(400).send({ 
            message: '状态参数无效，必须是 ongoing 或 completed',
            code: 'INVALID_STATUS'
          });
        }
        
        chats = await getChatsByStatus(user, status);
      } else {
        // 获取所有参与的对话
        const ongoingChats = await getChatsByStatus(user, 'ongoing');
        const completedChats = await getChatsByStatus(user, 'completed');
        chats = [...ongoingChats, ...completedChats];
      }
      
      reply.status(200).send({
        success: true,
        data: chats,
        total: chats.length,
        filters: {
          status: status || 'all',
          role: role || 'all'
        },
        user: {
          id: user.id || user._id,
          username: user.username
        }
      });
    } catch (error: any) {
      fastify.log.error('获取对话列表错误:', error);
      reply.status(500).send({ 
        success: false,
        message: error.message || '服务器错误',
        code: 'SERVER_ERROR'
      });
    }
  });
};

export default getChatsByStatusRoute;
