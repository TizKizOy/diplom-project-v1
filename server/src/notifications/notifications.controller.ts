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
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { INotification } from './interfaces/notifications.interfaces';
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
  @ApiQuery({
    name: 'unread',
    required: false,
    type: Boolean,
    description: 'Только непрочитанные',
  })
  async getByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('unread') unread?: string,
  ): Promise<INotification[]> {
    return await this.notificationsService.getByUser(
      userId,
      unread === 'true' ? true : unread === 'false' ? false : undefined,
    );
  }

  @Get('deleted/list')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Получить удалённые уведомления' })
  @ApiQuery({ name: 'id', required: false, type: Number })
  async getDeleted(@Query('id') id?: string): Promise<INotification[]> {
    return await this.notificationsService.getDeleted(
      id ? parseInt(id) : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить уведомление по ID' })
  async getById(@Param('id', ParseIntPipe) id: number): Promise<INotification> {
    return await this.notificationsService.getById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Создать уведомление пользователю' })
  async create(
    @Body() body: CreateNotificationDto,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<INotification> {
    return await this.notificationsService.create(body, adminId);
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
  ): Promise<{ deleted_id: number; message: string }> {
    return await this.notificationsService.remove(id, adminId);
  }

  @Post(':id/restore')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Восстановить удалённое уведомление' })
  async restore(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<{ restored_id: number; message: string }> {
    return await this.notificationsService.restore(id, adminId);
  }

  @Delete(':id/hard')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Жёсткое удаление уведомления из БД' })
  async hardDelete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('pkIdUser') adminId: number,
  ): Promise<{ deleted_id: number; message: string }> {
    return await this.notificationsService.hardDelete(id, adminId);
  }
}
