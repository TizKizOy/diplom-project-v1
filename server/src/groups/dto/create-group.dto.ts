import {
  IsString,
  MinLength,
  MaxLength,
  IsInt,
  Min,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateGroupDto {
  @ApiProperty({
    example: 'React-2025-1',
    description: 'Название группы',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 1, description: 'ID курса' })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  courseId: number;

  @ApiPropertyOptional({
    example: 2,
    description: 'ID куратора (преподавателя), опционально',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  curatorId?: number;
}
