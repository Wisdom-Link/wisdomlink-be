import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';

const chatRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post('/AIchat',{ onRequest: [fastify.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { messages } = request.body as { messages?: any[] };

      if (!Array.isArray(messages) || messages.length === 0) {
        reply.status(400).send({ error: 'messages 字段必须为非空数组' });
        return;
      }

      let stream;
      try {
        stream = await fastify.openai.chat.completions.create({
          model: 'deepseek-chat',
          messages,
          stream: true,
        });
      } catch (err) {
        fastify.log.error('OpenAI API 调用失败:', err);
        reply.status(502).send({ error: 'AI 服务不可用' });
        return;
      }

      reply.raw.setHeader('Content-Type', 'text/event-stream');
      reply.raw.setHeader('Cache-Control', 'no-cache');
      reply.raw.setHeader('Connection', 'keep-alive');

      // 监听客户端断开连接
      let clientAborted = false;
      reply.raw.on('close', () => {
        clientAborted = true;
      });

      try {
        for await (const chunk of stream) {
          if (clientAborted) break;
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            reply.raw.write(`data: ${content}\n\n`);
          }
        }
        reply.raw.write(`data: [DONE]\n\n`);
      } catch (streamErr) {
        fastify.log.error('流式响应出错:', streamErr);
        reply.raw.write(`data: [ERROR]\n\n`);
      } finally {
        reply.raw.end();
      }

    } catch (err) {
      fastify.log.error('聊天失败:', err);
      if (!reply.sent) {
        reply.status(500).send({ error: 'Internal Server Error' });
      }
    }
  });
}

export default chatRoute;