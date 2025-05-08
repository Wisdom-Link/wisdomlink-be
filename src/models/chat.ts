import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  imageUrl: {
    type: String,
    default: ''
  },
  questionUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  answerUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tap: {
    type: String,
    default: ''
  },
  subject: {
    type: String,
    default: ''
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
