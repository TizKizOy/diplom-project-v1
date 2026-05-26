export interface INotification {
  pkIdNotification: number;
  /** Получатель уведомления (если возвращает хранимая процедура) */
  fkIdUser?: number;
  message: string;
  isRead: boolean;
  createdAt: Date;
  userName: string;
}
