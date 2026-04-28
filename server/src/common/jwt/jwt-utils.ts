import { UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { IUser } from 'src/users/interfaces/user.interface';

const ACCESS_SECRET = process.env.ACCESS_SECRET_KEY || 'ACCESS_SECRET';
const REFRESH_SECRET = process.env.REFRESH_SECRET_KEY || 'REFRESH_SECRET';
const ACCESS_TTL = '15m';
const REFRESH_TTL = '7d';

export interface IJwtPayload extends Omit<IUser, 'passwordHash'> {}

export const generatePayload = (dataUser: IJwtPayload) => {
  return {
    pkIdUser: dataUser.pkIdUser,
    fullName: dataUser.fullName,
    login: dataUser.login,
    phone: dataUser.phone,
    email: dataUser.email,
    regData: dataUser.regData,
    roleName: dataUser.roleName,
    positionName: dataUser.positionName ?? undefined,
  };
};

export const signAccess = (payload: IJwtPayload): string => {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_TTL });
};

export const signRefresh = (payload: IJwtPayload): string => {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_TTL });
};

export const verifyAccess = (accessToken: string): IJwtPayload => {
  try {
    return jwt.verify(accessToken, ACCESS_SECRET) as IJwtPayload;
  } catch (e) {
    throw new UnauthorizedException(
      'Недействительный или просроченный access-токен',
    );
  }
};

export const verifyRefresh = (refreshToken: string): IJwtPayload => {
  try {
    return jwt.verify(refreshToken, REFRESH_SECRET) as IJwtPayload;
  } catch (e) {
    throw new UnauthorizedException(
      'Недействительный или просроченный refresh-токен',
    );
  }
};
