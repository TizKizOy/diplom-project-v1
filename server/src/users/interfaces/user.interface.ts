export interface IUser {
  pkIdUser: number;
  fullName: string;
  login: string;
  email: string;
  phone: string;
  passwordHash: string;
  regData: Date;
  roleName: string;
  positionName?: string;
}
