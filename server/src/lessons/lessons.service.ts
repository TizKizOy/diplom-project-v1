import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import * as db from './db/lessons.db';
import { ILesson } from './interfaces/lessons.interfaces';
import { IDeletedResult } from '../common/interfaces/delete.interfaces';
import { IRestoredResult } from '../common/interfaces/restore.interface';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';

@Injectable()
export class LessonsService {
  async getLessons(filter: {
    id?: number;
    courseId?: number;
    title?: string;
    isPublished?: boolean;
  }): Promise<ILesson[]> {
    const lessons = await db.getLessons(filter);
    return lessons || [];
  }

  async getAll(): Promise<any[]> {
    const result = await db.getLessons({});
    return result || [];
  }

  async getById(id: number): Promise<ILesson> {
    const lessons = await db.getLessons({ id });
    const lesson = lessons[0];
    if (!lesson) {
      throw new NotFoundException(`Урок с id=${id} не найден`);
    }
    return lesson;
  }

  async getByCourse(courseId: number): Promise<ILesson[]> {
    return await this.getLessons({ courseId });
  }

  async getDeleted(): Promise<ILesson[]> {
    const lessons = await db.getDeletedLessons();
    if (!lessons || lessons.length === 0) {
      throw new NotFoundException('Удалённые уроки не найдены');
    }
    return lessons;
  }

  async create(dto: CreateLessonDto, adminId: number): Promise<ILesson> {
    try {
      return await db.createLesson(dto, adminId);
    } catch (e: any) {
     if (e.message && e.message.includes('уже существует')) {
        throw new ConflictException(e.message);
      }
      throw new BadRequestException(e.message || 'Ошибка создания урока');
    }
  }

  async update(
    id: number,
    dto: UpdateLessonDto,
    adminId: number,
  ): Promise<ILesson> {
    await this.getById(id);
    try {
      return await db.updateLesson(id, dto, adminId);
    } catch (e: any) {
      if (e.message && e.message.includes('уже существует')) {
        throw new ConflictException(e.message);
      }
      throw new BadRequestException(e.message || 'Ошибка создания урока');
    }
  }

  async remove(id: number, adminId: number): Promise<IDeletedResult> {
    try {
      const result = await db.deleteLesson(id, adminId);
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
      return await db.restoreLesson(id, adminId);
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }

  async hardDelete(id: number, adminId: number): Promise<IDeletedResult> {
    try {
      return await db.hardDeleteLesson(id, adminId);
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }
}
