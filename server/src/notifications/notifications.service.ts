import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as db from './db/notifications.db';
import {
  INotification,
  IDeletedNotificationResult,
  IRestoredNotificationResult,
} from './interfaces/notifications.interfaces';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  async getNotifications(filter: {
    id?: number;
    user?: number;
    unread?: boolean;
  }): Promise<INotification[]> {
    const notifications = await db.getNotifications(filter);
    if (!notifications || notifications.length === 0) {
      throw new NotFoundException('Уведомления не найдены');
    }
    return notifications;
  }

  async getAll(): Promise<INotification[]> {
    return await this.getNotifications({});
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
    return await this.getNotifications({ user: userId, unread });
  }

  async getDeleted(id?: number): Promise<INotification[]> {
    const notifications = await db.getDeletedNotifications(id);
    if (!notifications || notifications.length === 0) {
      throw new NotFoundException(
        id
          ? `Удалённое уведомление с id=${id} не найдено`
          : 'Удалённые уведомления не найдены',
      );
    }
    return notifications;
  }

  async create(
    dto: CreateNotificationDto,
    adminId: number,
  ): Promise<INotification> {
    try {
      return await db.createNotification(dto, adminId);
    } catch (e: any) {
      if (e.message?.includes('не найден') || e.message?.includes('удалён')) {
        throw new NotFoundException(e.message);
      }
      throw new BadRequestException(e.message || 'Ошибка создания уведомления');
    }
  }

  async markAsRead(id: number, adminId: number): Promise<INotification> {
    try {
      return await db.markNotificationAsRead(id, adminId);
    } catch (e: any) {
      if (e.message?.includes('не найдено') || e.message?.includes('удалено')) {
        throw new NotFoundException(e.message);
      }
      throw new BadRequestException(e.message);
    }
  }

  async remove(
    id: number,
    adminId: number,
  ): Promise<IDeletedNotificationResult> {
    try {
      const result = await db.deleteNotification(id, adminId);
      if (result.deleted_id === 0) {
        throw new NotFoundException(`Уведомление с id=${id} не найдено`);
      }
      return result;
    } catch (e: any) {
      if (e instanceof NotFoundException) throw e;

      if (
        e.message?.includes('не найдено') ||
        e.message?.includes('уже удалено')
      ) {
        throw new NotFoundException(e.message);
      }
      throw new BadRequestException(e.message);
    }
  }

  async restore(
    id: number,
    adminId: number,
  ): Promise<IRestoredNotificationResult> {
    try {
      return await db.restoreNotification(id, adminId);
    } catch (e: any) {
      if (
        e.message?.includes('не найдено') ||
        e.message?.includes('не было удалено')
      ) {
        throw new NotFoundException(e.message);
      }
      if (e.message?.includes('Невозможно восстановить: пользователь удалён')) {
        throw new BadRequestException(e.message);
      }
      throw new BadRequestException(e.message);
    }
  }

  async hardDelete(
    id: number,
    adminId: number,
  ): Promise<IDeletedNotificationResult> {
    try {
      return await db.hardDeleteNotification(id, adminId);
    } catch (e: any) {
      if (e.message?.includes('необходимо сначала пометить как удалённое')) {
        throw new BadRequestException(e.message);
      }
      if (e.message?.includes('не найдено')) {
        throw new NotFoundException(e.message);
      }
      throw new BadRequestException(e.message);
    }
  }
}
