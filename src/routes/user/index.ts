import { FastifyPluginAsync } from 'fastify';
import loginRoute from './login.js';
import registerRoute from './register.js';
import getInfoRoute from './getInfo.js';
import updateInfoRoute from './updateInfo.js';
import deleteUserRoute from './deleteUser.js'; 

const userRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.register(loginRoute);
  fastify.register(registerRoute);
  fastify.register(getInfoRoute);
  fastify.register(updateInfoRoute);
  fastify.register(deleteUserRoute);
};

export default userRoutes;