export interface ICourse {
  pkIdCourse: number;
  title: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
  statusName: string;
  isOverdue: boolean;
}

export interface IDeletedCourseResult {
  deleted_id: number;
  message: string;
}

export interface IRestoredCourseResult {
  restored_id: number;
  message: string;
}
