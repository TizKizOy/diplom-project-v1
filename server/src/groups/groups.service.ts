import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import * as db from './db/groups.db';
import {
  IGroup,
  IDeletedGroupResult,
  IRestoredGroupResult,
} from './interfaces/groups.interfaces';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

@Injectable()
export class GroupsService {
  async getGroups(filter: {
    id?: number;
    courseId?: number;
  }): Promise<IGroup[]> {
    const groups = await db.getGroups(filter);
    if (!groups || groups.length === 0) {
      throw new NotFoundException('Группы не найдены');
    }
    return groups;
  }

  async getAll(): Promise<IGroup[]> {
    return await this.getGroups({});
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
      if (e.code === '23505') {
        throw new ConflictException('Группа с таким названием уже существует');
      }
      if (e.code === '23503') {
        if (e.message?.includes('fkIdCourse')) {
          throw new BadRequestException('Указанный курс не существует');
        }
        if (e.message?.includes('fkIdCurator')) {
          throw new BadRequestException('Указанный куратор не существует');
        }
      }
      if (e.code === 'P0001' || e.message?.includes('уже существует')) {
        throw new ConflictException(e.message);
      }
      if (
        e.message?.includes('не найден') ||
        e.message?.includes('удалён') ||
        e.message?.includes('не является преподавателем')
      ) {
        throw new BadRequestException(e.message);
      }
      throw new BadRequestException(e.message || 'Ошибка создания группы');
    }
  }

  async update(
    id: number,
    dto: UpdateGroupDto,
    adminId: number,
  ): Promise<IGroup> {
    try {
      await this.getById(id);
      return await db.updateGroup(id, dto, adminId);
    } catch (e: any) {
      if (e instanceof NotFoundException) throw e;

      if (e.code === '23505') {
        throw new ConflictException('Группа с таким названием уже существует');
      }
      if (e.code === '23503') {
        throw new BadRequestException(
          'Указанный курс или куратор не существует',
        );
      }
      if (e.code === 'P0001' || e.message?.includes('уже существует')) {
        throw new ConflictException(e.message);
      }
      if (
        e.message?.includes('не найден') ||
        e.message?.includes('удалён') ||
        e.message?.includes('не является преподавателем')
      ) {
        throw new BadRequestException(e.message);
      }
      throw new BadRequestException(e.message || 'Ошибка обновления группы');
    }
  }

  async remove(id: number, adminId: number): Promise<IDeletedGroupResult> {
    try {
      const result = await db.deleteGroup(id, adminId);
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

  async restore(id: number, adminId: number): Promise<IRestoredGroupResult> {
    try {
      return await db.restoreGroup(id, adminId);
    } catch (e: any) {
      if (
        e.message?.includes('не найдена') ||
        e.message?.includes('не была удалена')
      ) {
        throw new NotFoundException(e.message);
      }
      if (e.message?.includes('курс удалён')) {
        throw new BadRequestException(
          'Невозможно восстановить: курс удалён. Сначала восстановите курс.',
        );
      }
      throw new BadRequestException(e.message);
    }
  }

  async hardDelete(id: number, adminId: number): Promise<IDeletedGroupResult> {
    try {
      return await db.hardDeleteGroup(id, adminId);
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
