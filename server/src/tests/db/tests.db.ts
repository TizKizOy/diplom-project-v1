import { query } from 'src/common/db/dbConfig';
import { CreateTestDto } from '../dto/create-test.dto';
import { UpdateTestDto } from '../dto/update-test.dto';
import { ITest } from '../interfaces/tests.interface';
import { IDeletedResult } from '../../common/interfaces/delete.interfaces';
import { IRestoredResult } from '../../common/interfaces/restore.interface';

export const getTests = async (filter: {
  id?: number;
  isDeleted?: boolean;
}): Promise<ITest[]> => {
  return await query<ITest>(
    `EXEC prGetTestsWithTasks
    @pkIdTest = @pkIdTest,
    @isDeleted = @isDeleted`,
    {
      pkIdTest: filter.id ?? null,
      isDeleted: filter.isDeleted ?? 0,
    },
  );
};

export const getDeletedTests = async (): Promise<ITest[]> => {
  return await getTests({ isDeleted: true });
};

export const createTest = async (
  dto: CreateTestDto,
  adminId: number,
): Promise<ITest> => {
  const result = await query<ITest>(
    `EXEC spTestCreate
      @timeLimitMinutes = @timeLimitMinutes,
      @shuffleQuestions = @shuffleQuestions,
      @maxAttempts = @maxAttempts,
      @showResults = @showResults,
      @passingScorePercent = @passingScorePercent`,
    {
      timeLimitMinutes: dto.timeLimitMinutes ?? null,
      shuffleQuestions: dto.shuffleQuestions ?? false,
      maxAttempts: dto.maxAttempts ?? 1,
      showResults: dto.showResults ?? true,
      passingScorePercent: dto.passingScorePercent ?? 60,
    },
    adminId,
  );

  return result[0];
};

export const updateTest = async (
  id: number,
  dto: UpdateTestDto,
  adminId: number,
): Promise<ITest> => {
  const result = await query<ITest>(
    `EXEC spTestUpdate
    @pkIdTest = @pkIdTest,
    @timeLimitMinutes = @timeLimitMinutes,
    @shuffleQuestions = @shuffleQuestions,
    @maxAttempts = @maxAttempts,
    @showResults = @showResults,
    @passingScorePercent = @passingScorePercent`,
    {
      pkIdTest: id,
      timeLimitMinutes: dto.timeLimitMinutes ?? null,
      shuffleQuestions: dto.shuffleQuestions ?? null,
      maxAttempts: dto.maxAttempts ?? null,
      showResults: dto.showResults ?? null,
      passingScorePercent: dto.passingScorePercent ?? null,
    },
    adminId,
  );

  return result[0];
};

export const deleteTest = async (
  id: number,
  adminId: number,
): Promise<IDeletedResult> => {
  const result = await query<IDeletedResult>(
    `EXEC spTestDelete @pkIdTest = @pkIdTest`,
    { pkIdTest: id },
    adminId,
  );
  return result[0];
};

export const restoreTest = async (
  id: number,
  adminId: number,
): Promise<IRestoredResult> => {
  const result = await query<IRestoredResult>(
    `EXEC spTestRestore @pkIdTest = @pkIdTest`,
    { pkIdTest: id },
    adminId,
  );
  return result[0];
};

export const hardDeleteTest = async (
  id: number,
  adminId: number,
): Promise<IDeletedResult> => {
  const result = await query<IDeletedResult>(
    `EXEC spTestHardDelete @pkIdTest = @pkIdTest`,
    { pkIdTest: id },
    adminId,
  );
  return result[0];
};
