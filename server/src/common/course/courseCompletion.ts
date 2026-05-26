/** Логика «курс пройден» совпадает с клиентом (уроки по порядку, все задания — статус «Принято»). */

export type AttemptLite = {
  fkIdTask?: number | null;
  pkIdTask?: number | null;
  statusName?: string;
};

export type LessonLite = { pkIdLesson: number; sortOrder?: number | null };
export type TaskLite = { pkIdTask: number; fkIdLesson?: number | null };

const ACCEPTED = 'Принято';

function taskIdOf(t: TaskLite): number | null {
  const id = Number(t.pkIdTask);
  return Number.isFinite(id) ? id : null;
}

function attemptTaskId(x: AttemptLite): number | null {
  const id = Number(x.fkIdTask ?? x.pkIdTask);
  return Number.isFinite(id) ? id : null;
}

/** Есть хотя бы одна попытка со статусом «Принято» по заданию. */
export function isTaskAccepted(
  taskId: number,
  attempts: AttemptLite[],
): boolean {
  return attempts.some(
    (x) => attemptTaskId(x) === taskId && x.statusName === ACCEPTED,
  );
}

export function isLessonComplete(
  lessonId: number,
  tasks: TaskLite[],
  attempts: AttemptLite[],
): boolean {
  const lessonTasks = tasks.filter((t) => t.fkIdLesson === lessonId);
  if (lessonTasks.length === 0) return true;
  for (const t of lessonTasks) {
    const taskId = taskIdOf(t);
    if (taskId == null) continue;
    if (!isTaskAccepted(taskId, attempts)) return false;
  }
  return true;
}

/** Есть хотя бы один урок и по всем урокам (в порядке sortOrder) задания приняты. */
export function isCourseFullyComplete(
  lessons: LessonLite[],
  tasks: TaskLite[],
  attempts: AttemptLite[],
): boolean {
  const sorted = [...lessons].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
  );
  if (sorted.length === 0) return false;
  for (const l of sorted) {
    if (!isLessonComplete(l.pkIdLesson, tasks, attempts)) return false;
  }
  return true;
}
