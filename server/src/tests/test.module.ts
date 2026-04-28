import { Module } from '@nestjs/common';
import { TestsService } from './test.service';
import { TestsController } from './test.controller';

@Module({
  controllers: [TestsController],
  providers: [TestsService],
})
export class TestModule {}
