export interface ICourse {
  pkIdCourse: number;
  fkIdStatus: number;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  statusName: string;
  tags: string;
  /** ID тегов (tbCourseTags), только в ответе getById / после сохранения */
  tagIds?: number[];
}
