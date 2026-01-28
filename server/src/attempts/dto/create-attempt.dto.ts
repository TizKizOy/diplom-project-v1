import { IsInt, Min, IsOptional, Max } from 'class-validator';
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
    example: 1,
    description:
      'ID статуса: 1-На проверке (по умолчанию), 2-Принято, 3-Возвращено, 4-Апелляция',
    enum: [1, 2, 3, 4],
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(4)
  @Type(() => Number)
  statusId?: number;

  @ApiPropertyOptional({
    example: 85,
    description: 'Балл (если сразу оценивается, иначе null)',
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  score?: number | null;
}
