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
  gender: { 
    type: String, 
    enum: ['male', 'female'], 
    required: true 
  },
  birthday: { 
    type: Date, 
    required: true 
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
  avatar: { 
    type: String, 
    default: '', // 默认头像为空字符串
  },
  chats: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat'
    }
  ]
}, {
  timestamps: true,  // 自动创建 createdAt 和 updatedAt 字段
});

// 创建并导出 User 模型
const User = mongoose.model('User', userSchema);

export default User;
