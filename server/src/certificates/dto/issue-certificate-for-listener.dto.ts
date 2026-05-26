import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class IssueCertificateForListenerDto {
  @ApiProperty({ description: 'ID курса', example: 1 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  courseId: number;

  @ApiProperty({ description: 'ID слушателя', example: 5 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  listenerId: number;
}
