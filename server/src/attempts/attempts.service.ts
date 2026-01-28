import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import * as db from './db/attempts.db';
import {
  IAttempt,
  IDeletedAttemptResult,
  IRestoredAttemptResult,
} from './interfaces/attempts.interfaces';
import { CreateAttemptDto } from './dto/create-attempt.dto';
import { UpdateAttemptDto } from './dto/update-attempt.dto';
import { GradeAttemptDto } from './dto/grade-attempt.dto';

@Injectable()
export class AttemptsService {
  async getAttempts(filter: {
    id?: number;
    taskId?: number;
    listenerId?: number;
    statusId?: number;
  }): Promise<IAttempt[]> {
    const attempts = await db.getAttempts(filter);
    if (!attempts || attempts.length === 0) {
      throw new NotFoundException('Попытки не найдены');
    }
    return attempts;
  }

  async getAll(): Promise<IAttempt[]> {
    return await this.getAttempts({});
  }

  async getById(id: number): Promise<IAttempt> {
    const attempts = await db.getAttempts({ id });
    const attempt = attempts[0];
    if (!attempt) {
      throw new NotFoundException(`Попытка с id=${id} не найдена`);
    }
    return attempt;
  }

  async getByTask(taskId: number): Promise<IAttempt[]> {
    return await this.getAttempts({ taskId });
  }

  async getByListener(listenerId: number): Promise<IAttempt[]> {
    return await this.getAttempts({ listenerId });
  }

  async getByStatus(statusId: number): Promise<IAttempt[]> {
    return await this.getAttempts({ statusId });
  }

  async getDeleted(): Promise<IAttempt[]> {
    const attempts = await db.getDeletedAttempts();
    if (!attempts || attempts.length === 0) {
      throw new NotFoundException('Удалённые попытки не найдены');
    }
    return attempts;
  }

  async create(dto: CreateAttemptDto, adminId: number): Promise<IAttempt> {
    try {
      return await db.createAttempt(dto, adminId);
    } catch (e: any) {
      if (
        e.code === 'P0001' ||
        e.message?.includes('активная попытка') ||
        e.message?.includes('Нельзя создать')
      ) {
        throw new ConflictException(e.message);
      }
      if (e.code === '23503') {
        if (e.message?.includes('fkIdTask')) {
          throw new BadRequestException('Задание не найдено');
        }
        if (e.message?.includes('fkIdListener')) {
          throw new BadRequestException('Слушатель не найден');
        }
      }
      if (
        e.message?.includes('не найден') ||
        e.message?.includes('удалён') ||
        e.message?.includes('не является')
      ) {
        throw new BadRequestException(e.message);
      }
      throw new BadRequestException(e.message || 'Ошибка создания попытки');
    }
  }

  async update(
    id: number,
    dto: UpdateAttemptDto,
    adminId: number,
  ): Promise<IAttempt> {
    try {
      await this.getById(id);
      return await db.updateAttempt(id, dto, adminId);
    } catch (e: any) {
      if (e instanceof NotFoundException) throw e;

      if (e.code === '23503') {
        if (e.message?.includes('fkIdTask')) {
          throw new BadRequestException('Задание не найдено');
        }
        if (e.message?.includes('fkIdListener')) {
          throw new BadRequestException('Слушатель не найден');
        }
      }
      if (
        e.message?.includes('не найден') ||
        e.message?.includes('удалён') ||
        e.message?.includes('не является')
      ) {
        throw new BadRequestException(e.message);
      }
      throw new BadRequestException(e.message || 'Ошибка обновления попытки');
    }
  }

  async grade(
    id: number,
    dto: GradeAttemptDto,
    adminId: number,
  ): Promise<IAttempt> {
    try {
      await this.getById(id);
      return await db.gradeAttempt(id, dto, adminId);
    } catch (e: any) {
      if (e instanceof NotFoundException) throw e;

      if (e.message?.includes('не найдена') || e.message?.includes('удалена')) {
        throw new NotFoundException(e.message);
      }
      throw new BadRequestException(e.message || 'Ошибка оценки попытки');
    }
  }

  async remove(id: number, adminId: number): Promise<IDeletedAttemptResult> {
    try {
      const result = await db.deleteAttempt(id, adminId);
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

  async restore(id: number, adminId: number): Promise<IRestoredAttemptResult> {
    try {
      return await db.restoreAttempt(id, adminId);
    } catch (e: any) {
      if (
        e.message?.includes('не найдена') ||
        e.message?.includes('не была удалена')
      ) {
        throw new NotFoundException(e.message);
      }
      if (
        e.message?.includes('задание удалено') ||
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
  ): Promise<IDeletedAttemptResult> {
    try {
      return await db.hardDeleteAttempt(id, adminId);
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
