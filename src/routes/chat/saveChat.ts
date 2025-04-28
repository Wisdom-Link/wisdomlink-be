import { FastifyPluginAsync } from 'fastify';
import Chat from '../../models/chat';
import { Chat as ChatType } from '../../types/chat';
import mongoose from 'mongoose';

const saveChatRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post('/saveChat', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const chatData = request.body as ChatType;

      // 查找是否已存在 chatId
      let chat = await Chat.findOne({ chatId: chatData.chatId });

      const messages = chatData.messages.map(msg => ({
        sender: new mongoose.Types.ObjectId(msg.sender),
        content: msg.content,
        timestamp: msg.timestamp || new Date()
      }));

      if (chat) {
        // 已存在则更新
        chat.imageUrl = chatData.imageUrl || chat.imageUrl;
        chat.userIds = chatData.userIds.map(userId => new mongoose.Types.ObjectId(userId));
        chat.set('messages', messages, { strict: true }); // 使用 set 方法
        await chat.save();
      } else {
        // 不存在则新建
        chat = new Chat({
          chatId: chatData.chatId,
          imageUrl: chatData.imageUrl,
          userIds: chatData.userIds.map(userId => new mongoose.Types.ObjectId(userId)),
          messages
        });
        await chat.save();
      }

      reply.send({ message: '对话保存成功', chat });
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ message: '服务器错误' });
    }
  });
};

export default saveChatRoute;
