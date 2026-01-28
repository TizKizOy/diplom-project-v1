export interface ICertificate {
  pkIdCertificate: number;
  listenerName: string;
  courseTitle: string;
  issuedAt: Date;
  pdfUrl: string | null;
}

export interface IDeletedCertificateResult {
  deleted_id: number;
  message: string;
}

export interface IRestoredCertificateResult {
  restored_id: number;
  message: string;
}
