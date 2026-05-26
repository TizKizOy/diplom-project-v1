import {
  IsString,
  MinLength,
  MaxLength,
  IsInt,
  Min,
  Max,
  IsDateString,
  IsOptional,
  IsArray,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { transformDeadlineToIso } from 'src/common/transformers/parse-deadline.transform';

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
  @Transform(transformDeadlineToIso)
  @IsOptional()
  @IsDateString()
  startDate?: Date;

  @ApiPropertyOptional({
    example: '2025-12-01T10:00:00Z',
    description: 'Дата окончания (ISO 8601)',
  })
  @Transform(transformDeadlineToIso)
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

  @ApiPropertyOptional({
    description: 'ID тегов из справочника tbTags',
    type: [Number],
    example: [1, 2],
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(0)
  @IsInt({ each: true })
  @Type(() => Number)
  tagIds?: number[];
}
