export interface ICertificate {
  pkIdCertificate: number;
  fkIdListener?: number;
  fkIdCourse?: number;
  listenerName: string;
  courseTitle: string;
  issuedAt: Date;
  pdfUrl: string;
  templateName: string;
  templateHtml: string;
}
