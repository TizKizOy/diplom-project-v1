import apiClient from './apiClient';

export interface IAdminLog {
  pkIdLog: number;
  actionTime: string;
  tableName: string;
  action: string;
  oldData: string | null;
  newData: string | null;
  adminName: string;
}

export const adminLogApi = {
  getAll: async (): Promise<IAdminLog[]> => {
    const response = await apiClient.get('/admin-log');
    return response.data;
  },
};
