import { IsInt, Min, Max, IsBoolean, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTestDto {
  @ApiProperty({
    description: 'Лимит времени в минутах (null - без ограничения)',
    example: 30,
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt({ message: 'Лимит времени должен быть числом' })
  @Min(1, { message: 'Лимит времени ≥ 1 минуты' })
  @Type(() => Number)
  timeLimitMinutes?: number | null;

  @ApiProperty({
    description: 'Перемешивать вопросы',
    example: false,
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Перемешивание должно быть boolean' })
  @Type(() => Boolean)
  shuffleQuestions?: boolean;

  @ApiProperty({
    description: 'Максимальное количество попыток',
    example: 3,
    default: 1,
    minimum: 1,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'Количество попыток должно быть числом' })
  @Min(1, { message: 'Количество попыток ≥ 1' })
  @Type(() => Number)
  maxAttempts?: number;

  @ApiProperty({
    description: 'Показывать результаты',
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Показ результатов должен быть boolean' })
  @Type(() => Boolean)
  showResults?: boolean;

  @ApiProperty({
    description: 'Проходной балл в процентах (0-100)',
    example: 60,
    default: 60,
    minimum: 0,
    maximum: 100,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'Проходной балл должен быть числом' })
  @Min(0, { message: 'Проходной балл ≥ 0' })
  @Max(100, { message: 'Проходной балл ≤ 100' })
  @Type(() => Number)
  passingScorePercent?: number;
}
