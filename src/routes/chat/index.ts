import { FastifyPluginAsync } from 'fastify';
import chatRoute from './AIchat'; 
import getChatRoute from './getChat';
import saveChatRoute from './saveChat';
import oneoneChatRoute from './oneoneChat';
import getChatsByStatusRoute from './getChatsByStatus'; // 这个路由现在处理所有条件查询
import updateChatStatusRoute from './updateChatStatus';
import addMessageRoute from './addMessage';
import debugChatsRoute from './debugChats';
import getChatWithDetailsRoute from './getChatWithDetails';
import evaluateUserRoute from './evaluateUser';

const chatRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.register(getChatRoute);
  fastify.register(saveChatRoute);
  fastify.register(chatRoute);
  fastify.register(oneoneChatRoute);
  fastify.register(getChatsByStatusRoute); // 统一的查询接口
  fastify.register(updateChatStatusRoute);
  fastify.register(addMessageRoute);
  fastify.register(debugChatsRoute);
  fastify.register(getChatWithDetailsRoute);
  fastify.register(evaluateUserRoute); // 简单的用户评价接口
};

export default chatRoutes;