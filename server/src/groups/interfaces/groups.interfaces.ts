export interface IGroup {
  pkIdGroup: number;
  fkIdCourse: number;
  fkIdCurator: number | null;
  groupName: string;
  courseTitle: string;
  curatorName: string;
  listenerCount: number;
}
