import mongoose from 'mongoose';

// 定义用户 Schema
const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true,  // 去除字符串两端的空格
  },
  password: { 
    type: String, 
    required: true, 
    minlength: 6,  // 密码至少 6 位字符
  },
  motto: { 
    type: String, 
    default: '', // 如果没有设置格言则默认值为空
  },
  taps: { 
    type: [String], // 数组，存储多个标签
    default: [],    // 默认是空数组
  },
  level: { 
    type: Number, 
    default: 0, // 默认头像为空字符串
  },
  questionCount: {
    type: Number,
    default: 0
  },
  answerCount: {
    type: Number,
    default: 0
  },
  highQualityAnswerCount: {
    type: Number,
    default: 0
  },
  avatar: { 
    type: String, 
    default: 'http://szsykcdad.hn-bkt.clouddn.com/avatar/%E9%BB%98%E8%AE%A4123456789.png'
  },
  questionChats: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat'
    }
  ],
  answerChats: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat'
    }
  ],
  posts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Thread'
    }
  ]
}, {
  timestamps: true,  // 自动创建 createdAt 和 updatedAt 字段
});

// 创建并导出 User 模型
const User = mongoose.model('User', userSchema);

export default User;
