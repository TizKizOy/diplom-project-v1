import { IsInt, Min, Max, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class GradeAttemptDto {
  @ApiProperty({ example: 85, description: 'Выставленный балл' })
  @IsInt()
  @Min(0)
  score: number;

  @ApiPropertyOptional({
    example: 2,
    description:
      'ID статуса: 2-Принято (по умолчанию), 3-Возвращено, 4-Апелляция',
    enum: [2, 3, 4],
    default: 2,
  })
  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(4)
  @Type(() => Number)
  statusId?: number;
}
