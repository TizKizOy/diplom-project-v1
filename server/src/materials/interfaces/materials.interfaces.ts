export interface IMaterial {
  pkIdMaterial: number;
  materialTitle: string;
  description: string;
  fileUrl: string | null;
  link: string | null;
  typeName: string;
  lessonTitle: string;
  courseTitle: string;
  fkIdCourse?: number;
  fkIdLesson?: number;
  fkIdTypeMaterial?: number;
  sortOrder?: number;
  isAdditional?: boolean;
}
