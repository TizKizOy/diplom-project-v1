import { query } from 'src/common/db/dbConfig';
import { CreateCourseTeacherDto } from '../dto/create-course-teacher.dto';
import { UpdateCourseTeacherDto } from '../dto/update-course-teacher.dto';
import { ICourseTeacher } from '../interfaces/course-teachers.interface';
import { IDeletedResult } from '../../common/interfaces/delete.interfaces';
import { IRestoredResult } from '../../common/interfaces/restore.interface';

export const getCourseTeachers = async (filter: {
  id?: number;
  courseId?: number;
  teacherId?: number;
  isDeleted?: boolean;
}): Promise<ICourseTeacher[]> => {
  return await query<ICourseTeacher>(
    `EXEC prGetCourseTeachers
    @pkIdCourseTeacher = @pkIdCourseTeacher,
    @fkIdCourse = @fkIdCourse,
    @fkIdTeacher = @fkIdTeacher,
    @isDeleted = @isDeleted`,
    {
      pkIdCourseTeacher: filter.id ?? null,
      fkIdCourse: filter.courseId ?? null,
      fkIdTeacher: filter.teacherId ?? null,
      isDeleted: filter.isDeleted ?? 0,
    },
  );
};

export const getDeletedCourseTeachers = async (): Promise<ICourseTeacher[]> => {
  return await getCourseTeachers({ isDeleted: true });
};

export const createCourseTeacher = async (
  dto: CreateCourseTeacherDto,
  adminId: number,
): Promise<ICourseTeacher> => {
  const result = await query<ICourseTeacher>(
    `EXEC spCreateCourseTeacher
      @fkIdCourse = @fkIdCourse,
      @fkIdTeacher = @fkIdTeacher`,
    {
      fkIdCourse: dto.courseId,
      fkIdTeacher: dto.teacherId,
    },
    adminId,
  );

  return result[0];
};

export const deleteCourseTeacher = async (
  id: number,
  adminId: number,
): Promise<IDeletedResult> => {
  const result = await query<IDeletedResult>(
    `EXEC spCourseTeacherDelete @pkIdCourseTeacher = @pkIdCourseTeacher`,
    { pkIdCourseTeacher: id },
    adminId,
  );
  return result[0];
};

export const restoreCourseTeacher = async (
  id: number,
  adminId: number,
): Promise<IRestoredResult> => {
  const result = await query<IRestoredResult>(
    `EXEC spCourseTeacherRestore @pkIdCourseTeacher = @pkIdCourseTeacher`,
    { pkIdCourseTeacher: id },
    adminId,
  );
  return result[0];
};

export const hardDeleteCourseTeacher = async (
  id: number,
  adminId: number,
): Promise<IDeletedResult> => {
  const result = await query<IDeletedResult>(
    `EXEC spCourseTeacherHardDelete @pkIdCourseTeacher = @pkIdCourseTeacher`,
    { pkIdCourseTeacher: id },
    adminId,
  );
  return result[0];
};
