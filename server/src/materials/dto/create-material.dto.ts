import {
  IsString,
  IsInt,
  IsOptional,
  MinLength,
  MaxLength,
  IsUrl,
  IsBoolean,
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
    description: 'ID урока',
    example: 4,
  })
  @IsInt({ message: 'ID урока должно быть числом' })
  @Type(() => Number)
  lessonId: number;

  @ApiProperty({
    description:
      'ID типа материала (1-Видео, 2-Презентация, 3-PDF документ, 4-Ссылка)',
    example: 4,
  })
  @IsInt({ message: 'ID типа материала должно быть числом' })
  @Type(() => Number)
  typeMaterialId: number;

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

  @ApiProperty({
    description: 'Описание материала',
    example: 'В первой лекции будет информация о введение в курс React',
    minLength: 3,
    maxLength: 2000,
  })
  @IsString({ message: 'Описание должно быть строкой' })
  @MinLength(3, { message: 'Описание минимум 3 символа' })
  @MaxLength(2000, { message: 'Описание максимум 2000 символов' })
  description: string;

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

  @ApiPropertyOptional({
    description: 'Указатель поочерёдности (сортировки)',
    example: '1',
  })
  @IsOptional()
  @IsInt({ message: 'Указатель должен быть числом' })
  sortOrder?: number;

  @ApiPropertyOptional({
    description: 'Является дополнительным? (1-true, 0-false)',
    example: '1',
  })
  @IsOptional()
  @IsBoolean({ message: 'Указатель должнен быть boolean' })
  isAdditional?: boolean;
}
