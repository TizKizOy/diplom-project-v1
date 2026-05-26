'use client';

import { useEffect, useState } from 'react';
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
import { issueCertificateIfComplete } from '@/lib/certificates/issueCertificateIfComplete';
import { getMaterialTitle, type ICourse, type ILesson, type ITask, type IMaterial } from '@/lib/types';
import Link from 'next/link';
import { CourseReportGenerator } from '@/components/CourseReportPDF';
import {
  getContinueLessonId,
  courseProgressPercent,
} from '@/lib/course/courseProgress';
import { MATERIAL_TYPE_ICONS, isPublishedCourse } from '@/lib/constants';
import styles from './page.module.scss';

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, checkRole } = useAuth();
  const courseId = Number(params.id);
  const justEnrolled = searchParams.get('enrolled') === '1';

  const [course, setCourse] = useState<ICourse | null>(null);
  const [teachers, setTeachers] = useState<ICourseTeacher[]>([]);
  const [lessons, setLessons] = useState<ILesson[]>([]);
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [materials, setMaterials] = useState<IMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedLesson, setExpandedLesson] = useState<number | null>(null);
  const formatDate = (value?: string | null) => {
    if (!value) return '—';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleDateString('ru-RU');
  };

  const formatDeadline = (value?: string | null) => {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' });
  };

  // Listener-specific state
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [myAttempts, setMyAttempts] = useState<any[]>([]);

  const isAdmin = checkRole(['Администратор']);
  const isTeacher = checkRole(['Преподаватель']);
  const isListener = checkRole(['Слушатель']);

  useEffect(() => {
    loadData();
  }, [courseId, user, isListener]);

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

      if (user && isListener) {
        const [enrollments, attempts] = await Promise.allSettled([
          groupListenersApi.getByListener(user.pkIdUser),
          attemptsApi.getByListener(user.pkIdUser),
        ]);
        if (attempts.status === 'fulfilled') setMyAttempts(attempts.value);

        if (enrollments.status === 'fulfilled') {
          try {
            const courseGroups = await groupsApi.getByCourse(courseId);
            const courseGroupIds = new Set(courseGroups.map((g) => g.pkIdGroup));
            const enrolled = enrollments.value.some(
              (e) =>
                e.fkIdGroup != null && courseGroupIds.has(e.fkIdGroup),
            );
            setIsEnrolled(enrolled);
            if (enrolled && attempts.status === 'fulfilled') {
              await issueCertificateIfComplete(courseId);
            }
          } catch {
            setIsEnrolled(false);
          }
        }
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
  const canEnroll = isListener && isPublishedCourse(course) && !isEnrolled;

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
    const continueLessonId =
      isEnrolled && lessons.length > 0
        ? getContinueLessonId(lessons, tasks, myAttempts)
        : null;
    const coursePct =
      isEnrolled && lessons.length > 0
        ? courseProgressPercent(lessons, tasks, myAttempts)
        : 0;

    return (
      <div className={styles.container}>
        {canEnroll && (
          <div className={styles.enrollPanel}>
            <div>
              <strong>Запись на курс</strong>
              <p>После записи вы попадёте в учебную группу и сможете проходить уроки по порядку.</p>
            </div>
            <Link href={`/courses/${courseId}/enroll`} className={styles.enrollPanelBtn}>
              Записаться на курс
            </Link>
          </div>
        )}
        <div className={styles.courseInfo}>
          {justEnrolled && (
            <div className={styles.successBanner}>
              Вы записались на курс. Откройте первый урок в программе слева или нажмите «Продолжить обучение».
            </div>
          )}
          <h1>{course.title}</h1>
          <p className={styles.description}>{course.description}</p>
          <div className={styles.meta}>
            {course.tags && <span className={styles.tags}>{course.tags}</span>}
            <span className={styles.dates}>
              {formatDate(course.startDate)} — {formatDate(course.endDate)}
            </span>
          </div>
          <div className={styles.teachers}>
            <h3>Преподаватели</h3>
            <div className={styles.teacherList}>
              {teachers.length > 0
                ? teachers.map((t) => (
                    <span key={t.pkIdCourseTeacher} className={styles.teacher}>
                      {t.teacherName}
                    </span>
                  ))
                : <span className={styles.noTeachers}>Не назначены</span>}
            </div>
          </div>
          {!isEnrolled && (
            <p className={styles.programHint}>
              Запишитесь на курс, чтобы открыть уроки и выполнять задания. Ниже — программа в свёрнутом виде со сроками.
            </p>
          )}

          <div className={styles.heroActions}>
            {canEnroll && (
              <Link href={`/courses/${courseId}/enroll`} className={styles.enrollBtn}>
                Записаться на курс
              </Link>
            )}
            {isEnrolled && continueLessonId && (
              <Link
                href={`/courses/${courseId}/lessons/${continueLessonId}`}
                className={styles.continueBtn}
              >
                Продолжить обучение
              </Link>
            )}
            {isEnrolled && (
              <Link href={`/courses/${courseId}/progress`} className={styles.outlineBtn}>
                Успеваемость
              </Link>
            )}
            {isEnrolled && lessons.length > 0 && (
              <span className={styles.coursePct}>{coursePct}% курса</span>
            )}
          </div>

          {isEnrolled && (
            <div className={styles.enrolledBadge}>Вы на курсе</div>
          )}
        </div>

        <div className={styles.content}>
          {isEnrolled ? (
            <>
              <h2>Как проходить</h2>
              <p className={styles.programHint}>
                Слева — программа: уроки открываются по очереди, когда все задания предыдущего урока приняты.
                Теория и материалы — на странице урока.
              </p>
              {getGlobalTasks().length > 0 && (
                <div className={styles.globalExtra}>
                  <h3>Общие задания курса</h3>
                  <p className={styles.mutedSmall}>Не привязаны к уроку — выполняйте по ссылке с курса преподавателя или из уведомлений.</p>
                  <div className={styles.tasksList}>
                    {getGlobalTasks().map((task) => {
                      const status = getAttemptStatus(task.pkIdTask);
                      return (
                        <div key={task.pkIdTask} className={styles.taskItem}>
                          <div className={styles.taskInfo}>
                            <span className={styles.taskTypeBadge}>{task.taskTypeName}</span>
                            <strong>{task.title || task.taskTitle}</strong>
                          </div>
                          <div className={styles.taskAction}>
                            {status === 'Принято' && <span className={styles.statusAccepted}>Принято</span>}
                            {status === 'На проверке' && <span className={styles.statusPending}>На проверке</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <h2>Программа курса</h2>
              <p className={styles.programHint}>
                Содержимое уроков доступно после записи на курс.
              </p>
              {lessons.length === 0 ? (
                <p className={styles.empty}>Уроки пока не добавлены</p>
              ) : (
                <div className={styles.lessons}>
                  {lessons.map((lesson, index) => {
                    const lessonTasks = getLessonTasks(lesson.pkIdLesson);
                    return (
                      <div key={lesson.pkIdLesson} className={`${styles.lesson} ${styles.lessonLocked}`}>
                        <div className={`${styles.lessonHeader} ${styles.lessonHeaderLocked}`}>
                          <div className={styles.lessonNumber}>{index + 1}</div>
                          <div className={styles.lessonTitle}>
                            <h4>{lesson.title}</h4>
                            {lessonTasks.length > 0 && (
                              <ul className={styles.deadlineList}>
                                {lessonTasks.map((task) => {
                                  const label = formatDeadline(task.deadline);
                                  return (
                                    <li key={task.pkIdTask}>
                                      {task.title || task.taskTitle}
                                      {label ? ` — до ${label}` : ''}
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </div>
                          <div className={styles.lessonRight}>
                            {lessonTasks.length > 0 && (
                              <span className={styles.taskCount}>{lessonTasks.length} зад.</span>
                            )}
                            <span className={styles.lockLabel}>Закрыто</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
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
            {formatDate(course.startDate)} — {formatDate(course.endDate)}
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
                                {task.deadline && <small>Дедлайн: {formatDate(task.deadline)}</small>}
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
                                <h6>{getMaterialTitle(mat)}</h6>
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
                  <h6>{getMaterialTitle(mat)}</h6>
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
