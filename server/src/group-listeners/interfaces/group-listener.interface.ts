export interface IGroupListener {
  pkIdGroupListener: number;
  groupName: string;
  courseTitle: string;
  listenerName: string;
  email: string;
}

export interface IDeletedGroupListenerResult {
  deleted_id: number;
  message: string;
}

export interface IRestoredGroupListenerResult {
  restored_id: number;
  message: string;
}
