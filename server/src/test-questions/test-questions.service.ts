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

/** prGetTestQuestionsWithOptions даёт по строке на каждый вариант ответа — оставляем один объект на вопрос. */
function distinctQuestionsFromJoinedRows(
  rows: Record<string, unknown>[] | null | undefined,
  fallbackTestId?: number,
): ITestQuestion[] {
  if (!rows?.length) return [];
  const byId = new Map<number, ITestQuestion>();
  for (const row of rows) {
    const id = Number(row.pkIdQuestion);
    if (!Number.isFinite(id) || byId.has(id)) continue;
    const sortRaw =
      row.sortOrder ?? row.questionSortOrder ?? row.QuestionSortOrder ?? 0;
    const fkRaw = row.fkIdTest ?? fallbackTestId;
    const fkIdTest = Number(fkRaw);
    byId.set(id, {
      pkIdQuestion: id,
      fkIdTest: Number.isFinite(fkIdTest) ? fkIdTest : (fallbackTestId as number),
      questionText: String(row.questionText ?? ''),
      sortOrder: Number(sortRaw) || 0,
      score: Number(row.score ?? 1),
      isDeleted: Boolean(row.isDeleted),
    });
  }
  return Array.from(byId.values()).sort((a, b) => a.sortOrder - b.sortOrder);
}

@Injectable()
export class TestQuestionsService {
  async getAll(): Promise<ITestQuestion[]> {
    const rows = await db.getTestQuestions({});
    return distinctQuestionsFromJoinedRows(
      rows as unknown as Record<string, unknown>[],
    );
  }

  async getById(id: number): Promise<ITestQuestion> {
    const rows = await db.getTestQuestions({ id });
    const list = distinctQuestionsFromJoinedRows(
      rows as unknown as Record<string, unknown>[],
    );
    const question = list[0];
    if (!question) {
      throw new NotFoundException(`Вопрос с id=${id} не найден`);
    }
    return question;
  }

  async getByTest(testId: number): Promise<ITestQuestion[]> {
    const rows = await db.getTestQuestions({ testId });
    return distinctQuestionsFromJoinedRows(
      rows as unknown as Record<string, unknown>[],
      testId,
    );
  }

  async getDeleted(): Promise<ITestQuestion[]> {
    const questions = await db.getDeletedTestQuestions();
    if (!questions || questions.length === 0) {
      throw new NotFoundException('Удалённые вопросы не найдены');
    }
    return distinctQuestionsFromJoinedRows(
      questions as unknown as Record<string, unknown>[],
    );
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
