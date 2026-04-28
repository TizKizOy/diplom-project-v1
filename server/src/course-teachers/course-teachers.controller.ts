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
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { CourseTeachersService } from './course-teachers.service';
import { IDeletedResult } from '../common/interfaces/delete.interfaces';
import { IRestoredResult } from '../common/interfaces/restore.interface';
import { ICourseTeacher } from './interfaces/course-teachers.interface';
import { CreateCourseTeacherDto } from './dto/create-course-teacher.dto';
import { UpdateCourseTeacherDto } from './dto/update-course-teacher.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwtAuth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Role } from 'src/common/enums/role.enum';

@ApiTags('Course-Teachers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('course-teachers')
export class CourseTeachersController {
  constructor(private readonly courseTeachersService: CourseTeachersService) {}

  @Roles(Role.ADMIN, Role.TEACHER)
  @Get()
  @ApiOperation({ summary: 'Получить все записи о преподавателях курсов' })
  async getAll(): Promise<ICourseTeacher[]> {
    return await this.courseTeachersService.getAll();
  }

  @Get('course/:courseId')
  @Roles(Role.ADMIN, Role.TEACHER, Role.LISTENER)
  @ApiOperation({ summary: 'Получить преподавателей по курсу' })
  async getByCourse(
    @Param('courseId', ParseIntPipe) courseId: number,
  ): Promise<ICourseTeacher[]> {
    return await this.courseTeachersService.getByCourse(courseId);
  }

  @Get('deleted/list')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Получить удалённые записи' })
  async getDeleted(): Promise<ICourseTeacher[]> {
    return await this.courseTeachersService.getDeleted();
  }

  @Get('teacher/:teacherId')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Получить курсы по преподавателю' })
  async getByTeacher(
    @Param('teacherId', ParseIntPipe) teacherId: number,
  ): Promise<ICourseTeacher[]> {
    return await this.courseTeachersService.getByTeacher(teacherId);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Получить запись о преподавателе курса по ID' })
  async getById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ICourseTeacher> {
    return await this.courseTeachersService.getById(id);
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Создать запись о преподавателе курса' })
  async create(
    @Body() body: CreateCourseTeacherDto,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<ICourseTeacher> {
    return await this.courseTeachersService.create(body, adminId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Soft-delete записи о преподавателе курса' })
  async deleteCourseTeacher(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<IDeletedResult> {
    return await this.courseTeachersService.remove(id, adminId);
  }

  @Post(':id/restore')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Восстановить запись о преподавателе курса' })
  async restore(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<IRestoredResult> {
    return await this.courseTeachersService.restore(id, adminId);
  }

  @Delete(':id/hard')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Жёсткое удаление записи о преподавателе курса' })
  async hardDelete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<IDeletedResult> {
    return await this.courseTeachersService.hardDelete(id, adminId);
  }
}
