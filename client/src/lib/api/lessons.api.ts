import apiClient from './apiClient';
import type { ILesson } from '@/lib/types';

export interface ICreateLessonDto {
  courseId: number;
  title: string;
  description?: string;
  content?: string;
  sortOrder?: number;
  isPublished?: boolean;
}

export const lessonsApi = {
  getByCourse: async (courseId: number): Promise<ILesson[]> => {
    const response = await apiClient.get(`/lessons/course/${courseId}`);
    return response.data;
  },

  create: async (dto: ICreateLessonDto): Promise<ILesson> => {
    const response = await apiClient.post('/lessons', dto);
    return response.data;
  },

  update: async (
    id: number,
    dto: Partial<ICreateLessonDto>,
  ): Promise<ILesson> => {
    const response = await apiClient.put(`/lessons/${id}`, dto);
    return response.data;
  },

  delete: async (
    id: number,
  ): Promise<{ deletedId: number; message: string }> => {
    const response = await apiClient.delete(`/lessons/${id}`);
    return response.data;
  },
};
