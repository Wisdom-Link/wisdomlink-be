export interface ChatMessage {
    sender: string;      // 发送者用户id
    content: string;     // 消息内容
    timestamp?: Date;    // 发送时间，可选
}

export interface Chat {
    _id?: string;
    imageUrl?: string;
    questionUserId: string; // 问问题的用户id
    answerUserId: string;   // 答问题的用户id
    tap?: string;
    subject?: string;
    status?: 'ongoing' | 'completed';
    messages: {
        sender: string;
        content: string;
        timestamp?: Date;
    }[];
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ChatId {
    chatId: string;
}

