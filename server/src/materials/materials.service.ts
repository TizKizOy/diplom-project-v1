import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as db from './db/materials.db';
import {
  IMaterial,
  IDeletedMaterialResult,
  IRestoredMaterialResult,
} from './interfaces/materials.interfaces';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';

@Injectable()
export class MaterialsService {
  async getMaterials(filter: {
    id?: number;
    course?: number;
  }): Promise<IMaterial[]> {
    const materials = await db.getMaterials(filter);
    if (!materials || materials.length === 0) {
      throw new NotFoundException('Материалы не найдены');
    }
    return materials;
  }

  async getAll(): Promise<IMaterial[]> {
    return await this.getMaterials({});
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
    return await this.getMaterials({ course: courseId });
  }

  async getDeleted(id?: number): Promise<IMaterial[]> {
    const materials = await db.getDeletedMaterials(id);
    if (!materials || materials.length === 0) {
      throw new NotFoundException(
        id
          ? `Удалённый материал с id=${id} не найден`
          : 'Удалённые материалы не найдены',
      );
    }
    return materials;
  }

  async create(dto: CreateMaterialDto, adminId: number): Promise<IMaterial> {
    try {
      return await db.createMaterial(dto, adminId);
    } catch (e: any) {
      if (e.message?.includes('не найден') || e.message?.includes('удалён')) {
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
    try {
      await this.getById(id);
      return await db.updateMaterial(id, dto, adminId);
    } catch (e: any) {
      if (e instanceof NotFoundException) throw e;

      if (e.message?.includes('не найден') || e.message?.includes('удалён')) {
        throw new NotFoundException(e.message);
      }
      throw new BadRequestException(e.message || 'Ошибка обновления материала');
    }
  }

  async remove(id: number, adminId: number): Promise<IDeletedMaterialResult> {
    try {
      const result = await db.deleteMaterial(id, adminId);
      if (result.deleted_id === 0) {
        throw new NotFoundException(`Материал с id=${id} не найден`);
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

  async restore(id: number, adminId: number): Promise<IRestoredMaterialResult> {
    try {
      return await db.restoreMaterial(id, adminId);
    } catch (e: any) {
      if (
        e.message?.includes('не найден') ||
        e.message?.includes('не был удалён')
      ) {
        throw new NotFoundException(e.message);
      }
      if (e.message?.includes('Невозможно восстановить: курс удалён')) {
        throw new BadRequestException(e.message);
      }
      throw new BadRequestException(e.message);
    }
  }

  async hardDelete(
    id: number,
    adminId: number,
  ): Promise<IDeletedMaterialResult> {
    try {
      return await db.hardDeleteMaterial(id, adminId);
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
