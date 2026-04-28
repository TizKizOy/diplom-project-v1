import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { GroupListenersService } from './group-listeners.service';
import { IGroupListener } from './interfaces/group-listener.interface';
import { IDeletedResult } from '../common/interfaces/delete.interfaces';
import { IRestoredResult } from '../common/interfaces/restore.interface';
import { CreateGroupListenerDto } from './dto/create-group-listener.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwtAuth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Role } from 'src/common/enums/role.enum';

@ApiTags('Group-listeners')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('group-listeners')
export class GroupListenersController {
  constructor(private readonly groupListenersService: GroupListenersService) {}

  @Roles(Role.ADMIN, Role.TEACHER)
  @Get()
  @ApiOperation({
    summary: 'Получить все записи слушателей в группах ',
  })
  async getAll(): Promise<IGroupListener[]> {
    return await this.groupListenersService.getAll();
  }

  @Get('group/:groupId')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Получить слушателей конкретной группы' })
  async getByGroup(
    @Param('groupId', ParseIntPipe) groupId: number,
  ): Promise<IGroupListener[]> {
    return await this.groupListenersService.getByGroup(groupId);
  }

  @Get('listener/:listenerId')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Получить группы конкретного слушателя' })
  async getByListener(
    @Param('listenerId', ParseIntPipe) listenerId: number,
  ): Promise<IGroupListener[]> {
    return await this.groupListenersService.getByListener(listenerId);
  }

  @Get('deleted/list')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Получить удалённые записи' })
  async getDeleted(): Promise<IGroupListener[]> {
    return await this.groupListenersService.getDeleted();
  }

  @Post()
  @ApiOperation({ summary: 'Добавить слушателя в группу' })
  async create(
    @Body() body: CreateGroupListenerDto,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<IGroupListener> {
    return await this.groupListenersService.create(body, adminId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Исключить слушателя из группы (soft-delete)' })
  async deleteGroupListener(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<IDeletedResult> {
    return await this.groupListenersService.remove(id, adminId);
  }

  @Post(':id/restore')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Восстановить запись в группе' })
  async restore(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<IRestoredResult> {
    return await this.groupListenersService.restore(id, adminId);
  }

  @Delete(':id/hard')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Жёсткое удаление записи' })
  async hardDelete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<IDeletedResult> {
    return await this.groupListenersService.hardDelete(id, adminId);
  }
}
