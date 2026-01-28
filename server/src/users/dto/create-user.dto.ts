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
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'Полное имя пользователя',
    example: 'Иванов Иван Иванович',
    minLength: 3,
    maxLength: 30,
  })
  @IsString({ message: 'Необходимо передать строковое ФИО' })
  @MinLength(3, { message: 'ФИО минимум 3 символа' })
  @MaxLength(30, { message: 'ФИО максимум 30 символов' })
  fullName: string;

  @ApiProperty({
    description: 'Уникальный логин (латиница, цифры, _. -)',
    example: 'ivanov_i',
    pattern: '^[a-zA-Z0-9_.-]+$',
  })
  @IsString({ message: 'Необходимо передать строковый Логин' })
  @MinLength(3, { message: 'Логин минимум 3 символа' })
  @MaxLength(30, { message: 'Логин максимум 30 символов' })
  @Matches(/^[a-zA-Z0-9_.-]+$/, {
    message: 'Логин может содержать только латиницу, цифры, . _ -',
  })
  login: string;

  @ApiProperty({
    description: 'Номер телефона',
    example: '+375291234567',
    pattern: '^(\\+\\d{1,3}[- ]?)?\\d{10}$',
  })
  @IsString({ message: 'Необходимо передать строковый телефон' })
  @Matches(/^(\+\d{1,3}[- ]?)?\d{10}$/, {
    message: 'Телефон в формате +375291234567 или 291234567',
  })
  phone: string;

  @ApiProperty({
    description: 'Email адрес',
    example: 'user@example.com',
    maxLength: 50,
  })
  @IsEmail({}, { message: 'Некорректный email' })
  @MaxLength(50, { message: 'Email максимум 50 символов' })
  email: string;

  @ApiProperty({
    description: 'Пароль (минимум 5 символов)',
    example: 'password123',
    minLength: 5,
    maxLength: 55,
  })
  @IsString({ message: 'Необходимо передать строковый пароль' })
  @MinLength(5, { message: 'Пароль минимум 5 символов' })
  @MaxLength(55, { message: 'Пароль максимум 55 символов' })
  password: string;

  @ApiProperty({
    description: 'ID роли: 1-Админ, 2-Преподаватель, 3-Слушатель',
    example: 3,
    minimum: 1,
    maximum: 3,
    enum: [1, 2, 3],
  })
  @IsInt({ message: 'ID роли должно быть числом' })
  @Min(1, { message: 'ID роли ≥ 1' })
  @Max(3, { message: 'ID роли ≤ 3' })
  @Type(() => Number)
  roleId: number;
}
