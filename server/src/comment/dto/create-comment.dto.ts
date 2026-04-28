import {
  IsString,
  MinLength,
  MaxLength,
  IsInt,
  Min,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({
    description: `ID задания`,
    example: 3,
    minimum: 1,
  })
  @IsOptional()
  @IsInt({ message: 'ID задания должно быть числом' })
  @Min(1, { message: 'ID задания ≥ 1' })
  @Type(() => Number)
  fkIdTask?: number;

  @ApiProperty({
    description: `ID попытки сдачи задания`,
    example: 3,
    minimum: 1,
  })
  @IsOptional()
  @IsInt({ message: 'ID попытки сдачи задания' })
  @Min(1, { message: 'ID попытки сдачи задания ≥ 1' })
  @Type(() => Number)
  fkIdAttempt?: number;

  @ApiProperty({
    description: `ID пользователя`,
    example: 3,
    minimum: 1,
  })
  @IsOptional()
  @IsInt({ message: 'ID пользователя должно быть числом' })
  @Min(1, { message: 'ID пользователя ≥ 1' })
  @Type(() => Number)
  fkIdUser: number;

  @ApiProperty({
    description:
      'Комментарий слушателя к сдачи работы или преподавателя после проверки задания ',
    example: 'А как определить свой стиль общения?',
    minLength: 5,
    maxLength: 2000,
  })
  @IsString({ message: 'Необходимо передать сообщение' })
  @MinLength(3, { message: 'ФИО минимум 5 символа' })
  @MaxLength(2000, { message: 'ФИО максимум 2000 символов' })
  message: string;
}
