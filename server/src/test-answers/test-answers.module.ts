import { Module } from '@nestjs/common';
import { TestAnswersService } from './test-answers.service';
import { TestAnswersController } from './test-answers.controller';
import { AttemptsModule } from 'src/attempts/attempts.module';

@Module({
  imports: [AttemptsModule],
  controllers: [TestAnswersController],
  providers: [TestAnswersService],
})
export class TestAnswersModule {}
