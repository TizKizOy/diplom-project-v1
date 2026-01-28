export interface ITask {
  pkIdTask: number;
  courseTitle: string;
  taskType: string;
  title: string;
  description: string | null;
  deadline: Date;
  maxScore: number;
  isOverdue: boolean;
}

export interface IDeletedTaskResult {
  deleted_id: number;
  message: string;
}

export interface IRestoredTaskResult {
  restored_id: number;
  message: string;
}
