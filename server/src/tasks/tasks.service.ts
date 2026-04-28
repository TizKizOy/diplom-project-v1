import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as db from './db/tasks.db';
import { ITask } from './interfaces/tasks.interface';
import { IDeletedResult } from '../common/interfaces/delete.interfaces';
import { IRestoredResult } from '../common/interfaces/restore.interface';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

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
    await this.getById(id);
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
