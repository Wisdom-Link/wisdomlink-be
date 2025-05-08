import { FastifyPluginAsync } from 'fastify';
import Chat from '../../models/chat';
import { Chat as ChatType } from '../../types/chat';
import mongoose from 'mongoose';

const saveChatRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post('/saveChat', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const chatData = request.body as ChatType;

      // 如果有 _id 则查找并更新，否则新建
      let chat = chatData._id ? await Chat.findById(chatData._id) : null;

      const messages = chatData.messages.map(msg => ({
        sender: new mongoose.Types.ObjectId(msg.sender),
        content: msg.content,
        timestamp: msg.timestamp || new Date()
      }));

      if (chat) {
        // 已存在则更新
        chat.imageUrl = chatData.imageUrl || chat.imageUrl;
        chat.questionUserId = new mongoose.Types.ObjectId(chatData.questionUserId);
        chat.answerUserId = new mongoose.Types.ObjectId(chatData.answerUserId);
        chat.tap = chatData.tap || '';
        chat.subject = chatData.subject || '';
        chat.set('messages', messages, { strict: true });
        await chat.save();
      } else {
        // 不存在则新建
        chat = new Chat({
          imageUrl: chatData.imageUrl,
          questionUserId: new mongoose.Types.ObjectId(chatData.questionUserId),
          answerUserId: new mongoose.Types.ObjectId(chatData.answerUserId),
          tap: chatData.tap || '',
          subject: chatData.subject || '',
          messages
        });
        await chat.save();
      }

      reply.send({ message: '对话保存成功', chat, _id: chat._id });
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ message: '服务器错误' });
    }
  });
};

export default saveChatRoute;
