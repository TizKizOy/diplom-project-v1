import { IsInt, Min, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class TestAnswerItemDto {
  @IsInt()
  @Min(1)
  questionId: number;

  @IsInt()
  @Min(1)
  optionId: number;
}

export class BulkCreateTestAnswersDto {
  @ApiProperty({
    example: 1,
    description: 'ID попытки, для которой создаются ответы',
  })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  attemptId: number;

  @ApiProperty({
    type: [TestAnswerItemDto],
    description: 'Массив ответов: [{ questionId: 1, optionId: 2 }, ...]',
    example: [
      { questionId: 1, optionId: 2 },
      { questionId: 2, optionId: 5 },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TestAnswerItemDto)
  answers: TestAnswerItemDto[];
}
