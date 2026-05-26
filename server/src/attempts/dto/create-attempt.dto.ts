import { IsInt, Min, Max, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateAttemptDto {
  @ApiProperty({ example: 1, description: 'ID задания (task)' })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  taskId: number;

  @ApiProperty({ example: 5, description: 'ID слушателя' })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  listenerId: number;

  @ApiPropertyOptional({
    example: 4,
    enum: [1, 2, 3, 4],
    default: 1,
  })
  @IsInt()
  @Min(1)
  @Max(4)
  @Type(() => Number)
  statusId: number;

  @ApiPropertyOptional({
    example: 85,
    description: 'Текст ответа попытки',
  })
  @IsString()
  @IsOptional()
  answerText?: string;

  @ApiPropertyOptional({
    example: 85,
    description: 'Файл в попытке (например практическое задание)',
  })
  @IsString()
  @IsOptional()
  answerFileUrl?: string;

  @ApiPropertyOptional({
    example: 85,
    description: 'Балл (если сразу оценивается, иначе null)',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  @Type(() => Number)
  score?: number;
}
