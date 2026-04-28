import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import * as db from './db/groups.db';
import { IGroup } from './interfaces/groups.interfaces';
import { IDeletedResult } from '../common/interfaces/delete.interfaces';
import { IRestoredResult } from '../common/interfaces/restore.interface';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

@Injectable()
export class GroupsService {
  async getGroups(filter: {
    id?: number;
    courseId?: number;
    curatorId?: number;
    groupName?: string;
    isDeleted?: boolean;
  }): Promise<IGroup[]> {
    const groups = await db.getGroups(filter);
    return groups || [];
  }

  async getAll(): Promise<any[]> {
    const result = await db.getGroups({});
    return result || [];
  }

  async getById(id: number): Promise<IGroup> {
    const groups = await db.getGroups({ id });
    const group = groups[0];
    if (!group) {
      throw new NotFoundException(`Группа с id=${id} не найдена`);
    }
    return group;
  }

  async getByCourse(courseId: number): Promise<IGroup[]> {
    return await this.getGroups({ courseId });
  }

  async getDeleted(): Promise<IGroup[]> {
    const groups = await db.getDeletedGroups();
    if (!groups || groups.length === 0) {
      throw new NotFoundException('Удалённые группы не найдены');
    }
    return groups;
  }

  async create(dto: CreateGroupDto, adminId: number): Promise<IGroup> {
    try {
      return await db.createGroup(dto, adminId);
    } catch (e: any) {
      if (e.message && e.message.includes('уже существует')) {
        throw new ConflictException(e.message);
      }
      throw new BadRequestException(e.message || 'Ошибка создания группы');
    }
  }

  async update(
    id: number,
    dto: UpdateGroupDto,
    adminId: number,
  ): Promise<IGroup> {
    await this.getById(id);
    try {
      return await db.updateGroup(id, dto, adminId);
    } catch (e: any) {
      if (e.message && e.message.includes('уже существует')) {
        throw new ConflictException(e.message);
      }
      throw new BadRequestException(e.message || 'Ошибка создания группы');
    }
  }

  async remove(id: number, adminId: number): Promise<IDeletedResult> {
    try {
      const result = await db.deleteGroup(id, adminId);
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
      return await db.restoreGroup(id, adminId);
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }

  async hardDelete(id: number, adminId: number): Promise<IDeletedResult> {
    try {
      return await db.hardDeleteGroup(id, adminId);
    } catch (e: any) {
     throw new BadRequestException(e.message);
    }
  }
}
