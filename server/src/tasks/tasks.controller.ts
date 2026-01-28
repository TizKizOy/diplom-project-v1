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
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { ITask } from './interfaces/tasks.interface';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwtAuth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Role } from 'src/common/enums/role.enum';

@ApiTags('Tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @ApiOperation({ summary: 'Получить все активные задания' })
  async getAll(): Promise<ITask[]> {
    return await this.tasksService.getAll();
  }

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Получить задания конкретного курса' })
  async getByCourse(
    @Param('courseId', ParseIntPipe) courseId: number,
  ): Promise<ITask[]> {
    return await this.tasksService.getByCourse(courseId);
  }

  @Get('type/:typeId')
  @ApiOperation({
    summary: 'Получить задания по типу: 1-Тест, 2-Практическая, 3-Аттестация',
  })
  async getByType(
    @Param('typeId', ParseIntPipe) typeId: number,
  ): Promise<ITask[]> {
    return await this.tasksService.getByType(typeId);
  }

  @Get('filter')
  @ApiOperation({ summary: 'Универсальный фильтр (курс + тип)' })
  @ApiQuery({ name: 'courseId', required: false, type: Number })
  @ApiQuery({ name: 'typeId', required: false, type: Number })
  async getByFilter(
    @Query('courseId') courseId?: string,
    @Query('typeId') typeId?: string,
  ): Promise<ITask[]> {
    return await this.tasksService.getTasks({
      courseId: courseId ? parseInt(courseId) : undefined,
      typeId: typeId ? parseInt(typeId) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить задание по ID' })
  async getById(@Param('id', ParseIntPipe) id: number): Promise<ITask> {
    return await this.tasksService.getById(id);
  }

  @Get('deleted/list')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Получить удалённые задания' })
  async getDeleted(): Promise<ITask[]> {
    return await this.tasksService.getDeleted();
  }

  @Post()
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Создать задание' })
  async create(
    @Body() body: CreateTaskDto,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<ITask> {
    return await this.tasksService.create(body, adminId);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Обновить задание' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateTaskDto,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<ITask> {
    return await this.tasksService.update(id, body, adminId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Soft-delete задания (каскадно удаляет попытки)' })
  async deleteTask(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<{ deleted_id: number; message: string }> {
    return await this.tasksService.remove(id, adminId);
  }

  @Post(':id/restore')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Восстановить задание' })
  async restore(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<{ restored_id: number; message: string }> {
    return await this.tasksService.restore(id, adminId);
  }

  @Delete(':id/hard')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Жёсткое удаление задания' })
  async hardDelete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<{ deleted_id: number; message: string }> {
    return await this.tasksService.hardDelete(id, adminId);
  }
}
