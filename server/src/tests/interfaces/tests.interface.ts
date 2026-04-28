export interface ITest {
  pkIdTest: number;
  timeLimitMinutes: number | null;
  shuffleQuestions: boolean;
  maxAttempts: number;
  showResults: boolean;
  passingScorePercent: number;
  isDeleted: boolean;
}
