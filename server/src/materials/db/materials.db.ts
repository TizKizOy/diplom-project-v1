import { query } from 'src/common/db/dbConfig';
import { CreateMaterialDto } from '../dto/create-material.dto';
import { IMaterial } from '../interfaces/materials.interfaces';
import { IDeletedResult } from '../../common/interfaces/delete.interfaces';
import { IRestoredResult } from '../../common/interfaces/restore.interface';

export const getMaterials = async (filter: {
  id?: number;
  courseId?: number;
  lessonId?: number;
  typeMaterialId?: number;
  isDeleted?: boolean;
}): Promise<IMaterial[]> => {
  return await query<IMaterial>(
    `EXEC prGetMaterialsWithTypesAndLessons
    @pkIdMaterial = @pkIdMaterial,
    @fkIdCourse = @fkIdCourse,
    @fkIdLesson = @fkIdLesson,
    @fkIdTypeMaterial = @fkIdTypeMaterial,
    @isDeleted = @isDeleted`,
    {
      pkIdMaterial: filter.id ?? null,
      fkIdCourse: filter.courseId ?? null,
      fkIdLesson: filter.lessonId ?? null,
      fkIdTypeMaterial: filter.typeMaterialId ?? null,
      isDeleted: filter.isDeleted ?? 0,
    },
  );
};

export const getDeletedMaterials = async (): Promise<IMaterial[]> => {
  return await getMaterials({ isDeleted: true });
};

export const createMaterial = async (
  dto: CreateMaterialDto,
  adminId: number,
): Promise<IMaterial> => {
  const rows = await query<IMaterial>(
    `EXEC spMaterialsCreate
    @fkIdCourse = @fkIdCourse,
    @fkIdLesson = @fkIdLesson,
    @fkIdTypeMaterial = @fkIdTypeMaterial,
    @title = @title,
    @description = @description,
    @fileUrl = @fileUrl,
    @link = @link,
    @sortOrder = @sortOrder,
    @isAdditional = @isAdditional`,
    {
      fkIdCourse: dto.courseId,
      fkIdLesson: dto.lessonId,
      fkIdTypeMaterial: dto.typeMaterialId,
      title: dto.title,
      description: dto.description,
      fileUrl: dto.fileUrl,
      link: dto.link,
      sortOrder: dto.sortOrder,
      isAdditional: dto.isAdditional,
    },
    adminId,
  );
  return rows[0];
};

export const updateMaterial = async (
  id: number,
  dto: Partial<CreateMaterialDto>,
  adminId: number,
): Promise<IMaterial> => {
  const rows = await query<IMaterial>(
    `EXEC spMaterialsUpdate
    @pkIdMaterial = @pkIdMaterial,
    @fkIdCourse = @fkIdCourse,
    @fkIdLesson = @fkIdLesson,
    @fkIdTypeMaterial = @fkIdTypeMaterial,
    @title = @title,
    @description = @description,
    @fileUrl = @fileUrl,
    @link = @link,
    @sortOrder = @sortOrder,
    @isAdditional = @isAdditional`,
    {
      pkIdMaterial: id,
      fkIdCourse: dto.courseId ?? null,
      fkIdLesson: dto.lessonId ?? null,
      fkIdTypeMaterial: dto.typeMaterialId ?? null,
      title: dto.title ?? null,
      description: dto.description ?? null,
      fileUrl: dto.fileUrl ?? null,
      link: dto.link ?? null,
      sortOrder: dto.sortOrder ?? null,
      isAdditional: dto.isAdditional ?? null,
    },
    adminId,
  );
  return rows[0];
};

export const deleteMaterial = async (
  id: number,
  adminId: number,
): Promise<IDeletedResult> => {
  const rows = await query<IDeletedResult>(
    `EXEC spMaterialsDelete @pkIdMaterial = @pkIdMaterial`,
    { pkIdMaterial: id },
    adminId,
  );
  return rows[0];
};

export const restoreMaterial = async (
  id: number,
  adminId: number,
): Promise<IRestoredResult> => {
  const rows = await query<IRestoredResult>(
    `EXEC spMaterialsRestore @pkIdMaterial = @pkIdMaterial`,
    { pkIdMaterial: id },
    adminId,
  );
  return rows[0];
};

export const hardDeleteMaterial = async (
  id: number,
  adminId: number,
): Promise<IDeletedResult> => {
  const rows = await query<IDeletedResult>(
    `EXEC spMaterialsHardDelete @pkIdMaterial = @pkIdMaterial`,
    { pkIdMaterial: id },
    adminId,
  );
  return rows[0];
};
