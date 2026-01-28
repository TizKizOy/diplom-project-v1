export interface INotification {
  pkIdNotification: number;
  userName: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

export interface IDeletedNotificationResult {
  deleted_id: number;
  message: string;
}

export interface IRestoredNotificationResult {
  restored_id: number;
  message: string;
}
