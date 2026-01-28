import { query } from 'src/common/db/dbConfig';
import { CreateMaterialDto } from '../dto/create-material.dto';
import {
  IMaterial,
  IDeletedMaterialResult,
  IRestoredMaterialResult,
} from '../interfaces/materials.interfaces';

export const getMaterials = async (filter: {
  id?: number;
  course?: number;
}): Promise<IMaterial[]> => {
  return await query('SELECT * FROM f_materials_get($1, $2)', [
    filter.id ?? null,
    filter.course ?? null,
  ]);
};

export const getDeletedMaterials = async (
  id?: number,
): Promise<IMaterial[]> => {
  return await query('SELECT * FROM f_materials_get_deleted($1)', [id ?? null]);
};

export const createMaterial = async (
  dto: CreateMaterialDto,
  adminId: number,
): Promise<IMaterial> => {
  const rows = await query(
    'SELECT * FROM f_materials_create($1, $2, $3, $4)',
    [dto.courseId, dto.title, dto.fileUrl ?? null, dto.link ?? null],
    adminId,
  );
  return rows[0];
};

export const updateMaterial = async (
  id: number,
  dto: Partial<CreateMaterialDto>,
  adminId: number,
): Promise<IMaterial> => {
  const rows = await query(
    'SELECT * FROM f_materials_update($1, $2, $3, $4)',
    [id, dto.title ?? null, dto.fileUrl ?? null, dto.link ?? null],
    adminId,
  );
  return rows[0];
};

export const deleteMaterial = async (
  id: number,
  adminId: number,
): Promise<IDeletedMaterialResult> => {
  const rows = await query(
    'SELECT * FROM f_materials_delete($1)',
    [id],
    adminId,
  );
  return rows[0];
};

export const restoreMaterial = async (
  id: number,
  adminId: number,
): Promise<IRestoredMaterialResult> => {
  const rows = await query(
    'SELECT * FROM f_materials_restore($1)',
    [id],
    adminId,
  );
  return rows[0];
};

export const hardDeleteMaterial = async (
  id: number,
  adminId: number,
): Promise<IDeletedMaterialResult> => {
  const rows = await query(
    'SELECT * FROM f_materials_hard_delete($1)',
    [id],
    adminId,
  );
  return rows[0];
};
