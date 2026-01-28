import { IsString, IsInt, MinLength, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateNotificationDto {
  @ApiProperty({
    description: 'ID пользователя-получателя',
    example: 5,
  })
  @IsInt({ message: 'ID пользователя должно быть числом' })
  @Type(() => Number)
  userId: number;

  @ApiProperty({
    description: 'Текст уведомления',
    example: 'Дедлайн по заданию через 1 день!',
    minLength: 3,
    maxLength: 527,
  })
  @IsString({ message: 'Сообщение должно быть строкой' })
  @MinLength(3, { message: 'Сообщение минимум 3 символа' })
  @MaxLength(527, { message: 'Сообщение максимум 527 символов' })
  message: string;
}
