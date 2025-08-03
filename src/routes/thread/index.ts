import { FastifyPluginAsync } from 'fastify';
import deleteThreadRoute from './deleteThread'; 
import saveThreadRoute from './saveThread';
import threadsByCommunityRoute from './threadsByCommunity';
import searchThreadRoute from './searchThread'
import getThreadRoute from './getThreadsByUsername';
import getRandomThreadsRoute from './getRandomThreads';
import updateThreadRoute from './updateThread';

const threadRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.register(deleteThreadRoute);
  fastify.register(saveThreadRoute);
  fastify.register(threadsByCommunityRoute);
  fastify.register(searchThreadRoute);
  fastify.register(getThreadRoute);
  fastify.register(getRandomThreadsRoute);
  fastify.register(updateThreadRoute);
};

export default threadRoutes;