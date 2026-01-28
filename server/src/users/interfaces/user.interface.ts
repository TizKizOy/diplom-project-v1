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

export interface IDeletedUserResult {
  deleted_id: number;
  message: string;
}

export interface IRestoredUserResult {
  restored_id: number;
  message: string;
}
