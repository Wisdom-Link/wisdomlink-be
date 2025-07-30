import { FastifyPluginAsync } from 'fastify';
import chatRoute from './AIchat'; 
import getChatRoute from './getChat';
import saveChatRoute from './saveChat';
import oneoneChatRoute from './oneoneChat';
import getChatsByStatusRoute from './getChatsByStatus';
import updateChatStatusRoute from './updateChatStatus';


const chatRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.register(getChatRoute);
  fastify.register(saveChatRoute);
  fastify.register(chatRoute);
  fastify.register(oneoneChatRoute);
  fastify.register(getChatsByStatusRoute);
  fastify.register(updateChatStatusRoute);
};

export default chatRoutes;