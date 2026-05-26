import { datetimeLocalToIso } from './datetimeLocalToIso';

const startOfTodayMs = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

/** Пустое значение — без дедлайна (валидно). Иначе дата должна быть строго позже текущего момента. */
export function isDeadlineValueInFuture(value: string | undefined | null): boolean {
  if (value == null || !String(value).trim()) return true;
  const iso = datetimeLocalToIso(value);
  if (!iso) return false;
  return new Date(iso).getTime() > Date.now();
}

/**
 * Для сохранения задания: новый дедлайн должен быть в будущем,
 * либо совпадать с уже сохранённым (не блокируем старые записи в БД при правке названия).
 */
export function isDeadlineUnchangedOrInFuture(
  formValue: string,
  previousIso: string | undefined | null,
): boolean {
  if (!formValue.trim()) return true;
  const iso = datetimeLocalToIso(formValue);
  if (!iso) return false;
  const nextMin = Math.floor(new Date(iso).getTime() / 60_000);
  if (previousIso) {
    const prevMin = Math.floor(new Date(previousIso).getTime() / 60_000);
    if (prevMin === nextMin) return true;
  }
  return new Date(iso).getTime() > Date.now();
}

/** Сравнение дат начала и окончания. true если порядок допустим или одна из дат не задана. */
export function isCourseDateRangeValid(
  start: string | undefined | null,
  end: string | undefined | null,
): boolean {
  if (!start?.trim() || !end?.trim()) return true;
  const sIso = datetimeLocalToIso(start);
  const eIso = datetimeLocalToIso(end);
  if (!sIso || !eIso) return false;
  return new Date(eIso).getTime() >= new Date(sIso).getTime();
}

/** Дата начала курса не раньше сегодняшнего дня (по локальному календарю). */
export function isCourseStartNotInPast(start: string | undefined | null): boolean {
  if (!start?.trim()) return true;
  const iso = datetimeLocalToIso(start);
  if (!iso) return false;
  return new Date(iso).getTime() >= startOfTodayMs();
}

/** Дедлайн задания в пределах дат проведения курса (включительно по календарным дням). */
export function isDeadlineWithinCourseRange(
  deadlineValue: string | undefined | null,
  courseStart: string | undefined | null,
  courseEnd: string | undefined | null,
): boolean {
  if (!deadlineValue?.trim()) return true;
  const dIso = datetimeLocalToIso(deadlineValue);
  if (!dIso) return false;
  const dMs = new Date(dIso).getTime();
  if (courseStart?.trim()) {
    const sIso = datetimeLocalToIso(courseStart);
    if (sIso && dMs < new Date(sIso).getTime()) return false;
  }
  if (courseEnd?.trim()) {
    const eIso = datetimeLocalToIso(courseEnd);
    if (eIso) {
      const end = new Date(eIso);
      end.setHours(23, 59, 59, 999);
      if (dMs > end.getTime()) return false;
    }
  }
  return true;
}

/** Минимум одно задание привязано к уроку (не «общее» задание без урока). */
export function courseHasLessonWithTask(
  lessons: { pkIdLesson: number }[],
  tasks: { fkIdLesson?: number | null }[],
): boolean {
  if (lessons.length === 0) return false;
  const lessonIds = new Set(lessons.map((l) => l.pkIdLesson));
  return tasks.some((t) => t.fkIdLesson != null && lessonIds.has(Number(t.fkIdLesson)));
}
