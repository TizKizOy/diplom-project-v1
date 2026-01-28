import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as db from './db/tasks.db';
import {
  ITask,
  IDeletedTaskResult,
  IRestoredTaskResult,
} from './interfaces/tasks.interface';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  async getTasks(filter: {
    id?: number;
    courseId?: number;
    typeId?: number;
  }): Promise<ITask[]> {
    const tasks = await db.getTasks(filter);
    if (!tasks || tasks.length === 0) {
      throw new NotFoundException('Задания не найдены');
    }
    return tasks;
  }

  async getAll(): Promise<ITask[]> {
    return await this.getTasks({});
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

  async getByType(typeId: number): Promise<ITask[]> {
    return await this.getTasks({ typeId });
  }

  async getByCourseAndType(courseId: number, typeId: number): Promise<ITask[]> {
    return await this.getTasks({ courseId, typeId });
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
      if (e.message?.includes('уже существует')) {
        throw new BadRequestException(e.message);
      }
      if (e.message?.includes('не найден') || e.message?.includes('удалён')) {
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
    try {
      await this.getById(id);
      return await db.updateTask(id, dto, adminId);
    } catch (e: any) {
      if (e instanceof NotFoundException) throw e;
      if (e.message?.includes('уже существует')) {
        throw new BadRequestException(e.message);
      }
      if (e.message?.includes('не найден') || e.message?.includes('удалён')) {
        throw new BadRequestException(e.message);
      }
      throw new BadRequestException(e.message || 'Ошибка обновления задания');
    }
  }

  async remove(id: number, adminId: number): Promise<IDeletedTaskResult> {
    try {
      const result = await db.deleteTask(id, adminId);
      if (result.deleted_id === 0) {
        throw new NotFoundException(result.message);
      }
      return result;
    } catch (e: any) {
      if (e instanceof NotFoundException) throw e;
      throw new BadRequestException(e.message);
    }
  }

  async restore(id: number, adminId: number): Promise<IRestoredTaskResult> {
    try {
      return await db.restoreTask(id, adminId);
    } catch (e: any) {
      if (e.message?.includes('курс удалён')) {
        throw new BadRequestException(
          'Невозможно восстановить: курс удалён. Сначала восстановите курс.',
        );
      }
      throw new BadRequestException(e.message);
    }
  }

  async hardDelete(id: number, adminId: number): Promise<IDeletedTaskResult> {
    try {
      return await db.hardDeleteTask(id, adminId);
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }
}
