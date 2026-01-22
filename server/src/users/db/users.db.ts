import { query } from 'src/common/db/dbConfig';
import { CreateUserDto } from '../dto/create-user.dto';
import { IUser } from '../interfaces/user.interface';
import { UpdateUserDto } from '../dto/update-user.dto';
import { hashingPassword } from 'src/common/hash/crypto';

export const getAllUsers = async (userId?: number): Promise<IUser[]> => {
  return (await query('SELECT * FROM f_users_get()', [], userId)) as IUser[];
};

export const getUser = async (
  filter: {
    id?: number;
    roleId?: string;
    email?: string;
    login?: string;
  },
  userId?: number,
): Promise<IUser> => {
  const rows = await query(
    'SELECT * FROM f_users_get($1,$2,$3,$4) LIMIT 1',
    [
      filter.id ?? null,
      filter.roleId ?? null,
      filter.email ?? null,
      filter.login ?? null,
    ],
    userId,
  );
  return rows[0];
};

export const createUser = async (
  dto: CreateUserDto,
  adminId?: number,
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
  user: UpdateUserDto,
  adminId?: number,
): Promise<IUser> => {
  const rows = await query(
    'SELECT * FROM f_users_update($1,$2,$3,$4,$5,$6,$7)',
    [
      id,
      user.fullName,
      user.login,
      user.phone,
      user.email,
      user.passwordHash,
      user.roleId,
    ],
    adminId,
  );
  return rows[0];
};

export const deleteUser = async (
  id: number,
  adminId?: number,
): Promise<{ deleted_id: number; message: string }> => {
  const rows = (await query(
    'SELECT * FROM f_users_delete($1)',
    [id],
    adminId,
  )) as {
    deleted_id: number;
    message: string;
  }[];
  return rows[0];
};
