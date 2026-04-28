import { query } from 'src/common/db/dbConfig';
import { CreateLessonDto } from '../dto/create-lesson.dto';
import { UpdateLessonDto } from '../dto/update-lesson.dto';
import { ILesson } from '../interfaces/lessons.interfaces';
import { IDeletedResult } from '../../common/interfaces/delete.interfaces';
import { IRestoredResult } from '../../common/interfaces/restore.interface';

export const getLessons = async (filter: {
  id?: number;
  courseId?: number;
  title?: string;
  isPublished?: boolean;
  isDeleted?: boolean;
}): Promise<ILesson[]> => {
  return await query<ILesson>(
    `EXEC prGetLessonsWithCourse
      @pkIdLesson = @pkIdLesson,
      @fkIdCourse = @fkIdCourse,
      @title = @title,
      @isPublished = @isPublished,
      @isDeleted = @isDeleted`,
    {
      pkIdLesson: filter.id ?? null,
      fkIdCourse: filter.courseId ?? null,
      title: filter.title ?? null,
      isPublished: filter.isPublished ?? null,
      isDeleted: filter.isDeleted ?? 0,
    },
  );
};

export const getDeletedLessons = async (): Promise<ILesson[]> => {
  return await getLessons({ isDeleted: true });
};

export const createLesson = async (
  dto: CreateLessonDto,
  userId: number,
): Promise<ILesson> => {
  const result = await query<ILesson>(
    `EXEC spLessonsCreate
      @fkIdCourse = @fkIdCourse,
      @title = @title,
      @description = @description,
      @content = @content,
      @sortOrder = @sortOrder,
      @isPublished = @isPublished`,
    {
      fkIdCourse: dto.courseId,
      title: dto.title,
      description: dto.description ?? null,
      content: dto.content ?? null,
      sortOrder: dto.sortOrder ?? 0,
      isPublished: dto.isPublished ?? false,
    },
    userId,
  );

  return result[0];
};

export const updateLesson = async (
  id: number,
  dto: UpdateLessonDto,
  userId: number,
): Promise<ILesson> => {
  const result = await query<ILesson>(
    `EXEC spLessonsUpdate
      @pkIdLesson = @pkIdLesson,
      @fkIdCourse = @fkIdCourse,
      @title = @title,
      @description = @description,
      @content = @content,
      @sortOrder = @sortOrder,
      @isPublished = @isPublished`,
    {
      pkIdLesson: id,
      fkIdCourse: dto.courseId ?? null,
      title: dto.title ?? null,
      description: dto.description ?? null,
      content: dto.content ?? null,
      sortOrder: dto.sortOrder ?? null,
      isPublished: dto.isPublished ?? null,
    },
    userId,
  );

  return result[0];
};

export const deleteLesson = async (
  id: number,
  userId: number,
): Promise<IDeletedResult> => {
  const result = await query<IDeletedResult>(
    `EXEC spLessonsDelete @pkIdLesson = @pkIdLesson`,
    { pkIdLesson: id },
    userId,
  );
  return result[0];
};

export const restoreLesson = async (
  id: number,
  userId: number,
): Promise<IRestoredResult> => {
  const result = await query<IRestoredResult>(
    `EXEC spLessonsRestore @pkIdLesson = @pkIdLesson`,
    { pkIdLesson: id },
    userId,
  );
  return result[0];
};

export const hardDeleteLesson = async (
  id: number,
  userId: number,
): Promise<IDeletedResult> => {
  const result = await query<IDeletedResult>(
    `EXEC spLessonsHardDelete @pkIdLesson = @pkIdLesson`,
    { pkIdLesson: id },
    userId,
  );
  return result[0];
};
