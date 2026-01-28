import { query } from 'src/common/db/dbConfig';
import { CreateAttemptDto } from '../dto/create-attempt.dto';
import { UpdateAttemptDto } from '../dto/update-attempt.dto';
import { GradeAttemptDto } from '../dto/grade-attempt.dto';
import {
  IAttempt,
  IDeletedAttemptResult,
  IRestoredAttemptResult,
} from '../interfaces/attempts.interfaces';

export const getAttempts = async (filter: {
  id?: number;
  taskId?: number;
  listenerId?: number;
  statusId?: number;
}): Promise<IAttempt[]> => {
  return await query('SELECT * FROM f_attempts_get($1, $2, $3, $4)', [
    filter.id ?? null,
    filter.taskId ?? null,
    filter.listenerId ?? null,
    filter.statusId ?? null,
  ]);
};

export const getDeletedAttempts = async (id?: number): Promise<IAttempt[]> => {
  return await query('SELECT * FROM f_attempts_get_deleted($1)', [id ?? null]);
};

export const createAttempt = async (
  dto: CreateAttemptDto,
  adminId: number,
): Promise<IAttempt> => {
  const rows = await query(
    'SELECT * FROM f_attempts_create($1,$2,$3,$4)',
    [dto.taskId, dto.listenerId, dto.score ?? null, dto.statusId ?? 1],
    adminId,
  );
  return rows[0];
};

export const updateAttempt = async (
  id: number,
  dto: UpdateAttemptDto,
  adminId: number,
): Promise<IAttempt> => {
  const rows = await query(
    'SELECT * FROM f_attempts_update($1,$2,$3,$4,$5)',
    [
      id,
      dto.taskId ?? null,
      dto.listenerId ?? null,
      dto.statusId ?? null,
      dto.score ?? null,
    ],
    adminId,
  );
  return rows[0];
};

export const gradeAttempt = async (
  id: number,
  dto: GradeAttemptDto,
  adminId: number,
): Promise<IAttempt> => {
  const rows = await query(
    'SELECT * FROM f_attempts_grade($1,$2,$3)',
    [id, dto.score, dto.statusId ?? 2],
    adminId,
  );
  return rows[0];
};

export const deleteAttempt = async (
  id: number,
  adminId: number,
): Promise<IDeletedAttemptResult> => {
  const rows = await query(
    'SELECT * FROM f_attempts_delete($1)',
    [id],
    adminId,
  );
  return rows[0];
};

export const restoreAttempt = async (
  id: number,
  adminId: number,
): Promise<IRestoredAttemptResult> => {
  const rows = await query(
    'SELECT * FROM f_attempts_restore($1)',
    [id],
    adminId,
  );
  return rows[0];
};

export const hardDeleteAttempt = async (
  id: number,
  adminId: number,
): Promise<IDeletedAttemptResult> => {
  const rows = await query(
    'SELECT * FROM f_attempts_hard_delete($1)',
    [id],
    adminId,
  );
  return rows[0];
};
