import {
  IsString,
  MinLength,
  Matches,
  IsEmail,
  MaxLength,
} from 'class-validator';
import { IUser } from 'src/users/interfaces/user.interface';

export class RegisterDto implements Omit<
  IUser,
  'roleName' | 'passwordHash' | 'regDate' | 'pkIdUser'
> {
  @IsString({ message: 'Необходимо передать ФИО' })
  @MinLength(2, { message: 'ФИО минимум 2 символа' })
  @MaxLength(30, { message: 'ФИО максимум 30 символов' })
  fullName: string;

  @IsString({ message: 'Необходимо передать логин' })
  @MinLength(3, { message: 'Логин минимум 3 символа' })
  @MaxLength(30, { message: 'Логин максимум 30 символов' })
  login: string;

  @IsString({ message: 'Необходимо передать телефон' })
  @Matches(/^(\+\d{1,3}[- ]?)?\d{10}$/, {
    message: 'Телефон в формате +375291234567 или 291234567',
  })
  phone: string;

  @IsEmail({}, { message: 'Некорректный email' })
  @MaxLength(100, { message: 'Email максимум 100 символов' })
  email: string;

  @IsString({ message: 'Необходимо передать пароль' })
  @MinLength(4, { message: 'Пароль минимум 4 символа' })
  @MaxLength(255, { message: 'Пароль максимум 255 символов' })
  password: string;
}
