import { Module } from '@nestjs/common';
import { TestQuestionsService } from './test-questions.service';
import { TestQuestionsController } from './test-questions.controller';

@Module({
  controllers: [TestQuestionsController],
  providers: [TestQuestionsService],
})
export class TestQuestionsModule {}
