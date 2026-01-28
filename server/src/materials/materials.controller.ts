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
import { MaterialsService } from './materials.service';
import { IMaterial } from './interfaces/materials.interfaces';
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
  @ApiOperation({ summary: 'Получить все активные материалы' })
  async getAll(): Promise<IMaterial[]> {
    return await this.materialsService.getAll();
  }

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Получить материалы курса' })
  async getByCourse(
    @Param('courseId', ParseIntPipe) courseId: number,
  ): Promise<IMaterial[]> {
    return await this.materialsService.getByCourse(courseId);
  }

  @Get('deleted/list')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Получить удалённые материалы' })
  @ApiQuery({ name: 'id', required: false, type: Number })
  async getDeleted(@Query('id') id?: string): Promise<IMaterial[]> {
    return await this.materialsService.getDeleted(
      id ? parseInt(id) : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить материал по ID' })
  async getById(@Param('id', ParseIntPipe) id: number): Promise<IMaterial> {
    return await this.materialsService.getById(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Создать материал курса' })
  async create(
    @Body() body: CreateMaterialDto,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<IMaterial> {
    return await this.materialsService.create(body, adminId);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Обновить материал (частичное обновление)' })
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
  ): Promise<{ deleted_id: number; message: string }> {
    return await this.materialsService.remove(id, adminId);
  }

  @Post(':id/restore')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Восстановить удалённый материал' })
  async restore(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<{ restored_id: number; message: string }> {
    return await this.materialsService.restore(id, adminId);
  }

  @Delete(':id/hard')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Жёсткое удаление материала из БД' })
  async hardDelete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<{ deleted_id: number; message: string }> {
    return await this.materialsService.hardDelete(id, adminId);
  }
}
