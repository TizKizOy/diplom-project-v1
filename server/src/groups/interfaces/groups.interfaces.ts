export interface IGroup {
  pkIdGroup: number;
  groupName: string;
  courseTitle: string;
  curatorName: string | null;
  listenerCount: number;
}

export interface IDeletedGroupResult {
  deleted_id: number;
  message: string;
}

export interface IRestoredGroupResult {
  restored_id: number;
  message: string;
}
