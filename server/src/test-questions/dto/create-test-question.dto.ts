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

export class CreateTestQuestionDto {
  @ApiProperty({
    description: 'ID теста',
    example: 1,
    minimum: 1,
  })
  @IsInt({ message: 'ID теста должно быть числом' })
  @Min(1, { message: 'ID теста ≥ 1' })
  @Type(() => Number)
  testId: number;

  @ApiProperty({
    description: 'Текст вопроса',
    example: 'Что такое замыкание в JavaScript?',
    minLength: 1,
    maxLength: 4000,
  })
  @IsString({ message: 'Необходимо передать текст вопроса' })
  @MinLength(1, { message: 'Текст вопроса минимум 1 символ' })
  @MaxLength(4000, { message: 'Текст вопроса максимум 4000 символов' })
  questionText: string;

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

  @ApiProperty({
    description: 'Балл за вопрос',
    example: 1,
    default: 1,
    minimum: 1,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'Балл должен быть числом' })
  @Min(1, { message: 'Балл ≥ 1' })
  @Type(() => Number)
  score?: number;
}
