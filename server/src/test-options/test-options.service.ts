import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as db from './db/test-options.db';
import { ITestOption } from './interfaces/test-options.interface';
import { IDeletedResult } from '../common/interfaces/delete.interfaces';
import { IRestoredResult } from '../common/interfaces/restore.interface';
import { CreateTestOptionDto } from './dto/create-test-option.dto';
import { UpdateTestOptionDto } from './dto/update-test-option.dto';

@Injectable()
export class TestOptionsService {
  async getTestOptions(filter: {
    id?: number;
    questionId?: number;
    isDeleted?: boolean;
  }): Promise<ITestOption[]> {
    const options = await db.getTestOptions(filter);
    if (!options || options.length === 0) {
      throw new NotFoundException('Варианты ответов не найдены');
    }
    return options;
  }

  async getAll(): Promise<ITestOption[]> {
    return await this.getTestOptions({});
  }

  async getById(id: number): Promise<ITestOption> {
    const options = await db.getTestOptions({ id });
    const option = options[0];
    if (!option) {
      throw new NotFoundException(`Вариант ответа с id=${id} не найден`);
    }
    return option;
  }

  async getByQuestion(questionId: number): Promise<ITestOption[]> {
    return await this.getTestOptions({ questionId });
  }

  async getDeleted(): Promise<ITestOption[]> {
    const options = await db.getDeletedTestOptions();
    if (!options || options.length === 0) {
      throw new NotFoundException('Удалённые варианты ответов не найдены');
    }
    return options;
  }

  async create(
    dto: CreateTestOptionDto,
    adminId: number,
  ): Promise<ITestOption> {
    try {
      return await db.createTestOption(dto, adminId);
    } catch (e: any) {
      throw new BadRequestException(
        e.message || 'Ошибка создания варианта ответа',
      );
    }
  }

  async update(
    id: number,
    dto: UpdateTestOptionDto,
    adminId: number,
  ): Promise<ITestOption> {
    await this.getById(id);
    try {
      return await db.updateTestOption(id, dto, adminId);
    } catch (e: any) {
      throw new BadRequestException(
        e.message || 'Ошибка обновления варианта ответа',
      );
    }
  }

  async remove(id: number, adminId: number): Promise<IDeletedResult> {
    try {
      const result = await db.deleteTestOption(id, adminId);
      if (!result.deletedId) {
        throw new NotFoundException(result.message);
      }
      return result;
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }

  async restore(id: number, adminId: number): Promise<IRestoredResult> {
    try {
      return await db.restoreTestOption(id, adminId);
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }

  async hardDelete(id: number, adminId: number): Promise<IDeletedResult> {
    try {
      return await db.hardDeleteTestOption(id, adminId);
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }
}
