export interface ThreadId {
  threadId: string;
}

export interface Thread {
  threadId: string;
  subject: string;
  content: string;
  userId: string;
  createdAt?: Date;
  location?: string;
  tags?: string[];
}

export interface ThreadSearch {
  subject: string;
  tags?: string[];
}
