import {
  IsString,
  MinLength,
  MaxLength,
  IsInt,
  Min,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTestOptionDto {
  @ApiProperty({
    description: 'ID вопроса',
    example: 1,
    minimum: 1,
  })
  @IsInt({ message: 'ID вопроса должно быть числом' })
  @Min(1, { message: 'ID вопроса ≥ 1' })
  @Type(() => Number)
  questionId: number;

  @ApiProperty({
    description: 'Текст варианта ответа',
    example: 'Функция внутри функции',
    minLength: 1,
    maxLength: 500,
  })
  @IsString({ message: 'Необходимо передать текст варианта' })
  @MinLength(1, { message: 'Текст варианта минимум 1 символ' })
  @MaxLength(500, { message: 'Текст варианта максимум 500 символов' })
  optionText: string;

  @ApiProperty({
    description: 'Правильный ответ',
    example: true,
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'isCorrect должен быть boolean' })
  @Type(() => Boolean)
  isCorrect?: boolean;

  @ApiProperty({
    description: 'Порядок сортировки',
    example: 0,
    default: 0,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'Порядок сортировки должен быть числом' })
  @Type(() => Number)
  sortOrder?: number;
}
