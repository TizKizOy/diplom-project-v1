import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import * as db from './db/users.db';
import { IUser } from './interfaces/user.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  async getAll(userId?: number): Promise<IUser[]> {
    const users = await db.getAllUsers(userId);
    if (!users || users.length === 0)
      throw new NotFoundException('Сервер не получил данные с бд');
    return users;
  }

  async getById(id: number, userId?: number): Promise<IUser> {
    const findUser = await db.getUser({ id: id }, userId);
    if (!findUser)
      throw new NotFoundException(`Сервер не получил пользователя с id=${id}`);
    return findUser;
  }

  async create(dto: CreateUserDto, adminId?: number): Promise<IUser> {
    try {
      return await db.createUser(dto, adminId);
    } catch (e: any) {
      if (e.code === '23505') {
        const field = e.constraint?.replace(/^tbusers_+|_key$/g, '');
        throw new ConflictException(`Поле ${field} уже существует`);
      }
      throw e;
    }
  }

  async update(
    id: number,
    dto: UpdateUserDto,
    adminId?: number,
  ): Promise<IUser> {
    try {
      return await db.updateUser(id, dto, adminId);
    } catch (e: any) {
      throw new ConflictException(e.message);
    }
  }

  async remove(
    id: number,
    adminId?: number,
  ): Promise<{ deleted_id: number; message: string }> {
    const res = await db.deleteUser(id, adminId);
    if (res.deleted_id === 0) {
      throw new NotFoundException(res.message);
    }
    return res;
  }
}
