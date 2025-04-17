import { FastifyPluginAsync } from 'fastify';

const updateInfoRoute: FastifyPluginAsync = async (fastify) => {

  fastify.put('/info', async (request, reply) => {
    reply.send({ message: '信息修改成功' });
  });
};

export default updateInfoRoute;
