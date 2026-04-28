import { query } from 'src/common/db/dbConfig';
import { RegisterDto } from '../dto/register.dto';
import { IUser } from 'src/users/interfaces/user.interface';
import { hashingPassword } from 'src/common/hash/crypto';
import { getUsers } from 'src/users/db/users.db';

export const findUserByLogin = async (login: string): Promise<IUser> => {
  const rows = await getUsers({ login: login });
  return rows[0];
};

export const createUserFromAuth = async (dto: RegisterDto): Promise<IUser> => {
  const hash = await hashingPassword(dto.password);
  // const consoleHash = await hashingPassword('listener2');
  // console.log(consoleHash);
  // const consoleHash2 = await hashingPassword('listener3');
  // console.log(consoleHash2);
  // const consoleHash3 = await hashingPassword('ivanov');
  // console.log(consoleHash3);
  // const consoleHash4 = await hashingPassword('petrov');
  // console.log(consoleHash3);

  const rows = await query<IUser>(
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
      fkIdRole: 3,
      fkIdPosition: dto.positionId,
    },
  );
  return rows[0];
};
