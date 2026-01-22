import {
  IsString,
  MinLength,
  MaxLength,
  IsEmail,
  IsInt,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IUser } from '../interfaces/user.interface';

export class CreateUserDto implements Omit<
  IUser,
  'pkIdUser' | 'regDate' | 'roleName' | 'passwordHash'
> {
  @IsString({ message: 'Необходимо передать строковое ФИО' })
  @MinLength(3, { message: 'ФИО минимум 3 символа' })
  @MaxLength(30, { message: 'ФИО максимум 30 символов' })
  fullName: string;

  @IsString({ message: 'Необходимо передать строковый Логин' })
  @MinLength(3, { message: 'Логин минимум 3 символа' })
  @MaxLength(30, { message: 'Логин максимум 30 символов' })
  @Matches(/^[a-zA-Z0-9_.-]+$/, {
    message: 'Логин может содержать только латиницу, цифры, . _ -',
  })
  login: string;

  @IsString({ message: 'Необходимо передать строковый телефон' })
  @Matches(/^(\+\d{1,3}[- ]?)?\d{10}$/, {
    message: 'Телефон в формате +375291234567 или 291234567',
  })
  phone: string;

  @IsEmail({}, { message: 'Некорректный email' })
  @MaxLength(50, { message: 'Email максимум 50 символов' })
  email: string;

  @IsString({ message: 'Необходимо передать строковый пароль' })
  @MinLength(5, { message: 'Пароль минимум 5 символов' })
  @MaxLength(55, { message: 'Пароль максимум 55 символов' })
  password: string;

  @IsInt({ message: 'ID роли должно быть числом' })
  @Min(1, { message: 'ID роли ≥ 1' })
  @Max(3, { message: 'ID роли ≤ 3' })
  @Type(() => Number)
  roleId: number;
}
