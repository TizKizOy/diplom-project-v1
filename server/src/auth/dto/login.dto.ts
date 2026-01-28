import { IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin', description: 'Логин пользователя' })
  @IsString({ message: 'Необходимо передать логин' })
  @MinLength(3)
  @MaxLength(30)
  login: string;

  @ApiProperty({ example: 'admin', description: 'Пароль' })
  @IsString({ message: 'Необходимо передать пароль' })
  @MinLength(5)
  @MaxLength(55)
  password: string;
}
