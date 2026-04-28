export interface ITestQuestion {
  pkIdQuestion: number;
  fkIdTest: number;
  questionText: string;
  sortOrder: number;
  score: number;
  isDeleted: boolean;
}
