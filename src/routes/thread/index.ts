import { FastifyPluginAsync } from 'fastify';
import getThreadRoute from './getThread';
import saveThreadRoute from './saveThread';
import deleteThreadRoute from './deleteThread';

const threadRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.register(getThreadRoute);
    fastify.register(saveThreadRoute);
    fastify.register(deleteThreadRoute);
};

export default threadRoutes;