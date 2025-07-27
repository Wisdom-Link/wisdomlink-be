import { FastifyPluginAsync } from 'fastify';

const chatRoute: FastifyPluginAsync = async (fastify) => {
  // WebSocket 路由
  fastify.get('/AIchat', { websocket: true }, (connection, req) => {
    // 使用 connection 而不是 connection.socket
    connection.on('message', async (message: any) => {
      try {
        const messageStr = message.toString();
        fastify.log.info('收到原始消息:', messageStr);
        
        const { messages, token } = JSON.parse(messageStr);

        // 验证 token（简单验证，可以根据需要完善）
        if (!token) {
          connection.send(JSON.stringify({ type: 'error', error: '未提供认证token' }));
          return;
        }

        if (!Array.isArray(messages) || messages.length === 0) {
          connection.send(JSON.stringify({ type: 'error', error: 'messages 字段必须为非空数组' }));
          return;
        }

        // 添加日志查看前端传递的消息内容
        fastify.log.info('收到的消息:', JSON.stringify(messages, null, 2));
        
        try {
          const completion = await fastify.openai.chat.completions.create({
            model: 'deepseek-chat',
            messages,
            stream: true,
          });

          // 通过 WebSocket 流式发送数据
          for await (const chunk of completion) {
            const content = chunk.choices?.[0]?.delta?.content || '';
            if (content) {
              connection.send(JSON.stringify({ 
                type: 'content', 
                content 
              }));
            }
          }
          
          // 发送结束标识
          connection.send(JSON.stringify({ type: 'end' }));

        } catch (err: any) {
          fastify.log.error('OpenAI API 调用失败:', err);
          connection.send(JSON.stringify({ 
            type: 'error', 
            error: 'AI 服务不可用',
            detail: err.message || err 
          }));
        }

      } catch (err) {
        fastify.log.error('消息处理失败:', err);
        connection.send(JSON.stringify({ 
          type: 'error', 
          error: '消息处理失败',
          detail: err instanceof Error ? err.message : String(err)
        }));
      }
    });

    connection.on('error', (err: Error) => {
      fastify.log.error('WebSocket 错误:', err);
    });

    connection.on('close', () => {
      fastify.log.info('WebSocket 连接关闭');
    });
  });
}

export default chatRoute;