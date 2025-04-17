export interface UserLoginBody {
    username: string;
    password: string;
  }
  
  export interface UserRegisterBody {
    username: string;
    password: string;
    email: string;
  }
  
  export interface UserInfo {
    id: number;
    username: string;
    email: string;
  }
  