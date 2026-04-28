import { Module } from '@nestjs/common';
import { TestOptionsService } from './test-options.service';
import { TestOptionsController } from './test-options.controller';

@Module({
  controllers: [TestOptionsController],
  providers: [TestOptionsService],
})
export class TestOptionsModule {}
