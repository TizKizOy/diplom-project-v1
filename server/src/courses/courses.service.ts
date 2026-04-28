import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as db from './db/courses.db';
import { ICourse } from './interfaces/courses.interfaces';
import { IDeletedResult } from '../common/interfaces/delete.interfaces';
import { IRestoredResult } from '../common/interfaces/restore.interface';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Injectable()
export class CoursesService {
  async getCourses(filter: {
    id?: number;
    statusId?: number;
  }): Promise<ICourse[]> {
    const courses = await db.getCourses(filter);
    if (!courses || courses.length === 0) {
      throw new NotFoundException('Курсы не найдены');
    }
    return courses;
  }

  async getAll(): Promise<ICourse[]> {
    return await this.getCourses({});
  }

  async getById(id: number): Promise<ICourse> {
    const courses = await db.getCourses({ id });
    const course = courses[0];
    if (!course) {
      throw new NotFoundException(`Курс с id=${id} не найден`);
    }
    return course;
  }

  async getByStatus(statusId: number): Promise<ICourse[]> {
    return await this.getCourses({ statusId });
  }

  async getDeleted(): Promise<ICourse[]> {
    const courses = await db.getDeletedCourses();
    if (!courses || courses.length === 0) {
      throw new NotFoundException('Удалённые курсы не найдены');
    }
    return courses;
  }

  async create(dto: CreateCourseDto, adminId: number): Promise<ICourse> {
    try {
      return await db.createCourse(dto, adminId);
    } catch (e: any) {
      if (e.message && e.message.includes('уже существует')) {
        throw new ConflictException(e.message);
      }
      throw new BadRequestException(e.message || 'Ошибка создания курса');
    }
  }

  async update(
    id: number,
    dto: UpdateCourseDto,
    adminId: number,
  ): Promise<ICourse> {
    await this.getById(id);
    try {
      return await db.updateCourse(id, dto, adminId);
    } catch (e: any) {
      if (e.message && e.message.includes('уже существует')) {
        throw new ConflictException(e.message);
      }
      throw new BadRequestException(e.message || 'Ошибка обновления курса');
    }
  }

  async remove(id: number, adminId: number): Promise<IDeletedResult> {
    try {
      const result = await db.deleteCourse(id, adminId);
      if (!result.deletedId) {
        throw new NotFoundException(result.message);
      }
      return result;
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }

  async restore(id: number, adminId: number): Promise<IRestoredResult> {
    try {
      return await db.restoreCourse(id, adminId);
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }

  async hardDelete(id: number, adminId: number): Promise<IDeletedResult> {
    try {
      return await db.hardDeleteCourse(id, adminId);
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }
}