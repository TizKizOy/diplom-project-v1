import {
  Injectable,
  NotFoundException,
  BadRequestException,
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
  async getAll(): Promise<ICourse[]> {
    const courses = await db.getAllCourses();
    if (!courses || courses.length === 0) {
      throw new NotFoundException('Курсы не найдены');
    }
    return courses;
  }

  async getById(id: number): Promise<ICourse> {
    const course = await db.getCourse(id);
    if (!course) {
      throw new NotFoundException(`Курс с id=${id} не найден`);
    }
    return course;
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
      if (e.message?.includes('уже существует')) {
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
      return await db.updateCourse(id, dto, adminId);
    } catch (e: any) {
      if (e instanceof NotFoundException) throw e;
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
      throw new BadRequestException(e.message);
    }
  }

  async restore(id: number, adminId: number): Promise<IRestoredCourseResult> {
    try {
      return await db.restoreCourse(id, adminId);
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }

  async hardDelete(id: number, adminId: number): Promise<IDeletedCourseResult> {
    try {
      return await db.hardDeleteCourse(id, adminId);
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }
}
