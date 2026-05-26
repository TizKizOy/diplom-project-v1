export interface ICourseTeacher {
  pkIdCourseTeacher: number;
  fkIdCourse: number;
  fkIdTeacher: number;
  assignedAt: Date;
  courseTitle: string;
  teacherName: string;
}
