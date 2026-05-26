import { Module } from '@nestjs/common';
import { CourseTeachersService } from './course-teachers.service';
import { CourseTeachersController } from './course-teachers.controller';

@Module({
  controllers: [CourseTeachersController],
  providers: [CourseTeachersService],
  exports: [CourseTeachersService],
})
export class CourseTeachersModule {}
