import { query } from 'src/common/db/dbConfig';
import { CreateCourseDto } from '../dto/create-course.dto';
import { UpdateCourseDto } from '../dto/update-course.dto';
import {
  ICourse,
  IDeletedCourseResult,
  IRestoredCourseResult,
} from '../interfaces/courses.interfaces';

export const getAllCourses = async (): Promise<ICourse[]> => {
  return await query('SELECT * FROM f_courses_get()');
};

export const getCourse = async (
  id?: number,
  statusId?: number,
): Promise<ICourse> => {
  const rows = await query('SELECT * FROM f_courses_get($1, $2)', [
    id ?? null,
    statusId ?? null,
  ]);
  return rows[0];
};

export const getDeletedCourses = async (id?: number): Promise<ICourse[]> => {
  return await query('SELECT * FROM f_courses_get_deleted($1)', [id ?? null]);
};

export const createCourse = async (
  dto: CreateCourseDto,
  adminId: number,
): Promise<ICourse> => {
  const rows = await query(
    'SELECT * FROM f_courses_create($1,$2,$3,$4,$5)',
    [
      dto.title,
      dto.description ?? null,
      dto.startDate ?? null,
      dto.endDate ?? null,
      dto.statusId ?? 1,
    ],
    adminId,
  );
  return rows[0];
};

export const updateCourse = async (
  id: number,
  dto: UpdateCourseDto,
  adminId: number,
): Promise<ICourse> => {
  const rows = await query(
    'SELECT * FROM f_courses_update($1,$2,$3,$4,$5,$6)',
    [
      id,
      dto.title ?? null,
      dto.description ?? null,
      dto.startDate ?? null,
      dto.endDate ?? null,
      dto.statusId ?? null,
    ],
    adminId,
  );
  return rows[0];
};

export const deleteCourse = async (
  id: number,
  adminId: number,
): Promise<IDeletedCourseResult> => {
  const rows = await query('SELECT * FROM f_courses_delete($1)', [id], adminId);
  return rows[0];
};

export const restoreCourse = async (
  id: number,
  adminId: number,
): Promise<IRestoredCourseResult> => {
  const rows = await query(
    'SELECT * FROM f_courses_restore($1)',
    [id],
    adminId,
  );
  return rows[0];
};

export const hardDeleteCourse = async (
  id: number,
  adminId: number,
): Promise<IDeletedCourseResult> => {
  const rows = await query(
    'SELECT * FROM f_courses_hard_delete($1)',
    [id],
    adminId,
  );
  return rows[0];
};
