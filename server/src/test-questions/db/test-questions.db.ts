import { query } from 'src/common/db/dbConfig';
import { CreateTestQuestionDto } from '../dto/create-test-question.dto';
import { UpdateTestQuestionDto } from '../dto/update-test-question.dto';
import { ITestQuestion } from '../interfaces/test-questions.interfaces';
import { IDeletedResult } from '../../common/interfaces/delete.interfaces';
import { IRestoredResult } from '../../common/interfaces/restore.interface';

export const getTestQuestions = async (filter: {
  id?: number;
  testId?: number;
  isDeleted?: boolean;
}): Promise<ITestQuestion[]> => {
  return await query<ITestQuestion>(
    `EXEC prGetTestQuestionsWithOptions
    @pkIdQuestion = @pkIdQuestion,
    @fkIdTest = @fkIdTest,
    @isDeleted = @isDeleted`,
    {
      pkIdQuestion: filter.id ?? null,
      fkIdTest: filter.testId ?? null,
      isDeleted: filter.isDeleted ?? 0,
    },
  );
};

export const getDeletedTestQuestions = async (): Promise<ITestQuestion[]> => {
  return await getTestQuestions({ isDeleted: true });
};

export const createTestQuestion = async (
  dto: CreateTestQuestionDto,
  adminId: number,
): Promise<ITestQuestion> => {
  const result = await query<ITestQuestion>(
    `EXEC spTestQuestionCreate
      @fkIdTest = @fkIdTest,
      @questionText = @questionText,
      @sortOrder = @sortOrder,
      @score = @score`,
    {
      fkIdTest: dto.testId,
      questionText: dto.questionText,
      sortOrder: dto.sortOrder ?? 0,
      score: dto.score ?? 1,
    },
    adminId,
  );

  return result[0];
};

export const updateTestQuestion = async (
  id: number,
  dto: UpdateTestQuestionDto,
  adminId: number,
): Promise<ITestQuestion> => {
  const result = await query<ITestQuestion>(
    `EXEC spTestQuestionUpdate
    @pkIdQuestion = @pkIdQuestion,
    @questionText = @questionText,
    @sortOrder = @sortOrder,
    @score = @score`,
    {
      pkIdQuestion: id,
      questionText: dto.questionText ?? null,
      sortOrder: dto.sortOrder ?? null,
      score: dto.score ?? null,
    },
    adminId,
  );

  return result[0];
};

export const deleteTestQuestion = async (
  id: number,
  adminId: number,
): Promise<IDeletedResult> => {
  const result = await query<IDeletedResult>(
    `EXEC spTestQuestionDelete @pkIdQuestion = @pkIdQuestion`,
    { pkIdQuestion: id },
    adminId,
  );
  return result[0];
};

export const restoreTestQuestion = async (
  id: number,
  adminId: number,
): Promise<IRestoredResult> => {
  const result = await query<IRestoredResult>(
    `EXEC spTestQuestionRestore @pkIdQuestion = @pkIdQuestion`,
    { pkIdQuestion: id },
    adminId,
  );
  return result[0];
};

export const hardDeleteTestQuestion = async (
  id: number,
  adminId: number,
): Promise<IDeletedResult> => {
  const result = await query<IDeletedResult>(
    `EXEC spTestQuestionsHardDelet @pkIdQuestion = @pkIdQuestion`,
    { pkIdQuestion: id },
    adminId,
  );
  return result[0];
};
