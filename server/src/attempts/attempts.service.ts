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
import { CertificatesService } from '../certificates/certificates.service';
import { TasksService } from '../tasks/tasks.service';
import { NotificationsService } from '../notifications/notifications.service';

const ATTEMPT_PENDING = 1;
const ATTEMPT_ACCEPTED = 2;
const ATTEMPT_REJECTED = 3;
const ATTEMPT_REVISION = 4;

@Injectable()
export class AttemptsService {
  constructor(
    private readonly certificatesService: CertificatesService,
    private readonly tasksService: TasksService,
    private readonly notificationsService: NotificationsService,
  ) {}
  async getAttempts(filter: {
    id?: number;
    taskId?: number;
    listenerId?: number;
    statusId?: number;
    courseId?: number;
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

  async getByCourse(courseId: number): Promise<IAttempt[]> {
    return await this.getAttempts({ courseId });
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
    const existing = await this.getById(id);
    if (dto.score !== undefined && dto.score !== null) {
      const sc = Number(dto.score);
      if (!Number.isInteger(sc) || sc < 0) {
        throw new BadRequestException('Балл должен быть целым числом не меньше 0');
      }
      const taskId = existing.fkIdTask;
      if (taskId != null) {
        const task = await this.tasksService.getById(taskId);
        const max = task.maxScore;
        if (typeof max === 'number' && Number.isFinite(max) && sc > max) {
          throw new BadRequestException(
            `Балл не может быть больше максимума задания (${max})`,
          );
        }
      }
    }
    try {
      const updated = await db.updateAttempt(id, dto, adminId);

      if (dto.statusId === ATTEMPT_REVISION) {
        const listenerId = updated.fkIdListener;
        if (listenerId != null) {
          const maxScore = await this.getTaskMaxScore(updated.fkIdTask);
          await this.notifyAttemptStatus(
            listenerId,
            updated.taskTitle,
            dto.statusId,
            dto.score,
            maxScore,
          );
        }
        return updated;
      }

      if (dto.statusId === ATTEMPT_ACCEPTED && updated.fkIdListener != null) {
        let courseId = updated.fkIdCourse ?? null;
        if (courseId == null && updated.fkIdTask != null) {
          try {
            const task = await this.tasksService.getById(updated.fkIdTask);
            courseId = task.fkIdCourse ?? null;
          } catch {
            courseId = null;
          }
        }
        if (courseId != null) {
          await this.certificatesService.tryAutoIssueIfCourseCompleted(
            updated.fkIdListener,
            courseId,
            adminId,
          );
        }
      }
      return updated;
    } catch (e: any) {
      throw new BadRequestException(e.message || 'Ошибка обновления попытки сдачи');
    }
  }

  private async getTaskMaxScore(taskId?: number | null): Promise<number | null> {
    if (taskId == null) return null;
    try {
      const task = await this.tasksService.getById(taskId);
      const max = task.maxScore;
      return typeof max === 'number' && Number.isFinite(max) ? max : null;
    } catch {
      return null;
    }
  }

  async resubmit(
    id: number,
    dto: Pick<CreateAttemptDto, 'answerText' | 'answerFileUrl'>,
    listenerId: number,
  ): Promise<IAttempt> {
    const existing = await this.getById(id);
    if (existing.fkIdListener !== listenerId) {
      throw new BadRequestException('Нельзя изменять чужую попытку');
    }
    if (existing.fkIdTask == null) {
      throw new BadRequestException('Попытка не привязана к заданию');
    }
    const rows = await db.getAttempts({ id });
    const row = rows[0];
    const statusName = row?.statusName ?? '';
    if (statusName !== 'На доработке') {
      throw new BadRequestException(
        'Повторная отправка доступна только для работ со статусом «На доработке»',
      );
    }
    const text = dto.answerText?.trim();
    const file = dto.answerFileUrl?.trim();
    if (!text && !file) {
      throw new BadRequestException('Укажите текст ответа и/или ссылку на файл');
    }
    return await db.updateAttempt(
      id,
      {
        answerText: text,
        answerFileUrl: file,
        statusId: ATTEMPT_PENDING,
      },
      listenerId,
    );
  }

  private async notifyAttemptStatus(
    listenerId: number,
    taskTitle: string,
    statusId: number,
    score?: number | null,
    maxScore?: number | null,
  ): Promise<void> {
    let message: string;
    if (statusId === ATTEMPT_ACCEPTED) {
      const scoreStr =
        score !== undefined && score !== null ? String(score) : '—';
      const maxStr =
        maxScore !== undefined && maxScore !== null ? String(maxScore) : '—';
      message = `Ваша работа «${taskTitle}» принята. Балл: ${scoreStr} из ${maxStr}.`;
    } else if (statusId === ATTEMPT_REVISION) {
      const scorePart =
        score !== undefined && score !== null
          ? ` Текущий балл: ${score}.`
          : '';
      message = `Работа «${taskTitle}» отправлена на доработку.${scorePart} Доработайте задание и отправьте ответ снова.`;
    } else {
      message = `Работа «${taskTitle}» обновлена.`;
    }
    try {
      await this.notificationsService.create({
        userId: listenerId,
        message,
      });
    } catch (e: unknown) {
      console.error('[notifyAttemptStatus]', e);
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
