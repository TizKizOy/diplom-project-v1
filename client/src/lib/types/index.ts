export interface ApiError {
  message: string;
  error: string;
  statusCode: number;
}

export interface IUser {
  pkIdUser: number;
  fullName: string;
  login: string;
  email: string;
  phone: string;
  regData: string;
  roleName: string;
  positionName?: string;
}

export interface ICourse {
  pkIdCourse: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  fkIdStatus: number;
  statusName: string;
  tags?: string;
  tagIds?: number[];
}

export interface ILesson {
  pkIdLesson: number;
  fkIdCourse: number;
  title: string;
  description: string;
  content: string;
  sortOrder: number;
  isPublished: boolean;
  createdAt: string;
  courseTitle: string;
}

export interface ITask {
  pkIdTask: number;
  taskTitle: string;
  description: string;
  deadline: string;
  maxScore: number;
  taskTypeName: string;
  lessonTitle: string;
  courseTitle: string;
  typeId?: number;
  fkIdCourse?: number;
  fkIdLesson?: number;
  fkIdTest?: number | null;
  title?: string;
  content?: string;
  contentFileUrl?: string;
  sortOrder?: number;
}

export interface IMaterial {
  pkIdMaterial: number;
  fkIdCourse?: number;
  fkIdLesson?: number;
  fkIdTypeMaterial?: number;
  /** Как приходит из API / prGetMaterialsWithTypesAndLessons (`m.title AS materialTitle`) */
  materialTitle?: string;
  /** Локальное имя при создании DTO; если с сервера только materialTitle — смотрите getMaterialTitle */
  title?: string;
  description: string;
  fileUrl: string;
  link: string;
  sortOrder?: number;
  isAdditional?: boolean;
  typeName: string;
  lessonTitle: string;
  courseTitle: string;
}

export function getMaterialTitle(m: Pick<IMaterial, 'materialTitle' | 'title'>): string {
  const s = m.materialTitle ?? m.title;
  return s == null ? '' : String(s);
}

export interface IGroup {
  pkIdGroup: number;
  fkIdCourse: number;
  fkIdCurator?: number | null;
  name: string;
  groupName?: string; // API может возвращать groupName вместо name
  courseTitle: string;
  curatorName: string;
  listenerCount: number;
}

export interface IGroupListener {
  pkIdGroupListener: number;
  fkIdGroup: number;
  fkIdListener: number;
  fkIdCourse?: number;
  groupName: string;
  courseTitle: string;
  listenerName: string;
  email: string;
}
