import { Module } from '@nestjs/common';
import { GroupListenersService } from './group-listeners.service';
import { GroupListenersController } from './group-listeners.controller';

@Module({
  controllers: [GroupListenersController],
  providers: [GroupListenersService],
  exports: [GroupListenersService],
})
export class GroupListenersModule {}
