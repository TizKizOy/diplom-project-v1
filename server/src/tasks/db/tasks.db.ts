import { query } from 'src/common/db/dbConfig';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import {
  ITask,
  IDeletedTaskResult,
  IRestoredTaskResult,
} from '../interfaces/tasks.interface';

export const getTasks = async (filter: {
  id?: number;
  courseId?: number;
  typeId?: number;
}): Promise<ITask[]> => {
  return await query('SELECT * FROM f_tasks_get($1, $2, $3)', [
    filter.id ?? null,
    filter.courseId ?? null,
    filter.typeId ?? null,
  ]);
};

export const getDeletedTasks = async (id?: number): Promise<ITask[]> => {
  return await query('SELECT * FROM f_tasks_get_deleted($1)', [id ?? null]);
};

export const createTask = async (
  dto: CreateTaskDto,
  adminId: number,
): Promise<ITask> => {
  const rows = await query(
    'SELECT * FROM f_tasks_create($1,$2,$3,$4,$5,$6)',
    [
      dto.courseId,
      dto.typeId,
      dto.title,
      dto.description ?? null,
      dto.deadline ?? null,
      dto.maxScore ?? 100,
    ],
    adminId,
  );
  return rows[0];
};

export const updateTask = async (
  id: number,
  dto: UpdateTaskDto,
  adminId: number,
): Promise<ITask> => {
  const rows = await query(
    'SELECT * FROM f_tasks_update($1,$2,$3,$4,$5,$6,$7)',
    [
      id,
      dto.courseId ?? null,
      dto.typeId ?? null,
      dto.title ?? null,
      dto.description ?? null,
      dto.deadline ?? null,
      dto.maxScore ?? null,
    ],
    adminId,
  );
  return rows[0];
};

export const deleteTask = async (
  id: number,
  adminId: number,
): Promise<IDeletedTaskResult> => {
  const rows = await query('SELECT * FROM f_tasks_delete($1)', [id], adminId);
  return rows[0];
};

export const restoreTask = async (
  id: number,
  adminId: number,
): Promise<IRestoredTaskResult> => {
  const rows = await query('SELECT * FROM f_tasks_restore($1)', [id], adminId);
  return rows[0];
};

export const hardDeleteTask = async (
  id: number,
  adminId: number,
): Promise<IDeletedTaskResult> => {
  const rows = await query(
    'SELECT * FROM f_tasks_hard_delete($1)',
    [id],
    adminId,
  );
  return rows[0];
};
