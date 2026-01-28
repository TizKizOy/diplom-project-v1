import {
  IsString,
  MinLength,
  MaxLength,
  IsInt,
  Min,
  IsOptional,
  IsDateString,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateTaskDto {
  @ApiProperty({ example: 1, description: 'ID курса' })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  courseId: number;

  @ApiProperty({
    example: 2,
    description: 'ID типа задания: 1-Тест, 2-Практическая, 3-Аттестация',
    enum: [1, 2, 3],
  })
  @IsInt()
  @Min(1)
  @Max(3)
  @Type(() => Number)
  typeId: number;

  @ApiProperty({
    example: 'Домашняя работа #1',
    description: 'Название задания',
    minLength: 3,
    maxLength: 255,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({
    example: 'Сделать CRUD на NestJS',
    description: 'Описание задания',
    maxLength: 511,
  })
  @IsOptional()
  @IsString()
  @MaxLength(511)
  description?: string;

  @ApiPropertyOptional({
    example: '2025-09-15T23:59:59Z',
    description: 'Дедлайн (ISO 8601)',
  })
  @IsOptional()
  @IsDateString()
  deadline?: Date;

  @ApiPropertyOptional({
    example: 100,
    description: 'Максимальный балл',
    default: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  maxScore?: number;
}
