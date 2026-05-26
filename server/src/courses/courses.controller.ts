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
import { CoursesService } from './courses.service';
import { ICourse } from './interfaces/courses.interfaces';
import { IDeletedResult } from '../common/interfaces/delete.interfaces';
import { IRestoredResult } from '../common/interfaces/restore.interface';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwtAuth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Role } from 'src/common/enums/role.enum';

@ApiTags('Courses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  @ApiOperation({ summary: 'Получить все курсы' })
  async getAll(): Promise<ICourse[]> {
    return await this.coursesService.getAll();
  }

  @Get('meta/tags')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Справочник тегов для привязки к курсам' })
  async getTagsCatalog() {
    return await this.coursesService.getTagsCatalog();
  }

  @Get('deleted/list')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Получить удалённые курсы' })
  async getDeleted(): Promise<ICourse[]> {
    return await this.coursesService.getDeleted();
  }

  @Get('status/:statusId')
  @ApiOperation({
    summary:
      'Получить курсы по статусу: 1-Черновик, 2-Опубликован, 3-Архивирован',
  })
  async getByStatus(
    @Param('statusId', ParseIntPipe) statusId: number,
  ): Promise<ICourse[]> {
    return await this.coursesService.getByStatus(statusId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить курс по ID' })
  async getById(@Param('id', ParseIntPipe) id: number): Promise<ICourse> {
    return await this.coursesService.getById(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Создать курс' })
  async create(
    @Body() body: CreateCourseDto,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<ICourse> {
    return await this.coursesService.create(body, adminId);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Обновить курс' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateCourseDto,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<ICourse> {
    return await this.coursesService.update(id, body, adminId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({
    summary: 'Soft-delete курса (каскадно удаляет группы, задания, материалы)',
  })
  async deleteCourse(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<IDeletedResult> {
    return await this.coursesService.remove(id, adminId);
  }

  @Post(':id/restore')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Восстановить курс' })
  async restore(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<IRestoredResult> {
    return await this.coursesService.restore(id, adminId);
  }

  @Delete(':id/hard')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Жёсткое удаление курса' })
  async hardDelete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<IDeletedResult> {
    return await this.coursesService.hardDelete(id, adminId);
  }
}
