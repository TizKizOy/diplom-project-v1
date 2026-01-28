import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as db from './db/certificates.db';
import {
  ICertificate,
  IDeletedCertificateResult,
  IRestoredCertificateResult,
} from './interfaces/certificates.interfaces';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { UpdateCertificateDto } from './dto/update-certificate.dto';

@Injectable()
export class CertificatesService {
  async getCertificates(filter: {
    id?: number;
    listener?: number;
    course?: number;
  }): Promise<ICertificate[]> {
    const certificates = await db.getCertificates(filter);
    if (!certificates || certificates.length === 0) {
      throw new NotFoundException('Сертификаты не найдены');
    }
    return certificates;
  }

  async getAll(): Promise<ICertificate[]> {
    return await this.getCertificates({});
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

  async getDeleted(id?: number): Promise<ICertificate[]> {
    const certificates = await db.getDeletedCertificates(id);
    if (!certificates || certificates.length === 0) {
      throw new NotFoundException(
        id
          ? `Удалённый сертификат с id=${id} не найден`
          : 'Удалённые сертификаты не найдены',
      );
    }
    return certificates;
  }

  async create(
    dto: CreateCertificateDto,
    adminId: number,
  ): Promise<ICertificate> {
    try {
      return await db.createCertificate(dto, adminId);
    } catch (e: any) {
      if (
        e.message?.includes('не найден') ||
        e.message?.includes('не является слушателем')
      ) {
        throw new NotFoundException(e.message);
      }
      throw new BadRequestException(e.message || 'Ошибка выдачи сертификата');
    }
  }

  async update(
    id: number,
    dto: UpdateCertificateDto,
    adminId: number,
  ): Promise<ICertificate> {
    try {
      await this.getById(id);
      return await db.updateCertificate(id, dto.pdfUrl, adminId);
    } catch (e: any) {
      if (e instanceof NotFoundException) throw e;

      if (e.message?.includes('не найден') || e.message?.includes('удалён')) {
        throw new NotFoundException(e.message);
      }
      throw new BadRequestException(
        e.message || 'Ошибка обновления сертификата',
      );
    }
  }

  async remove(
    id: number,
    adminId: number,
  ): Promise<IDeletedCertificateResult> {
    try {
      const result = await db.deleteCertificate(id, adminId);
      if (result.deleted_id === 0) {
        throw new NotFoundException(`Сертификат с id=${id} не найден`);
      }
      return result;
    } catch (e: any) {
      if (e instanceof NotFoundException) throw e;

      if (
        e.message?.includes('не найден') ||
        e.message?.includes('уже удалён')
      ) {
        throw new NotFoundException(e.message);
      }
      throw new BadRequestException(e.message);
    }
  }

  async restore(
    id: number,
    adminId: number,
  ): Promise<IRestoredCertificateResult> {
    try {
      return await db.restoreCertificate(id, adminId);
    } catch (e: any) {
      if (
        e.message?.includes('не найден') ||
        e.message?.includes('не был удалён')
      ) {
        throw new NotFoundException(e.message);
      }
      if (e.message?.includes('Невозможно восстановить: слушатель удалён')) {
        throw new BadRequestException(e.message);
      }
      throw new BadRequestException(e.message);
    }
  }

  async hardDelete(
    id: number,
    adminId: number,
  ): Promise<IDeletedCertificateResult> {
    try {
      return await db.hardDeleteCertificate(id, adminId);
    } catch (e: any) {
      if (e.message?.includes('необходимо сначала пометить как удалённый')) {
        throw new BadRequestException(e.message);
      }
      if (e.message?.includes('не найден')) {
        throw new NotFoundException(e.message);
      }
      throw new BadRequestException(e.message);
    }
  }
}
