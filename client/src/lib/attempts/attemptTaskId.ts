/**
 * Извлекает идентификатор задания из строки попытки (учёт разных ключей/регистров с API/БД).
 */
const TASK_ID_KEYS = ['fkIdTask', 'FkIdTask', 'pkIdTask', 'PkIdTask'] as const;

export function attemptRowTaskId(a: object): number | null {
  const row = a as Record<string, unknown>;
  for (const k of TASK_ID_KEYS) {
    const v = row[k];
    if (v !== undefined && v !== null && v !== '') {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
}

export function attemptMatchesTask(a: object, taskId: number): boolean {
  const id = attemptRowTaskId(a);
  return id !== null && id === taskId;
}

/** Ссылка на файл в ответе (camelCase / PascalCase с API). */
export function attemptAnswerFileUrl(a: object): string {
  const r = a as Record<string, unknown>;
  const v = r.answerFileUrl ?? r.AnswerFileUrl;
  if (typeof v !== 'string') return '';
  return v.trim();
}
