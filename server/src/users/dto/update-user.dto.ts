import {
  IsString,
  MinLength,
  MaxLength,
  IsEmail,
  IsInt,
  IsOptional,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IUser } from '../interfaces/user.interface';

export class UpdateUserDto implements Omit<
  IUser,
  'pkIdUser' | 'regDate' | 'roleName'
> {
  @IsOptional()
  @IsString({ message: 'Необходимо передать строковое ФИО' })
  @MinLength(2, { message: 'ФИО минимум 2 символа' })
  @MaxLength(30, { message: 'ФИО максимум 30 символов' })
  fullName: string;

  @IsOptional()
  @IsString({ message: 'Необходимо передать строковый Логин' })
  @MinLength(3, { message: 'Логин минимум 3 символа' })
  @MaxLength(30, { message: 'Логин максимум 30 символов' })
  @Matches(/^[a-zA-Z0-9_.-]+$/, {
    message: 'Логин может содержать только латиницу, цифры, . _ -',
  })
  login: string;

  @IsOptional()
  @IsString({ message: 'Необходимо передать строковый телефон' })
  @Matches(/^(\+\d{1,3}[- ]?)?\d{10}$/, {
    message: 'Телефон в формате +375291234567 или 291234567',
  })
  phone: string;

  @IsOptional()
  @IsEmail({}, { message: 'Некорректный email' })
  @MaxLength(100, { message: 'Email максимум 100 символов' })
  email: string;

  @IsOptional()
  @IsString({ message: 'Необходимо передать строковый пароль' })
  @MinLength(6, { message: 'Пароль минимум 6 символов' })
  @MaxLength(255, { message: 'Пароль максимум 255 символов' })
  passwordHash: string;

  @IsOptional()
  @IsInt({ message: 'ID роли должно быть числом' })
  @Min(1, { message: 'ID роли ≥ 1' })
  @Max(3, { message: 'ID роли ≤ 3' })
  @Type(() => Number)
  roleId: number;
}
