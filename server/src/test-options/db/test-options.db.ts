import { query } from 'src/common/db/dbConfig';
import { CreateTestOptionDto } from '../dto/create-test-option.dto';
import { UpdateTestOptionDto } from '../dto/update-test-option.dto';
import { ITestOption } from '../interfaces/test-options.interface';
import { IDeletedResult } from '../../common/interfaces/delete.interfaces';
import { IRestoredResult } from '../../common/interfaces/restore.interface';

export const getTestOptions = async (filter: {
  id?: number;
  questionId?: number;
  isDeleted?: boolean;
}): Promise<ITestOption[]> => {
  return await query<ITestOption>(
    `EXEC prGetTestOptions
    @pkIdOption = @pkIdOption,
    @fkIdQuestion = @fkIdQuestion,
    @isDeleted = @isDeleted`,
    {
      pkIdOption: filter.id ?? null,
      fkIdQuestion: filter.questionId ?? null,
      isDeleted: filter.isDeleted ?? 0,
    },
  );
};

export const getDeletedTestOptions = async (): Promise<ITestOption[]> => {
  return await getTestOptions({ isDeleted: true });
};

export const createTestOption = async (
  dto: CreateTestOptionDto,
  adminId: number,
): Promise<ITestOption> => {
  const result = await query<ITestOption>(
    `EXEC spTestOptionCreate
      @fkIdQuestion = @fkIdQuestion,
      @optionText = @optionText,
      @isCorrect = @isCorrect,
      @sortOrder = @sortOrder`,
    {
      fkIdQuestion: dto.questionId,
      optionText: dto.optionText,
      isCorrect: dto.isCorrect ?? false,
      sortOrder: dto.sortOrder ?? 0,
    },
    adminId,
  );

  return result[0];
};

export const updateTestOption = async (
  id: number,
  dto: UpdateTestOptionDto,
  adminId: number,
): Promise<ITestOption> => {
  const result = await query<ITestOption>(
    `EXEC spTestOptionUpdate
    @pkIdOption = @pkIdOption,
    @optionText = @optionText,
    @isCorrect = @isCorrect,
    @sortOrder = @sortOrder`,
    {
      pkIdOption: id,
      optionText: dto.optionText ?? null,
      isCorrect: dto.isCorrect ?? null,
      sortOrder: dto.sortOrder ?? null,
    },
    adminId,
  );

  return result[0];
};

export const deleteTestOption = async (
  id: number,
  adminId: number,
): Promise<IDeletedResult> => {
  const result = await query<IDeletedResult>(
    `EXEC spTestOptionDelete @pkIdOption = @pkIdOption`,
    { pkIdOption: id },
    adminId,
  );
  return result[0];
};

export const restoreTestOption = async (
  id: number,
  adminId: number,
): Promise<IRestoredResult> => {
  const result = await query<IRestoredResult>(
    `EXEC spTestOptionRestore @pkIdOption = @pkIdOption`,
    { pkIdOption: id },
    adminId,
  );
  return result[0];
};

export const hardDeleteTestOption = async (
  id: number,
  adminId: number,
): Promise<IDeletedResult> => {
  const result = await query<IDeletedResult>(
    `EXEC spTestOptionsHardDelet @pkIdOption = @pkIdOption`,
    { pkIdOption: id },
    adminId,
  );
  return result[0];
};
