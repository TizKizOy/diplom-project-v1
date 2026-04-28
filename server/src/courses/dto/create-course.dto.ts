import {
  IsString,
  MinLength,
  MaxLength,
  IsInt,
  Min,
  Max,
  IsDateString,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateCourseDto {
  @ApiProperty({
    example: 'React для начинающих',
    description: 'Название курса',
    minLength: 3,
    maxLength: 255,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({
    example: 'Полный курс по React с нуля',
    description: 'Описание курса',
    maxLength: 2000,
  })
  @IsString()
  @MaxLength(2000)
  description: string;

  @ApiPropertyOptional({
    example: '2025-09-01T10:00:00Z',
    description: 'Дата начала (ISO 8601)',
  })
  @IsOptional()
  @IsDateString()
  startDate?: Date;

  @ApiPropertyOptional({
    example: '2025-12-01T10:00:00Z',
    description: 'Дата окончания (ISO 8601)',
  })
  @IsOptional()
  @IsDateString()
  endDate?: Date;

  @ApiPropertyOptional({
    example: 1,
    description: 'ID статуса: 1-Черновик, 2-Опубликован, 3-Архивирован',
    default: 1,
    enum: [1, 2, 3],
  })
  @IsInt()
  @Min(1)
  @Max(3)
  @Type(() => Number)
  statusId: number;
}
