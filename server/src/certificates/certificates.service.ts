import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import * as db from './db/certificates.db';
import * as groupListenersDb from '../group-listeners/db/group-listeners.db';
import * as groupsDb from '../groups/db/groups.db';
import * as lessonsDb from '../lessons/db/lessons.db';
import * as tasksDb from '../tasks/db/tasks.db';
import * as attemptsDb from '../attempts/db/attempts.db';
import * as coursesDb from '../courses/db/courses.db';
import { isCourseFullyComplete } from '../common/course/courseCompletion';
import { ICertificate } from './interfaces/certificates.interfaces';
import { IDeletedResult } from '../common/interfaces/delete.interfaces';
import { IRestoredResult } from '../common/interfaces/restore.interface';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { UpdateCertificateDto } from './dto/update-certificate.dto';
import { NotificationsService } from '../notifications/notifications.service';

export type AutoIssueResult = {
  certificate: ICertificate | null;
  newlyIssued: boolean;
};

/** Один активный сертификат на пару слушатель + курс (оставляем с большим id). */
export function dedupeCertificatesByListenerCourse(
  list: ICertificate[],
): ICertificate[] {
  const map = new Map<string, ICertificate>();
  for (const c of list) {
    const listenerId = c.fkIdListener ?? 0;
    const courseId = c.fkIdCourse ?? 0;
    const key =
      listenerId > 0 && courseId > 0
        ? `${listenerId}:${courseId}`
        : `title:${c.listenerName}|${c.courseTitle}`;
    const prev = map.get(key);
    if (!prev || c.pkIdCertificate > prev.pkIdCertificate) {
      map.set(key, c);
    }
  }
  return Array.from(map.values());
}

@Injectable()
export class CertificatesService {
  /** Сериализация параллельных автовыдач по одному слушателю и курсу. */
  private readonly issueInFlight = new Map<string, Promise<AutoIssueResult>>();

  constructor(private readonly notificationsService: NotificationsService) {}

  async getCertificates(filter: {
    id?: number;
    listener?: number;
    course?: number;
    isDeleted?: boolean;
  }): Promise<ICertificate[]> {
    const certificates = await db.getCertificates(filter);
    return dedupeCertificatesByListenerCourse(certificates || []);
  }

  async getAll(): Promise<ICertificate[]> {
    const result = await db.getCertificates({});
    return dedupeCertificatesByListenerCourse(result || []);
  }

  async getById(id: number): Promise<ICertificate> {
    const certificates = await db.getCertificates({ id });
    const cert = certificates[0];
    if (!cert) {
      throw new NotFoundException(`Сертификат с id=${id} не найден`);
    }
    return cert;
  }

  async getByListener(listenerId: number): Promise<ICertificate[]> {
    return await this.getCertificates({ listener: listenerId });
  }

  async getByCourse(courseId: number): Promise<ICertificate[]> {
    return await this.getCertificates({ course: courseId });
  }

  async getDeleted(): Promise<ICertificate[]> {
    const certificates = await db.getDeletedCertificates();
    if (!certificates || certificates.length === 0) {
      throw new NotFoundException('Удалённые сертификаты не найдены');
    }
    return certificates;
  }

  async create(
    dto: CreateCertificateDto,
    adminId: number,
    options?: { skipNotify?: boolean },
  ): Promise<ICertificate> {
    try {
      const cert = await db.createCertificate(dto, adminId);
      if (!options?.skipNotify) {
        await this.notifyCertificateIssued(dto.listenerId, cert);
      }
      return cert;
    } catch (e: any) {
      if (e.message && e.message.includes('уже существует')) {
        throw new ConflictException(e.message);
      }
      throw new BadRequestException(e.message || 'Ошибка создания сертификата');
    }
  }

  async update(
    id: number,
    dto: UpdateCertificateDto,
    adminId: number,
  ): Promise<ICertificate> {
    await this.getById(id);
    try {
      return await db.updateCertificate(id, dto, adminId);
    } catch (e: any) {
      if (e.message && e.message.includes('уже существует')) {
        throw new ConflictException(e.message);
      }
      throw new BadRequestException(e.message || 'Ошибка создания сертификата');
    }
  }

