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

const userListSelect = `
SELECT DISTINCT u.pkIdUser, u.fullName, u.login, u.email, u.phone, u.passwordHash, u.regData,
  r.name AS roleName, p.name AS positionName
FROM tbUsers u
LEFT JOIN tbRoles r ON u.fkIdRole = r.pkIdRole
LEFT JOIN tbPositions p ON u.fkIdPosition = p.pkIdPosition
`;

/** Контакты для личных сообщений: админ — все; преподаватель/слушатель — по курсам и группам. */
export const getMessagingContacts = async (
  userId: number,
  roleName: string,
): Promise<IUser[]> => {
  if (roleName === 'Администратор') {
    return await query<IUser>(
      `${userListSelect}
       WHERE u.isDeleted = 0 AND u.pkIdUser <> @userId`,
      { userId },
    );
  }

  if (roleName === 'Преподаватель') {
    return await query<IUser>(
      `${userListSelect}
       WHERE u.isDeleted = 0 AND u.pkIdUser <> @userId
         AND (
           u.fkIdRole = 1
           OR u.pkIdUser IN (
             SELECT gl.fkIdListener
             FROM tbGroup g
             INNER JOIN tbGroupListener gl ON gl.fkIdGroup = g.pkIdGroup AND gl.isDeleted = 0
             WHERE g.fkIdCurator = @userId AND g.isDeleted = 0
           )
           OR u.pkIdUser IN (
             SELECT DISTINCT gl2.fkIdListener
             FROM tbCourseTeacher ct
             INNER JOIN tbGroup g2 ON g2.fkIdCourse = ct.fkIdCourse AND g2.isDeleted = 0
             INNER JOIN tbGroupListener gl2 ON gl2.fkIdGroup = g2.pkIdGroup AND gl2.isDeleted = 0
             WHERE ct.fkIdTeacher = @userId AND ct.isDeleted = 0
           )
           OR u.pkIdUser IN (
             SELECT DISTINCT ct2.fkIdTeacher
             FROM tbCourseTeacher ct1
             INNER JOIN tbCourseTeacher ct2
               ON ct2.fkIdCourse = ct1.fkIdCourse AND ct2.isDeleted = 0 AND ct2.fkIdTeacher <> @userId
             WHERE ct1.fkIdTeacher = @userId AND ct1.isDeleted = 0
           )
         )`,
      { userId },
    );
  }

  if (roleName === 'Слушатель') {
    return await query<IUser>(
      `${userListSelect}
       WHERE u.isDeleted = 0 AND u.pkIdUser <> @userId
         AND (
           u.fkIdRole = 1
           OR u.pkIdUser IN (
             SELECT g.fkIdCurator
             FROM tbGroupListener gl
             INNER JOIN tbGroup g ON g.pkIdGroup = gl.fkIdGroup AND g.isDeleted = 0
             WHERE gl.fkIdListener = @userId AND gl.isDeleted = 0 AND g.fkIdCurator IS NOT NULL
           )
           OR u.pkIdUser IN (
             SELECT ct.fkIdTeacher
             FROM tbGroupListener gl
             INNER JOIN tbGroup g ON g.pkIdGroup = gl.fkIdGroup AND g.isDeleted = 0
             INNER JOIN tbCourseTeacher ct ON ct.fkIdCourse = g.fkIdCourse AND ct.isDeleted = 0
             WHERE gl.fkIdListener = @userId AND gl.isDeleted = 0
           )
         )`,
      { userId },
    );
  }

  return [];
};
