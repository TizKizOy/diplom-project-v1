import { query } from 'src/common/db/dbConfig';
import { CreateGroupDto } from '../dto/create-group.dto';
import { UpdateGroupDto } from '../dto/update-group.dto';
import {
  IGroup,
  IDeletedGroupResult,
  IRestoredGroupResult,
} from '../interfaces/groups.interfaces';

export const getGroups = async (filter: {
  id?: number;
  courseId?: number;
}): Promise<IGroup[]> => {
  return await query('SELECT * FROM f_groups_get($1, $2)', [
    filter.id ?? null,
    filter.courseId ?? null,
  ]);
};

export const getDeletedGroups = async (id?: number): Promise<IGroup[]> => {
  return await query('SELECT * FROM f_groups_get_deleted($1)', [id ?? null]);
};

export const createGroup = async (
  dto: CreateGroupDto,
  adminId: number,
): Promise<IGroup> => {
  const rows = await query(
    'SELECT * FROM f_groups_create($1,$2,$3)',
    [dto.name, dto.courseId, dto.curatorId ?? null],
    adminId,
  );
  return rows[0];
};

export const updateGroup = async (
  id: number,
  dto: UpdateGroupDto,
  adminId: number,
): Promise<IGroup> => {
  const rows = await query(
    'SELECT * FROM f_groups_update($1,$2,$3,$4)',
    [id, dto.name ?? null, dto.courseId ?? null, dto.curatorId ?? null],
    adminId,
  );
  return rows[0];
};

export const deleteGroup = async (
  id: number,
  adminId: number,
): Promise<IDeletedGroupResult> => {
  const rows = await query('SELECT * FROM f_groups_delete($1)', [id], adminId);
  return rows[0];
};

export const restoreGroup = async (
  id: number,
  adminId: number,
): Promise<IRestoredGroupResult> => {
  const rows = await query('SELECT * FROM f_groups_restore($1)', [id], adminId);
  return rows[0];
};

export const hardDeleteGroup = async (
  id: number,
  adminId: number,
): Promise<IDeletedGroupResult> => {
  const rows = await query(
    'SELECT * FROM f_groups_hard_delete($1)',
    [id],
    adminId,
  );
  return rows[0];
};
