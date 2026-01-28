import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import * as db from './db/courses.db';
import {
  ICourse,
  IDeletedCourseResult,
  IRestoredCourseResult,
} from './interfaces/courses.interfaces';
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
      if (e.code === '23505') {
        throw new ConflictException('Курс с таким названием уже существует');
      }
      if (e.code === 'P0001' || e.message?.includes('уже существует')) {
        throw new ConflictException(e.message);
      }
      if (
        e.message?.includes('не найден') ||
        e.message?.includes('не существует')
      ) {
        throw new BadRequestException(e.message);
      }
      throw new BadRequestException(e.message || 'Ошибка создания курса');
    }
  }

  async update(
    id: number,
    dto: UpdateCourseDto,
    adminId: number,
  ): Promise<ICourse> {
    try {
      await this.getById(id);
      return await db.updateCourse(id, dto, adminId);
    } catch (e: any) {
      if (e instanceof NotFoundException) throw e;

      if (e.code === '23505') {
        throw new ConflictException('Курс с таким названием уже существует');
      }
      if (e.code === 'P0001' || e.message?.includes('уже существует')) {
        throw new ConflictException(e.message);
      }
      if (e.message?.includes('не найден') || e.message?.includes('удалён')) {
        throw new BadRequestException(e.message);
      }
      throw new BadRequestException(e.message || 'Ошибка обновления курса');
    }
  }

  async remove(id: number, adminId: number): Promise<IDeletedCourseResult> {
    try {
      const result = await db.deleteCourse(id, adminId);
      if (result.deleted_id === 0) {
        throw new NotFoundException(result.message);
      }
      return result;
    } catch (e: any) {
      if (e instanceof NotFoundException) throw e;
      if (
        e.message?.includes('не найден') ||
        e.message?.includes('уже удалён')
      ) {
        throw new NotFoundException(e.message);
      }
      throw new BadRequestException(e.message);
    }
  }

  async restore(id: number, adminId: number): Promise<IRestoredCourseResult> {
    try {
      return await db.restoreCourse(id, adminId);
    } catch (e: any) {
      if (
        e.message?.includes('не найден') ||
        e.message?.includes('не был удалён')
      ) {
        throw new NotFoundException(e.message);
      }
      if (
        e.message?.includes('связанные данные') ||
        e.message?.includes('зависимости')
      ) {
        throw new BadRequestException(e.message);
      }
      throw new BadRequestException(e.message);
    }
  }

  async hardDelete(id: number, adminId: number): Promise<IDeletedCourseResult> {
    try {
      return await db.hardDeleteCourse(id, adminId);
    } catch (e: any) {
      if (e.message?.includes('необходимо сначала пометить как удалённый')) {
        throw new BadRequestException(e.message);
      }
      if (e.message?.includes('не найден')) {
        throw new NotFoundException(e.message);
      }
      throw new BadRequestException(e.message);
    }
  }
}
