export interface UserLoginBody {
    username: string;
    password: string;
  }
  
  export interface UserRegisterBody {
    username: string;
    password: string;
    gender: 'male' | 'female';
    birthday:Date;
  }
  
  export interface userInfo {
    username: string;
    motto: string;
    gender: string;
    avatar: string;
    taps: string[];
    level: number;
    questionCount?: number; // Added questionCount property
    answerCount?: number; // Added answerCount property
    highQualityAnswerCount?: number; // Added highQualityAnswerCount property
  }
  