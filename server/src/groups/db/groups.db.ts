import { query } from 'src/common/db/dbConfig';
import { CreateGroupDto } from '../dto/create-group.dto';
import { UpdateGroupDto } from '../dto/update-group.dto';
import { IGroup } from '../interfaces/groups.interfaces';
import { IDeletedResult } from '../../common/interfaces/delete.interfaces';
import { IRestoredResult } from '../../common/interfaces/restore.interface';

export const getGroups = async (filter: {
  id?: number;
  courseId?: number;
  curatorId?: number;
  groupName?: string;
  isDeleted?: boolean;
}): Promise<IGroup[]> => {
  return await query<IGroup>(
    `EXEC prGetGroupsWithCuratorsAndCourses
      @pkIdGroup = @pkIdGroup,
      @fkIdCourse = @fkIdCourse,
      @fkIdCurator = @fkIdCurator,
      @groupName = @groupName,
      @isDeleted = @isDeleted`,
    {
      pkIdGroup: filter.id ?? null,
      fkIdCourse: filter.courseId ?? null,
      fkIdCurator: filter.curatorId ?? null,
      groupName: filter.groupName ?? null,
      isDeleted: filter.isDeleted ?? 0,
    },
  );
};

export const getDeletedGroups = async (): Promise<IGroup[]> => {
  return await getGroups({ isDeleted: true });
};

export const createGroup = async (
  dto: CreateGroupDto,
  userId: number,
): Promise<IGroup> => {
  const result = await query<IGroup>(
    `EXEC spGroupsCreate
      @name = @name,
      @fkIdCourse = @fkIdCourse,
      @fkIdCurator = @fkIdCurator`,
    {
      name: dto.name,
      fkIdCourse: dto.courseId,
      fkIdCurator: dto.curatorId ?? null,
    },
    userId,
  );

  return result[0];
};

export const updateGroup = async (
  id: number,
  dto: UpdateGroupDto,
  userId: number,
): Promise<IGroup> => {
  const result = await query<IGroup>(
    `EXEC spGroupsUpdate
      @pkIdGroup = @pkIdGroup,
      @name = @name,
      @fkIdCourse = @fkIdCourse,
      @fkIdCurator = @fkIdCurator`,
    {
      pkIdGroup: id,
      name: dto.name ?? null,
      fkIdCourse: dto.courseId ?? null,
      fkIdCurator: dto.curatorId ?? null,
    },
    userId,
  );

  return result[0];
};

export const deleteGroup = async (
  id: number,
  userId: number,
): Promise<IDeletedResult> => {
  const result = await query<IDeletedResult>(
    `EXEC spGroupsDelete @pkIdGroup = @pkIdGroup`,
    { pkIdGroup: id },
    userId,
  );
  return result[0];
};

export const restoreGroup = async (
  id: number,
  userId: number,
): Promise<IRestoredResult> => {
  const result = await query<IRestoredResult>(
    `EXEC spGroupsRestore @pkIdGroup = @pkIdGroup`,
    { pkIdGroup: id },
    userId,
  );
  return result[0];
};

export const hardDeleteGroup = async (
  id: number,
  userId: number,
): Promise<IDeletedResult> => {
  const result = await query<IDeletedResult>(
    `EXEC spGroupsHardDelete @pkIdGroup = @pkIdGroup`,
    { pkIdGroup: id },
    userId,
  );
  return result[0];
};
