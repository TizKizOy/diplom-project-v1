export interface IAdminLog {
  pkIdLog: number;
  actionTime: Date;
  tableName: string;
  action: string;
  oldData: string | null;
  newData: string;
  adminName: string;
}
