import fp from 'fastify-plugin';
import websocket from '@fastify/websocket';
import { FastifyInstance } from 'fastify';

const websocketPlugin = async (fastify: FastifyInstance) => {
  // 只需注册 websocket 插件
  await fastify.register(websocket);
};

export default fp(websocketPlugin);
