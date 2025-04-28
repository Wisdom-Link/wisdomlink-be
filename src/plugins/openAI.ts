import fp from 'fastify-plugin';
import OpenAI from 'openai';

import { FastifyInstance } from 'fastify';

async function openaiPlugin(fastify: FastifyInstance, options: any) {
  const openai = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: process.env.DeepSeek_API_Key,
  });

  // 挂到 fastify 实例上
  fastify.decorate('openai', openai);
}

export default fp(openaiPlugin);
