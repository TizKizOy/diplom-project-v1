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
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { ICourse } from './interfaces/courses.interfaces';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwtAuth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Role } from 'src/common/enums/role.enum';

@ApiTags('Сourses')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  @ApiOperation({ summary: 'Получить все активные курсы' })
  async getAll(): Promise<ICourse[]> {
    return await this.coursesService.getAll();
  }

  @Roles(Role.ADMIN)
  @Get('deleted')
  @ApiOperation({ summary: 'Получить удалённые курсы' })
  async getDeleted(): Promise<ICourse[]> {
    return await this.coursesService.getDeleted();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить курс по ID' })
  async getById(@Param('id', ParseIntPipe) id: number): Promise<ICourse> {
    return await this.coursesService.getById(id);
  }

  @Roles(Role.ADMIN, Role.TEACHER)
  @Post()
  @ApiOperation({ summary: 'Создать новый курс' })
  @ApiBody({ type: CreateCourseDto })
  async create(
    @Body() body: CreateCourseDto,
    @CurrentUser('sub') adminId: number,
  ): Promise<ICourse> {
    return await this.coursesService.create(body, adminId);
  }

  @Roles(Role.ADMIN, Role.TEACHER)
  @Put(':id')
  @ApiOperation({ summary: 'Обновить курс' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateCourseDto,
    @CurrentUser('sub') adminId: number,
  ): Promise<ICourse> {
    return await this.coursesService.update(id, body, adminId);
  }

  @Roles(Role.ADMIN, Role.TEACHER)
  @Delete(':id')
  @ApiOperation({
    summary: 'Soft-delete курса (каскадно удаляет группы, задания, материалы)',
  })
  async deleteCourse(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('sub') adminId: number,
  ): Promise<{ deleted_id: number; message: string }> {
    return await this.coursesService.remove(id, adminId);
  }

  @Roles(Role.ADMIN)
  @Post(':id/restore')
  @ApiOperation({
    summary:
      'Восстановить удалённый курс (каскадно восстанавливает связанные данные)',
  })
  async restore(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('sub') adminId: number,
  ): Promise<{ restored_id: number; message: string }> {
    return await this.coursesService.restore(id, adminId);
  }

  @Roles(Role.ADMIN)
  @Delete(':id/hard')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Жёсткое удаление курса (требует предварительного soft-delete)',
  })
  async hardDelete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('sub') adminId: number,
  ): Promise<{ deleted_id: number; message: string }> {
    return await this.coursesService.hardDelete(id, adminId);
  }
}
