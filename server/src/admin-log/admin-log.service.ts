import { IAdminLog } from './interface/admin-log.interface';
import * as db from './db/admin-log.db';

export class AdminLogService {
  async getAll(): Promise<IAdminLog[]> {
    return await db.getAdminLog();
  }
}
