import { Module, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { LoggerMiddleware } from './middlewares/logger.middleware';
import { AuthModule } from './auth/auth.module';
import { CoursesModule } from './courses/courses.module';
import { GroupsModule } from './groups/groups.module';
import { TasksModule } from './tasks/tasks.module';
import { AttemptsModule } from './attempts/attempts.module';
import { CertificatesModule } from './certificates/certificates.module';
import { MaterialsModule } from './materials/materials.module';
import { NotificationsModule } from './notifications/notifications.module';
import { GroupListenersModule } from './group-listeners/group-listeners.module';
import { LessonsModule } from './lessons/lessons.module';
import { CommentModule } from './comment/comment.module';
import { MessageModule } from './message/message.module';
import { CourseTeachersModule } from './course-teachers/course-teachers.module';
import { TestQuestionsModule } from './test-questions/test-questions.module';
import { TestOptionsModule } from './test-options/test-options.module';
import { TestModule } from './tests/test.module';
import { TestAnswersModule } from './test-answers/test-answers.module';
import { AdminsModule } from './admin-log/admin-log.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    UsersModule,
    CoursesModule,
    GroupsModule,
    GroupListenersModule,
    TasksModule,
    AttemptsModule,
    CertificatesModule,
    MaterialsModule,
    NotificationsModule,
    LessonsModule,
    CommentModule,
    MessageModule,
    CourseTeachersModule,
    TestQuestionsModule,
    TestOptionsModule,
    TestModule,
    TestAnswersModule,
    AdminsModule,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
