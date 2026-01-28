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
import { CertificatesService } from './certificates.service';
import { ICertificate } from './interfaces/certificates.interfaces';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { UpdateCertificateDto } from './dto/update-certificate.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwtAuth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Role } from 'src/common/enums/role.enum';

@ApiTags('Certificates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('certificates')
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Получить все активные сертификаты' })
  async getAll(): Promise<ICertificate[]> {
    return await this.certificatesService.getAll();
  }

  @Get('search/listener/:listenerId')
  @ApiOperation({ summary: 'Получить сертификаты слушателя' })
  async getByListener(
    @Param('listenerId', ParseIntPipe) listenerId: number,
  ): Promise<ICertificate[]> {
    return await this.certificatesService.getByListener(listenerId);
  }

  @Get('search/course/:courseId')
  @ApiOperation({ summary: 'Получить сертификаты по курсу' })
  async getByCourse(
    @Param('courseId', ParseIntPipe) courseId: number,
  ): Promise<ICertificate[]> {
    return await this.certificatesService.getByCourse(courseId);
  }

  @Get('filter')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Универсальный поиск сертификатов' })
  @ApiQuery({ name: 'listenerId', required: false, type: Number })
  @ApiQuery({ name: 'courseId', required: false, type: Number })
  async getByFilter(
    @Query('listenerId') listenerId?: string,
    @Query('courseId') courseId?: string,
  ): Promise<ICertificate[]> {
    return await this.certificatesService.getCertificates({
      listener: listenerId ? parseInt(listenerId) : undefined,
      course: courseId ? parseInt(courseId) : undefined,
    });
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Получить сертификат по ID' })
  async getById(@Param('id', ParseIntPipe) id: number): Promise<ICertificate> {
    return await this.certificatesService.getById(id);
  }

  @Get('deleted/list')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Получить удалённые (аннулированные) сертификаты' })
  @ApiQuery({
    name: 'id',
    required: false,
    type: Number,
    description: 'ID конкретного удалённого сертификата',
  })
  async getDeleted(@Query('id') id?: string): Promise<ICertificate[]> {
    return await this.certificatesService.getDeleted(
      id ? parseInt(id) : undefined,
    );
  }

  @Post()
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Выдать сертификат слушателю' })
  async create(
    @Body() body: CreateCertificateDto,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<ICertificate> {
    return await this.certificatesService.create(body, adminId);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Обновить PDF ссылку сертификата' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateCertificateDto,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<ICertificate> {
    return await this.certificatesService.update(id, body, adminId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Аннулировать сертификат (soft-delete)' })
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<{ deleted_id: number; message: string }> {
    return await this.certificatesService.remove(id, adminId);
  }

  @Post(':id/restore')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Восстановить аннулированный сертификат' })
  async restore(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<{ restored_id: number; message: string }> {
    return await this.certificatesService.restore(id, adminId);
  }

  @Delete(':id/hard')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Жёсткое удаление сертификата из БД' })
  async hardDelete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<{ deleted_id: number; message: string }> {
    return await this.certificatesService.hardDelete(id, adminId);
  }
}
