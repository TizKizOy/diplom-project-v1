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
import { GroupsService } from './groups.service';
import { IGroup } from './interfaces/groups.interfaces';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwtAuth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Role } from 'src/common/enums/role.enum';

@ApiTags('Groups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

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

  @Post()
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Создать группу' })
  async create(
    @Body() body: CreateGroupDto,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<IGroup> {
    return await this.groupsService.create(body, adminId);
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
  ): Promise<{ deleted_id: number; message: string }> {
    return await this.groupsService.remove(id, adminId);
  }

  @Post(':id/restore')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Восстановить группу' })
  async restore(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<{ restored_id: number; message: string }> {
    return await this.groupsService.restore(id, adminId);
  }

  @Delete(':id/hard')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Жёсткое удаление группы' })
  async hardDelete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<{ deleted_id: number; message: string }> {
    return await this.groupsService.hardDelete(id, adminId);
  }
}
