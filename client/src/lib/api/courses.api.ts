import apiClient from './apiClient';
import type { ICourse } from '@/lib/types';

export interface ICreateCourseDto {
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  statusId: number;
  tagIds?: number[];
}

export interface IUpdateCourseDto {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  statusId?: number;
  tagIds?: number[];
}

export interface ICourseTag {
  pkIdTag: number;
  name: string;
}

export const coursesApi = {
  getAll: async (): Promise<ICourse[]> => {
    const response = await apiClient.get('/courses');
    return response.data;
  },

  getById: async (id: number): Promise<ICourse> => {
    const response = await apiClient.get(`/courses/${id}`);
    return response.data;
  },

  getByStatus: async (statusId: number): Promise<ICourse[]> => {
    const response = await apiClient.get(`/courses/status/${statusId}`);
    return response.data;
  },

  getTagCatalog: async (): Promise<ICourseTag[]> => {
    const response = await apiClient.get('/courses/meta/tags');
    return response.data;
  },

  create: async (dto: ICreateCourseDto): Promise<ICourse> => {
    const response = await apiClient.post('/courses', dto);
    return response.data;
  },

  update: async (id: number, dto: IUpdateCourseDto): Promise<ICourse> => {
    const response = await apiClient.put(`/courses/${id}`, dto);
    return response.data;
  },

  delete: async (
    id: number,
  ): Promise<{ deletedId: number; message: string }> => {
    const response = await apiClient.delete(`/courses/${id}`);
    return response.data;
  },

  restore: async (
    id: number,
  ): Promise<{ restoredId: number; message: string }> => {
    const response = await apiClient.post(`/courses/${id}/restore`);
    return response.data;
  },
};
