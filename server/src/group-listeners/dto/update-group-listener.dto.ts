import { PartialType } from '@nestjs/mapped-types';
import { CreateGroupListenerDto } from './create-group-listener.dto';

export class UpdateGroupListenerDto extends PartialType(CreateGroupListenerDto) {}
