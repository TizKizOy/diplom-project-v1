import apiClient from './apiClient';

export interface IGroupListener {
  pkIdGroupListener: number;
  fkIdGroup?: number;
  /** Дублируется из JOIN — удобно для UI без запроса всех групп */
  fkIdCourse?: number;
  fkIdListener?: number;
  groupName: string;
  courseTitle: string;
  listenerName: string;
  email: string;
}

export interface ICreateGroupListenerDto {
  groupId: number;
  listenerId: number;
}

export const groupListenersApi = {
  getAll: async (): Promise<IGroupListener[]> => {
    const response = await apiClient.get('/group-listeners');
    return response.data;
  },

  getByListener: async (listenerId: number): Promise<IGroupListener[]> => {
    const response = await apiClient.get(
      `/group-listeners/listener/${listenerId}`,
    );
    return response.data;
  },

  getByGroup: async (groupId: number): Promise<IGroupListener[]> => {
    const response = await apiClient.get(`/group-listeners/group/${groupId}`);
    return response.data;
  },

  create: async (dto: ICreateGroupListenerDto): Promise<IGroupListener> => {
    const response = await apiClient.post('/group-listeners', dto);
    return response.data;
  },

  delete: async (
    id: number,
  ): Promise<{ deletedId: number; message: string }> => {
    const response = await apiClient.delete(`/group-listeners/${id}`);
    return response.data;
  },
};
