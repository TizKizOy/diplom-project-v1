export interface IUser {
  pkIdUser: number;
  fullName: string;
  login: string;
  phone: string;
  email: string;
  passwordHash: string;
  regDate: Date;
  roleName: string;
}
