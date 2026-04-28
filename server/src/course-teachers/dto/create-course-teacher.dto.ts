import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class CreateCourseTeacherDto {
  @ApiProperty({
    description: 'ID курса',
    example: 3,
    minimum: 1,
  })
  @IsInt({ message: 'ID курса должно быть числом' })
  @Min(1, { message: 'ID курса ≥ 1' })
  @Type(() => Number)
  courseId: number;

  @ApiProperty({
    description: 'ID преподавателя',
    example: 3,
    minimum: 1,
  })
  @IsInt({ message: 'ID преподавателя должно быть числом' })
  @Min(1, { message: 'ID преподавателя ≥ 1' })
  @Type(() => Number)
  teacherId: number;
}
