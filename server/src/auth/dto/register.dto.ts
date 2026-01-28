import {
  IsString,
  MinLength,
  MaxLength,
  IsEmail,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'Иванов Иван Иванович' })
  @IsString({ message: 'Необходимо передать ФИО' })
  @MinLength(3)
  @MaxLength(30)
  fullName: string;

  @ApiProperty({ example: 'ivanov' })
  @IsString({ message: 'Необходимо передать логин' })
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9_.-]+$/, {
    message: 'Логин может содержать только латиницу, цифры, . _ -',
  })
  login: string;

  @ApiProperty({ example: '+375291234567' })
  @IsString({ message: 'Необходимо передать телефон' })
  @Matches(/^(\+\d{1,3}[- ]?)?\d{10}$/, {
    message: 'Телефон в формате +375291234567',
  })
  phone: string;

  @ApiProperty({ example: 'ivan@example.com' })
  @IsEmail({}, { message: 'Некорректный email' })
  @MaxLength(50)
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString({ message: 'Необходимо передать пароль' })
  @MinLength(5)
  @MaxLength(55)
  password: string;
}
