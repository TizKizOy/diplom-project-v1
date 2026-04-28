import { query } from 'src/common/db/dbConfig';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { IUser } from '../interfaces/user.interface';
import { IDeletedResult } from '../../common/interfaces/delete.interfaces';
import { IRestoredResult } from '../../common/interfaces/restore.interface';
import { hashingPassword } from 'src/common/hash/crypto';

export const getUsers = async (filter: {
  id?: number;
  login?: string;
  roleId?: number;
  isDeleted?: boolean;
}): Promise<IUser[]> => {
  return await query<IUser>(
    `EXEC prGetUsersWithRolesAndPositions
    @pkIdUser = @id,
    @login = @login,
    @roleId = @roleId,
    @isDeleted = @isDeleted`,
    {
      id: filter.id ?? null,
      login: filter.login ?? null,
      roleId: filter.roleId ?? null,
      isDeleted: filter.isDeleted ?? 0,
    },
  );
};

export const getDeletedUsers = async (): Promise<IUser[]> => {
  return await getUsers({ isDeleted: true });
};

export const createUser = async (
  dto: CreateUserDto,
  adminId: number,
): Promise<IUser> => {
  const hash = await hashingPassword(dto.password);

  const result = await query<IUser>(
    `EXEC spUsersCreate
      @fullName = @fullName,
      @login = @login,
      @phone = @phone,
      @email = @email,
      @passwordHash = @passwordHash,
      @fkIdRole = @fkIdRole,
      @fkIdPosition = @fkIdPosition`,
    {
      fullName: dto.fullName,
      login: dto.login,
      phone: dto.phone,
      email: dto.email,
      passwordHash: hash,
      fkIdRole: dto.roleId,
      fkIdPosition: dto.positionId ?? null,
    },
    adminId,
  );

  return result[0];
};

export const updateUser = async (
  id: number,
  dto: UpdateUserDto,
  adminId: number,
): Promise<IUser> => {
  let passwordHash: string | null = null;
  if (dto.password) {
    passwordHash = await hashingPassword(dto.password);
  }

  const result = await query<IUser>(
    `EXEC spUsersUpdate
    @pkIdUser = @pkIdUser,
    @fullName = @fullName,
    @login = @login,
    @phone = @phone,
    @email = @email,
    @passwordHash = @passwordHash,
    @fkIdRole = @fkIdRole,
    @fkIdPosition = @fkIdPosition`,
    {
      pkIdUser: id,
      fullName: dto.fullName ?? null,
      login: dto.login ?? null,
      phone: dto.phone ?? null,
      email: dto.email ?? null,
      passwordHash: passwordHash ?? null,
      fkIdRole: dto.roleId ?? null,
      fkIdPosition: dto.positionId ?? null,
    },
    adminId,
  );

  return result[0];
};

export const deleteUser = async (
  id: number,
  adminId: number,
): Promise<IDeletedResult> => {
  const result = await query<IDeletedResult>(
    `EXEC spUsersDelete @pkIdUser = @pkIdUser`,
    { pkIdUser: id },
    adminId,
  );
  return result[0];
};

export const restoreUser = async (
  id: number,
  adminId: number,
): Promise<IRestoredResult> => {
  const result = await query<IRestoredResult>(
    `EXEC spUsersRestore @pkIdUser = @pkIdUser`,
    { pkIdUser: id },
    adminId,
  );
  return result[0];
};

export const hardDeleteUser = async (
  id: number,
  adminId: number,
): Promise<IDeletedResult> => {
  const result = await query<IDeletedResult>(
    `EXEC spUsersHardDelete @pkIdUser = @pkIdUser`,
    { pkIdUser: id },
    adminId,
  );
  return result[0];
};
