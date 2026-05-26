import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import * as db from './db/test-answers.db';
import {
  ITestAnswer,
  IBulkCreateResult,
} from './interfaces/test-answers.interface';
import { IDeletedResult } from '../common/interfaces/delete.interfaces';
import { IRestoredResult } from '../common/interfaces/restore.interface';
import { CreateTestAnswerDto } from './dto/create-test-answer.dto';
import { UpdateTestAnswerDto } from './dto/update-test-answer.dto';
import { BulkCreateTestAnswersDto } from './dto/bulk-create-test-answers.dto';

@Injectable()
export class TestAnswersService {
  async getTestAnswers(filter: {
    id?: number;
    attemptId?: number;
    questionId?: number;
    isDeleted?: boolean;
  }): Promise<ITestAnswer[]> {
    const answers = await db.getTestAnswers(filter);
    if (!answers || answers.length === 0) {
      throw new NotFoundException('Ответы не найдены');
    }
    return answers;
  }

  async getAll(): Promise<ITestAnswer[]> {
    return await this.getTestAnswers({});
  }

  async getById(id: number): Promise<ITestAnswer> {
    const answers = await db.getTestAnswers({ id });
    const answer = answers[0];
    if (!answer) {
      throw new NotFoundException(`Ответ с id=${id} не найден`);
    }
    return answer;
  }

  async getByAttempt(attemptId: number): Promise<ITestAnswer[]> {
    const answers = await db.getTestAnswers({ attemptId });
    return answers || [];
  }

  async getByQuestion(questionId: number): Promise<ITestAnswer[]> {
    return await this.getTestAnswers({ questionId });
  }

  async getDeleted(): Promise<ITestAnswer[]> {
    const answers = await db.getDeletedTestAnswers();
    if (!answers || answers.length === 0) {
      throw new NotFoundException('Удалённые ответы не найдены');
    }
    return answers;
  }

  async create(
    dto: CreateTestAnswerDto,
    adminId: number,
  ): Promise<ITestAnswer> {
    try {
      return await db.createTestAnswer(dto, adminId);
    } catch (e: any) {
      throw new BadRequestException(e.message || 'Ошибка создания ответа');
    }
  }

  async bulkCreate(
    dto: BulkCreateTestAnswersDto,
    adminId: number,
  ): Promise<IBulkCreateResult> {
    try {
      return await db.bulkCreateTestAnswers(dto, adminId);
    } catch (e: any) {
      const msg = String(e?.message ?? '');
      if (
        !msg.includes('spTestAnswersBulkCreate') &&
        !msg.includes('Could not find stored procedure')
      ) {
        throw new BadRequestException(
          msg || 'Ошибка массового создания ответов',
        );
      }
    }

    let lastId = 0;
    for (const item of dto.answers) {
      const row = await db.createTestAnswer(
        {
          attemptId: dto.attemptId,
          questionId: item.questionId,
          selectedOptionId: item.optionId,
        },
        adminId,
      );
      lastId = row.pkIdTestAnswer;
    }
    return { lastId, insertedCount: dto.answers.length };
  }

  async update(
    id: number,
    dto: UpdateTestAnswerDto,
    adminId: number,
  ): Promise<ITestAnswer> {
    await this.getById(id);
    try {
      return await db.updateTestAnswer(id, dto, adminId);
    } catch (e: any) {
      throw new BadRequestException(e.message || 'Ошибка обновления ответа');
    }
  }

  async remove(id: number, adminId: number): Promise<IDeletedResult> {
    try {
      const result = await db.deleteTestAnswer(id, adminId);
      if (result.deletedId === 0) {
        throw new NotFoundException(result.message);
      }
      return result;
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }

  async restore(id: number, adminId: number): Promise<IRestoredResult> {
    try {
      return await db.restoreTestAnswer(id, adminId);
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }

  async hardDelete(id: number, adminId: number): Promise<IDeletedResult> {
    try {
      return await db.hardDeleteTestAnswer(id, adminId);
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }
}
