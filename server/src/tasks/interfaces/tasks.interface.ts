export interface ITask {
  pkIdTask: number;
  fkIdCourse?: number | null;
  fkIdLesson?: number | null;
  fkIdTest?: number | null;
  typeId?: number | null;
  sortOrder?: number | null;
  taskTitle: string;
  description: string;
  deadline: Date;
  maxScore: number;
  taskTypeName: string;
  lessonTitle: string;
  courseTitle: string;
}
