import type { ILesson, ITask } from '@/lib/types';
import { attemptMatchesTask } from '@/lib/attempts/attemptTaskId';

const ACCEPTED = 'Принято';

/** Все задания урока приняты (или заданий нет — урок считается пройденным). */
export function isLessonComplete(
  lessonId: number,
  tasks: ITask[],
  attempts: { fkIdTask?: number | null; pkIdTask?: number | null; statusName?: string }[],
): boolean {
  const lessonTasks = tasks.filter((t) => t.fkIdLesson === lessonId);
  if (lessonTasks.length === 0) return true;
  for (const t of lessonTasks) {
    const tid = Number(t.pkIdTask);
    if (!Number.isFinite(tid)) continue;
    const accepted = attempts.some(
      (x) => attemptMatchesTask(x, tid) && x.statusName === ACCEPTED,
    );
    if (!accepted) return false;
  }
  return true;
}

/** Слушатель может открыть урок с индексом `lessonIndex` (0 — всегда открыт). */
export function isLessonUnlockedForListener(
  lessonIndex: number,
  sortedLessons: ILesson[],
  tasks: ITask[],
  attempts: { fkIdTask?: number | null; pkIdTask?: number | null; statusName?: string }[],
): boolean {
  if (lessonIndex <= 0) return true;
  const prev = sortedLessons[lessonIndex - 1];
  if (!prev) return true;
  return isLessonComplete(prev.pkIdLesson, tasks, attempts);
}

export function lessonUnlockReason(
  lessonIndex: number,
  sortedLessons: ILesson[],
  tasks: ITask[],
  attempts: { fkIdTask?: number | null; pkIdTask?: number | null; statusName?: string }[],
): string | null {
  if (isLessonUnlockedForListener(lessonIndex, sortedLessons, tasks, attempts))
    return null;
  const prev = sortedLessons[lessonIndex - 1];
  return prev
    ? `Сначала завершите урок «${prev.title}»: все задания должны быть приняты.`
    : 'Урок пока недоступен.';
}
