import mongoose from 'mongoose';

const threadSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  location: {
    type: String,
    default: ''
  },
  tags: {
    type: [String],
    default: []
  }
});

const Thread = mongoose.model('Thread', threadSchema);

export default Thread;
