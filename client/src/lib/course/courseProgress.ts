import type { ILesson, ITask } from '@/lib/types';
import {
  isLessonUnlockedForListener,
  isLessonComplete,
} from '@/lib/course/lessonUnlock';
import { attemptRowTaskId } from '@/lib/attempts/attemptTaskId';

export type AttemptLite = {
  fkIdTask?: number | null;
  pkIdTask?: number | null;
  statusName?: string;
};

export function countCompletedLessons(
  sortedLessons: ILesson[],
  tasks: ITask[],
  attempts: AttemptLite[],
): number {
  return sortedLessons.filter((l) =>
    isLessonComplete(l.pkIdLesson, tasks, attempts),
  ).length;
}

/** Первый доступный незавершённый урок; если все пройдены — последний урок. */
export function getContinueLessonId(
  sortedLessons: ILesson[],
  tasks: ITask[],
  attempts: AttemptLite[],
): number | null {
  if (sortedLessons.length === 0) return null;
  for (let i = 0; i < sortedLessons.length; i++) {
    if (!isLessonUnlockedForListener(i, sortedLessons, tasks, attempts)) continue;
    const lid = sortedLessons[i].pkIdLesson;
    if (!isLessonComplete(lid, tasks, attempts)) return lid;
  }
  return sortedLessons[sortedLessons.length - 1].pkIdLesson;
}

const ACCEPTED = 'Принято';
const PENDING = 'На проверке';
const REVISION = 'На доработке';
const REJECTED = 'Отклонено';

function taskProgressWeight(taskId: number, attempts: AttemptLite[]): number {
  const a = attempts.find((x) => attemptRowTaskId(x) === taskId);
  if (!a?.statusName) return 0;
  if (a.statusName === ACCEPTED) return 1;
  if (
    a.statusName === PENDING ||
    a.statusName === REVISION ||
    a.statusName === REJECTED
  ) {
    return 0.55;
  }
  return 0.35;
}

export function courseProgressPercent(
  sortedLessons: ILesson[],
  tasks: ITask[],
  attempts: AttemptLite[],
): number {
  const total = sortedLessons.length;
  if (total === 0) return 0;
  let sum = 0;
  for (const lesson of sortedLessons) {
    const ltasks = tasks.filter((t) => t.fkIdLesson === lesson.pkIdLesson);
    if (ltasks.length === 0) {
      sum += 1;
      continue;
    }
    const part =
      ltasks.reduce(
        (acc, t) => acc + taskProgressWeight(Number(t.pkIdTask), attempts),
        0,
      ) / ltasks.length;
    sum += part;
  }
  return Math.min(100, Math.round((sum / total) * 100));
}
