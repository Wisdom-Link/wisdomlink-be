import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';

const chatRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post('/AIchat',{ onRequest: [fastify.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { messages } = request.body as { messages?: any[] };

      if (!Array.isArray(messages) || messages.length === 0) {
        reply.status(400).send({ error: 'messages 字段必须为非空数组' });
        return;
      }

      try {
        // 关闭流式，直接获取完整响应，便于调试
        const completion = await fastify.openai.chat.completions.create({
          model: 'deepseek-chat',
          messages,
          stream: false,
        });
        const content = completion.choices?.[0]?.message?.content || '';
        reply.send({ content, raw: completion });
        return;
      } catch (err: any) {
        fastify.log.error('OpenAI API 调用失败:', err);
        // 输出详细错误信息
        if (err.response) {
          const errorText = await err.response.text?.();
          fastify.log.error('OpenAI API 响应:', errorText);
          reply.status(502).send({ error: 'AI 服务不可用', detail: errorText });
        } else {
          reply.status(502).send({ error: 'AI 服务不可用', detail: err.message || err });
        }
        return;
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