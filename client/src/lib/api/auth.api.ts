import apiClient from './apiClient';
import type { IUser } from '@/lib/types';

export const authApi = {
  login: async (login: string, password: string) => {
    const response = await apiClient.post('/auth/login', { login, password });
    return response.data;
  },

  register: async (data: {
    fullName: string;
    login: string;
    phone: string;
    email: string;
    password: string;
    positionId?: number;
  }) => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },

  refresh: async () => {
    const response = await apiClient.post('auth/refresh');
    return response.data;
  },

  me: async (): Promise<IUser> => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },
};
