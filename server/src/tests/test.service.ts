import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as db from './db/tests.db';
import { ITest } from './interfaces/tests.interface';
import { IDeletedResult } from '../common/interfaces/delete.interfaces';
import { IRestoredResult } from '../common/interfaces/restore.interface';
import { CreateTestDto } from './dto/create-test.dto';
import { UpdateTestDto } from './dto/update-test.dto';

@Injectable()
export class TestsService {
  async getTests(filter: {
    id?: number;
    isDeleted?: boolean;
  }): Promise<ITest[]> {
    const tests = await db.getTests(filter);
    if (!tests || tests.length === 0) {
      throw new NotFoundException('Тесты не найдены');
    }
    return tests;
  }

  async getAll(): Promise<ITest[]> {
    return await this.getTests({});
  }

  async getById(id: number): Promise<ITest> {
    const tests = await db.getTests({ id });
    const test = tests[0];
    if (!test) {
      throw new NotFoundException(`Тест с id=${id} не найден`);
    }
    return test;
  }

  async getDeleted(): Promise<ITest[]> {
    const tests = await db.getDeletedTests();
    if (!tests || tests.length === 0) {
      throw new NotFoundException('Удалённые тесты не найдены');
    }
    return tests;
  }

  async create(dto: CreateTestDto, adminId: number): Promise<ITest> {
    try {
      return await db.createTest(dto, adminId);
    } catch (e: any) {
      throw new BadRequestException(e.message || 'Ошибка создания теста');
    }
  }

  async update(
    id: number,
    dto: UpdateTestDto,
    adminId: number,
  ): Promise<ITest> {
    await this.getById(id);
    try {
      return await db.updateTest(id, dto, adminId);
    } catch (e: any) {
      if (e instanceof NotFoundException) throw e;
      throw new BadRequestException(e.message || 'Ошибка обновления теста');
    }
  }

  async remove(id: number, adminId: number): Promise<IDeletedResult> {
    try {
      const result = await db.deleteTest(id, adminId);
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
      return await db.restoreTest(id, adminId);
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }

  async hardDelete(id: number, adminId: number): Promise<IDeletedResult> {
    try {
      return await db.hardDeleteTest(id, adminId);
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }
}
