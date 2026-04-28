import apiClient from './apiClient';
import type { ITask } from '@/lib/types';

export interface ICreateTaskDto {
  typeId: number;
  courseId: number;
  lessonId?: number;
  testId?: number;
  title: string;
  description?: string;
  content?: string;
  contentFileUrl?: string;
  deadline?: string;
  maxScore?: number;
  sortOrder?: number;
}

export const tasksApi = {
  getByCourse: async (courseId: number): Promise<ITask[]> => {
    const response = await apiClient.get(`/tasks/course/${courseId}`);
    return response.data;
  },

  getByType: async (typeTaskId: number): Promise<ITask[]> => {
    const response = await apiClient.get(`/tasks/type/${typeTaskId}`);
    return response.data;
  },

  create: async (dto: ICreateTaskDto): Promise<ITask> => {
    const response = await apiClient.post('/tasks', dto);
    return response.data;
  },

  update: async (id: number, dto: Partial<ICreateTaskDto>): Promise<ITask> => {
    const response = await apiClient.put(`/tasks/${id}`, dto);
    return response.data;
  },

  delete: async (
    id: number,
  ): Promise<{ deletedId: number; message: string }> => {
    const response = await apiClient.delete(`/tasks/${id}`);
    return response.data;
  },
};
