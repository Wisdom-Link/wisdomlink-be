export interface ThreadId {
  threadId: string;
}

export interface Thread {
  threadId: string;
  content: string;
  userId: string;
  createdAt?: Date;
  location?: string;
  tags?: string[];
  community: string;
}

export interface ThreadSearch {
  content: string;
  tags?: string[];
}
