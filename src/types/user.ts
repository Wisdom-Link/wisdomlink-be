export interface UserLoginBody {
    username: string;
    password: string;
  }
  
  export interface UserRegisterBody {
    username: string;
    password: string;
  }
  
  export interface userInfo {
    username: string;
    motto: string;
    avatar: string;
    taps: string[];
    level: number;
    questionCount?: number; 
    answerCount?: number; 
    highQualityAnswerCount?: number; 
    questionChats?: string[]; // Chat _id 数组
    answerChats?: string[];   // Chat _id 数组
    posts?: string[];         // Thread _id 数组
  }
  
  export interface updateInfo {
    username: string;
    motto: string;
    avatar: string;
    taps: string[];
  }