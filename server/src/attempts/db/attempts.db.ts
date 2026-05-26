import { query } from 'src/common/db/dbConfig';
import { CreateAttemptDto } from '../dto/create-attempt.dto';
import { UpdateAttemptDto } from '../dto/update-attempt.dto';
import { IAttempt } from '../interfaces/attempts.interfaces';
import { IDeletedResult } from '../../common/interfaces/delete.interfaces';
import { IRestoredResult } from '../../common/interfaces/restore.interface';

export const getAttempts = async (filter: {
  id?: number;
  taskId?: number;
  listenerId?: number;
  statusId?: number;
  courseId?: number;
  isDeleted?: boolean;
}): Promise<IAttempt[]> => {
  return await query<IAttempt>(
    `exec prGetAttemptsWithUsersAndStatus
    @pkIdAttempt = @pkIdAttempt,
    @fkIdTask = @fkIdTask,
    @fkIdListener = @fkIdListener,
    @fkIdStatusAttempt = @fkIdStatusAttempt,
    @isDeleted = @isDeleted,
    @fkIdCourse = @fkIdCourse`,
    {
      pkIdAttempt: filter.id ?? null,
      fkIdTask: filter.taskId ?? null,
      fkIdListener: filter.listenerId ?? null,
      fkIdStatusAttempt: filter.statusId ?? null,
      isDeleted: filter.isDeleted ?? 0,
      fkIdCourse: filter.courseId ?? null,
    },
  );
};

export const getDeletedAttempts = async (): Promise<IAttempt[]> => {
  return await getAttempts({ isDeleted: true });
};

export const createAttempt = async (
  dto: CreateAttemptDto,
  adminId: number,
): Promise<IAttempt> => {
  const rows = await query<IAttempt>(
    `exec spAttemptsCreate 
    @fkIdTask = @fkIdTask,
    @fkIdListener = @fkIdListener,
    @fkIdStatusAttempt = @fkIdStatusAttempt,
    @answerText = @answerText,
    @answerFileUrl = @answerFileUrl`,
    {
      fkIdTask: dto.taskId,
      fkIdListener: dto.listenerId,
      fkIdStatusAttempt: dto.statusId,
      answerText: dto.answerText,
      answerFileUrl: dto.answerFileUrl,
    },
    adminId,
  );
  return rows[0];
};

export const updateAttempt = async (
  id: number,
  dto: UpdateAttemptDto,
  adminId: number,
): Promise<IAttempt> => {
  const rows = await query<IAttempt>(
    `exec spAttemptsUpdate 
    @pkIdAttempt = @pkIdAttempt,
    @fkIdStatusAttempt = @fkIdStatusAttempt,
    @answerText = @answerText,
    @answerFileUrl = @answerFileUrl,
    @score = @score`,
    {
      pkIdAttempt: id,
      fkIdStatusAttempt: dto.statusId ?? null,
      answerText: dto.answerText ?? null,
      answerFileUrl: dto.answerFileUrl ?? null,
      score: dto.score ?? null,
    },
    adminId,
  );
  return rows[0];
};

export const deleteAttempt = async (
  id: number,
  adminId: number,
): Promise<IDeletedResult> => {
  const rows = await query<IDeletedResult>(
    `EXEC spAttemptsDelete @pkIdAttempt = @pkIdAttempt`,
    { pkIdAttempt: id },
    adminId,
  );
  return rows[0];
};

export const restoreAttempt = async (
  id: number,
  adminId: number,
): Promise<IRestoredResult> => {
  const rows = await query<IRestoredResult>(
    `EXEC spAttemptsRestore @pkIdAttempt = @pkIdAttempt`,
    { pkIdAttempt: id },
    adminId,
  );
  return rows[0];
};

export const hardDeleteAttempt = async (
  id: number,
  adminId: number,
): Promise<IDeletedResult> => {
  const rows = await query<IDeletedResult>(
    `EXEC spAttemptsHardDelete @pkIdAttempt = @pkIdAttempt`,
    { pkIdAttempt: id },
    adminId,
  );
  return rows[0];
};
