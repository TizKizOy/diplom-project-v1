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
import { Type, Transform } from 'class-transformer';
import { transformDeadlineToIso } from 'src/common/transformers/parse-deadline.transform';

export class CreateTaskDto {
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

  @ApiProperty({ example: 1, description: 'ID курса' })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  courseId: number;

  @ApiPropertyOptional({ example: 1, description: 'ID урока (если не указано — задание уровня курса)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  lessonId?: number;

  @ApiPropertyOptional({ example: 1, description: 'ID теста' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  testId?: number;

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
  @IsString()
  @IsOptional()
  @MaxLength(511)
  description?: string;

  @ApiPropertyOptional({
    example: 'В этом задание необходимо реализовать такой функционал ...',
    description: 'Текст задания',
    maxLength: 5048,
  })
  @IsOptional()
  @IsString()
  @MaxLength(5048)
  content?: string;

  @ApiPropertyOptional({
    example: 'Ссылка на файл',
    description: 'Файл с заданием',
    maxLength: 511,
  })
  @IsOptional()
  @IsString()
  @MaxLength(511)
  contentFileUrl?: string;

  @ApiPropertyOptional({
    example: '2025-09-15T23:59:59.000Z',
    description: 'Дедлайн (ISO 8601; допускаются datetime-local и DD.MM.YYYY HH:mm)',
  })
  @Transform(transformDeadlineToIso)
  @IsOptional()
  @IsDateString()
  deadline?: string;

  @ApiPropertyOptional({
    example: 100,
    description: 'Максимальный балл',
    default: 100,
  })
  @IsInt()
  @Min(0)
  @Max(10000)
  @IsOptional()
  @Type(() => Number)
  maxScore?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Порядок уроков',
    default: 0,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  sortOrder?: number;
}
