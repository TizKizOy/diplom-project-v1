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
  title?: string;
  content?: string;
  contentFileUrl?: string;
  sortOrder?: number;
}

export interface IMaterial {
  pkIdMaterial: number;
  fkIdCourse: number;
  fkIdLesson: number;
  fkIdTypeMaterial: number;
  title: string;
  description: string;
  fileUrl: string;
  link: string;
  sortOrder: number;
  isAdditional: boolean;
  typeName: string;
  lessonTitle: string;
  courseTitle: string;
}

export interface IGroup {
  pkIdGroup: number;
  fkIdCourse: number;
  fkIdCurator: number;
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
  groupName: string;
  courseTitle: string;
  listenerName: string;
  email: string;
}
