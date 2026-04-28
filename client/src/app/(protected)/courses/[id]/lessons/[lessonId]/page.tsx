'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { lessonsApi } from '@/lib/api/lessons.api';
import { materialsApi } from '@/lib/api/materials.api';
import { tasksApi } from '@/lib/api/tasks.api';
import { attemptsApi } from '@/lib/api/attempts.api';
import type { ILesson, IMaterial, ITask } from '@/lib/types';
import { MATERIAL_TYPE_ICONS, TASK_TYPE, ATTEMPT_STATUS } from '@/lib/constants';
import Link from 'next/link';
import styles from './page.module.scss';

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const { user, checkRole } = useAuth();
  const courseId = Number(params.id);
  const lessonId = Number(params.lessonId);
  const initialized = useRef(false);

  const [lesson, setLesson] = useState<ILesson | null>(null);
  const [materials, setMaterials] = useState<IMaterial[]>([]);
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [attemptMap, setAttemptMap] = useState<Record<number, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isListener = checkRole(['Слушатель']);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [lessonsData, materialsData, tasksData] = await Promise.all([
        lessonsApi.getByCourse(courseId),
        materialsApi.getByLesson(lessonId),
        tasksApi.getByCourse(courseId),
      ]);

      const found = lessonsData.find((l) => l.pkIdLesson === lessonId);
      if (!found) { setError('Урок не найден'); return; }
      setLesson(found);
      setMaterials(materialsData.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)));

      const lessonTasks = tasksData
        .filter((t) => t.fkIdLesson === lessonId)
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      setTasks(lessonTasks);

      // Загружаем попытки слушателя
      if (user && isListener && lessonTasks.length > 0) {
        const attempts = await attemptsApi.getByListener(user.pkIdUser);
        const map: Record<number, any> = {};
        for (const a of attempts) {
          const taskId = (a as any).fkIdTask;
          if (taskId) map[taskId] = a;
        }
        setAttemptMap(map);
      }
    } catch {
      setError('Ошибка загрузки урока');
    } finally {
      setLoading(false);
    }
  };

  const getTaskStatus = (taskId: number) => {
    const a = attemptMap[taskId];
    if (!a) return null;
    return a.statusName;
  };

  const getMaterialIcon = (typeName: string, typeId: number) => {
    if (MATERIAL_TYPE_ICONS[typeId]) return MATERIAL_TYPE_ICONS[typeId];
    const t = typeName?.toLowerCase();
    if (t?.includes('видео')) return '🎬';
    if (t?.includes('pdf')) return '📄';
    if (t?.includes('презент')) return '📊';
    return '🔗';
  };

  const completedTasks = tasks.filter((t) => getTaskStatus(t.pkIdTask) === 'Принято').length;

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
          <h2>📎 Материалы урока</h2>
          <div className={styles.materialsList}>
            {materials.map((m) => (
              <a
                key={m.pkIdMaterial}
                href={m.fileUrl || m.link || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.materialItem}
              >
                <span className={styles.matIcon}>{getMaterialIcon(m.typeName, m.fkIdTypeMaterial)}</span>
                <div className={styles.matInfo}>
                  <strong>{m.title}</strong>
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
          <h2>📝 Задания</h2>
          <div className={styles.tasksList}>
            {tasks.map((t) => {
              const status = getTaskStatus(t.pkIdTask);
              const isTest = t.taskTypeName === 'Тест' || (t as any).fkIdTypeTasks === TASK_TYPE.TEST;
              const hasTestId = !!(t as any).fkIdTest;
              const taskHref = isTest && hasTestId
                ? `/courses/${courseId}/lessons/${lessonId}/tasks/${t.pkIdTask}/test`
                : `/courses/${courseId}/lessons/${lessonId}/tasks/${t.pkIdTask}`;

              return (
                <div key={t.pkIdTask} className={`${styles.taskItem} ${status === 'Принято' ? styles.taskDone : ''}`}>
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
                      <span>⭐ {t.maxScore} баллов</span>
                      {t.deadline && (
                        <span className={new Date(t.deadline) < new Date() ? styles.overdue : ''}>
                          📅 до {new Date(t.deadline).toLocaleDateString('ru-RU')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={styles.taskRight}>
                    {status === 'Принято' ? (
                      <span className={styles.doneIcon}>✅</span>
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
