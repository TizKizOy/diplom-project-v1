import { IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'admin',
    description: 'Логин пользователя (латиница, цифры, _. -)',
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
    example: 'admin',
    description: 'Пароль',
    minLength: 5,
    maxLength: 55,
  })
  @IsString({ message: 'Необходимо передать пароль' })
  @MinLength(5, { message: 'Пароль минимум 5 символов' })
  @MaxLength(55, { message: 'Пароль максимум 55 символов' })
  password: string;
}
