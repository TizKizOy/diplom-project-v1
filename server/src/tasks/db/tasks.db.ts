import { query } from 'src/common/db/dbConfig';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { ITask } from '../interfaces/tasks.interface';
import { IDeletedResult } from '../../common/interfaces/delete.interfaces';
import { IRestoredResult } from '../../common/interfaces/restore.interface';

export const getTasks = async (filter: {
  id?: number;
  typeTaskId?: number;
  courseId?: number;
  lessonId?: number;
  taskTitle?: string;
  isDeleted?: boolean;
}): Promise<ITask[]> => {
  return await query<ITask>(
    `EXEC prGetTasksWithTypesAndLessons
    @pkIdTask = @pkIdTask,
    @fkIdTypeTasks = @fkIdTypeTasks,
    @fkIdCourse = @fkIdCourse,
    @fkIdLesson = @fkIdLesson,
    @taskTitle = @taskTitle,
    @isDeleted = @isDeleted`,
    {
      pkIdTask: filter.id ?? null,
      fkIdTypeTasks: filter.typeTaskId ?? null,
      fkIdCourse: filter.courseId ?? null,
      fkIdLesson: filter.lessonId ?? null,
      taskTitle: filter.taskTitle ?? null,
      isDeleted: filter.isDeleted ?? 0,
    },
  );
};

export const getDeletedTasks = async (): Promise<ITask[]> => {
  return await getTasks({ isDeleted: true });
};

export const createTask = async (
  dto: CreateTaskDto,
  adminId: number,
): Promise<ITask> => {
  const result = await query<ITask>(
    `EXEC spTasksCreate
    @fkIdTypeTasks = @fkIdTypeTasks,
    @fkIdCourse = @fkIdCourse,
    @fkIdLesson = @fkIdLesson,
    @fkIdTest = @fkIdTest,
    @title = @title,
    @description = @description,
    @content = @content,
    @contentFileUrl = @contentFileUrl,
    @deadline = @deadline,
    @maxScore = @maxScore,
    @sortOrder = @sortOrder`,
    {
      fkIdTypeTasks: dto.typeId,
      fkIdCourse: dto.courseId,
      fkIdLesson: dto.lessonId ?? null,
      fkIdTest: dto.testId ?? null,
      title: dto.title,
      description: dto.description,
      content: dto.content,
      contentFileUrl: dto.contentFileUrl ?? null,
      deadline: dto.deadline,
      maxScore: dto.maxScore ?? 100,
      sortOrder: dto.sortOrder,
    },
    adminId,
  );
  return result[0];
};

export const updateTask = async (
  id: number,
  dto: UpdateTaskDto,
  adminId: number,
): Promise<ITask> => {
  const result = await query<ITask>(
    `EXEC spTasksUpdate
    @pkIdTask = @pkIdTask,
    @fkIdTypeTasks = @fkIdTypeTasks,
    @fkIdCourse = @fkIdCourse,
    @fkIdLesson = @fkIdLesson,
    @fkIdTest = @fkIdTest,
    @title = @title,
    @description = @description,
    @content = @content,
    @contentFileUrl = @contentFileUrl,
    @deadline = @deadline,
    @maxScore = @maxScore,
    @sortOrder = @sortOrder`,
    {
      pkIdTask: id,
      fkIdTypeTasks: dto.typeId ?? null,
      fkIdCourse: dto.courseId ?? null,
      fkIdLesson: dto.lessonId ?? null,
      fkIdTest: dto.testId ?? null,
      title: dto.title ?? null,
      description: dto.description ?? null,
      content: dto.content ?? null,
      contentFileUrl: dto.contentFileUrl ?? null,
      deadline: dto.deadline ?? null,
      maxScore: dto.maxScore ?? 100,
      sortOrder: dto.sortOrder ?? null,
    },
    adminId,
  );
  return result[0];
};

export const deleteTask = async (
  id: number,
  adminId: number,
): Promise<IDeletedResult> => {
  const rows = await query<IDeletedResult>(
    `EXEC spTasksDelete @pkIdTask = @pkIdTask`,
    { pkIdTask: id },
    adminId,
  );
  return rows[0];
};

export const restoreTask = async (
  id: number,
  adminId: number,
): Promise<IRestoredResult> => {
  const rows = await query<IRestoredResult>(
    `EXEC spTasksRestore @pkIdTask = @pkIdTask`,
    { pkIdTask: id },
    adminId,
  );
  return rows[0];
};

export const hardDeleteTask = async (
  id: number,
  adminId: number,
): Promise<IDeletedResult> => {
  const rows = await query<IDeletedResult>(
    `EXEC spTasksHardDelete @pkIdTask = @pkIdTask`,
    { pkIdTask: id },
    adminId,
  );
  return rows[0];
};
