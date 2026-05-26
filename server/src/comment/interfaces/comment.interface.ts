export interface IComment {
  pkIdComment: number;
  /** Автор комментария (если возвращает БД) */
  fkIdUser?: number;
  message: string;
  createdAt: Date;
  userName: string;
  targetType: 'task' | 'attempt' | 'general';
  taskId?: number;       
  taskTitle?: string;     
  attemptId?: number;     
  attemptStatus?: string; 

}
