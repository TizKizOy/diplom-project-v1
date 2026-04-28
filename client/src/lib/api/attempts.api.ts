import apiClient from './apiClient';

export interface IAttempt {
  pkIdAttempt: number;
  taskTitle: string;
  listenerName: string;
  statusName: string;
  submittedAt: string;
  score: number | null;
  answerText?: string;
  answerFileUrl?: string;
}

export interface ICreateAttemptDto {
  taskId: number;
  listenerId: number;
  statusId?: number;
  answerText?: string;
  answerFileUrl?: string;
}

export interface IGradeAttemptDto {
  score: number;
  statusId?: number;
}

export const attemptsApi = {
  getAll: async (): Promise<IAttempt[]> => {
    const response = await apiClient.get('/attempts');
    return response.data;
  },

  getByTask: async (taskId: number): Promise<IAttempt[]> => {
    const response = await apiClient.get(`/attempts/task/${taskId}`);
    return response.data;
  },

  getByListener: async (listenerId: number): Promise<IAttempt[]> => {
    const response = await apiClient.get(`/attempts/listener/${listenerId}`);
    return response.data;
  },

  getByStatus: async (statusId: number): Promise<IAttempt[]> => {
    const response = await apiClient.get(`/attempts/status/${statusId}`);
    return response.data;
  },

  getById: async (id: number): Promise<IAttempt> => {
    const response = await apiClient.get(`/attempts/${id}`);
    return response.data;
  },

  create: async (dto: ICreateAttemptDto): Promise<IAttempt> => {
    const response = await apiClient.post('/attempts', dto);
    return response.data;
  },

  grade: async (id: number, dto: IGradeAttemptDto): Promise<IAttempt> => {
    const response = await apiClient.put(`/attempts/${id}/grade`, dto);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await apiClient.delete(`/attempts/${id}`);
    return response.data;
  },
};
