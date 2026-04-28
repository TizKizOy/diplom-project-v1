import { Module } from '@nestjs/common';
import { TestAnswersService } from './test-answers.service';
import { TestAnswersController } from './test-answers.controller';

@Module({
  controllers: [TestAnswersController],
  providers: [TestAnswersService],
})
export class TestAnswersModule {}
