import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as db from './db/course-teachers.db';
import { ICourseTeacher } from './interfaces/course-teachers.interface';
import { IDeletedResult } from '../common/interfaces/delete.interfaces';
import { IRestoredResult } from '../common/interfaces/restore.interface';
import { CreateCourseTeacherDto } from './dto/create-course-teacher.dto';
import { UpdateCourseTeacherDto } from './dto/update-course-teacher.dto';

@Injectable()
export class CourseTeachersService {
  async getCourseTeachers(filter: {
    id?: number;
    courseId?: number;
    teacherId?: number;
    isDeleted?: boolean;
  }): Promise<ICourseTeacher[]> {
    const courseTeachers = await db.getCourseTeachers(filter);
    return courseTeachers || [];
  }

  async getAll(): Promise<any[]> {
    const result = await db.getCourseTeachers({});
    return result || [];
  }

  async getById(id: number): Promise<ICourseTeacher> {
    const courseTeachers = await db.getCourseTeachers({ id });
    const courseTeacher = courseTeachers[0];
    if (!courseTeacher) {
      throw new NotFoundException(
        `Запись о преподавателе курса с id=${id} не найдена`,
      );
    }
    return courseTeacher;
  }

  async getByCourse(courseId: number): Promise<ICourseTeacher[]> {
    return await this.getCourseTeachers({ courseId });
  }

  async getByTeacher(teacherId: number): Promise<ICourseTeacher[]> {
    return await this.getCourseTeachers({ teacherId });
  }

  async getDeleted(): Promise<ICourseTeacher[]> {
    const courseTeacher = await db.getDeletedCourseTeachers();
    if (!courseTeacher || courseTeacher.length === 0) {
      throw new NotFoundException('Удалённые записи не найдены');
    }
    return courseTeacher;
  }

  async create(
    dto: CreateCourseTeacherDto,
    adminId: number,
  ): Promise<ICourseTeacher> {
    try {
      return await db.createCourseTeacher(dto, adminId);
    } catch (e: any) {
      throw new BadRequestException(
        e.message || 'Ошибка создания записи о преподавателе курса',
      );
    }
  }

  async remove(id: number, adminId: number): Promise<IDeletedResult> {
    try {
      const result = await db.deleteCourseTeacher(id, adminId);
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
      return await db.restoreCourseTeacher(id, adminId);
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }

  async hardDelete(id: number, adminId: number): Promise<IDeletedResult> {
    try {
      return await db.hardDeleteCourseTeacher(id, adminId);
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }
}
