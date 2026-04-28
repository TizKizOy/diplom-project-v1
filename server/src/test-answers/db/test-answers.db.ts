import { query } from 'src/common/db/dbConfig';
import { CreateTestAnswerDto } from '../dto/create-test-answer.dto';
import { UpdateTestAnswerDto } from '../dto/update-test-answer.dto';
import { BulkCreateTestAnswersDto } from '../dto/bulk-create-test-answers.dto';
import {
  ITestAnswer,
  IBulkCreateResult,
} from '../interfaces/test-answers.interface';
import { IDeletedResult } from '../../common/interfaces/delete.interfaces';
import { IRestoredResult } from '../../common/interfaces/restore.interface';

export const getTestAnswers = async (filter: {
  id?: number;
  attemptId?: number;
  questionId?: number;
  isDeleted?: boolean;
}): Promise<ITestAnswer[]> => {
  return await query<ITestAnswer>(
    `EXEC prGetTestAnswersWithDetails
    @pkIdTestAnswer = @pkIdTestAnswer,
    @fkIdAttempt = @fkIdAttempt,
    @fkIdQuestion = @fkIdQuestion,
    @isDeleted = @isDeleted`,
    {
      pkIdTestAnswer: filter.id ?? null,
      fkIdAttempt: filter.attemptId ?? null,
      fkIdQuestion: filter.questionId ?? null,
      isDeleted: filter.isDeleted ?? 0,
    },
  );
};

export const getDeletedTestAnswers = async (): Promise<ITestAnswer[]> => {
  return await getTestAnswers({ isDeleted: true });
};

export const createTestAnswer = async (
  dto: CreateTestAnswerDto,
  adminId: number,
): Promise<ITestAnswer> => {
  const result = await query<ITestAnswer>(
    `EXEC spTestAnswerCreate
    @fkIdAttempt = @fkIdAttempt,
    @fkIdQuestion = @fkIdQuestion,
    @fkIdSelectedOption = @fkIdSelectedOption`,
    {
      fkIdAttempt: dto.attemptId,
      fkIdQuestion: dto.questionId,
      fkIdSelectedOption: dto.selectedOptionId,
    },
    adminId,
  );
  return result[0];
};

export const bulkCreateTestAnswers = async (
  dto: BulkCreateTestAnswersDto,
  adminId: number,
): Promise<IBulkCreateResult> => {
  const answersJson = JSON.stringify(
    dto.answers.map((a) => ({
      questionId: a.questionId,
      optionId: a.optionId,
    })),
  );

  const result = await query<IBulkCreateResult>(
    `EXEC spTestAnswersBulkCreate
    @fkIdAttempt = @fkIdAttempt,
    @answersJson = @answersJson`,
    {
      fkIdAttempt: dto.attemptId,
      answersJson: answersJson,
    },
    adminId,
  );
  return result[0];
};

export const updateTestAnswer = async (
  id: number,
  dto: UpdateTestAnswerDto,
  adminId: number,
): Promise<ITestAnswer> => {
  const result = await query<ITestAnswer>(
    `EXEC spTestAnswerUpdate
    @pkIdTestAnswer = @pkIdTestAnswer,
    @fkIdAttempt = @fkIdAttempt,
    @fkIdQuestion = @fkIdQuestion,
    @fkIdSelectedOption = @fkIdSelectedOption`,
    {
      pkIdTestAnswer: id,
      fkIdAttempt: dto.attemptId ?? null,
      fkIdQuestion: dto.questionId ?? null,
      fkIdSelectedOption: dto.selectedOptionId ?? null,
    },
    adminId,
  );
  return result[0];
};

export const deleteTestAnswer = async (
  id: number,
  adminId: number,
): Promise<IDeletedResult> => {
  const result = await query<IDeletedResult>(
    `EXEC spTestAnswerDelete @pkIdTestAnswer = @pkIdTestAnswer`,
    { pkIdTestAnswer: id },
    adminId,
  );
  return result[0];
};

export const restoreTestAnswer = async (
  id: number,
  adminId: number,
): Promise<IRestoredResult> => {
  const result = await query<IRestoredResult>(
    `EXEC spTestAnswerRestore @pkIdTestAnswer = @pkIdTestAnswer`,
    { pkIdTestAnswer: id },
    adminId,
  );
  return result[0];
};

export const hardDeleteTestAnswer = async (
  id: number,
  adminId: number,
): Promise<IDeletedResult> => {
  const result = await query<IDeletedResult>(
    `EXEC spTestAnswerHardDelete @pkIdTestAnswer = @pkIdTestAnswer`,
    { pkIdTestAnswer: id },
    adminId,
  );
  return result[0];
};
