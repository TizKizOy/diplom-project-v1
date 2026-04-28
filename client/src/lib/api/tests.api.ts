import apiClient from './apiClient';

export interface ITestQuestion {
  pkIdQuestion: number;
  fkIdTest: number;
  questionText: string;
  sortOrder: number;
  score: number;
  options?: ITestOption[];
}

export interface ITestOption {
  pkIdOption: number;
  fkIdQuestion: number;
  optionText: string;
  isCorrect?: boolean;
  sortOrder: number;
}

export interface ITest {
  pkIdTest: number;
  timeLimitMinutes: number | null;
  shuffleQuestions: boolean;
  maxAttempts: number;
  showResults: boolean;
  passingScorePercent: number;
  taskTitle?: string;
}

export const testsApi = {
  getById: async (id: number): Promise<ITest> =>
    (await apiClient.get(`/tests/${id}`)).data,

  getQuestionsByTest: async (testId: number): Promise<ITestQuestion[]> =>
    (await apiClient.get(`/test-questions/test/${testId}`)).data,

  getOptionsByQuestion: async (questionId: number): Promise<ITestOption[]> =>
    (await apiClient.get(`/test-options/question/${questionId}`)).data,

  submitAnswers: async (dto: { attemptId: number; answersJson: string }) =>
    (await apiClient.post('/test-answers/bulk', dto)).data,

  getAnswersByAttempt: async (attemptId: number) =>
    (await apiClient.get(`/test-answers/attempt/${attemptId}`)).data,
};