  async remove(id: number, adminId: number): Promise<IDeletedResult> {
    try {
      const result = await db.deleteCertificate(id, adminId);
      if (result.deletedId === 0) {
        throw new NotFoundException(`Сертификат с id=${id} не найден`);
      }
      return result;
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }

  async restore(id: number, adminId: number): Promise<IRestoredResult> {
    try {
      return await db.restoreCertificate(id, adminId);
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }

  async hardDelete(id: number, adminId: number): Promise<IDeletedResult> {
    try {
      return await db.hardDeleteCertificate(id, adminId);
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }

  private async resolveCourseTitle(courseId: number): Promise<string> {
    const rows = await coursesDb.getCourses({ id: courseId });
    const title = rows[0]?.title;
    return typeof title === 'string' && title.trim() ? title.trim() : `Курс #${courseId}`;
  }

  private async notifyCertificateIssued(
    listenerId: number,
    cert: ICertificate,
  ): Promise<void> {
    const courseTitle = cert.courseTitle?.trim() || 'курс';
    const message = `Поздравляем! Вам выдан сертификат по курсу «${courseTitle}». Откройте раздел «Сертификаты», чтобы скачать документ.`;
    try {
      await this.notificationsService.create({
        userId: listenerId,
        message,
      });
    } catch (e: unknown) {
      console.error('[notifyCertificateIssued]', e);
    }
  }

  /**
   * Автовыдача: слушатель в группе курса, все уроки пройдены (все задания «Принято»),
   * при отсутствии шаблона создаётся стандартный. Идемпотентно при параллельных вызовах.
   */
  async tryAutoIssueIfCourseCompleted(
    listenerId: number,
    courseId: number,
    auditUserId: number,
  ): Promise<AutoIssueResult> {
    const key = `${listenerId}:${courseId}`;
    const pending = this.issueInFlight.get(key);
    if (pending) {
      return pending;
    }

    const work = this.runAutoIssueIfCourseCompleted(
      listenerId,
      courseId,
      auditUserId,
    );
    this.issueInFlight.set(key, work);
    try {
      return await work;
    } finally {
      this.issueInFlight.delete(key);
    }
  }

  private async runAutoIssueIfCourseCompleted(
    listenerId: number,
    courseId: number,
    auditUserId: number,
  ): Promise<AutoIssueResult> {
    const enrollments = await groupListenersDb.getGroupListeners({
      listenerId,
    });
    const courseGroups = await groupsDb.getGroups({ courseId });
    const groupIds = new Set(courseGroups.map((g) => g.pkIdGroup));
    const enrolled = enrollments.some(
      (e) => e.fkIdGroup != null && groupIds.has(e.fkIdGroup),
    );
    if (!enrolled) {
      return { certificate: null, newlyIssued: false };
    }

    const lessons = await lessonsDb.getLessons({ courseId });
    const tasks = await tasksDb.getTasks({ courseId });
    const attempts = await attemptsDb.getAttempts({ listenerId, courseId });

    if (!isCourseFullyComplete(lessons, tasks, attempts)) {
      return { certificate: null, newlyIssued: false };
    }

    const existing = dedupeCertificatesByListenerCourse(
      await db.getCertificates({
        listener: listenerId,
        course: courseId,
      }),
    );
    if (existing.length > 0) {
      return { certificate: existing[0], newlyIssued: false };
    }

    const courseTitle = await this.resolveCourseTitle(courseId);
    const templateId = await db.ensureDefaultCertificateTemplate(
      courseId,
      courseTitle,
    );

    const dto: CreateCertificateDto = {
      listenerId,
      courseId,
      templateId,
    };
    try {
      const cert = await this.create(dto, auditUserId);
      return { certificate: cert, newlyIssued: true };
    } catch (e: unknown) {
      if (e instanceof ConflictException) {
        const again = dedupeCertificatesByListenerCourse(
          await db.getCertificates({
            listener: listenerId,
            course: courseId,
          }),
        );
        return {
          certificate: again[0] ?? null,
          newlyIssued: false,
        };
      }
      throw e;
    }
  }
}
