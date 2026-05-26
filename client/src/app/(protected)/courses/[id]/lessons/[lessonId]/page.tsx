'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { lessonsApi } from '@/lib/api/lessons.api';
import { materialsApi } from '@/lib/api/materials.api';
import { tasksApi } from '@/lib/api/tasks.api';
import { attemptsApi } from '@/lib/api/attempts.api';
import { groupsApi } from '@/lib/api/groups.api';
import { groupListenersApi } from '@/lib/api/groupListeners.api';
import { getMaterialTitle, type ILesson, type IMaterial, type ITask } from '@/lib/types';
import {
  isLessonUnlockedForListener,
  lessonUnlockReason,
} from '@/lib/course/lessonUnlock';
import { MATERIAL_TYPE_ICONS, TASK_TYPE } from '@/lib/constants';
import Link from 'next/link';
import { getApiErrorMessage } from '@/lib/http/getApiErrorMessage';
import { attemptRowTaskId, attemptAnswerFileUrl } from '@/lib/attempts/attemptTaskId';
import styles from './page.module.scss';

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const { user, checkRole } = useAuth();
  const courseId = Number(params.id);
  const lessonId = Number(params.lessonId);

  const [lesson, setLesson] = useState<ILesson | null>(null);
  const [materials, setMaterials] = useState<IMaterial[]>([]);
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [attemptMap, setAttemptMap] = useState<Record<number, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isListener = checkRole(['Слушатель']);

  useEffect(() => {
    loadData();
  }, [courseId, lessonId, user, isListener]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [lessonsData, materialsData, tasksData] = await Promise.all([
        lessonsApi.getByCourse(courseId),
        materialsApi.getByLesson(lessonId),
        tasksApi.getByCourse(courseId),
      ]);

      const sortedLessons = [...lessonsData].sort(
        (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0),
      );
      const found = sortedLessons.find((l) => l.pkIdLesson === lessonId);
      if (!found) {
        setError('Урок не найден');
        return;
      }
      setLesson(found);
      setMaterials(materialsData.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)));

      const lessonTasks = tasksData
        .filter((t) => t.fkIdLesson === lessonId)
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      setTasks(lessonTasks);

      let attemptsList: import('@/lib/course/courseProgress').AttemptLite[] = [];

      if (user && isListener) {
        const courseGroups = await groupsApi.getByCourse(courseId);
        const courseGroupIds = new Set(courseGroups.map((g) => g.pkIdGroup));
        const enrollments = await groupListenersApi.getByListener(user.pkIdUser);
        const enrolled = enrollments.some(
          (e) =>
            e.fkIdGroup != null && courseGroupIds.has(e.fkIdGroup),
        );
        if (!enrolled) {
          setError('Запишитесь на курс, чтобы открывать уроки.');
          return;
        }

        attemptsList = await attemptsApi.getByListener(user.pkIdUser);
        const lessonIndex = sortedLessons.findIndex((l) => l.pkIdLesson === lessonId);
        if (
          lessonIndex >= 0 &&
          !isLessonUnlockedForListener(lessonIndex, sortedLessons, tasksData, attemptsList)
        ) {
          setError(lessonUnlockReason(lessonIndex, sortedLessons, tasksData, attemptsList) || 'Урок недоступен');
          return;
        }

        const map: Record<number, any> = {};
        for (const a of attemptsList) {
          const taskId = attemptRowTaskId(a);
          if (taskId != null) map[taskId] = a;
        }
        setAttemptMap(map);
      } else {
        setAttemptMap({});
      }
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Ошибка загрузки урока'));
    } finally {
      setLoading(false);
    }
  };

  const getTaskAttempt = (taskId: number) => {
    const n = Number(taskId);
    if (!Number.isFinite(n)) return null;
    return attemptMap[n] ?? null;
  };

  const getTaskStatus = (taskId: number) => {
    const a = getTaskAttempt(taskId);
    if (!a) return null;
    return a.statusName;
  };

  const getMaterialIcon = (typeName: string, typeId: number) => {
    if (MATERIAL_TYPE_ICONS[typeId]) return MATERIAL_TYPE_ICONS[typeId];
    const t = typeName?.toLowerCase();
    if (t?.includes('видео')) return 'Видео';
    if (t?.includes('pdf')) return 'PDF';
    if (t?.includes('презент')) return 'Презентация';
    return 'Ссылка';
  };

  const completedTasks = tasks.filter((t) => getTaskStatus(Number(t.pkIdTask)) === 'Принято').length;

  if (loading) return <div className={styles.loading}><div className={styles.spinner} /></div>;
  if (error || !lesson) return (
    <div className={styles.errorPage}>
      <p>{error || 'Урок не найден'}</p>
      <button onClick={() => router.push(`/courses/${courseId}`)} className={styles.backBtn}>← К курсу</button>
    </div>
  );

  return (
    <div className={styles.container}>
      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        <button onClick={() => router.push(`/courses/${courseId}`)} className={styles.breadLink}>← К курсу</button>
      </div>

      {/* Lesson header */}
      <div className={styles.lessonHeader}>
        <div className={styles.lessonMeta}>
          <span className={styles.lessonLabel}>Урок</span>
          {isListener && tasks.length > 0 && (
            <span className={styles.progressBadge}>
              {completedTasks}/{tasks.length} заданий выполнено
            </span>
          )}
        </div>
        <h1>{lesson.title}</h1>
        {lesson.description && <p className={styles.lessonDesc}>{lesson.description}</p>}
      </div>

      {/* Content */}
      {lesson.content && (
        <div className={styles.contentCard}>
          <div
            className={styles.lessonContent}
            dangerouslySetInnerHTML={{ __html: lesson.content }}
          />
        </div>
      )}

      {/* Materials */}
      {materials.length > 0 && (
        <div className={styles.card}>
          <h2>Материалы урока</h2>
          <div className={styles.materialsList}>
            {materials.map((m) => (
              <a
                key={m.pkIdMaterial}
                href={m.fileUrl || m.link || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.materialItem}
              >
                <span className={styles.matIcon}>{getMaterialIcon(m.typeName, m.fkIdTypeMaterial ?? 0)}</span>
                <div className={styles.matInfo}>
                  <strong>{getMaterialTitle(m)}</strong>
                  {m.description && <span>{m.description}</span>}
                  <span className={styles.matType}>{m.typeName}</span>
                </div>
                <span className={styles.matArrow}>↓</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Tasks */}
      {tasks.length > 0 && (
        <div className={styles.card}>
          <h2>Задания</h2>
          <div className={styles.tasksList}>
            {tasks.map((t) => {
              const tid = Number(t.pkIdTask);
              const status = getTaskStatus(tid);
              const att = getTaskAttempt(tid);
              const fileUrl = att ? attemptAnswerFileUrl(att) : '';
              const taskTypeId = t.typeId ?? (t as { fkIdTypeTasks?: number }).fkIdTypeTasks;
              const isTest = taskTypeId === TASK_TYPE.TEST;
              const hasTestId = !!t.fkIdTest;
              const taskHref = isTest && hasTestId
                ? `/courses/${courseId}/lessons/${lessonId}/tasks/${tid}/test`
                : `/courses/${courseId}/lessons/${lessonId}/tasks/${tid}`;

              return (
                <div key={tid} className={`${styles.taskItem} ${status === 'Принято' ? styles.taskDone : ''}`}>
                  <div className={styles.taskLeft}>
                    <div className={styles.taskTop}>
                      <span className={styles.taskTypeBadge}>{t.taskTypeName}</span>
                      {status && (
                        <span className={`${styles.taskStatus} ${
                          status === 'Принято' ? styles.statusAccepted :
                          status === 'На проверке' ? styles.statusPending : styles.statusRejected
                        }`}>{status}</span>
                      )}
                    </div>
                    <strong className={styles.taskTitle}>{t.title || t.taskTitle}</strong>
                    {t.description && <p className={styles.taskDesc}>{t.description}</p>}
                    <div className={styles.taskMeta}>
                      <span>Макс. {t.maxScore} баллов</span>
                      {status === 'Принято' &&
                        att &&
                        att.score != null &&
                        att.score !== undefined && (
                          <span className={styles.scoreEarned}>
                            Балл: {att.score} / {t.maxScore}
                          </span>
                        )}
                      {t.deadline && (
                        <span className={new Date(t.deadline) < new Date() ? styles.overdue : ''}>
                          Срок: {new Date(t.deadline).toLocaleDateString('ru-RU')}
                        </span>
                      )}
                      {status === 'Принято' && fileUrl && (
                        <a
                          className={styles.answerLink}
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Ссылка на ответ
                        </a>
                      )}
                    </div>
                  </div>
                  <div className={styles.taskRight}>
                    {status === 'Принято' ? (
                      <span className={styles.doneLabel}>Готово</span>
                    ) : (
                      <Link href={taskHref} className={styles.taskBtn}>
                        {status === 'На проверке' ? 'Просмотр' :
                         status === 'Отклонено' || status === 'На доработке' ? 'Переделать' :
                         isTest ? 'Пройти тест' : 'Выполнить'}
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
