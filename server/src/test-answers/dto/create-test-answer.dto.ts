import { IsInt, Min, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateTestAnswerDto {
  @ApiProperty({
    example: 1,
    description: 'ID попытки (attempt)',
  })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  attemptId: number;

  @ApiProperty({
    example: 5,
    description: 'ID вопроса (test question)',
  })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  questionId: number;

  @ApiProperty({
    example: 3,
    description: 'ID выбранного варианта ответа (test option)',
  })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  selectedOptionId: number;
}
