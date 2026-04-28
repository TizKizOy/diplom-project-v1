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
import { LessonsService } from './lessons.service';
import { ILesson } from './interfaces/lessons.interfaces';
import { IDeletedResult } from '../common/interfaces/delete.interfaces';
import { IRestoredResult } from '../common/interfaces/restore.interface';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwtAuth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Role } from 'src/common/enums/role.enum';

@ApiTags('Lessons')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Get()
  @ApiOperation({ summary: 'Получить все уроки' })
  async getAll(): Promise<ILesson[]> {
    return await this.lessonsService.getAll();
  }

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Получить уроки конкретного курса' })
  async getByCourse(
    @Param('courseId', ParseIntPipe) courseId: number,
  ): Promise<ILesson[]> {
    return await this.lessonsService.getByCourse(courseId);
  }

  @Get('deleted/list')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Получить удалённые уроки' })
  async getDeleted(): Promise<ILesson[]> {
    return await this.lessonsService.getDeleted();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить урок по ID' })
  async getById(@Param('id', ParseIntPipe) id: number): Promise<ILesson> {
    return await this.lessonsService.getById(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Создать урок' })
  async create(
    @Body() body: CreateLessonDto,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<ILesson> {
    return await this.lessonsService.create(body, adminId);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Обновить урок' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateLessonDto,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<ILesson> {
    return await this.lessonsService.update(id, body, adminId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Soft-delete урока' })
  async deleteLesson(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<IDeletedResult> {
    return await this.lessonsService.remove(id, adminId);
  }

  @Post(':id/restore')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Восстановить урок' })
  async restore(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<IRestoredResult> {
    return await this.lessonsService.restore(id, adminId);
  }

  @Delete(':id/hard')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Жёсткое удаление урока' })
  async hardDelete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<IDeletedResult> {
    return await this.lessonsService.hardDelete(id, adminId);
  }
}
