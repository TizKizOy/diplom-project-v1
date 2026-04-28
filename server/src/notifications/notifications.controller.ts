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
  ParseBoolPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
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
    @Query('onlyUnread', ParseBoolPipe) onlyUnread?: boolean,  
  ): Promise<INotification[]> {
    return await this.notificationsService.getByUser(userId, onlyUnread);
  }

  @Get('deleted/list')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Получить удалённые уведомления' })
  async getDeleted(): Promise<INotification[]> {
    return await this.notificationsService.getDeleted();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить уведомление по ID' })
  async getById(@Param('id', ParseIntPipe) id: number): Promise<INotification> {
    return await this.notificationsService.getById(id);
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Пометить уведомление как прочитанное' })
  async markAsRead(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<INotification> {
    return await this.notificationsService.markAsRead(id, adminId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить уведомление (soft-delete)' })
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<IDeletedResult> {
    return await this.notificationsService.remove(id, adminId);
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
}
