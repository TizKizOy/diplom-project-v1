import apiClient from './apiClient';
import type { IUser } from '@/lib/types';

export interface ICreateUserDto {
  fullName: string;
  login: string;
  phone: string;
  email: string;
  password: string;
  roleId: number;
  positionId?: number;
}

export interface IUpdateUserDto {
  fullName?: string;
  login?: string;
  phone?: string;
  email?: string;
  password?: string;
  roleId?: number;
  positionId?: number;
}

export const usersApi = {
  getAll: async (): Promise<IUser[]> => {
    const response = await apiClient.get('/users');
    return response.data;
  },

  getById: async (id: number): Promise<IUser> => {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },

  getByRole: async (roleId: number): Promise<IUser[]> => {
    const response = await apiClient.get(`/users/role/${roleId}`);
    return response.data;
  },

  create: async (dto: ICreateUserDto): Promise<IUser> => {
    const response = await apiClient.post('/users', dto);
    return response.data;
  },

  update: async (id: number, dto: Partial<ICreateUserDto>): Promise<IUser> => {
    const response = await apiClient.put(`/users/${id}`, dto);
    return response.data;
  },

  delete: async (
    id: number,
  ): Promise<{ deletedId: number; message: string }> => {
    const response = await apiClient.delete(`/users/${id}`);
    return response.data;
  },

  restore: async (
    id: number,
  ): Promise<{ restoredId: number; message: string }> => {
    const response = await apiClient.post(`/users/${id}/restore`);
    return response.data;
  },
};
