import { query } from 'src/common/db/dbConfig';
import { CreateGroupListenerDto } from '../dto/create-group-listener.dto';
import { UpdateGroupListenerDto } from '../dto/update-group-listener.dto';
import {
  IGroupListener,
  IDeletedGroupListenerResult,
  IRestoredGroupListenerResult,
} from '../interfaces/group-listener.interface';

export const getGroupListeners = async (filter: {
  id?: number;
  groupId?: number;
  listenerId?: number;
}): Promise<IGroupListener[]> => {
  return await query('SELECT * FROM f_grouplisteners_get($1, $2, $3)', [
    filter.id ?? null,
    filter.groupId ?? null,
    filter.listenerId ?? null,
  ]);
};

export const getDeletedGroupListeners = async (filter?: {
  groupId?: number;
  listenerId?: number;
}): Promise<IGroupListener[]> => {
  return await query('SELECT * FROM f_grouplisteners_get_deleted($1, $2)', [
    filter?.groupId ?? null,
    filter?.listenerId ?? null,
  ]);
};

export const createGroupListener = async (
  dto: CreateGroupListenerDto,
  adminId: number,
): Promise<IGroupListener> => {
  const rows = await query(
    'SELECT * FROM f_grouplisteners_add($1, $2)',
    [dto.groupId, dto.listenerId],
    adminId,
  );
  return rows[0];
};

export const updateGroupListener = async (
  id: number,
  dto: UpdateGroupListenerDto,
  adminId: number,
): Promise<IGroupListener> => {
  const rows = await query(
    'SELECT * FROM f_grouplisteners_update($1, $2, $3)',
    [id, dto.groupId ?? null, dto.listenerId ?? null],
    adminId,
  );
  return rows[0];
};

export const deleteGroupListener = async (
  id: number,
  adminId: number,
): Promise<IDeletedGroupListenerResult> => {
  const rows = await query(
    'SELECT * FROM f_grouplisteners_remove($1)',
    [id],
    adminId,
  );
  return rows[0];
};

export const restoreGroupListener = async (
  id: number,
  adminId: number,
): Promise<IRestoredGroupListenerResult> => {
  const rows = await query(
    'SELECT * FROM f_grouplisteners_restore($1)',
    [id],
    adminId,
  );
  return rows[0];
};

export const hardDeleteGroupListener = async (
  id: number,
  adminId: number,
): Promise<IDeletedGroupListenerResult> => {
  const rows = await query(
    'SELECT * FROM f_grouplisteners_hard_delete($1)',
    [id],
    adminId,
  );
  return rows[0];
};
