import { Module } from '@nestjs/common';
import { AttemptsService } from './attempts.service';
import { AttemptsController } from './attempts.controller';
import { CourseTeachersModule } from 'src/course-teachers/course-teachers.module';
import { CertificatesModule } from 'src/certificates/certificates.module';
import { TasksModule } from 'src/tasks/tasks.module';
import { GroupsModule } from 'src/groups/groups.module';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [
    CourseTeachersModule,
    CertificatesModule,
    TasksModule,
    GroupsModule,
    NotificationsModule,
  ],
  controllers: [AttemptsController],
  providers: [AttemptsService],
  exports: [AttemptsService],
})
export class AttemptsModule {}
