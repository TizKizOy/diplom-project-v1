'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { coursesApi } from '@/lib/api/courses.api';
import { lessonsApi } from '@/lib/api/lessons.api';
import { tasksApi } from '@/lib/api/tasks.api';
import { groupsApi } from '@/lib/api/groups.api';
import { groupListenersApi } from '@/lib/api/groupListeners.api';
import { attemptsApi } from '@/lib/api/attempts.api';
import type { ICourse, ILesson, ITask } from '@/lib/types';
import {
  isLessonUnlockedForListener,
  isLessonComplete,
} from '@/lib/course/lessonUnlock';
import {
  countCompletedLessons,
  courseProgressPercent,
  type AttemptLite,
} from '@/lib/course/courseProgress';
import { isPublishedCourse } from '@/lib/constants';
import styles from './CourseLearnChrome.module.scss';

export function CourseLearnChrome({ children }: { children: ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const { user, checkRole } = useAuth();
  const courseId = Number(params.id);

  const [course, setCourse] = useState<ICourse | null>(null);
  const [lessons, setLessons] = useState<ILesson[]>([]);
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [attempts, setAttempts] = useState<AttemptLite[]>([]);
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);

  const isListener = checkRole(['Слушатель']);
  const isAdmin = checkRole(['Администратор']);
  const isTeacher = checkRole(['Преподаватель']);

  const activeLessonMatch = pathname.match(/\/lessons\/(\d+)/);
  const activeLessonId = activeLessonMatch ? Number(activeLessonMatch[1]) : null;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [courseData, lessonsData, tasksData] = await Promise.all([
          coursesApi.getById(courseId),
          lessonsApi.getByCourse(courseId),
          tasksApi.getByCourse(courseId),
        ]);
        if (cancelled) return;
        setCourse(courseData);
        setLessons(
          [...lessonsData].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
        );
        setTasks(tasksData);

        if (user && isListener) {
          const [courseGroups, enrollRows, att] = await Promise.all([
            groupsApi.getByCourse(courseId),
            groupListenersApi.getByListener(user.pkIdUser),
            attemptsApi.getByListener(user.pkIdUser),
          ]);
          if (cancelled) return;
          const gids = new Set(courseGroups.map((g) => g.pkIdGroup));
          const en = enrollRows.some(
            (e: { fkIdCourse?: number; fkIdGroup?: number }) => {
              if (e.fkIdCourse != null && Number(e.fkIdCourse) === courseId)
                return true;
              return e.fkIdGroup != null && gids.has(e.fkIdGroup as number);
            },
          );
          setEnrolled(en);
          setAttempts(att || []);
        } else {
          setEnrolled(false);
          setAttempts([]);
        }
      } catch {
        if (!cancelled) {
          setCourse(null);
          setLessons([]);
          setTasks([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [courseId, user, isListener]);

  const sequential = isListener && enrolled;
  const percent = useMemo(
    () => courseProgressPercent(lessons, tasks, attempts),
    [lessons, tasks, attempts],
  );
  const completedCount = useMemo(
    () => countCompletedLessons(lessons, tasks, attempts),
    [lessons, tasks, attempts],
  );

  const showSidebar =
    lessons.length > 0 && (isAdmin || isTeacher || (isListener && enrolled));

  const title = course?.title ?? 'Курс';
  const showEnrollInChrome =
    isListener &&
    !enrolled &&
    isPublishedCourse(course) &&
    !loading &&
    course != null;

  return (
    <div className={styles.shell}>
      <header className={styles.topBar}>
        <nav className={styles.breadcrumbs} aria-label="Навигация по курсу">
          <Link href="/courses" className={styles.crumb}>
            Каталог
          </Link>
          <span className={styles.crumbSep}>/</span>
          <span className={styles.crumbCurrent} title={title}>
            {loading ? '…' : title}
          </span>
        </nav>
        <div className={styles.topRight}>
          {showEnrollInChrome && (
            <Link href={`/courses/${courseId}/enroll`} className={styles.enrollCta}>
              Записаться на курс
            </Link>
          )}
          {isListener && enrolled && lessons.length > 0 && !loading && (
            <div className={styles.progressWrap}>
              <span className={styles.progressLabel}>
                Прогресс {percent}% · уроков полностью: {completedCount} / {lessons.length}
              </span>
              <div className={styles.progressBar} role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          )}
          <Link href="/main" className={styles.linkGhost}>
            Моё обучение
          </Link>
        </div>
      </header>

      <div className={styles.body}>
        {showSidebar && !loading ? (
          <>
            <aside className={styles.sidebar}>
              <div className={styles.sideHead}>Программа</div>
              <div className={styles.sideList}>
                {lessons.map((lesson, index) => {
                  const unlocked =
                    !sequential ||
                    isLessonUnlockedForListener(
                      index,
                      lessons,
                      tasks,
                      attempts,
                    );
                  const done = isLessonComplete(
                    lesson.pkIdLesson,
                    tasks,
                    attempts,
                  );
                  const active = activeLessonId === lesson.pkIdLesson;
                  const inner = (
                    <>
                      <span
                        className={`${styles.idx} ${done ? styles.idxDone : ''} ${active ? styles.idxActive : ''}`}
                      >
                        {done ? '●' : index + 1}
                      </span>
                      <div className={styles.lessonMeta}>
                        <div className={styles.lessonTitle}>{lesson.title}</div>
                        {!unlocked && sequential && (
                          <div className={styles.lessonSub}>
                            Завершите предыдущий урок
                          </div>
                        )}
                      </div>
                    </>
                  );
                  return unlocked ? (
                    <Link
                      key={lesson.pkIdLesson}
                      href={`/courses/${courseId}/lessons/${lesson.pkIdLesson}`}
                      className={`${styles.lessonLink} ${active ? styles.lessonActive : ''}`}
                      aria-current={active ? 'page' : undefined}
                    >
                      {inner}
                    </Link>
                  ) : (
                    <div
                      key={lesson.pkIdLesson}
                      className={`${styles.lessonLink} ${styles.lessonLocked}`}
                    >
                      {inner}
                    </div>
                  );
                })}
              </div>
            </aside>
            <div className={styles.main}>{children}</div>
          </>
        ) : (
          <div className={styles.mainNoSide}>{children}</div>
        )}
      </div>
    </div>
  );
}
