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
