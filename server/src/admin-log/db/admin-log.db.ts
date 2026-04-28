import { query } from 'src/common/db/dbConfig';
import { IAdminLog } from '../interface/admin-log.interface';

export const getAdminLog = async (): Promise<IAdminLog[]> => {
  return await query<IAdminLog>(`select * from vwAdminLogs`);
};
