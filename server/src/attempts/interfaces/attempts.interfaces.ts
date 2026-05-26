export interface IAttempt {
  pkIdAttempt: number;
  fkIdTask?: number | null;
  fkIdListener?: number | null;
  fkIdLesson?: number | null;
  fkIdCourse?: number | null;
  taskTitle: string;
  listenerName: string;
  statusName: string;
  submittedAt: Date;
  score: number;
  answerText?: string | null;
  answerFileUrl?: string | null;
}
