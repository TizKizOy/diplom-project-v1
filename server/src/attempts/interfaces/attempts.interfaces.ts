export interface IAttempt {
  pkIdAttemp: number;
  taskTitle: string;
  listenerName: string;
  statusName: string;
  submittedAt: Date;
  score: number | null;
  maxScore: number;
  percent: number | null;
}

export interface IDeletedAttemptResult {
  deleted_id: number;
  message: string;
}

export interface IRestoredAttemptResult {
  restored_id: number;
  message: string;
}
