import { query } from 'src/common/db/dbConfig';
import { CreateCertificateDto } from '../dto/create-certificate.dto';
import {
  ICertificate,
  IDeletedCertificateResult,
  IRestoredCertificateResult,
} from '../interfaces/certificates.interfaces';

export const getCertificates = async (filter: {
  id?: number;
  listener?: number;
  course?: number;
}): Promise<ICertificate[]> => {
  return await query('SELECT * FROM f_certificates_get($1, $2, $3)', [
    filter.id ?? null,
    filter.listener ?? null,
    filter.course ?? null,
  ]);
};

export const getDeletedCertificates = async (
  id?: number,
): Promise<ICertificate[]> => {
  return await query('SELECT * FROM f_certificates_get_deleted($1)', [
    id ?? null,
  ]);
};

export const createCertificate = async (
  dto: CreateCertificateDto,
  adminId: number,
): Promise<ICertificate> => {
  const rows = await query(
    'SELECT * FROM f_certificates_issue($1, $2, $3)',
    [dto.listenerId, dto.courseId, dto.pdfUrl ?? null],
    adminId,
  );
  return rows[0];
};

export const updateCertificate = async (
  id: number,
  pdfUrl: string,
  adminId: number,
): Promise<ICertificate> => {
  const rows = await query(
    'SELECT * FROM f_certificates_update($1, $2)',
    [id, pdfUrl],
    adminId,
  );
  return rows[0];
};

export const deleteCertificate = async (
  id: number,
  adminId: number,
): Promise<IDeletedCertificateResult> => {
  const rows = await query(
    'SELECT * FROM f_certificates_delete($1)',
    [id],
    adminId,
  );
  return rows[0];
};

export const restoreCertificate = async (
  id: number,
  adminId: number,
): Promise<IRestoredCertificateResult> => {
  const rows = await query(
    'SELECT * FROM f_certificates_restore($1)',
    [id],
    adminId,
  );
  return rows[0];
};

export const hardDeleteCertificate = async (
  id: number,
  adminId: number,
): Promise<IDeletedCertificateResult> => {
  const rows = await query(
    'SELECT * FROM f_certificates_hard_delete($1)',
    [id],
    adminId,
  );
  return rows[0];
};
