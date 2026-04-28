'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { coursesApi } from '@/lib/api/courses.api';
import { courseTeachersApi, type ICourseTeacher } from '@/lib/api/courseTeachers.api';
import { lessonsApi } from '@/lib/api/lessons.api';
import { tasksApi } from '@/lib/api/tasks.api';
import { materialsApi } from '@/lib/api/materials.api';
import { groupListenersApi } from '@/lib/api/groupListeners.api';
import { groupsApi } from '@/lib/api/groups.api';
import { attemptsApi } from '@/lib/api/attempts.api';
import type { ICourse, ILesson, ITask, IMaterial } from '@/lib/types';
import Link from 'next/link';
import { CourseReportGenerator } from '@/components/CourseReportPDF';
import styles from './page.module.scss';

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, checkRole } = useAuth();
  const courseId = Number(params.id);
  const initialized = useRef(false);
  const justEnrolled = searchParams.get('enrolled') === '1';

  const [course, setCourse] = useState<ICourse | null>(null);
  const [teachers, setTeachers] = useState<ICourseTeacher[]>([]);
  const [lessons, setLessons] = useState<ILesson[]>([]);
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [materials, setMaterials] = useState<IMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedLesson, setExpandedLesson] = useState<number | null>(null);

  // Listener-specific state
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [myAttempts, setMyAttempts] = useState<any[]>([]);

  const isAdmin = checkRole(['Администратор']);
  const isTeacher = checkRole(['Преподаватель']);
  const isListener = checkRole(['Слушатель']);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const courseData = await coursesApi.getById(courseId);
      setCourse(courseData);

      const [teachersRes, lessonsRes, tasksRes, materialsRes] = await Promise.allSettled([
        courseTeachersApi.getByCourse(courseId),
        lessonsApi.getByCourse(courseId),
        tasksApi.getByCourse(courseId),
        materialsApi.getByCourse(courseId),
      ]);

      if (teachersRes.status === 'fulfilled') setTeachers(teachersRes.value);
      if (lessonsRes.status === 'fulfilled')
        setLessons(lessonsRes.value.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)));
      if (tasksRes.status === 'fulfilled')
        setTasks(tasksRes.value.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)));
      if (materialsRes.status === 'fulfilled')
        setMaterials(materialsRes.value.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)));

      // Check enrollment and attempts for listener
      if (user && isListener) {
        const [enrollments, attempts] = await Promise.allSettled([
          groupListenersApi.getByListener(user.pkIdUser),
          attemptsApi.getByListener(user.pkIdUser),
        ]);
        if (enrollments.status === 'fulfilled') {
          // Получаем группы курса и проверяем есть ли слушатель в любой из них
          try {
            const courseGroups = await groupsApi.getByCourse(courseId);
            const courseGroupIds = new Set(courseGroups.map((g) => g.pkIdGroup));
            const enrolled = enrollments.value.some((e: any) => courseGroupIds.has(e.fkIdGroup));
            setIsEnrolled(enrolled);
          } catch {
            setIsEnrolled(false);
          }
        }
        if (attempts.status === 'fulfilled') setMyAttempts(attempts.value);
      }
    } catch (err: any) {
      setError(err.response?.status === 404 ? 'Курс не найден' : 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const toggleLesson = (lessonId: number) => {
    setExpandedLesson(expandedLesson === lessonId ? null : lessonId);
  };

  const getLessonTasks = (lessonId: number) => tasks.filter((t) => t.fkIdLesson === lessonId);
  const getLessonMaterials = (lessonId: number) => materials.filter((m) => m.fkIdLesson === lessonId);
  const getGlobalTasks = () => tasks.filter((t) => !t.fkIdLesson);
  const getGlobalMaterials = () => materials.filter((m) => !m.fkIdLesson);

  const getAttemptForTask = (taskId: number) =>
    myAttempts.find((a: any) => a.fkIdTask === taskId || a.pkIdTask === taskId);

  const getAttemptStatus = (taskId: number) => {
    const attempt = getAttemptForTask(taskId);
    if (!attempt) return null;
    return attempt.statusName;
  };

  const isCourseTeacher = teachers.some((t) => t.fkIdTeacher === user?.pkIdUser);
  const canManage = isAdmin || isCourseTeacher;
  const canEnroll = isListener && course?.fkIdStatus === 2 && !isEnrolled;

  if (loading) return <div className={styles.loading}>Загрузка...</div>;
  if (error) return (
    <div className={styles.error}>
      <p>{error}</p>
      <button onClick={() => router.push('/courses')} className={styles.backBtn}>← Назад к каталогу</button>
    </div>
  );
  if (!course) return null;

  // ===== LISTENER VIEW =====
  if (isListener) {
    return (
      <div className={styles.container}>
        <div className={styles.topBar}>
          <button onClick={() => router.push('/courses')} className={styles.backBtn}>← К каталогу</button>
        </div>

        {/* Course hero */}
        <div className={styles.courseInfo}>
          {justEnrolled && (
            <div className={styles.successBanner}>
              🎉 Вы успешно записались на курс! Начните изучение прямо сейчас.
            </div>
          )}
          <h1>{course.title}</h1>
          <p className={styles.description}>{course.description}</p>
          <div className={styles.meta}>
            {course.tags && <span className={styles.tags}>{course.tags}</span>}
            <span className={styles.dates}>
              📅 {new Date(course.startDate).toLocaleDateString('ru-RU')} — {new Date(course.endDate).toLocaleDateString('ru-RU')}
            </span>
          </div>
          <div className={styles.teachers}>
            <h3>Преподаватели:</h3>
            <div className={styles.teacherList}>
              {teachers.length > 0
                ? teachers.map((t) => <span key={t.pkIdCourseTeacher} className={styles.teacher}>{t.teacherName}</span>)
                : <span className={styles.noTeachers}>Не назначены</span>}
            </div>
          </div>

          {canEnroll && (
            <Link href={`/courses/${courseId}/enroll`} className={styles.enrollBtn}>
              Записаться на курс
            </Link>
          )}
          {isEnrolled && (
            <div className={styles.enrolledBadge}>✓ Вы записаны на этот курс</div>
          )}
          {isEnrolled && (
            <Link href={`/courses/${courseId}/progress`} className={styles.progressBtn}>
              📊 Моя успеваемость
            </Link>
          )}
        </div>

        {/* Lessons for listener */}
        <div className={styles.content}>
          <h2>Программа курса</h2>
          {lessons.length === 0 ? (
            <p className={styles.empty}>Уроки пока не добавлены</p>
          ) : (
            <div className={styles.lessons}>
              {lessons.map((lesson, index) => {
                const isExpanded = expandedLesson === lesson.pkIdLesson;
                const lessonTasks = getLessonTasks(lesson.pkIdLesson);
                const lessonMats = getLessonMaterials(lesson.pkIdLesson);

                return (
                  <div key={lesson.pkIdLesson} className={styles.lesson}>
                    <div className={styles.lessonHeader} onClick={() => toggleLesson(lesson.pkIdLesson)}>
                      <div className={styles.lessonNumber}>{index + 1}</div>
                      <div className={styles.lessonTitle}>
                        <h4>{lesson.title}</h4>
                        {lesson.description && <p>{lesson.description}</p>}
                      </div>
                      <div className={styles.lessonRight}>
                        {lessonTasks.length > 0 && (
                          <span className={styles.taskCount}>{lessonTasks.length} зад.</span>
                        )}
                        <span className={styles.toggle}>{isExpanded ? '−' : '+'}</span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className={styles.lessonBody}>
                        {lesson.content && (
                          <div className={styles.lessonContent} dangerouslySetInnerHTML={{ __html: lesson.content }} />
                        )}

                        {lessonMats.length > 0 && (
                          <div className={styles.section}>
                            <h5>Материалы</h5>
                            <div className={styles.materialsList}>
                              {lessonMats.map((mat) => (
                                <div key={mat.pkIdMaterial} className={styles.materialItem}>
                                  <span className={styles.matIcon}>
                                    {mat.typeName?.includes('Видео') ? '🎬' : mat.typeName?.includes('PDF') ? '📄' : mat.typeName?.includes('Презент') ? '📊' : '🔗'}
                                  </span>
                                  <span className={styles.matTitle}>{mat.title}</span>
                                  {(mat.fileUrl || mat.link) && (
                                    <a href={mat.fileUrl || mat.link} target="_blank" rel="noreferrer" className={styles.matLink}>
                                      Открыть →
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {lessonTasks.length > 0 && (
                          <div className={styles.section}>
                            <h5>Задания</h5>
                            <div className={styles.tasksList}>
                              {lessonTasks.map((task) => {
                                const status = getAttemptStatus(task.pkIdTask);
                                return (
                                  <div key={task.pkIdTask} className={styles.taskItem}>
                                    <div className={styles.taskInfo}>
                                      <span className={styles.taskTypeBadge}>{task.taskTypeName}</span>
                                      <strong>{task.title || task.taskTitle}</strong>
                                      {task.description && <p>{task.description}</p>}
                                      <div className={styles.taskMeta}>
                                        <span>Макс. балл: {task.maxScore}</span>
                                        {task.deadline && <span>Срок: {new Date(task.deadline).toLocaleDateString('ru-RU')}</span>}
                                      </div>
                                    </div>
                                    <div className={styles.taskAction}>
                                      {status === 'Принято' && <span className={styles.statusAccepted}>✓ Принято</span>}
                                      {status === 'На проверке' && <span className={styles.statusPending}>⏳ На проверке</span>}
                                      {status === 'Отклонено' && (
                                        <Link href={`/courses/${courseId}/lessons/${lesson.pkIdLesson}/tasks/${task.pkIdTask}`} className={styles.btnRetry}>
                                          Переделать
                                        </Link>
                                      )}
                                      {!status && (
                                        <Link
                                          href={`/courses/${courseId}/lessons/${lesson.pkIdLesson}/tasks/${task.pkIdTask}${task.taskTypeName === 'Тест' ? '/test' : ''}`}
                                          className={styles.btnDoTask}
                                        >
                                          {task.taskTypeName === 'Тест' ? 'Пройти тест' : 'Выполнить'}
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
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===== ADMIN / TEACHER VIEW =====
  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <button onClick={() => router.push('/courses')} className={styles.backBtn}>← К каталогу</button>
        <div style={{ display: 'flex', gap: '1.2rem' }}>
          <CourseReportGenerator
            course={course}
            teachers={teachers}
            lessons={lessons}
            tasks={tasks}
            materials={materials}
            className={styles.reportBtn}
          />
          {canManage && (
            <Link href={`/courses/${courseId}/manage`} className={styles.manageBtn}>
              Управление курсом
            </Link>
          )}
        </div>
      </div>

      <div className={styles.courseInfo}>
        <h1>{course.title}</h1>
        <p className={styles.description}>{course.description}</p>
        <div className={styles.meta}>
          <span className={`${styles.badge} ${styles[course.statusName?.toLowerCase()]}`}>{course.statusName}</span>
          {course.tags && <span className={styles.tags}>{course.tags}</span>}
          <span className={styles.dates}>
            📅 {new Date(course.startDate).toLocaleDateString('ru-RU')} — {new Date(course.endDate).toLocaleDateString('ru-RU')}
          </span>
        </div>
        <div className={styles.teachers}>
          <h3>Преподаватели:</h3>
          <div className={styles.teacherList}>
            {teachers.length > 0
              ? teachers.map((t) => <span key={t.pkIdCourseTeacher} className={styles.teacher}>{t.teacherName}</span>)
              : <span className={styles.noTeachers}>Не назначены</span>}
          </div>
        </div>
      </div>

      <div className={styles.content}>
        <h2>Программа курса</h2>
        {lessons.length > 0 ? (
          <div className={styles.lessons}>
            {lessons.map((lesson, index) => {
              const isExpanded = expandedLesson === lesson.pkIdLesson;
              const lessonTasks = getLessonTasks(lesson.pkIdLesson);
              const lessonMaterials = getLessonMaterials(lesson.pkIdLesson);
              return (
                <div key={lesson.pkIdLesson} className={styles.lesson}>
                  <div className={styles.lessonHeader} onClick={() => toggleLesson(lesson.pkIdLesson)}>
                    <div className={styles.lessonNumber}>{index + 1}</div>
                    <div className={styles.lessonTitle}>
                      <h4>{lesson.title}</h4>
                      {lesson.description && <p>{lesson.description}</p>}
                    </div>
                    <span className={styles.toggle}>{isExpanded ? '−' : '+'}</span>
                  </div>
                  {isExpanded && (
                    <div className={styles.lessonBody}>
                      {lesson.content && (
                        <div className={styles.lessonContent} dangerouslySetInnerHTML={{ __html: lesson.content }} />
                      )}
                      {lessonTasks.length > 0 && (
                        <div className={styles.section}>
                          <h5>Задания</h5>
                          <div className={styles.items}>
                            {lessonTasks.map((task) => (
                              <div key={task.pkIdTask} className={styles.item}>
                                <div className={styles.itemHeader}>
                                  <span className={styles.itemType}>{task.taskTypeName}</span>
                                  <span className={styles.itemScore}>{task.maxScore} балл.</span>
                                </div>
                                <h6>{task.title || task.taskTitle}</h6>
                                <p>{task.description}</p>
                                {task.deadline && <small>Дедлайн: {new Date(task.deadline).toLocaleDateString('ru-RU')}</small>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {lessonMaterials.length > 0 && (
                        <div className={styles.section}>
                          <h5>Материалы</h5>
                          <div className={styles.items}>
                            {lessonMaterials.map((mat) => (
                              <div key={mat.pkIdMaterial} className={styles.item}>
                                <span className={styles.itemType}>{mat.typeName}</span>
                                <h6>{mat.title}</h6>
                                <div className={styles.itemLinks}>
                                  {mat.fileUrl && <a href={mat.fileUrl} download>Скачать</a>}
                                  {mat.link && <a href={mat.link} target="_blank" rel="noreferrer">Открыть ссылку</a>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className={styles.empty}>Уроки пока не добавлены</p>
        )}

        {getGlobalTasks().length > 0 && (
          <div className={styles.globalSection}>
            <h3>Общие задания курса</h3>
            <div className={styles.items}>
              {getGlobalTasks().map((task) => (
                <div key={task.pkIdTask} className={styles.item}>
                  <div className={styles.itemHeader}>
                    <span className={styles.itemType}>{task.taskTypeName}</span>
                    <span className={styles.itemScore}>{task.maxScore} балл.</span>
                  </div>
                  <h6>{task.title}</h6>
                  <p>{task.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {getGlobalMaterials().length > 0 && (
          <div className={styles.globalSection}>
            <h3>Дополнительные материалы</h3>
            <div className={styles.items}>
              {getGlobalMaterials().map((mat) => (
                <div key={mat.pkIdMaterial} className={styles.item}>
                  <span className={styles.itemType}>{mat.typeName}</span>
                  <h6>{mat.title}</h6>
                  <div className={styles.itemLinks}>
                    {mat.fileUrl && <a href={mat.fileUrl} download>Скачать</a>}
                    {mat.link && <a href={mat.link} target="_blank" rel="noreferrer">Открыть</a>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
