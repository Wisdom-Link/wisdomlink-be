import mongoose from 'mongoose';

const threadSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  userAvatar: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  community: {
    type: String,
    required: true
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
