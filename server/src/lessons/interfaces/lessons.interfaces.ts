export interface ILesson {
  pkIdLesson: number;
  title: string;
  description: string;
  content: string;
  sortOrder: number;
  isPublished: boolean;
  createdAt: Date;
  courseTitle: string;
}
