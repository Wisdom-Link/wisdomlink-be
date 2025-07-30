import { FastifyPluginAsync } from "fastify";
import { updateChatStatus } from "../../services/chatService";

// 全局用户连接映射表：userId -> WebSocket 连接对象
const userConnMap = new Map<string, any>();

// 聊天室活跃状态映射：chatId -> 是否活跃
const chatActiveMap = new Map<string, boolean>();

const oneoneChatRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    "/oneoneChat",
    {
      websocket: true,
      onRequest: [fastify.authenticate],
    },
    (connection, req) => {
      // 获取当前用户ID（JWT解码后存于 request.user.id）
      const userId = (req as any).user?.id;
      if (!userId) {
        connection.socket.close();
        return;
      }
      userConnMap.set(userId, connection);

      connection.socket.on("message", async (message: string) => {
        // 期望前端发送格式：{ toUserId: string, content: string, chatId: string, end?: boolean }
        let data: { toUserId: string; content: string; chatId: string; end?: boolean };
        try {
          data = JSON.parse(message);
        } catch {
          connection.socket.send('消息格式错误');
          return;
        }

        // 聊天室结束逻辑
        if (data.end && data.chatId) {
          chatActiveMap.set(data.chatId, false);
          
          // 更新数据库中的对话状态
          try {
            await updateChatStatus(data.chatId, 'completed');
            fastify.log.info(`对话 ${data.chatId} 已标记为完成`);
          } catch (error) {
            fastify.log.error(`更新对话状态失败: ${error}`);
          }
          
          connection.socket.send(JSON.stringify({ system: true, msg: '对话已结束' }));
          const targetConn = userConnMap.get(data.toUserId);
          if (targetConn) {
            targetConn.socket.send(JSON.stringify({ system: true, msg: '对话已结束' }));
          }
          return;
        }

        // 检查聊天室是否活跃，未设置的默认活跃
        if (data.chatId && chatActiveMap.has(data.chatId) && chatActiveMap.get(data.chatId) === false) {
          connection.socket.send(JSON.stringify({ system: true, msg: '该对话已结束，不能再发送消息' }));
          return;
        }

        // 消息转发逻辑
        const targetConn = userConnMap.get(data.toUserId);
        if (targetConn) {
          targetConn.socket.send(
            JSON.stringify({ fromUserId: userId, content: data.content, chatId: data.chatId })
          );
        }
        // 无论对方是否在线，自己都可以发送消息（消息不会丢失，前端可自行处理未送达）
      });

      connection.socket.on("close", () => {
        // 当前用户下线，移除其 WebSocket 连接
        userConnMap.delete(userId);
      });
    }
  );
};

export default oneoneChatRoute;
