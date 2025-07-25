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
        // 添加日志查看前端传递的消息内容
        fastify.log.info('收到的消息:', JSON.stringify(messages, null, 2));
        
        // 开启流式响应，匹配前端流式读取
        const completion = await fastify.openai.chat.completions.create({
          model: 'deepseek-chat',
          messages,
          stream: true,
        });

        // 设置流式响应头
        reply.type('text/plain');
        reply.header('Transfer-Encoding', 'chunked');

        // 流式发送数据
        for await (const chunk of completion) {
          const content = chunk.choices?.[0]?.delta?.content || '';
          if (content) {
            reply.raw.write(content);
          }
        }
        
        reply.raw.end();
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