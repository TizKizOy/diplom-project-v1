import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import * as db from './db/certificates.db';
import { ICertificate } from './interfaces/certificates.interfaces';
import { IDeletedResult } from '../common/interfaces/delete.interfaces';
import { IRestoredResult } from '../common/interfaces/restore.interface';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { UpdateCertificateDto } from './dto/update-certificate.dto';

@Injectable()
export class CertificatesService {
  async getCertificates(filter: {
    id?: number;
    listener?: number;
    course?: number;
    isDeleted?: boolean;
  }): Promise<ICertificate[]> {
    const certificates = await db.getCertificates(filter);
    return certificates || [];
  }

  async getAll(): Promise<any[]> {
    const result = await db.getCertificates({});
    return result || [];
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
  ): Promise<ICertificate> {
    try {
      return await db.createCertificate(dto, adminId);
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
}
