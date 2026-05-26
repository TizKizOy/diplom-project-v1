import apiClient from './apiClient';

export interface ICertificate {
  pkIdCertificate: number;
  listenerName: string;
  courseTitle: string;
  templateName: string;
  templateHtml: string;
  issuedAt: string;
  pdfUrl: string | null;
}

export interface ICreateCertificateDto {
  listenerId: number;
  courseId: number;
  templateId: number;
  pdfUrl?: string;
}

export const certificatesApi = {
  getAll: async (): Promise<ICertificate[]> => {
    const response = await apiClient.get('/certificates');
    return response.data;
  },

  getByListener: async (listenerId: number): Promise<ICertificate[]> => {
    const response = await apiClient.get(`/certificates/search/listener/${listenerId}`);
    return response.data;
  },

  getByCourse: async (courseId: number): Promise<ICertificate[]> => {
    const response = await apiClient.get(`/certificates/search/course/${courseId}`);
    return response.data;
  },

  getById: async (id: number): Promise<ICertificate> => {
    const response = await apiClient.get(`/certificates/${id}`);
    return response.data;
  },

  create: async (dto: ICreateCertificateDto): Promise<ICertificate> => {
    const response = await apiClient.post('/certificates', dto);
    return response.data;
  },

  /** Слушатель: если курс полностью пройден — создаётся сертификат (при наличии шаблона в БД). */
  issueIfComplete: async (
    courseId: number,
  ): Promise<{
    issued: boolean;
    newlyIssued: boolean;
    certificate: ICertificate | null;
  }> => {
    const response = await apiClient.post('/certificates/issue-if-complete', {
      courseId,
    });
    return response.data;
  },

  /** Преподаватель / админ: проверить слушателя и выдать сертификат при полном прохождении. */
  issueForListenerIfComplete: async (
    courseId: number,
    listenerId: number,
  ): Promise<{
    issued: boolean;
    newlyIssued: boolean;
    certificate: ICertificate | null;
  }> => {
    const response = await apiClient.post(
      '/certificates/issue-for-listener-if-complete',
      { courseId, listenerId },
    );
    return response.data;
  },

  delete: async (id: number) => {
    const response = await apiClient.delete(`/certificates/${id}`);
    return response.data;
  },
};
