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
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger';
import { MaterialsService } from './materials.service';
import { IMaterial } from './interfaces/materials.interfaces';
import { IDeletedResult } from '../common/interfaces/delete.interfaces';
import { IRestoredResult } from '../common/interfaces/restore.interface';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwtAuth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Role } from 'src/common/enums/role.enum';

@ApiTags('Materials')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('materials')
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Получить все активные материалы' })
  async getAll(): Promise<IMaterial[]> {
    return await this.materialsService.getAll();
  }

  @Get('course/:courseId')
  @Roles(Role.ADMIN, Role.TEACHER, Role.LISTENER)
  @ApiOperation({ summary: 'Получить материалы курса' })
  async getByCourse(
    @Param('courseId', ParseIntPipe) courseId: number,
  ): Promise<IMaterial[]> {
    return await this.materialsService.getByCourse(courseId);
  }

  @Get('lesson/:lessonId')
  @Roles(Role.ADMIN, Role.TEACHER, Role.LISTENER)
  @ApiOperation({ summary: 'Получить материалы урока' })
  async getByLesson(
    @Param('lessonId', ParseIntPipe) lessonId: number,
  ): Promise<IMaterial[]> {
    return await this.materialsService.getByLesson(lessonId);
  }

  @Get('deleted/list')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Получить удалённые материалы' })
  async getDeleted(): Promise<IMaterial[]> {
    return await this.materialsService.getDeleted();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Получить материал по ID' })
  async getById(@Param('id', ParseIntPipe) id: number): Promise<IMaterial> {
    return await this.materialsService.getById(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Создать материал курса' })
  @ApiBody({
    type: CreateMaterialDto,
    examples: {
      'Пример создания материала': {
        value: {
          courseId: 2,
          lessonId: 4,
          typeMaterialId: 4,
          title: "Лекция 1. Введение в React",
          description: "В первой лекции будет информация о введение в курс React",
          sortOrder: 1,
          isAdditional: false
        }
      }
    }
  })
  async create(
    @Body() body: CreateMaterialDto,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<IMaterial> {
    return await this.materialsService.create(body, adminId);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Обновить материал' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateMaterialDto,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<IMaterial> {
    return await this.materialsService.update(id, body, adminId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Удалить материал (soft-delete)' })
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<IDeletedResult> {
    return await this.materialsService.remove(id, adminId);
  }

  @Post(':id/restore')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Восстановить удалённый материал' })
  async restore(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<IRestoredResult> {
    return await this.materialsService.restore(id, adminId);
  }

  @Delete(':id/hard')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Жёсткое удаление материала из БД' })
  async hardDelete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<IDeletedResult> {
    return await this.materialsService.hardDelete(id, adminId);
  }
}
