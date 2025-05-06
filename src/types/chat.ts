export interface ChatMessage {
    sender: string;      // 发送者用户id
    content: string;     // 消息内容
    timestamp?: Date;    // 发送时间，可选
}

export interface Chat {
    _id: string;
    imageUrl?: string;
    userIds: string[]; // 用户id数组
    messages: ChatMessage[];
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ChatId {
    chatId: string;
}

