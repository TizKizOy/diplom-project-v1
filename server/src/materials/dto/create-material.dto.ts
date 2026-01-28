import {
  IsString,
  IsInt,
  IsOptional,
  MinLength,
  MaxLength,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMaterialDto {
  @ApiProperty({
    description: 'ID курса',
    example: 2,
  })
  @IsInt({ message: 'ID курса должно быть числом' })
  @Type(() => Number)
  courseId: number;

  @ApiProperty({
    description: 'Название материала',
    example: 'Лекция 1. Введение в React',
    minLength: 3,
    maxLength: 255,
  })
  @IsString({ message: 'Название должно быть строкой' })
  @MinLength(3, { message: 'Название минимум 3 символа' })
  @MaxLength(255, { message: 'Название максимум 255 символов' })
  title: string;

  @ApiPropertyOptional({
    description: 'URL файла материала',
    example: 'https://example.com/materials/file.pdf',
  })
  @IsOptional()
  @IsString({ message: 'URL файла должен быть строкой' })
  @IsUrl({}, { message: 'Некорректный URL файла' })
  fileUrl?: string;

  @ApiPropertyOptional({
    description: 'Ссылка на внешний ресурс',
    example: 'https://example.com/materials/page',
  })
  @IsOptional()
  @IsString({ message: 'Ссылка должна быть строкой' })
  @IsUrl({}, { message: 'Некорректная ссылка' })
  link?: string;
}
