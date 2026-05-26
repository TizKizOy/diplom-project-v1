import apiClient from './apiClient';

export interface INotification {
  pkIdNotification: number;
  fkIdUser: number;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export const notificationsApi = {
  getByUser: async (userId: number): Promise<INotification[]> =>
    (await apiClient.get(`/notifications/user/${userId}`)).data,
  markRead: async (id: number): Promise<INotification> =>
    (await apiClient.post(`/notifications/${id}/read`)).data,
  create: async (dto: { userId: number; message: string }): Promise<INotification> =>
    (await apiClient.post('/notifications', dto)).data,
};
