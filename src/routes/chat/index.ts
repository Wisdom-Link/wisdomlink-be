import { FastifyPluginAsync } from 'fastify';
import getChatRoute from './getChat';
import saveChatRoute from './saveChat';

const chatRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.register(getChatRoute);
  fastify.register(saveChatRoute);
};

export default chatRoutes;