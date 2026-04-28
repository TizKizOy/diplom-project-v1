import apiClient from './apiClient';

export interface IComment {
  pkIdComment: number;
  message: string;
  createdAt: string;
  userName: string;
  fkIdTask?: number;
  fkIdAttempt?: number;
  fkIdUser: number;
}

export const commentsApi = {
  getByTask: async (taskId: number): Promise<IComment[]> =>
    (await apiClient.get(`/comments/task/${taskId}`)).data,

  getByAttempt: async (attemptId: number): Promise<IComment[]> =>
    (await apiClient.get(`/comments/attempt/${attemptId}`)).data,

  create: async (dto: {
    taskId?: number;
    attemptId?: number;
    userId: number;
    message: string;
  }): Promise<IComment> =>
    (await apiClient.post('/comments', dto)).data,

  delete: async (id: number) =>
    (await apiClient.delete(`/comments/${id}`)).data,
};
