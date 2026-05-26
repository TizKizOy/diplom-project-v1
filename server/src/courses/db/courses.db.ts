import { query } from 'src/common/db/dbConfig';
import { CreateCourseDto } from '../dto/create-course.dto';
import { UpdateCourseDto } from '../dto/update-course.dto';
import { IDeletedResult } from '../../common/interfaces/delete.interfaces';
import { IRestoredResult } from '../../common/interfaces/restore.interface';
import { ICourse } from '../interfaces/courses.interfaces';

export const getCourses = async (filter: {
  id?: number;
  statusId?: number;
  title?: string;
  isDeleted?: boolean;
}): Promise<ICourse[]> => {
  return await query<ICourse>(
    `EXEC prGetCoursesWithStatusAndTags
      @pkIdCourse = @pkIdCourse,
      @fkIdStatus = @fkIdStatus,
      @title = @title,
      @isDeleted = @isDeleted`,
    {
      pkIdCourse: filter.id ?? null,
      fkIdStatus: filter.statusId ?? null,
      title: filter.title ?? null,
      isDeleted: filter.isDeleted ?? 0,
    },
  );
};

export const getDeletedCourses = async (): Promise<ICourse[]> => {
  return await getCourses({ isDeleted: true });
};

export const createCourse = async (
  dto: CreateCourseDto,
  userId: number,
): Promise<ICourse> => {
  const result = await query<ICourse>(
    `EXEC spCoursesCreate
      @title = @title,
      @description = @description,
      @startDate = @startDate,
      @endDate = @endDate,
      @fkIdStatus = @fkIdStatus`,
    {
      title: dto.title,
      description: dto.description,
      startDate: dto.startDate,
      endDate: dto.endDate,
      fkIdStatus: dto.statusId,
    },
    userId,
  );

  return result[0];
};

export const updateCourse = async (
  id: number,
  dto: UpdateCourseDto,
  userId: number,
): Promise<ICourse> => {
  const result = await query<ICourse>(
    `EXEC spCoursesUpdate
      @pkIdCourse = @pkIdCourse,
      @title = @title,
      @description = @description,
      @startDate = @startDate,
      @endDate = @endDate,
      @fkIdStatus = @fkIdStatus`,
    {
      pkIdCourse: id,
      title: dto.title ?? null,
      description: dto.description ?? null,
      startDate: dto.startDate ?? null,
      endDate: dto.endDate ?? null,
      fkIdStatus: dto.statusId ?? null,
    },
    userId,
  );

  return result[0];
};

export const deleteCourse = async (
  id: number,
  userId: number,
): Promise<IDeletedResult> => {
  const result = await query<IDeletedResult>(
    `EXEC spCoursesDelete @pkIdCourse = @pkIdCourse`,
    { pkIdCourse: id },
    userId,
  );
  return result[0];
};

export const restoreCourse = async (
  id: number,
  userId: number,
): Promise<IRestoredResult> => {
  const result = await query<IRestoredResult>(
    `EXEC spCoursesRestore @pkIdCourse = @pkIdCourse`,
    { pkIdCourse: id },
    userId,
  );
  return result[0];
};

export const hardDeleteCourse = async (
  id: number,
  userId: number,
): Promise<IDeletedResult> => {
  const result = await query<IDeletedResult>(
    `EXEC spCoursesHardDelete @pkIdCourse = @pkIdCourse`,
    { pkIdCourse: id },
    userId,
  );
  return result[0];
};

export interface ICourseTagRow {
  pkIdTag: number;
  name: string;
}

export const getAllTags = async (): Promise<ICourseTagRow[]> => {
  return await query<ICourseTagRow>(
    `SELECT pkIdTag, name FROM tbTags ORDER BY name`,
    {},
  );
};

export const getCourseTagIds = async (courseId: number): Promise<number[]> => {
  const rows = await query<{ fkIdTag: number }>(
    `SELECT fkIdTag FROM tbCourseTags WHERE fkIdCourse = @courseId`,
    { courseId },
  );
  return rows.map((r) => r.fkIdTag);
};

/** Есть хотя бы один урок с заданием (задание привязано к уроку). */
export const courseHasLessonWithTask = async (
  courseId: number,
): Promise<boolean> => {
  const rows = await query<{ cnt: number }>(
    `SELECT COUNT(*) AS cnt
     FROM tbTasks t
     INNER JOIN tbLessons l ON t.fkIdLesson = l.pkIdLesson
     WHERE l.fkIdCourse = @courseId AND t.isDeleted = 0 AND l.isDeleted = 0`,
    { courseId },
  );
  return Number(rows[0]?.cnt ?? 0) > 0;
};

export const replaceCourseTags = async (
  courseId: number,
  tagIds: number[],
  userId: number,
): Promise<void> => {
  await query(
    `DELETE FROM tbCourseTags WHERE fkIdCourse = @courseId`,
    { courseId },
    userId,
  );
  const unique = [...new Set(tagIds)].filter(
    (id) => Number.isFinite(id) && id > 0,
  );
  for (const fkIdTag of unique) {
    await query(
      `INSERT INTO tbCourseTags (fkIdCourse, fkIdTag) VALUES (@courseId, @fkIdTag)`,
      { courseId, fkIdTag },
      userId,
    );
  }
};
