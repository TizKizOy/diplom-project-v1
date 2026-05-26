import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as db from './db/tasks.db';
import * as coursesDb from '../courses/db/courses.db';
import { ITask } from './interfaces/tasks.interface';
import { IDeletedResult } from '../common/interfaces/delete.interfaces';
import { IRestoredResult } from '../common/interfaces/restore.interface';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

function assertDeadlineInFuture(deadline?: string | null) {
  if (deadline == null || deadline === '') return;
  const t = new Date(deadline).getTime();
  if (Number.isNaN(t)) {
    throw new BadRequestException('Некорректная дата дедлайна');
  }
  if (t <= Date.now()) {
    throw new BadRequestException('Дедлайн задания должен быть в будущем');
  }
}

/** Сравнение по минуте UTC — datetime-local vs ISO из БД. */
function deadlineMinuteKey(d: Date | string | null | undefined): number | null {
  if (d == null) return null;
  const t = new Date(d as string).getTime();
  if (Number.isNaN(t)) return null;
  return Math.floor(t / 60_000);
}

function assertDeadlineChangeValid(
  existingDeadline: Date | string | null | undefined,
  incoming?: string | null,
) {
  if (incoming === undefined) return;
  if (incoming === null || String(incoming).trim() === '') return;
  const prev = deadlineMinuteKey(existingDeadline ?? null);
  const next = deadlineMinuteKey(incoming);
  if (prev != null && next != null && prev === next) return;
  assertDeadlineInFuture(incoming);
}

function assertTaskMaxScore(maxScore?: number | null) {
  if (maxScore === undefined || maxScore === null) return;
  if (!Number.isInteger(maxScore) || maxScore < 0 || maxScore > 10000) {
    throw new BadRequestException(
      'Максимальный балл задания — целое число от 0 до 10000',
    );
  }
}

async function loadCourseDates(courseId: number) {
  const courses = await coursesDb.getCourses({ id: courseId });
  return courses[0];
}

function assertDeadlineWithinCourse(
  course: { startDate?: Date | string; endDate?: Date | string } | undefined,
  deadline?: Date | string | null,
) {
  if (deadline == null || deadline === '' || !course) return;
  const d = new Date(deadline as string | Date).getTime();
  if (Number.isNaN(d)) {
    throw new BadRequestException('Некорректная дата дедлайна');
  }
  if (course.startDate) {
    const s = new Date(course.startDate as string).getTime();
    if (!Number.isNaN(s) && d < s) {
      throw new BadRequestException(
        'Дедлайн задания не может быть раньше даты начала курса',
      );
    }
  }
  if (course.endDate) {
    const end = new Date(course.endDate as string);
    end.setHours(23, 59, 59, 999);
    if (d > end.getTime()) {
      throw new BadRequestException(
        'Дедлайн задания не может быть позже даты окончания курса',
      );
    }
  }
}

@Injectable()
export class TasksService {
  async getTasks(filter: {
    id?: number;
    typeTaskId?: number;
    courseId?: number;
    lessonId?: number;
    taskTitle?: string;
    isDeleted?: boolean;
  }): Promise<ITask[]> {
    const tasks = await db.getTasks(filter);
    return tasks || [];
  }

  async getAll(): Promise<any[]> {
    const result = await db.getTasks({});
    return result || [];
  }

  async getById(id: number): Promise<ITask> {
    const tasks = await db.getTasks({ id });
    const task = tasks[0];
    if (!task) {
      throw new NotFoundException(`Задание с id=${id} не найдено`);
    }
    return task;
  }

  async getByCourse(courseId: number): Promise<ITask[]> {
    return await this.getTasks({ courseId });
  }

  async getByType(typeTaskId: number): Promise<ITask[]> {
    return await this.getTasks({ typeTaskId });
  }

  async getByCourseAndType(
    courseId: number,
    typeTaskId: number,
  ): Promise<ITask[]> {
    return await this.getTasks({ courseId, typeTaskId });
  }

  async getDeleted(): Promise<ITask[]> {
    const tasks = await db.getDeletedTasks();
    if (!tasks || tasks.length === 0) {
      throw new NotFoundException('Удалённые задания не найдены');
    }
    return tasks;
  }

  async create(dto: CreateTaskDto, adminId: number): Promise<ITask> {
    assertDeadlineInFuture(dto.deadline);
    assertTaskMaxScore(dto.maxScore);
    const course = await loadCourseDates(dto.courseId);
    assertDeadlineWithinCourse(course, dto.deadline);
    try {
      return await db.createTask(dto, adminId);
    } catch (e: any) {
      if (e.message && e.message.includes('уже существует')) {
        throw new BadRequestException(e.message);
      }
      throw new BadRequestException(e.message || 'Ошибка создания задания');
    }
  }

  async update(
    id: number,
    dto: UpdateTaskDto,
    adminId: number,
  ): Promise<ITask> {
    const existing = await this.getById(id);
    assertDeadlineChangeValid(existing.deadline, dto.deadline);
    assertTaskMaxScore(dto.maxScore);
    const courseId =
      dto.courseId ??
      (existing as ITask & { fkIdCourse?: number }).fkIdCourse;
    if (courseId) {
      const course = await loadCourseDates(Number(courseId));
      assertDeadlineWithinCourse(course, dto.deadline ?? existing.deadline);
    }
    try {
      return await db.updateTask(id, dto, adminId);
    } catch (e: any) {
      if (e.message && e.message.includes('уже существует')) {
        throw new BadRequestException(e.message);
      }
      throw new BadRequestException(e.message || 'Ошибка создания задания');
    }
  }

  async remove(id: number, adminId: number): Promise<IDeletedResult> {
    try {
      const result = await db.deleteTask(id, adminId);
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
      return await db.restoreTask(id, adminId);
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }

  async hardDelete(id: number, adminId: number): Promise<IDeletedResult> {
    try {
      return await db.hardDeleteTask(id, adminId);
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }
}
