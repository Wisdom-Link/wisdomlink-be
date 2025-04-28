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
    motto:string;
    gender:'male' | 'female';
    taps:string[];
    level:number;
    avatar:string;
  }
  