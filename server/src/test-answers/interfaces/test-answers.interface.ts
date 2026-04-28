export interface ITestAnswer {
  pkIdTestAnswer: number;
  answeredAt: Date;
  listenerName: string;
  questionText: string;
  optionText: string;
  isCorrect: boolean;
}

export interface ITestAnswerBulkItem {
  questionId: number;
  optionId: number;
}

export interface IBulkCreateResult {
  lastId: number;
  insertedCount: number;
}
