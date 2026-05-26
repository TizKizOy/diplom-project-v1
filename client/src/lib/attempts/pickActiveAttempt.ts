import type { IAttempt } from '@/lib/api/attempts.api';
import { attemptMatchesTask } from './attemptTaskId';

/**
 * Выбирает актуальную попытку слушателя по заданию.
 * Приоритет: «На доработке» → «На проверке» с ответом → «Принято» → последняя по id.
 */
export function pickActiveAttemptForTask(
  attempts: IAttempt[],
  taskId: number,
): IAttempt | undefined {
  const forTask = attempts.filter((a) => attemptMatchesTask(a, taskId));
  if (forTask.length === 0) return undefined;

  const revision = forTask.find((a) => a.statusName === 'На доработке');
  if (revision) return revision;

  const pending = forTask.find((a) => a.statusName === 'На проверке');
  if (pending) return pending;

  const accepted = forTask.find((a) => a.statusName === 'Принято');
  if (accepted) return accepted;

  return forTask.reduce((best, cur) =>
    cur.pkIdAttempt > best.pkIdAttempt ? cur : best,
  );
}

export function attemptHasSubmittedContent(a: IAttempt): boolean {
  const text = a.answerText?.trim();
  const hasText = !!text && text !== 'Тест';
  const file =
    typeof a.answerFileUrl === 'string' && a.answerFileUrl.trim().length > 0;
  return hasText || file;
}
