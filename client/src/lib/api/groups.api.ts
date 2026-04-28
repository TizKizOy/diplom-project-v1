import apiClient from './apiClient';
import type { IGroup } from '@/lib/types';

export interface ICreateGroupDto {
  name: string;
  courseId: number;
  curatorId?: number;
}

export const groupsApi = {
  getAll: async (): Promise<IGroup[]> => {
    const response = await apiClient.get('/groups');
    return response.data;
  },

  getByCourse: async (courseId: number): Promise<IGroup[]> => {
    const response = await apiClient.get(`/groups/course/${courseId}`);
    return response.data;
  },

  create: async (dto: ICreateGroupDto): Promise<IGroup> => {
    const response = await apiClient.post('/groups', dto);
    return response.data;
  },

  update: async (
    id: number,
    dto: Partial<ICreateGroupDto>,
  ): Promise<IGroup> => {
    const response = await apiClient.put(`/groups/${id}`, dto);
    return response.data;
  },

  delete: async (
    id: number,
  ): Promise<{ deletedId: number; message: string }> => {
    const response = await apiClient.delete(`/groups/${id}`);
    return response.data;
  },
};
