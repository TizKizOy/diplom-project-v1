import { certificatesApi } from '@/lib/api/certificates.api';

/**
 * Проверить завершение курса и выдать сертификат (идемпотентно).
 * Уведомление слушателю создаётся на сервере — без дублирующего toast.
 */
export async function issueCertificateIfComplete(courseId: number) {
  try {
    return await certificatesApi.issueIfComplete(courseId);
  } catch {
    return { issued: false, newlyIssued: false, certificate: null };
  }
}
