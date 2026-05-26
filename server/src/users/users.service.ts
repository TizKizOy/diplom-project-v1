import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as db from './db/users.db';
import { IUser } from './interfaces/user.interface';
import { IDeletedResult } from '../common/interfaces/delete.interfaces';
import { IRestoredResult } from '../common/interfaces/restore.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  async getUsers(filter: {
    id?: number;
    roleId?: number;
    login?: string;
    isDeleted?: boolean;
  }): Promise<IUser[]> {
    const users = await db.getUsers(filter);
    if (!users || users.length === 0) {
      throw new NotFoundException('Пользователи не найдены');
    }
    return users;
  }

  async getAll(): Promise<IUser[]> {
    return await this.getUsers({});
  }

  async getMessagingContacts(userId: number, roleName: string): Promise<IUser[]> {
    const rows = await db.getMessagingContacts(userId, roleName);
    return rows || [];
  }

  async getById(id: number): Promise<IUser> {
    const users = await db.getUsers({ id });
    const user = users[0];
    if (!user) {
      throw new NotFoundException(`Пользователь с id=${id} не найден`);
    }
    return user;
  }

  async getByRole(roleId: number): Promise<IUser[]> {
    return await this.getUsers({ roleId });
  }

  async findByLogin(login: string): Promise<IUser> {
    const users = await db.getUsers({ login });
    return users[0];
  }

  async getDeleted(): Promise<IUser[]> {
    const users = await db.getDeletedUsers();
    if (!users || users.length === 0) {
      throw new NotFoundException('Удалённые пользователи не найдены');
    }
    return users;
  }

  async create(dto: CreateUserDto, adminId: number): Promise<IUser> {
    try {
      return await db.createUser(dto, adminId);
    } catch (e: any) {
      if (e.message && e.message.includes('уже занят')) {
        throw new ConflictException(e.message);
      }
      throw new BadRequestException(e.message || 'Ошибка создания пользователя');
    }
  }

  async update(
    id: number,
    dto: UpdateUserDto,
    adminId: number,
  ): Promise<IUser> {
    await this.getById(id);
    try {
      return await db.updateUser(id, dto, adminId);
    } catch (e: any) {
      if (e.message && e.message.includes('уже занят')) {
        throw new ConflictException(e.message);
      }
      throw new BadRequestException(e.message || 'Ошибка обновления пользователя');
    }
  }

  async remove(id: number, adminId: number): Promise<IDeletedResult> {
    try {
      const result = await db.deleteUser(id, adminId);
      if (!result.deletedId) {
        throw new NotFoundException(result.message);
      }
      return result;
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }

  async restore(id: number, adminId: number): Promise<IRestoredResult> {
    try {
      return await db.restoreUser(id, adminId);
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }

  async hardDelete(id: number, adminId: number): Promise<IDeletedResult> {
    try {
      return await db.hardDeleteUser(id, adminId);
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }
}
