import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import * as db from './db/group-listeners.db';
import {
  IGroupListener,
  IDeletedGroupListenerResult,
  IRestoredGroupListenerResult,
} from './interfaces/group-listener.interface';
import { CreateGroupListenerDto } from './dto/create-group-listener.dto';
import { UpdateGroupListenerDto } from './dto/update-group-listener.dto';

@Injectable()
export class GroupListenersService {
  async getGroupListeners(filter: {
    groupId?: number;
    listenerId?: number;
  }): Promise<IGroupListener[]> {
    const listeners = await db.getGroupListeners(filter);
    if (!listeners || listeners.length === 0) {
      throw new NotFoundException('Записи слушателей в группах не найдены');
    }
    return listeners;
  }

  async getAll(): Promise<IGroupListener[]> {
    return await this.getGroupListeners({});
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

  async getDeleted(filter?: {
    groupId?: number;
    listenerId?: number;
  }): Promise<IGroupListener[]> {
    const listeners = await db.getDeletedGroupListeners(filter);
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
      if (
        e.code === 'P0001' ||
        e.message?.includes('уже состоит в этой группе')
      ) {
        throw new ConflictException(e.message);
      }
      if (e.code === '23503') {
        if (e.message?.includes('fkIdGroup')) {
          throw new BadRequestException('Группа не найдена');
        }
        if (e.message?.includes('fkIdListener')) {
          throw new BadRequestException('Слушатель не найден');
        }
      }
      if (
        e.message?.includes('не найдена') ||
        e.message?.includes('удалена') ||
        e.message?.includes('не является слушателем')
      ) {
        throw new BadRequestException(e.message);
      }
      throw new BadRequestException(
        e.message || 'Ошибка добавления слушателя в группу',
      );
    }
  }

  async update(
    id: number,
    dto: UpdateGroupListenerDto,
    adminId: number,
  ): Promise<IGroupListener> {
    try {
      return await db.updateGroupListener(id, dto, adminId);
    } catch (e: any) {
      if (e.code === 'P0001' || e.message?.includes('уже состоит')) {
        throw new ConflictException(e.message);
      }
      if (e.code === '23503') {
        throw new BadRequestException('Группа или слушатель не найдены');
      }
      if (
        e.message?.includes('не найдена') ||
        e.message?.includes('удалена') ||
        e.message?.includes('не является')
      ) {
        throw new BadRequestException(e.message);
      }
      throw new BadRequestException(e.message || 'Ошибка обновления записи');
    }
  }

  async remove(
    id: number,
    adminId: number,
  ): Promise<IDeletedGroupListenerResult> {
    try {
      const result = await db.deleteGroupListener(id, adminId);
      if (result.deleted_id === 0) {
        throw new NotFoundException(result.message);
      }
      return result;
    } catch (e: any) {
      if (e instanceof NotFoundException) throw e;

      if (
        e.message?.includes('не найдена') ||
        e.message?.includes('уже удалена')
      ) {
        throw new NotFoundException(e.message);
      }
      throw new BadRequestException(e.message);
    }
  }

  async restore(
    id: number,
    adminId: number,
  ): Promise<IRestoredGroupListenerResult> {
    try {
      return await db.restoreGroupListener(id, adminId);
    } catch (e: any) {
      if (
        e.message?.includes('не найдена') ||
        e.message?.includes('не была удалена')
      ) {
        throw new NotFoundException(e.message);
      }
      if (
        e.message?.includes('группа удалена') ||
        e.message?.includes('слушатель удалён')
      ) {
        throw new BadRequestException(e.message);
      }
      throw new BadRequestException(e.message);
    }
  }

  async hardDelete(
    id: number,
    adminId: number,
  ): Promise<IDeletedGroupListenerResult> {
    try {
      return await db.hardDeleteGroupListener(id, adminId);
    } catch (e: any) {
      if (e.message?.includes('необходимо сначала пометить как удалённую')) {
        throw new BadRequestException(e.message);
      }
      if (e.message?.includes('не найдена')) {
        throw new NotFoundException(e.message);
      }
      throw new BadRequestException(e.message);
    }
  }
}
