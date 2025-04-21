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
  
  export interface UserInfo {
    username: string;
    motto:string;
    gender:'male' | 'female';
    Taps:string;
  }
  