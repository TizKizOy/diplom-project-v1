import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as db from './db/test-questions.db';
import { ITestQuestion } from './interfaces/test-questions.interfaces';
import { IDeletedResult } from '../common/interfaces/delete.interfaces';
import { IRestoredResult } from '../common/interfaces/restore.interface';
import { CreateTestQuestionDto } from './dto/create-test-question.dto';
import { UpdateTestQuestionDto } from './dto/update-test-question.dto';

@Injectable()
export class TestQuestionsService {
  async getTestQuestions(filter: {
    id?: number;
    testId?: number;
    isDeleted?: boolean;
  }): Promise<ITestQuestion[]> {
    const questions = await db.getTestQuestions(filter);
    if (!questions || questions.length === 0) {
      throw new NotFoundException('Вопросы не найдены');
    }
    return questions;
  }

  async getAll(): Promise<ITestQuestion[]> {
    return await this.getTestQuestions({});
  }

  async getById(id: number): Promise<ITestQuestion> {
    const questions = await db.getTestQuestions({ id });
    const question = questions[0];
    if (!question) {
      throw new NotFoundException(`Вопрос с id=${id} не найден`);
    }
    return question;
  }

  async getByTest(testId: number): Promise<ITestQuestion[]> {
    return await this.getTestQuestions({ testId });
  }

  async getDeleted(): Promise<ITestQuestion[]> {
    const questions = await db.getDeletedTestQuestions();
    if (!questions || questions.length === 0) {
      throw new NotFoundException('Удалённые вопросы не найдены');
    }
    return questions;
  }

  async create(
    dto: CreateTestQuestionDto,
    adminId: number,
  ): Promise<ITestQuestion> {
    try {
      return await db.createTestQuestion(dto, adminId);
    } catch (e: any) {
      throw new BadRequestException(e.message || 'Ошибка создания вопроса');
    }
  }

  async update(
    id: number,
    dto: UpdateTestQuestionDto,
    adminId: number,
  ): Promise<ITestQuestion> {
    await this.getById(id);
    try {
      return await db.updateTestQuestion(id, dto, adminId);
    } catch (e: any) {
      throw new BadRequestException(e.message || 'Ошибка обновления вопроса');
    }
  }

  async remove(id: number, adminId: number): Promise<IDeletedResult> {
    try {
      const result = await db.deleteTestQuestion(id, adminId);
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
      return await db.restoreTestQuestion(id, adminId);
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }

  async hardDelete(id: number, adminId: number): Promise<IDeletedResult> {
    try {
      return await db.hardDeleteTestQuestion(id, adminId);
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }
}
