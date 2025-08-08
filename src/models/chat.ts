import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  // 提问者信息
  questionUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  questionUsername: {
    type: String,
    required: true
  },
  // 回答者信息
  answerUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  answerUsername: {
    type: String,
    required: true
  },
  content: {
    type: String,
    default: ''
  },
  community: {
    type: String,
    required: true
  },
  tags: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    enum: ['ongoing', 'completed'],
    default: 'ongoing'
  },
  messages: [
    {
      senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      senderUsername: { type: String, required: true },
      content: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      _id: false 
    }
  ]
}, {
  timestamps: true
});

const Chat = mongoose.model('Chat', chatSchema);

export default Chat;
