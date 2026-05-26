import { query } from 'src/common/db/dbConfig';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { INotification } from '../interfaces/notifications.interfaces';
import { IDeletedResult } from '../../common/interfaces/delete.interfaces';
import { IRestoredResult } from '../../common/interfaces/restore.interface';

export const getNotifications = async (filter: {
  id?: number;
  userId?: number;
  unRead?: boolean;
  isDeleted?: boolean;
}): Promise<INotification[]> => {
  return await query<INotification>(
    `exec prGetNotifications
    @pkIdNotification = @pkIdNotification,
    @fkIdUser = @fkIdUser,
    @onlyUnread = @onlyUnread,
    @isDeleted = @isDeleted`,
    {
      pkIdNotification: filter.id ?? null,
      fkIdUser: filter.userId ?? null,
      onlyUnread: filter.unRead ?? 0,
      isDeleted: filter.isDeleted ?? 0,
    },
  );
};

export const getDeletedNotifications = async (): Promise<INotification[]> => {
  return await getNotifications({ isDeleted: true });
};

export const markNotificationAsRead = async (
  id: number,
  adminId: number,
): Promise<INotification> => {
  const rows = await query<INotification>(
    `exec spNotificationsUpdate
     @pkIdNotification = @pkIdNotification,
     @isRead = @isRead`,
    { pkIdNotification: id, isRead: true },
    adminId,
  );
  return rows[0];
};

export const deleteNotification = async (
  id: number,
  adminId: number,
): Promise<IDeletedResult> => {
  const rows = await query<IDeletedResult>(
    `exec spNotificationsDelete
     @pkIdNotification = @pkIdNotification`,
    { pkIdNotification: id },
    adminId,
  );
  return rows[0];
};

export const hardDeleteNotification = async (
  id: number,
  adminId: number,
): Promise<IDeletedResult> => {
  const rows = await query<IDeletedResult>(
    `exec spNotificationsHardDelete
     @pkIdNotification = @pkIdNotification`,
    { pkIdNotification: id },
    adminId,
  );
  return rows[0];
};

export const createNotification = async (
  dto: CreateNotificationDto,
  adminId?: number,
): Promise<INotification> => {
  const rows = await query<INotification>(
    `exec spNotificationsCreate
     @fkIdUser = @fkIdUser,
     @message = @message`,
    { fkIdUser: dto.userId, message: dto.message },
    adminId,
  );
  return rows[0];
};
