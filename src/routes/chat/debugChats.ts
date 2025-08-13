import { FastifyPluginAsync } from 'fastify';
import Chat from '../../models/chat';

const debugChatsRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/debugChats', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const username = user.username || user.name;
      
      // 获取所有对话
      const allChats = await Chat.find({})
        .select('questionUsername answerUsername community status createdAt updatedAt')
        .lean();
      
      // 获取用户相关对话
      const userChats = await Chat.find({
        $or: [
          { questionUsername: username },
          { answerUsername: username }
        ]
      })
      .select('questionUsername answerUsername community status createdAt updatedAt')
      .lean();
      
      // 统计信息
      const stats = {
        totalChats: allChats.length,
        userChats: userChats.length,
        ongoingChats: userChats.filter(c => c.status === 'ongoing').length,
        completedChats: userChats.filter(c => c.status === 'completed').length,
        asQuestioner: userChats.filter(c => c.questionUsername === username).length,
        asAnswerer: userChats.filter(c => c.answerUsername === username).length
      };
      
      reply.status(200).send({
        success: true,
        currentUser: username,
        stats,
        allChats: allChats.slice(0, 5).map(chat => ({
          _id: chat._id.toString(),
          questionUsername: chat.questionUsername,
          answerUsername: chat.answerUsername,
          community: chat.community,
          status: chat.status,
          createdAt: chat.createdAt,
          updatedAt: chat.updatedAt
        })),
        userChats: userChats.map(chat => ({
          _id: chat._id.toString(),
          questionUsername: chat.questionUsername,
          answerUsername: chat.answerUsername,
          community: chat.community,
          status: chat.status,
          role: chat.questionUsername === username ? 'questioner' : 'answerer',
          createdAt: chat.createdAt,
          updatedAt: chat.updatedAt
        }))
      });
    } catch (error: any) {
      fastify.log.error('调试查询失败:', error);
      reply.status(500).send({ 
        success: false,
        message: error.message || '调试查询失败',
        code: 'DEBUG_ERROR'
      });
    }
  });
};

export default debugChatsRoute;
