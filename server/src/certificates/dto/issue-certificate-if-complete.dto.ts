import { IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class IssueCertificateIfCompleteDto {
  @ApiProperty({ description: 'ID курса', example: 1 })
  @IsInt()
  @Type(() => Number)
  courseId: number;
}
