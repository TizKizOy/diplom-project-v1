import { IsString, MinLength, MaxLength } from 'class-validator';
import { ILogin } from '../interfaces/login.interface';

export class LoginDto implements ILogin {
  @IsString({ message: 'Необходимо передать логин' })
  @MinLength(3, { message: 'Логин минимум 3 символа' })
  @MaxLength(30, { message: 'Логин максимум 30 символов' })
  login: string;

  @IsString({ message: 'Необходимо передать пароль' })
  @MinLength(3, { message: 'Пароль минимум 3 символа' })
  @MaxLength(30, { message: 'Пароль максимум 30 символов' })
  password: string;
}
