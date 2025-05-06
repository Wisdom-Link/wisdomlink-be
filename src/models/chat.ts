import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  imageUrl: {
    type: String,
    default: ''
  },
  userIds: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'User',
    required: true,
    validate: [(arr: mongoose.Schema.Types.ObjectId[]) => arr.length === 2, '必须有两个用户id']
  },
  messages: [
    {
      sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
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
