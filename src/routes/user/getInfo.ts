import { FastifyPluginAsync } from 'fastify';
// import { UserInfo } from '../../types/user';

const getInfoRoute: FastifyPluginAsync = async (fastify) => {
  
  fastify.get('/getInfo', async (request, reply) => {
    reply.send({ id: 1, username: '张三', email: 'zhangsan@example.com' });
  });
};

export default getInfoRoute;
