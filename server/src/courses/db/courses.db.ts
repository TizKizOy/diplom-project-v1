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
