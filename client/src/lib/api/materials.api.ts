import apiClient from './apiClient';
import type { IMaterial } from '@/lib/types';

export interface ICreateMaterialDto {
  courseId: number;
  lessonId: number;
  typeMaterialId: number;
  title: string;
  /** Если не передать — сервер подставит текст по умолчанию */
  description?: string;
  fileUrl?: string;
  link?: string;
  sortOrder?: number;
  isAdditional?: boolean;
}

export const materialsApi = {
  getByCourse: async (courseId: number): Promise<IMaterial[]> => {
    const response = await apiClient.get(`/materials/course/${courseId}`);
    return response.data;
  },

  getByLesson: async (lessonId: number): Promise<IMaterial[]> => {
    const response = await apiClient.get(`/materials/lesson/${lessonId}`);
    return response.data;
  },

  create: async (dto: ICreateMaterialDto): Promise<IMaterial> => {
    const response = await apiClient.post('/materials', dto);
    return response.data;
  },

  update: async (
    id: number,
    dto: Partial<ICreateMaterialDto>,
  ): Promise<IMaterial> => {
    const response = await apiClient.put(`/materials/${id}`, dto);
    return response.data;
  },

  delete: async (
    id: number,
  ): Promise<{ deletedId: number; message: string }> => {
    const response = await apiClient.delete(`/materials/${id}`);
    return response.data;
  },
};
