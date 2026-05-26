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
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
} from '@nestjs/swagger';
import { CertificatesService } from './certificates.service';
import { ICertificate } from './interfaces/certificates.interfaces';
import { IDeletedResult } from '../common/interfaces/delete.interfaces';
import { IRestoredResult } from '../common/interfaces/restore.interface';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { UpdateCertificateDto } from './dto/update-certificate.dto';
import { IssueCertificateIfCompleteDto } from './dto/issue-certificate-if-complete.dto';
import { IssueCertificateForListenerDto } from './dto/issue-certificate-for-listener.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwtAuth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Role } from 'src/common/enums/role.enum';
import type { IJwtPayload } from 'src/common/jwt/jwt-utils';

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
    @CurrentUser() user: IJwtPayload,
  ): Promise<ICertificate[]> {
    const canViewOtherListeners =
      user.roleName === Role.ADMIN || user.roleName === Role.TEACHER;
    if (!canViewOtherListeners && user.pkIdUser !== listenerId) {
      throw new ForbiddenException(
        'Нет прав на просмотр сертификатов другого слушателя',
      );
    }

    return await this.certificatesService.getByListener(listenerId);
  }

  @Get('search/course/:courseId')
  @ApiOperation({ summary: 'Получить сертификаты по курсу' })
  async getByCourse(
    @Param('courseId', ParseIntPipe) courseId: number,
    @CurrentUser() user: IJwtPayload,
  ): Promise<ICertificate[]> {
    const canViewByCourse =
      user.roleName === Role.ADMIN || user.roleName === Role.TEACHER;
    if (!canViewByCourse) {
      throw new ForbiddenException(
        'Нет прав на просмотр сертификатов по курсу',
      );
    }

    return await this.certificatesService.getByCourse(courseId);
  }

  @Get('deleted/list')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Получить удалённые  сертификаты' })
  async getDeleted(): Promise<ICertificate[]> {
    return await this.certificatesService.getDeleted();
  }

  @Post('issue-if-complete')
  @Roles(Role.LISTENER)
  @ApiOperation({
    summary: 'Проверить завершение курса и выдать сертификат (если условия выполнены)',
  })
  async issueIfComplete(
    @Body() body: IssueCertificateIfCompleteDto,
    @CurrentUser() user: IJwtPayload,
  ): Promise<{
    issued: boolean;
    newlyIssued: boolean;
    certificate: ICertificate | null;
  }> {
    const result = await this.certificatesService.tryAutoIssueIfCourseCompleted(
      user.pkIdUser,
      body.courseId,
      user.pkIdUser,
    );
    return {
      issued: !!result.certificate,
      newlyIssued: result.newlyIssued,
      certificate: result.certificate,
    };
  }

  @Post('issue-for-listener-if-complete')
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({
    summary:
      'Проверить завершение курса слушателем и выдать сертификат (если все задания приняты и есть шаблон)',
    description:
      'Вызывается после оценки преподавателем или из админки. Идемпотентно: если сертификат уже есть — возвращается существующий.',
  })
  async issueForListenerIfComplete(
    @Body() body: IssueCertificateForListenerDto,
    @CurrentUser() user: IJwtPayload,
  ): Promise<{
    issued: boolean;
    newlyIssued: boolean;
    certificate: ICertificate | null;
  }> {
    const result = await this.certificatesService.tryAutoIssueIfCourseCompleted(
      body.listenerId,
      body.courseId,
      user.pkIdUser,
    );
    return {
      issued: !!result.certificate,
      newlyIssued: result.newlyIssued,
      certificate: result.certificate,
    };
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Получить сертификат по ID' })
  async getById(@Param('id', ParseIntPipe) id: number): Promise<ICertificate> {
    return await this.certificatesService.getById(id);
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
  @ApiOperation({ summary: 'Обновить сертификат' })
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
  ): Promise<IDeletedResult> {
    return await this.certificatesService.remove(id, adminId);
  }

  @Post(':id/restore')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Восстановить аннулированный сертификат' })
  async restore(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<IRestoredResult> {
    return await this.certificatesService.restore(id, adminId);
  }

  @Delete(':id/hard')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Жёсткое удаление сертификата из БД' })
  async hardDelete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<IDeletedResult> {
    return await this.certificatesService.hardDelete(id, adminId);
  }
}
