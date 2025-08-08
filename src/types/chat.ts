export interface ChatMessage {
    sender: string;      // 发送者用户id
    content: string;     // 消息内容
    timestamp?: Date;    // 发送时间，可选
}

export interface Chat {
  _id?: string;
  // 前端只需要传用户名，后端负责查找ID
  questionUsername: string;
  answerUsername: string;
  content?: string;
  community: string;
  tags?: string[];
  status?: 'ongoing' | 'completed';
  messages: {
    senderUsername: string;
    content: string;
    timestamp?: Date;
  }[];
  createdAt?: Date;
  updatedAt?: Date;
}


export interface ChatId {
    chatId: string;
}

