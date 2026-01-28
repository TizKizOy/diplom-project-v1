import { query } from 'src/common/db/dbConfig';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import {
  INotification,
  IDeletedNotificationResult,
  IRestoredNotificationResult,
} from '../interfaces/notifications.interfaces';

export const getNotifications = async (filter: {
  id?: number;
  user?: number;
  unread?: boolean;
}): Promise<INotification[]> => {
  return await query('SELECT * FROM f_notifications_get($1, $2, $3)', [
    filter.id ?? null,
    filter.user ?? null,
    filter.unread ?? null,
  ]);
};

export const getDeletedNotifications = async (
  id?: number,
): Promise<INotification[]> => {
  return await query('SELECT * FROM f_notifications_get_deleted($1)', [
    id ?? null,
  ]);
};

export const createNotification = async (
  dto: CreateNotificationDto,
  adminId: number,
): Promise<INotification> => {
  const rows = await query(
    'SELECT * FROM f_notifications_create($1, $2)',
    [dto.userId, dto.message],
    adminId,
  );
  return rows[0];
};

export const markNotificationAsRead = async (
  id: number,
  adminId: number,
): Promise<INotification> => {
  const rows = await query(
    'SELECT * FROM f_notifications_mark_read($1)',
    [id],
    adminId,
  );
  return rows[0];
};

export const deleteNotification = async (
  id: number,
  adminId: number,
): Promise<IDeletedNotificationResult> => {
  const rows = await query(
    'SELECT * FROM f_notifications_delete($1)',
    [id],
    adminId,
  );
  return rows[0];
};

export const restoreNotification = async (
  id: number,
  adminId: number,
): Promise<IRestoredNotificationResult> => {
  const rows = await query(
    'SELECT * FROM f_notifications_restore($1)',
    [id],
    adminId,
  );
  return rows[0];
};

export const hardDeleteNotification = async (
  id: number,
  adminId: number,
): Promise<IDeletedNotificationResult> => {
  const rows = await query(
    'SELECT * FROM f_notifications_hard_delete($1)',
    [id],
    adminId,
  );
  return rows[0];
};
