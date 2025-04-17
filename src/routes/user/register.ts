import { FastifyPluginAsync } from 'fastify';
// import { UserRegisterBody } from '../../types/user';

const registerRoute: FastifyPluginAsync = async (fastify) => {

  fastify.post('/register', async (request, reply) => {
    reply.send({ message: '注册成功' });
  });
};

export default registerRoute;
