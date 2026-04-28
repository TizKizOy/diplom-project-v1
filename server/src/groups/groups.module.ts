import { Module } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';
import { GroupListenersController } from 'src/group-listeners/group-listeners.controller';
import { GroupListenersModule } from 'src/group-listeners/group-listeners.module';

@Module({
  imports: [GroupListenersModule],
  controllers: [GroupsController, GroupListenersController],
  providers: [GroupsService],
  exports: [GroupsService],
})
export class GroupsModule {}
