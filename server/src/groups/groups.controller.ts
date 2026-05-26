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
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { GroupsService } from './groups.service';
import { IGroup } from './interfaces/groups.interfaces';
import { IDeletedResult } from '../common/interfaces/delete.interfaces';
import { IRestoredResult } from '../common/interfaces/restore.interface';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwtAuth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Role } from 'src/common/enums/role.enum';
import { GroupListenersService } from 'src/group-listeners/group-listeners.service';
import { IGroupListener } from 'src/group-listeners/interfaces/group-listener.interface';
import { CoursesService } from 'src/courses/courses.service';
import type { IJwtPayload } from 'src/common/jwt/jwt-utils';

const COURSE_PUBLISHED_STATUS_ID = 2;

@ApiTags('Groups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('groups')
export class GroupsController {
  constructor(
    private readonly groupsService: GroupsService,
    private readonly groupListenersService: GroupListenersService,
    private readonly coursesService: CoursesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Получить все группы ' })
  async getAll(): Promise<IGroup[]> {
    return await this.groupsService.getAll();
  }

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Получить группы конкретного курса' })
  async getByCourse(
    @Param('courseId', ParseIntPipe) courseId: number,
  ): Promise<IGroup[]> {
    return await this.groupsService.getByCourse(courseId);
  }

  @Get('deleted/list')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Получить удалённые группы' })
  async getDeleted(): Promise<IGroup[]> {
    return await this.groupsService.getDeleted();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить группу по ID' })
  async getById(@Param('id', ParseIntPipe) id: number): Promise<IGroup> {
    return await this.groupsService.getById(id);
  }

  @Get(':id/listeners')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Получить слушателей группы' })
  async getGroupListeners(
    @Param('id', ParseIntPipe) groupId: number,
  ): Promise<IGroupListener[]> {
    return await this.groupListenersService.getByGroup(groupId);
  }

  @Post()
  @Roles(Role.ADMIN, Role.TEACHER, Role.LISTENER)
  @ApiOperation({ summary: 'Создать группу' })
  async create(
    @Body() body: CreateGroupDto,
    @CurrentUser() user: IJwtPayload,
  ): Promise<IGroup> {
    if (user.roleName === Role.LISTENER) {
      const course = await this.coursesService.getById(body.courseId);
      const published =
        course.fkIdStatus === COURSE_PUBLISHED_STATUS_ID ||
        course.statusName === 'Опубликован';
      if (!published) {
        throw new ForbiddenException(
          'Создание группы слушателем доступно только для опубликованного курса',
        );
      }
    }
    return await this.groupsService.create(body, user.pkIdUser);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Обновить группу' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateGroupDto,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<IGroup> {
    return await this.groupsService.update(id, body, adminId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Soft-delete группы' })
  async deleteGroup(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<IDeletedResult> {
    return await this.groupsService.remove(id, adminId);
  }

  @Post(':id/restore')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Восстановить группу' })
  async restore(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<IRestoredResult> {
    return await this.groupsService.restore(id, adminId);
  }

  @Delete(':id/hard')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Жёсткое удаление группы' })
  async hardDelete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<IDeletedResult> {
    return await this.groupsService.hardDelete(id, adminId);
  }
}
