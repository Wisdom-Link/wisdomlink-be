import { FastifyPluginAsync } from 'fastify';
import chatRoute from './chat'; 
import getChatRoute from './getChat';
import saveChatRoute from './saveChat';


const chatRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.register(getChatRoute);
  fastify.register(saveChatRoute);
  fastify.register(chatRoute);
};

export default chatRoutes;