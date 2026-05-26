import type { ITestAnswerRow } from '@/lib/api/tests.api';

/** Нормализация полей ответа теста из API (camelCase / PascalCase). */
export function normalizeTestAnswerRow(row: Record<string, unknown>): ITestAnswerRow {
  const answered = row.answeredAt ?? row.AnsweredAt;
  const listener = row.listenerName ?? row.ListenerName;
  return {
    pkIdTestAnswer: Number(row.pkIdTestAnswer ?? row.PkIdTestAnswer ?? 0),
    questionText: String(row.questionText ?? row.QuestionText ?? '—'),
    optionText: String(row.optionText ?? row.OptionText ?? '—'),
    isCorrect: Boolean(row.isCorrect ?? row.IsCorrect),
    answeredAt: answered != null ? String(answered) : undefined,
    listenerName: listener != null ? String(listener) : undefined,
  };
}
