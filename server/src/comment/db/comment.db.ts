import { query } from 'src/common/db/dbConfig';
import { UpdateCommentDto } from '../dto/update-comment.dto';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { IComment } from '../interfaces/comment.interface';
import { IDeletedResult } from '../../common/interfaces/delete.interfaces';
import { IRestoredResult } from '../../common/interfaces/restore.interface';

export const getComments = async (filter: {
  id?: number;
  attemptId?: number;
  userId?: number;
  taskId?: number;
  isDeleted?: boolean;
}): Promise<IComment[]> => {
  return await query<IComment>(
    `EXEC prGetCommentsWithAttempts
    @pkIdComment = @pkIdComment,
    @fkIdAttempt = @fkIdAttempt,
    @fkIdUser = @fkIdUser,
    @fkIdTask = @fkIdTask,
    @isDeleted = @isDeleted`,
    {
      pkIdComment: filter.id ?? null,
      fkIdAttempt: filter.attemptId ?? null,
      fkIdUser: filter.userId ?? null,
      fkIdTask: filter.taskId ?? null,
      isDeleted: filter.isDeleted ?? 0,
    },
  );
};

export const getDeletedComments = async (): Promise<IComment[]> => {
  return await getComments({ isDeleted: true });
};

export const createComment = async (
  dto: CreateCommentDto,
  adminId: number,
): Promise<IComment> => {
  const result = await query<IComment>(
    `EXEC spCommentsCreate
      @fkIdTask = @fkIdTask,
      @fkIdAttempt = @fkIdAttempt,
      @fkIdUser = @fkIdUser,
      @message = @message`,
    {
      fkIdTask: dto.fkIdTask ?? null,
      fkIdAttempt: dto.fkIdAttempt ?? null,
      fkIdUser: dto.fkIdUser,
      message: dto.message,
    },
    adminId,
  );

  return result[0];
};

export const updateComment = async (
  id: number,
  dto: UpdateCommentDto,
  adminId: number,
): Promise<IComment> => {
  const result = await query<IComment>(
    `EXEC spCommentsUpdate
      @pkIdComment = @pkIdComment,
      @fkIdTask = @fkIdTask,
      @fkIdAttempt = @fkIdAttempt,
      @fkIdUser = @fkIdUser,
      @message = @message`,
    {
      pkIdComment: id,
      fkIdTask: dto.fkIdTask ?? null,
      fkIdAttempt: dto.fkIdAttempt ?? null,
      fkIdUser: dto.fkIdUser ?? null,
      message: dto.message ?? null,
    },
    adminId,
  );

  return result[0];
};

export const deleteComment = async (
  id: number,
  adminId: number,
): Promise<IDeletedResult> => {
  const result = await query<IDeletedResult>(
    `EXEC spCommentsDelete @pkIdComment = @pkIdComment`,
    { pkIdComment: id },
    adminId,
  );
  return result[0];
};

export const restoreComment = async (
  id: number,
  adminId: number,
): Promise<IRestoredResult> => {
  const result = await query<IRestoredResult>(
    `EXEC spCommentsRestore @pkIdComment = @pkIdComment`,
    { pkIdComment: id },
    adminId,
  );
  return result[0];
};

export const hardDeleteComment = async (
  id: number,
  adminId: number,
): Promise<IDeletedResult> => {
  const result = await query<IDeletedResult>(
    `EXEC spCommentsHardDelete @pkIdComment = @pkIdComment`,
    { pkIdComment: id },
    adminId,
  );
  return result[0];
};
