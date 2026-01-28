import { query } from 'src/common/db/dbConfig';
import { RegisterDto } from '../dto/register.dto';
import { IUser } from 'src/users/interfaces/user.interface';
import { hashingPassword } from 'src/common/hash/crypto';

export const findUserByLogin = async (login: string): Promise<IUser | null> => {
  const rows = await query('SELECT * FROM f_users_get(NULL, NULL, NULL, $1)', [
    login,
  ]);
  return rows[0] || null;
};

export const createUserFromAuth = async (dto: RegisterDto): Promise<IUser> => {
  const hash = await hashingPassword(dto.password);
  const rows = await query(
    'SELECT * FROM f_users_create($1, $2, $3, $4, $5, $6)',
    [dto.fullName, dto.login, dto.phone, dto.email, hash, 3],
  );
  return rows[0];
};
