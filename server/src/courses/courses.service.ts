import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as db from './db/courses.db';
import type { ICourseTagRow } from './db/courses.db';
import { ICourse } from './interfaces/courses.interfaces';
import { IDeletedResult } from '../common/interfaces/delete.interfaces';
import { IRestoredResult } from '../common/interfaces/restore.interface';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

const PUBLISHED_STATUS_ID = 2;

function startOfTodayMs() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function assertCourseStartEndOrder(
  start: Date | string | undefined | null,
  end: Date | string | undefined | null,
) {
  if (start == null || end == null || start === '' || end === '') return;
  const s = new Date(start as string).getTime();
  const e = new Date(end as string).getTime();
  if (Number.isNaN(s) || Number.isNaN(e)) return;
  if (e < s) {
    throw new BadRequestException(
      'Дата окончания курса не может быть раньше даты начала',
    );
  }
}

function assertCourseStartNotInPast(start: Date | string | undefined | null) {
  if (start == null || start === '') return;
  const s = new Date(start as string).getTime();
  if (Number.isNaN(s)) return;
  if (s < startOfTodayMs()) {
    throw new BadRequestException(
      'Дата начала курса не может быть в прошлом',
    );
  }
}

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

  async getTagsCatalog(): Promise<ICourseTagRow[]> {
    return await db.getAllTags();
  }

  async getById(id: number): Promise<ICourse> {
    const courses = await db.getCourses({ id });
    const course = courses[0];
    if (!course) {
      throw new NotFoundException(`Курс с id=${id} не найден`);
    }
    const tagIds = await db.getCourseTagIds(id);
    return { ...course, tagIds };
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
      const { tagIds, ...rest } = dto;
      assertCourseStartEndOrder(rest.startDate, rest.endDate);
      assertCourseStartNotInPast(rest.startDate);
      if (Number(rest.statusId) === PUBLISHED_STATUS_ID) {
        throw new BadRequestException(
          'Нельзя опубликовать курс при создании: сначала добавьте урок с заданием',
        );
      }
      const created = await db.createCourse(rest, adminId);
      if (tagIds !== undefined && tagIds.length > 0) {
        await db.replaceCourseTags(created.pkIdCourse, tagIds, adminId);
      }
      return await this.getById(created.pkIdCourse);
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
    const current = await this.getById(id);
    try {
      const { tagIds, ...rest } = dto;
      const start = dto.startDate ?? current.startDate;
      const end = dto.endDate ?? current.endDate;
      assertCourseStartEndOrder(start, end);
      assertCourseStartNotInPast(start);
      const nextStatus = dto.statusId ?? current.fkIdStatus;
      if (Number(nextStatus) === PUBLISHED_STATUS_ID) {
        const ok = await db.courseHasLessonWithTask(id);
        if (!ok) {
          throw new BadRequestException(
            'Опубликовать курс можно только после добавления хотя бы одного урока с заданием',
          );
        }
      }
      await db.updateCourse(id, rest, adminId);
      if (tagIds !== undefined) {
        await db.replaceCourseTags(id, tagIds, adminId);
      }
      return await this.getById(id);
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