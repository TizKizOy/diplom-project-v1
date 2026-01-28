import { query } from 'src/common/db/dbConfig';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import {
  IUser,
  IDeletedUserResult,
  IRestoredUserResult,
} from '../interfaces/user.interface';
import { hashingPassword } from 'src/common/hash/crypto';

export const getUsers = async (filter: {
  id?: number;
  roleId?: number;
  email?: string;
  login?: string;
}): Promise<IUser[]> => {
  return await query('SELECT * FROM f_users_get($1, $2, $3, $4)', [
    filter.id ?? null,
    filter.roleId ?? null,
    filter.email ?? null,
    filter.login ?? null,
  ]);
};

export const getDeletedUsers = async (id?: number): Promise<IUser[]> => {
  return await query('SELECT * FROM f_users_get_deleted($1)', [id ?? null]);
};

export const createUser = async (
  dto: CreateUserDto,
  adminId: number,
): Promise<IUser> => {
  const hash = await hashingPassword(dto.password);
  const rows = await query(
    'SELECT * FROM f_users_create($1,$2,$3,$4,$5,$6)',
    [dto.fullName, dto.login, dto.phone, dto.email, hash, dto.roleId],
    adminId,
  );
  return rows[0];
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

  const rows = await query(
    'SELECT * FROM f_users_update($1,$2,$3,$4,$5,$6,$7)',
    [
      id,
      dto.fullName ?? null,
      dto.login ?? null,
      dto.phone ?? null,
      dto.email ?? null,
      passwordHash,
      dto.roleId ?? null,
    ],
    adminId,
  );
  return rows[0];
};

export const deleteUser = async (
  id: number,
  adminId: number,
): Promise<IDeletedUserResult> => {
  const rows = await query('SELECT * FROM f_users_delete($1)', [id], adminId);
  return rows[0];
};

export const restoreUser = async (
  id: number,
  adminId: number,
): Promise<IRestoredUserResult> => {
  const rows = await query('SELECT * FROM f_users_restore($1)', [id], adminId);
  return rows[0];
};

export const hardDeleteUser = async (
  id: number,
  adminId: number,
): Promise<IDeletedUserResult> => {
  const rows = await query(
    'SELECT * FROM f_users_hard_delete($1)',
    [id],
    adminId,
  );
  return rows[0];
};
