import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as db from './db/materials.db';
import { IMaterial } from './interfaces/materials.interfaces';
import { IDeletedResult } from '../common/interfaces/delete.interfaces';
import { IRestoredResult } from '../common/interfaces/restore.interface';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';

@Injectable()
export class MaterialsService {
  async getMaterials(filter: {
    id?: number;
    courseId?: number;
    lessonId?: number;
    typeMaterialId?: number;
    isDeleted?: boolean;
  }): Promise<IMaterial[]> {
    const materials = await db.getMaterials(filter);
    return materials || [];
  }

  async getAll(): Promise<any[]> {
    const result = await db.getMaterials({});
    return result || [];
  }

  async getById(id: number): Promise<IMaterial> {
    const materials = await db.getMaterials({ id });
    const material = materials[0];
    if (!material) {
      throw new NotFoundException(`Материал с id=${id} не найден`);
    }
    return material;
  }

  async getByCourse(courseId: number): Promise<IMaterial[]> {
    return await this.getMaterials({ courseId: courseId });
  }

  async getByLesson(lessonId: number): Promise<IMaterial[]> {
    return await this.getMaterials({ lessonId });
  }

  async getDeleted(): Promise<IMaterial[]> {
    const materials = await db.getDeletedMaterials();
    if (!materials || materials.length === 0) {
      throw new NotFoundException('Удалённые материалы не найдены');
    }
    return materials;
  }

  async create(dto: CreateMaterialDto, adminId: number): Promise<IMaterial> {
    try {
      const desc = dto.description?.trim();
      const normalized: CreateMaterialDto = {
        ...dto,
        description:
          desc && desc.length >= 3
            ? desc
            : 'Краткое описание материала.',
      };
      return await db.createMaterial(normalized, adminId);
    } catch (e: any) {
      if (e.message && e.message.includes('не найден') || e.message && e.message.includes('уже существует')) {
        throw new NotFoundException(e.message);
      }
      throw new BadRequestException(e.message || 'Ошибка создания материала');
    }
  }

  async update(
    id: number,
    dto: UpdateMaterialDto,
    adminId: number,
  ): Promise<IMaterial> {
    await this.getById(id);
    try {
      return await db.updateMaterial(id, dto, adminId);
    } catch (e: any) {
      if (e.message && e.message.includes('не найден') || e.message && e.message.includes('уже существует')) {
        throw new NotFoundException(e.message);
      }
      throw new BadRequestException(e.message || 'Ошибка создания материала');
    }
  }

  async remove(id: number, adminId: number): Promise<IDeletedResult> {
    try {
      const result = await db.deleteMaterial(id, adminId);
      if (result.deletedId === 0) {
        throw new NotFoundException(`Материал с id=${id} не найден`);
      }
      return result;
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }

  async restore(id: number, adminId: number): Promise<IRestoredResult> {
    try {
      return await db.restoreMaterial(id, adminId);
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }

  async hardDelete(id: number, adminId: number): Promise<IDeletedResult> {
    try {
      return await db.hardDeleteMaterial(id, adminId);
    } catch (e: any) {
     throw new BadRequestException(e.message);
    }
  }
}
