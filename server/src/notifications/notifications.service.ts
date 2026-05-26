import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as db from './db/notifications.db';
import { INotification } from './interfaces/notifications.interfaces';
import { IDeletedResult } from '../common/interfaces/delete.interfaces';
import { IRestoredResult } from '../common/interfaces/restore.interface';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  async getNotifications(filter: {
    id?: number;
    userId?: number;
    unRead?: boolean;
    isDeleted?: boolean;
  }): Promise<INotification[]> {
    const notifications = await db.getNotifications(filter);
    return notifications || [];
  }

  async getAll(): Promise<any[]> {
    const result = await db.getNotifications({});
    return result || [];
  }

  async getById(id: number): Promise<INotification> {
    const notifications = await db.getNotifications({ id });
    const notification = notifications[0];
    if (!notification) {
      throw new NotFoundException(`Уведомление с id=${id} не найдено`);
    }
    return notification;
  }

  async getByUser(userId: number, unread?: boolean): Promise<INotification[]> {
    return await this.getNotifications({ userId: userId, unRead: unread });
  }

  async getDeleted(): Promise<INotification[]> {
    const notifications = await db.getDeletedNotifications();
    if (!notifications || notifications.length === 0) {
      throw new NotFoundException('Удалённые уведомления не найдены');
    }
    return notifications;
  }

  async create(dto: CreateNotificationDto, userId?: number): Promise<INotification> {
    try {
      return await db.createNotification(dto, userId);
    } catch (e: any) {
      throw new BadRequestException(e.message || 'Ошибка создания уведомления');
    }
  }

  async markAsRead(id: number, adminId: number): Promise<INotification> {    try {
      return await db.markNotificationAsRead(id, adminId);
    } catch (e: any) {
      if (e.message && e.message.includes('не найдено')) {
        throw new NotFoundException(e.message);
      }
      throw new BadRequestException(e.message);
    }
  }

  async remove(id: number, adminId: number): Promise<IDeletedResult> {
    try {
      const result = await db.deleteNotification(id, adminId);
      if (result.deletedId === 0) {
        throw new NotFoundException(`Уведомление с id=${id} не найдено`);
      }
      return result;
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }

  async hardDelete(id: number, adminId: number): Promise<IDeletedResult> {
    try {
      return await db.hardDeleteNotification(id, adminId);
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }
}
