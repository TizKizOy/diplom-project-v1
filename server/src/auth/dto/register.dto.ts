import {
  IsString,
  MinLength,
  MaxLength,
  IsEmail,
  Matches,
  IsOptional,
  IsInt,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class RegisterDto {
  @ApiProperty({
    example: 'Иванов Иван Иванович',
    description: 'Полное имя (ФИО)',
    minLength: 5,
    maxLength: 30,
  })
  @IsString({ message: 'Необходимо передать ФИО' })
  @MinLength(5, { message: 'ФИО минимум 5 символа' })
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

  @ApiProperty({
    description: `ID должности: 1-Учитель информатики, 2-Учитель математики, 3-Учитель физики,
          4-Учитель русского языка, 5-Учитель английского языка, 6-Учитель психологии,
          7-Учитель начальных классов, 8-Методист`,
    example: 3,
    minimum: 1,
    maximum: 8,
    enum: [1, 2, 3, 4, 5, 6, 7, 8],
  })
  @IsOptional()
  @IsInt({ message: 'ID должности должно быть числом' })
  @Min(1, { message: 'ID должности ≥ 1' })
  @Type(() => Number)
  positionId?: number;
}
