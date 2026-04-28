import apiClient from './apiClient';

export interface IMessage {
  pkIdMessage: number;
  message: string;
  isRead: boolean;
  createdAt: string;
  senderName: string;
  receiverName: string;
  fkIdSender: number;
  fkIdReceiver: number;
}

export interface ICreateMessageDto {
  senderId?: number;
  receiverId: number;
  message: string;
}

export const messagesApi = {
  getAll: async (): Promise<IMessage[]> => (await apiClient.get('/messages')).data,
  getBySender: async (id: number): Promise<IMessage[]> => (await apiClient.get(`/messages/sender/${id}`)).data,
  getByReceiver: async (id: number): Promise<IMessage[]> => (await apiClient.get(`/messages/receiver/${id}`)).data,
  getUnread: async (id: number): Promise<IMessage[]> => (await apiClient.get(`/messages/receiver/${id}/unread`)).data,
  create: async (dto: ICreateMessageDto): Promise<IMessage> => (await apiClient.post('/messages', dto)).data,
  markRead: async (id: number): Promise<IMessage> => (await apiClient.put(`/messages/${id}`, { isRead: true })).data,
};
