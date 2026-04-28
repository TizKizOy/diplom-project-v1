import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import * as db from './db/group-listeners.db';
import { IGroupListener } from './interfaces/group-listener.interface';
import { IDeletedResult } from '../common/interfaces/delete.interfaces';
import { IRestoredResult } from '../common/interfaces/restore.interface';
import { CreateGroupListenerDto } from './dto/create-group-listener.dto';

@Injectable()
export class GroupListenersService {
  async getGroupListeners(filter: {
    id?: number;
    groupId?: number;
    listenerId?: number;
    isDeleted?: boolean;
  }): Promise<IGroupListener[]> {
    const listeners = await db.getGroupListeners(filter);
    return listeners || [];
  }

  async getAll(): Promise<any[]> {
    const result = await db.getGroupListeners({});
    return result || [];
  }

  async getById(id: number): Promise<IGroupListener> {
    const listeners = await db.getGroupListeners({ id });
    const listener = listeners[0];
    if (!listener) {
      throw new NotFoundException(`Запись с id=${id} не найдена`);
    }
    return listener;
  }

  async getByGroup(groupId: number): Promise<IGroupListener[]> {
    return await this.getGroupListeners({ groupId });
  }

  async getByListener(listenerId: number): Promise<IGroupListener[]> {
    return await this.getGroupListeners({ listenerId });
  }

  async getDeleted(): Promise<IGroupListener[]> {
    const listeners = await db.getDeletedGroupListeners();
    if (!listeners || listeners.length === 0) {
      throw new NotFoundException('Удалённые записи не найдены');
    }
    return listeners;
  }

  async create(
    dto: CreateGroupListenerDto,
    adminId: number,
  ): Promise<IGroupListener> {
    try {
      return await db.createGroupListener(dto, adminId);
    } catch (e: any) {
       if (e.message && e.message.includes('уже добавлен')) {
        throw new ConflictException(e.message);
      }
      throw new BadRequestException(e.message || 'Ошибка создания записи слушателей');
    }
  }

  async remove(id: number, adminId: number): Promise<IDeletedResult> {
    try {
      const result = await db.deleteGroupListener(id, adminId);
      if (result.deletedId === 0) {
        throw new NotFoundException(result.message);
      }
      return result;
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }

  async restore(id: number, adminId: number): Promise<IRestoredResult> {
    try {
      return await db.restoreGroupListener(id, adminId);
    } catch (e: any) {
     throw new BadRequestException(e.message);
    }
  }

  async hardDelete(id: number, adminId: number): Promise<IDeletedResult> {
    try {
      return await db.hardDeleteGroupListener(id, adminId);
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }
}
