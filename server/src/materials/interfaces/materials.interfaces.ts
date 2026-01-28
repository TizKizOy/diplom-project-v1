export interface IMaterial {
  pkIdMaterial: number;
  courseTitle: string;
  title: string;
  fileUrl: string | null;
  link: string | null;
}

export interface IDeletedMaterialResult {
  deleted_id: number;
  message: string;
}

export interface IRestoredMaterialResult {
  restored_id: number;
  message: string;
}
