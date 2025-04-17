import { FastifyPluginAsync } from 'fastify';
// import { UserLoginBody } from '../../types/user';

const loginRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post('/login', async (request, reply) => {
    reply.send({ message: '登录成功' });
  });
};

export default loginRoute;
