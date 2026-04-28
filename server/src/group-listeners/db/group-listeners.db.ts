import { query } from 'src/common/db/dbConfig';
import { CreateGroupListenerDto } from '../dto/create-group-listener.dto';
import { IDeletedResult } from '../../common/interfaces/delete.interfaces';
import { IRestoredResult } from '../../common/interfaces/restore.interface';
import { IGroupListener } from '../interfaces/group-listener.interface';

export const getGroupListeners = async (filter: {
  id?: number;
  groupId?: number;
  listenerId?: number;
  isDeleted?: boolean;
}): Promise<IGroupListener[]> => {
  return await query<IGroupListener>(
    `EXEC prGetGroupListenersWithUserInfo
      @pkIdGroupListener = @pkIdGroupListener,
      @fkIdGroup = @fkIdGroup,
      @fkIdListener = @fkIdListener,
      @isDeleted = @isDeleted`,
    {
      pkIdGroupListener: filter.id ?? null,
      fkIdGroup: filter.groupId ?? null,
      fkIdListener: filter.listenerId ?? null,
      isDeleted: filter.isDeleted ?? 0,
    },
  );
};

export const getDeletedGroupListeners = async (): Promise<IGroupListener[]> => {
  return await getGroupListeners({ isDeleted: true });
};

export const createGroupListener = async (
  dto: CreateGroupListenerDto,
  adminId: number,
): Promise<IGroupListener> => {
  const result = await query<IGroupListener>(
    `EXEC spGroupListenersCreate
      @fkIdGroup = @fkIdGroup,
      @fkIdListener = @fkIdListener`,
    {
      fkIdGroup: dto.groupId,
      fkIdListener: dto.listenerId,
    },
    adminId,
  );

  return result[0];
};

export const deleteGroupListener = async (
  id: number,
  adminId: number,
): Promise<IDeletedResult> => {
  const result = await query<IDeletedResult>(
    `EXEC spGroupListenersDelete @pkIdGroupListener = @pkIdGroupListener`,
    { pkIdGroupListener: id },
    adminId,
  );
  return result[0];
};

export const restoreGroupListener = async (
  id: number,
  adminId: number,
): Promise<IRestoredResult> => {
  const result = await query<IRestoredResult>(
    `EXEC spGroupListenersRestore @pkIdGroupListener = @pkIdGroupListener`,
    { pkIdGroupListener: id },
    adminId,
  );
  return result[0];
};

export const hardDeleteGroupListener = async (
  id: number,
  adminId: number,
): Promise<IDeletedResult> => {
  const result = await query<IDeletedResult>(
    `EXEC spGroupListenersHardDelete @pkIdGroupListener = @pkIdGroupListener`,
    { pkIdGroupListener: id },
    adminId,
  );
  return result[0];
};
