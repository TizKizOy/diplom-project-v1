import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import * as db from './db/attempts.db';
import { IAttempt } from './interfaces/attempts.interfaces';
import { IDeletedResult } from '../common/interfaces/delete.interfaces';
import { IRestoredResult } from '../common/interfaces/restore.interface';
import { CreateAttemptDto } from './dto/create-attempt.dto';
import { UpdateAttemptDto } from './dto/update-attempt.dto';

@Injectable()
export class AttemptsService {
  async getAttempts(filter: {
    id?: number;
    taskId?: number;
    listenerId?: number;
    statusId?: number;
    isDeleted?: boolean;
  }): Promise<IAttempt[]> {
    const attempts = await db.getAttempts(filter);
    return attempts || [];
  }

  async getAll(): Promise<IAttempt[]> {
    const attempts = await db.getAttempts({});
    return attempts || [];
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
      if (e.message && e.message.includes('уже есть активная попытка')) {
        throw new ConflictException(e.message);
      }
      throw new BadRequestException(e.message || 'Ошибка создания попытки сдачи');
    }
  }

  async update(
    id: number,
    dto: UpdateAttemptDto,
    adminId: number,
  ): Promise<IAttempt> {
    await this.getById(id);
    try {
      return await db.updateAttempt(id, dto, adminId);
    } catch (e: any) {
      throw new BadRequestException(e.message || 'Ошибка обновления попытки сдачи');
    }
  }

  async remove(id: number, adminId: number): Promise<IDeletedResult> {
    try {
      const result = await db.deleteAttempt(id, adminId);
      if (result.deletedId === 0) {
        throw new NotFoundException(result.message);
      }
      return result;
    } catch (e: any) {
     throw new BadRequestException(e.message || 'Ошибка обновления попытки сдачи');
    }
  }

  async restore(id: number, adminId: number): Promise<IRestoredResult> {
    try {
      return await db.restoreAttempt(id, adminId);
    } catch (e: any) {
      throw new BadRequestException(e.message || 'Ошибка обновления попытки сдачи');
    }
  }

  async hardDelete(id: number, adminId: number): Promise<IDeletedResult> {
    try {
      return await db.hardDeleteAttempt(id, adminId);
    } catch (e: any) {
      throw new BadRequestException(e.message || 'Ошибка обновления попытки сдачи');
    }
  }
}
