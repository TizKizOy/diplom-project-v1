export interface IGroupListener {
  pkIdGroupListener: number;
  fkIdGroup?: number;
  fkIdListener?: number;
  fkIdCourse?: number;
  groupName: string;
  courseTitle: string;
  listenerName: string;
  email: string;
  phone: string;
}
