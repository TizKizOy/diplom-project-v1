import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  HttpCode,
  HttpStatus,
  UseGuards,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { INotification } from './interfaces/notifications.interfaces';
import { IDeletedResult } from '../common/interfaces/delete.interfaces';
import { IRestoredResult } from '../common/interfaces/restore.interface';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwtAuth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Role } from 'src/common/enums/role.enum';
import type { IJwtPayload } from 'src/common/jwt/jwt-utils';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Получить все активные уведомления' })
  async getAll(): Promise<INotification[]> {
    return await this.notificationsService.getAll();
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Получить уведомления пользователя' })
  async getByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() user: IJwtPayload,
    @Query('onlyUnread') onlyUnread?: string,
  ): Promise<INotification[]> {
    const canViewOtherUsers = user.roleName === Role.ADMIN;
    if (!canViewOtherUsers && user.pkIdUser !== userId) {
      throw new ForbiddenException(
        'Нет прав на просмотр уведомлений другого пользователя',
      );
    }

    const unreadFilter =
      typeof onlyUnread === 'string'
        ? ['1', 'true', 'yes'].includes(onlyUnread.toLowerCase())
        : undefined;
    return await this.notificationsService.getByUser(userId, unreadFilter);
  }

  @Get('deleted/list')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Получить удалённые уведомления' })
  async getDeleted(): Promise<INotification[]> {
    return await this.notificationsService.getDeleted();
  }

  @Post()
  @Roles(Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Создать уведомление пользователю' })
  async create(
    @Body() dto: CreateNotificationDto,
    @CurrentUser('pkIdUser') actorId: number,
  ): Promise<INotification> {
    return await this.notificationsService.create(dto, actorId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить уведомление по ID' })
  async getById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: IJwtPayload,
  ): Promise<INotification> {
    return await this.assertNotificationAccess(id, user);
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Пометить уведомление как прочитанное' })
  async markAsRead(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: IJwtPayload,
  ): Promise<INotification> {
    await this.assertNotificationAccess(id, user);
    return await this.notificationsService.markAsRead(id, user.pkIdUser);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить уведомление (soft-delete)' })
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: IJwtPayload,
  ): Promise<IDeletedResult> {
    await this.assertNotificationAccess(id, user);
    return await this.notificationsService.remove(id, user.pkIdUser);
  }

  @Delete(':id/hard')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Жёсткое удаление уведомления из БД' })
  async hardDelete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<IDeletedResult> {
    return await this.notificationsService.hardDelete(id, adminId);
  }

  private async assertNotificationAccess(
    id: number,
    user: IJwtPayload,
  ): Promise<INotification> {
    const n = await this.notificationsService.getById(id);
    if (user.roleName === Role.ADMIN) return n;
    if (n.fkIdUser === user.pkIdUser) return n;
    const mine = await this.notificationsService.getByUser(user.pkIdUser);
    if (mine.some((x) => x.pkIdNotification === id)) return n;
    throw new ForbiddenException('Нет прав на это уведомление');
  }
}
