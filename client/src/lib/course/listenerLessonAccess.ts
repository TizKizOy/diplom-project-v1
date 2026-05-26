import { groupsApi } from '@/lib/api/groups.api';
import { groupListenersApi } from '@/lib/api/groupListeners.api';
import { lessonsApi } from '@/lib/api/lessons.api';
import { tasksApi } from '@/lib/api/tasks.api';
import { attemptsApi } from '@/lib/api/attempts.api';
import {
  isLessonUnlockedForListener,
  lessonUnlockReason,
} from '@/lib/course/lessonUnlock';

/** Запись на курс + поочерёдное открытие уроков для слушателя. */
export async function checkListenerLessonSequentialAccess(
  courseId: number,
  lessonId: number,
  userId: number,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const [courseGroups, enrollments, lessonsData, tasksData] = await Promise.all([
    groupsApi.getByCourse(courseId),
    groupListenersApi.getByListener(userId),
    lessonsApi.getByCourse(courseId),
    tasksApi.getByCourse(courseId),
  ]);
  const courseGroupIds = new Set(courseGroups.map((g) => g.pkIdGroup));
  const enrolled = enrollments.some((e: { fkIdCourse?: number; fkIdGroup?: number }) => {
    if (e.fkIdCourse != null && Number(e.fkIdCourse) === courseId) return true;
    return e.fkIdGroup != null && courseGroupIds.has(e.fkIdGroup as number);
  });
  if (!enrolled) {
    return { ok: false, message: 'Запишитесь на курс, чтобы открывать уроки.' };
  }

  const sortedLessons = [...lessonsData].sort(
    (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0),
  );
  const lessonIndex = sortedLessons.findIndex((l) => l.pkIdLesson === lessonId);
  if (lessonIndex < 0) return { ok: false, message: 'Урок не найден.' };

  const attempts = await attemptsApi.getByListener(userId);
  if (
    !isLessonUnlockedForListener(lessonIndex, sortedLessons, tasksData, attempts)
  ) {
    return {
      ok: false,
      message:
        lessonUnlockReason(lessonIndex, sortedLessons, tasksData, attempts) ||
        'Урок недоступен.',
    };
  }
  return { ok: true };
}
