import { query } from 'src/common/db/dbConfig';
import { CreateCertificateDto } from '../dto/create-certificate.dto';
import { UpdateCertificateDto } from '../dto/update-certificate.dto';
import { ICertificate } from '../interfaces/certificates.interfaces';
import { IDeletedResult } from '../../common/interfaces/delete.interfaces';
import { IRestoredResult } from '../../common/interfaces/restore.interface';

export const getCertificates = async (filter: {
  id?: number;
  listener?: number;
  course?: number;
  isDeleted?: boolean;
}): Promise<ICertificate[]> => {
  return await query<ICertificate>(
    `EXEC prGetCertificatesWithTemplates
      @pkIdCertificate = @pkIdCertificate,
      @fkIdListener = @fkIdListener,
      @fkIdCourse = @fkIdCourse,
      @isDeleted = @isDeleted`,
    {
      pkIdCertificate: filter.id ?? null,
      fkIdListener: filter.listener ?? null,
      fkIdCourse: filter.course ?? null,
      isDeleted: filter.isDeleted ?? 0,
    },
  );
};

export const getDeletedCertificates = async (): Promise<ICertificate[]> => {
  return await getCertificates({ isDeleted: true });
};

export const createCertificate = async (
  dto: CreateCertificateDto,
  adminId: number,
): Promise<ICertificate> => {
  const result = await query<ICertificate>(
    `EXEC spCertificateCreate
      @fkIdListener = @fkIdListener,
      @fkIdCourse = @fkIdCourse,
      @fkIdTemplate = @fkIdTemplate,
      @pdfUrl = @pdfUrl`,
    {
      fkIdListener: dto.listenerId,
      fkIdCourse: dto.courseId,
      fkIdTemplate: dto.templateId,
      pdfUrl: dto.pdfUrl ?? null,
    },
    adminId,
  );

  return result[0];
};

export const updateCertificate = async (
  id: number,
  dto: UpdateCertificateDto,
  adminId: number,
): Promise<ICertificate> => {
  const result = await query<ICertificate>(
    `EXEC spCertificateUpdate
      @pkIdCertificate = @pkIdCertificate,
      @fkIdListener = @fkIdListener,
      @fkIdCourse = @fkIdCourse,
      @fkIdTemplate = @fkIdTemplate,
      @pdfUrl = @pdfUrl`,
    {
      pkIdCertificate: id,
      fkIdListener: dto.listenerId ?? null,
      fkIdCourse: dto.courseId ?? null,
      fkIdTemplate: dto.templateId ?? null,
      pdfUrl: dto.pdfUrl ?? null,
    },
    adminId,
  );

  return result[0];
};

export const deleteCertificate = async (
  id: number,
  adminId: number,
): Promise<IDeletedResult> => {
  const result = await query<IDeletedResult>(
    `EXEC spCertificateDelete @pkIdCertificate = @pkIdCertificate`,
    { pkIdCertificate: id },
    adminId,
  );
  return result[0];
};

export const restoreCertificate = async (
  id: number,
  adminId: number,
): Promise<IRestoredResult> => {
  const result = await query<IRestoredResult>(
    `EXEC spCertificateRestore @pkIdCertificate = @pkIdCertificate`,
    { pkIdCertificate: id },
    adminId,
  );
  return result[0];
};

export const hardDeleteCertificate = async (
  id: number,
  adminId: number,
): Promise<IDeletedResult> => {
  const result = await query<IDeletedResult>(
    `EXEC spCertificateHardDelete @pkIdCertificate = @pkIdCertificate`,
    { pkIdCertificate: id },
    adminId,
  );
  return result[0];
};

export interface ICertificateTemplateRow {
  pkIdTemplate: number;
  templateName: string;
  templateHtml: string;
  minScorePercent: number;
  isActive: boolean;
  courseTitle: string;
}

export const getCertificateTemplatesByCourse = async (
  courseId: number,
): Promise<ICertificateTemplateRow[]> => {
  return await query<ICertificateTemplateRow>(
    `EXEC prGetCertificateTemplates
      @pkIdTemplate = NULL,
      @fkIdCourse = @fkIdCourse,
      @templateName = NULL,
      @isActive = 1,
      @isDeleted = 0`,
    { fkIdCourse: courseId },
  );
};

const DEFAULT_TEMPLATE_HTML = `<div style="text-align:center;padding:2rem">
<h1>Сертификат</h1>
<p>Настоящим подтверждается успешное прохождение курса.</p>
</div>`;

/** Создаёт активный шаблон по курсу, если его ещё нет. */
export const ensureDefaultCertificateTemplate = async (
  courseId: number,
  courseTitle: string,
): Promise<number> => {
  const existing = await getCertificateTemplatesByCourse(courseId);
  if (existing.length > 0) {
    return existing[0].pkIdTemplate;
  }
  const name =
    courseTitle.trim().length > 0
      ? `Сертификат: ${courseTitle.trim().slice(0, 80)}`
      : `Сертификат по курсу #${courseId}`;
  const rows = await query<{ pkIdTemplate: number }>(
    `EXEC spCertificateTemplatesCreate
      @fkIdCourse = @fkIdCourse,
      @name = @name,
      @templateHtml = @templateHtml,
      @minScorePercent = @minScorePercent,
      @isActive = @isActive`,
    {
      fkIdCourse: courseId,
      name,
      templateHtml: DEFAULT_TEMPLATE_HTML,
      minScorePercent: 0,
      isActive: 1,
    },
  );
  const id = rows[0]?.pkIdTemplate;
  if (id == null) {
    throw new Error('Не удалось создать шаблон сертификата');
  }
  return id;
};
