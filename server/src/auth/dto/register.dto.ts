import {
  IsString,
  MinLength,
  MaxLength,
  IsEmail,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'Иванов Иван Иванович',
    description: 'Полное имя (ФИО)',
    minLength: 3,
    maxLength: 30,
  })
  @IsString({ message: 'Необходимо передать ФИО' })
  @MinLength(3, { message: 'ФИО минимум 3 символа' })
  @MaxLength(30, { message: 'ФИО максимум 30 символов' })
  fullName: string;

  @ApiProperty({
    example: 'ivanov',
    description: 'Уникальный логин (латиница, цифры, _. -)',
    minLength: 3,
    maxLength: 30,
  })
  @IsString({ message: 'Необходимо передать логин' })
  @MinLength(3, { message: 'Логин минимум 3 символа' })
  @MaxLength(30, { message: 'Логин максимум 30 символов' })
  @Matches(/^[a-zA-Z0-9_.-]+$/, {
    message: 'Логин может содержать только латиницу, цифры, . _ -',
  })
  login: string;

  @ApiProperty({
    example: '+375291234567',
    description: 'Номер телефона',
    pattern: '^(\\+\\d{1,3}[- ]?)?\\d{10}$',
  })
  @IsString({ message: 'Необходимо передать телефон' })
  @Matches(/^(\+\d{1,3}[- ]?)?\d{10}$/, {
    message: 'Телефон в формате +375291234567 или 80291234567',
  })
  phone: string;

  @ApiProperty({
    example: 'ivan@example.com',
    description: 'Email адрес',
    maxLength: 50,
  })
  @IsEmail({}, { message: 'Некорректный email' })
  @MaxLength(50, { message: 'Email максимум 50 символов' })
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'Пароль (минимум 5 символов)',
    minLength: 5,
    maxLength: 55,
  })
  @IsString({ message: 'Необходимо передать пароль' })
  @MinLength(5, { message: 'Пароль минимум 5 символов' })
  @MaxLength(55, { message: 'Пароль максимум 55 символов' })
  password: string;
}
