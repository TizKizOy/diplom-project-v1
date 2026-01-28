import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as db from './db/users.db';
import {
  IUser,
  IDeletedUserResult,
  IRestoredUserResult,
} from './interfaces/user.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  async getAll(): Promise<IUser[]> {
    const users = await db.getAllUsers();
    if (!users || users.length === 0) {
      throw new NotFoundException('Пользователи не найдены');
    }
    return users;
  }

  async getById(id: number): Promise<IUser> {
    const user = await db.getUser({ id });
    if (!user) {
      throw new NotFoundException(`Пользователь с id=${id} не найден`);
    }
    return user;
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
      if (e.message?.includes('уже занят')) {
        throw new ConflictException(e.message);
      }
      if (e.code === '23505') {
        const field = e.constraint?.match(/tbUsers_(.+)_key/)?.[1] || 'поле';
        throw new ConflictException(`${field} уже существует`);
      }
      throw new BadRequestException(
        e.message || 'Ошибка создания пользователя',
      );
    }
  }

  async update(
    id: number,
    dto: UpdateUserDto,
    adminId: number,
  ): Promise<IUser> {
    try {
      await this.getById(id);
      return await db.updateUser(id, dto, adminId);
    } catch (e: any) {
      if (e instanceof NotFoundException) throw e;
      if (e.message?.includes('уже занят')) {
        throw new ConflictException(e.message);
      }
      throw new BadRequestException(
        e.message || 'Ошибка обновления пользователя',
      );
    }
  }

  async remove(id: number, adminId: number): Promise<IDeletedUserResult> {
    try {
      const result = await db.deleteUser(id, adminId);
      if (result.deleted_id === 0) {
        throw new NotFoundException(result.message);
      }
      return result;
    } catch (e: any) {
      if (e instanceof NotFoundException) throw e;
      throw new BadRequestException(e.message);
    }
  }

  async restore(id: number, adminId: number): Promise<IRestoredUserResult> {
    try {
      return await db.restoreUser(id, adminId);
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }

  async hardDelete(id: number, adminId: number): Promise<IDeletedUserResult> {
    try {
      return await db.hardDeleteUser(id, adminId);
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }
}
