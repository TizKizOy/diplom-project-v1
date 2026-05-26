'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { coursesApi } from '@/lib/api/courses.api';
import { lessonsApi } from '@/lib/api/lessons.api';
import { tasksApi } from '@/lib/api/tasks.api';
import { attemptsApi } from '@/lib/api/attempts.api';
import { certificatesApi } from '@/lib/api/certificates.api';
import { groupListenersApi } from '@/lib/api/groupListeners.api';
import { groupsApi } from '@/lib/api/groups.api';
import type { ICourse, ILesson, ITask } from '@/lib/types';
import { ATTEMPT_STATUS } from '@/lib/constants';
import Link from 'next/link';
import styles from './page.module.scss';

export default function CourseProgressPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const courseId = Number(params.id);

  const [course, setCourse] = useState<ICourse | null>(null);
  const [lessons, setLessons] = useState<ILesson[]>([]);
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [attemptMap, setAttemptMap] = useState<Record<number, any>>({});
  const [certificate, setCertificate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const formatDate = (value?: string | null) => {
    if (!value) return '—';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleDateString('ru-RU');
  };

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [courseId, user]);

  const loadData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const [courseData, lessonsData, tasksData, attemptsData] = await Promise.all([
        coursesApi.getById(courseId),
        lessonsApi.getByCourse(courseId),
        tasksApi.getByCourse(courseId),
        attemptsApi.getByListener(user.pkIdUser),
      ]);

      setCourse(courseData);
      setLessons(lessonsData.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)));
      setTasks(tasksData);

      // Build attempt map
      const map: Record<number, any> = {};
      for (const a of attemptsData) {
        const tid = (a as any).fkIdTask;
        if (tid) map[tid] = a;
      }
      setAttemptMap(map);

      // Check enrollment
      const enrollments = await groupListenersApi.getByListener(user.pkIdUser);
      const courseGroups = await groupsApi.getByCourse(courseId);
      const courseGroupIds = new Set(courseGroups.map((g) => g.pkIdGroup));
      setIsEnrolled(enrollments.some((e: any) => courseGroupIds.has(e.fkIdGroup)));

      // Check certificate
      try {
        const certs = await certificatesApi.getByListener(user.pkIdUser);
        const found = certs.find((c: any) => c.fkIdCourse === courseId || c.courseTitle === courseData.title);
        if (found) {
          setCertificate(found);
        } else {
          // Проверяем можно ли выдать сертификат автоматически
          // (все задания выполнены и приняты)
          // Это делается через API — здесь только отображаем
        }
      } catch {}
    } catch (err: any) {
      if (err?.response?.status === 404) {
        router.push('/courses');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className={styles.loading}><div className={styles.spinner} /></div>;
  if (!course) return null;

  // Stats
  const totalTasks = tasks.length;
  const acceptedTasks = tasks.filter((t) => attemptMap[t.pkIdTask]?.statusName === 'Принято').length;
  const pendingTasks = tasks.filter((t) => attemptMap[t.pkIdTask]?.statusName === 'На проверке').length;
  const rejectedTasks = tasks.filter((t) => {
    const s = attemptMap[t.pkIdTask]?.statusName;
    return s === 'Отклонено' || s === 'На доработке';
  }).length;
  const notStarted = tasks.filter((t) => !attemptMap[t.pkIdTask]).length;

  const totalScore = tasks.reduce((s, t) => s + (t.maxScore || 0), 0);
  const earnedScore = tasks.reduce((s, t) => {
    const a = attemptMap[t.pkIdTask];
    return s + (a?.score || 0);
  }, 0);

  const progressPercent = totalTasks > 0 ? Math.round((acceptedTasks / totalTasks) * 100) : 0;
  const scorePercent = totalScore > 0 ? Math.round((earnedScore / totalScore) * 100) : 0;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => router.push(`/courses/${courseId}`)} className={styles.backBtn}>
          ← К курсу
        </button>
        <h1>Моя успеваемость</h1>
      </div>

      {/* Course info */}
      <div className={styles.courseCard}>
        <h2>{course.title}</h2>
        <div className={styles.courseMeta}>
          <span>{formatDate(course.startDate)} — {formatDate(course.endDate)}</span>
          {!isEnrolled && <span className={styles.notEnrolled}>Вы не записаны на этот курс</span>}
        </div>
      </div>

      {/* Certificate */}
      {certificate && (
        <div className={styles.certCard}>
          <span className={styles.certIcon} aria-hidden />
          <div>
            <h3>Сертификат получен!</h3>
            <p>Выдан {formatDate(certificate.issuedAt)}</p>
          </div>
          <Link href="/certificates" className={styles.btnCert}>Просмотреть →</Link>
        </div>
      )}

      {/* Progress overview */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statCircle} style={{ '--pct': `${progressPercent}` } as any}>
            <span>{progressPercent}%</span>
          </div>
          <div className={styles.statLabel}>Выполнено заданий</div>
          <div className={styles.statSub}>{acceptedTasks} из {totalTasks}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statBig}>{earnedScore}</div>
          <div className={styles.statLabel}>Набрано баллов</div>
          <div className={styles.statSub}>из {totalScore} ({scorePercent}%)</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statBig}>{pendingTasks}</div>
          <div className={styles.statLabel}>На проверке</div>
          <div className={styles.statSub}>ожидают оценки</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statBig}>{notStarted}</div>
          <div className={styles.statLabel}>Не начато</div>
          <div className={styles.statSub}>заданий осталось</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className={styles.progressSection}>
        <div className={styles.progressHeader}>
          <span>Общий прогресс курса</span>
          <span>{progressPercent}%</span>
        </div>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      {/* Lessons breakdown */}
      <div className={styles.lessonsSection}>
        <h2>По урокам</h2>
        {lessons.map((lesson) => {
          const lessonTasks = tasks.filter((t) => t.fkIdLesson === lesson.pkIdLesson);
          const lessonAccepted = lessonTasks.filter((t) => attemptMap[t.pkIdTask]?.statusName === 'Принято').length;
          const lessonPct = lessonTasks.length > 0 ? Math.round((lessonAccepted / lessonTasks.length) * 100) : 0;

          return (
            <div key={lesson.pkIdLesson} className={styles.lessonRow}>
              <div className={styles.lessonInfo}>
                <Link href={`/courses/${courseId}/lessons/${lesson.pkIdLesson}`} className={styles.lessonTitle}>
                  {lesson.title}
                </Link>
                <div className={styles.lessonBar}>
                  <div className={styles.lessonFill} style={{ width: `${lessonPct}%` }} />
                </div>
              </div>
              <div className={styles.lessonStats}>
                <span className={styles.lessonPct}>{lessonPct}%</span>
                <span className={styles.lessonCount}>{lessonAccepted}/{lessonTasks.length}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tasks table */}
      <div className={styles.tasksSection}>
        <h2>Все задания</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Задание</th>
                <th>Тип</th>
                <th>Урок</th>
                <th>Статус</th>
                <th>Балл</th>
                <th>Дата сдачи</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => {
                const attempt = attemptMap[t.pkIdTask];
                const lessonForTask = lessons.find((l) => l.pkIdLesson === t.fkIdLesson);
                return (
                  <tr key={t.pkIdTask}>
                    <td className={styles.bold}>{t.title || t.taskTitle}</td>
                    <td><span className={styles.typeBadge}>{t.taskTypeName}</span></td>
                    <td className={styles.muted}>{lessonForTask?.title || '—'}</td>
                    <td>
                      {attempt ? (
                        <span className={`${styles.statusBadge} ${
                          attempt.statusName === 'Принято' ? styles.accepted :
                          attempt.statusName === 'На проверке' ? styles.pending : styles.rejected
                        }`}>{attempt.statusName}</span>
                      ) : (
                        <span className={styles.notStartedBadge}>Не начато</span>
                      )}
                    </td>
                    <td>
                      {attempt?.score !== null && attempt?.score !== undefined
                        ? <strong>{attempt.score}/{t.maxScore}</strong>
                        : <span className={styles.muted}>—/{t.maxScore}</span>}
                    </td>
                    <td className={styles.muted}>
                      {attempt ? formatDate(attempt.submittedAt) : '—'}
                    </td>
                    <td>
                      <Link
                        href={`/courses/${courseId}/lessons/${t.fkIdLesson || 0}/tasks/${t.pkIdTask}`}
                        className={styles.btnGo}
                      >
                        {attempt?.statusName === 'Принято' ? 'Просмотр' :
                         attempt?.statusName === 'На проверке' ? 'Ожидание' :
                         attempt ? 'Переделать' : 'Выполнить'}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
