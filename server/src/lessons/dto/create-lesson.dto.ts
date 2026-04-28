import { IsString, IsInt, IsBoolean, Min, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateLessonDto {
  @ApiProperty({ example: 1, description: 'ID курса' })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  courseId: number;

  @ApiProperty({ example: 'Введение в Python', description: 'Название урока' })
  @IsString()
  title: string;

  @ApiPropertyOptional({
    example: 'Основные понятия языка Python.',
    description: 'Описание урока',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: '<p>Содержимое урока</p>',
    description: 'Содержимое урока',
  })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({ example: 1, description: 'Порядок сортировки' })
  @IsInt()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  sortOrder?: number;

  @ApiPropertyOptional({ example: false, description: 'Опубликован ли урок' })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isPublished?: boolean;
}
