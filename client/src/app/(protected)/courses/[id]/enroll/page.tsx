'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { coursesApi } from '@/lib/api/courses.api';
import { groupsApi } from '@/lib/api/groups.api';
import { groupListenersApi } from '@/lib/api/groupListeners.api';
import { courseTeachersApi } from '@/lib/api/courseTeachers.api';
import type { ICourse, IGroup } from '@/lib/types';
import { COURSE_STATUS } from '@/lib/constants';
import styles from './page.module.scss';

const GROUP_MAX_SIZE = 25; // максимум слушателей в группе

export default function EnrollPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const courseId = Number(params.id);
  const initialized = useRef(false);

  const [course, setCourse] = useState<ICourse | null>(null);
  const [groups, setGroups] = useState<IGroup[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [alreadyEnrolled, setAlreadyEnrolled] = useState(false);
  const [enrolledGroup, setEnrolledGroup] = useState<IGroup | null>(null);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [courseData, groupsData, teachersData] = await Promise.all([
        coursesApi.getById(courseId),
        groupsApi.getByCourse(courseId),
        courseTeachersApi.getByCourse(courseId),
      ]);

      if (courseData.fkIdStatus !== COURSE_STATUS.PUBLISHED) {
        setError('Этот курс недоступен для записи');
        setLoading(false);
        return;
      }

      setCourse(courseData);
      setTeachers(teachersData);

      // Проверяем не записан ли уже
      if (user) {
        const enrollments = await groupListenersApi.getByListener(user.pkIdUser);
        const groupIds = new Set(groupsData.map((g) => g.pkIdGroup));
        const myEnrollment = enrollments.find((e: any) => groupIds.has(e.fkIdGroup));
        if (myEnrollment) {
          const myGroup = groupsData.find((g) => g.pkIdGroup === (myEnrollment as any).fkIdGroup);
          setAlreadyEnrolled(true);
          setEnrolledGroup(myGroup || null);
          setLoading(false);
          return;
        }
      }

      setGroups(groupsData);
    } catch {
      setError('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  // Автоматически находим или создаём группу
  const handleEnroll = async () => {
    if (!user || !course) return;
    setSubmitting(true);
    setError('');

    try {
      // Ищем группу с местом
      const availableGroup = groups.find((g) => (g.listenerCount || 0) < GROUP_MAX_SIZE);

      let targetGroupId: number;

      if (availableGroup) {
        // Есть место в существующей группе
        targetGroupId = availableGroup.pkIdGroup;
      } else {
        // Создаём новую группу автоматически
        const groupNumber = groups.length + 1;
        const newGroup = await groupsApi.create({
          name: `${course.title.slice(0, 20)} — Группа ${groupNumber}`,
          courseId,
          curatorId: teachers[0]?.fkIdTeacher || undefined,
        });
        targetGroupId = newGroup.pkIdGroup;
      }

      await groupListenersApi.create({ groupId: targetGroupId, listenerId: user.pkIdUser });
      router.push(`/courses/${courseId}?enrolled=1`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка записи на курс');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className={styles.loading}><div className={styles.spinner} /></div>;

  if (error && !course) return (
    <div className={styles.errorPage}>
      <span>⚠️</span>
      <p>{error}</p>
      <button onClick={() => router.push('/courses')} className={styles.btnBack}>← К каталогу</button>
    </div>
  );

  if (alreadyEnrolled) return (
    <div className={styles.alreadyPage}>
      <span>✅</span>
      <h2>Вы уже записаны на этот курс</h2>
      <p className={styles.courseName}>{course?.title}</p>
      {enrolledGroup && (
        <p className={styles.groupInfo}>
          Ваша группа: <strong>{enrolledGroup.name || (enrolledGroup as any).groupName}</strong>
        </p>
      )}
      <button onClick={() => router.push(`/courses/${courseId}`)} className={styles.btnPrimary}>
        Перейти к курсу →
      </button>
    </div>
  );

  // Считаем доступные места
  const totalSlots = groups.length * GROUP_MAX_SIZE;
  const takenSlots = groups.reduce((s, g) => s + (g.listenerCount || 0), 0);
  const freeSlots = groups.length > 0 ? totalSlots - takenSlots : 'неограничено';
  const hasAvailableGroup = groups.some((g) => (g.listenerCount || 0) < GROUP_MAX_SIZE);

  return (
    <div className={styles.container}>
      <button onClick={() => router.back()} className={styles.backBtn}>← Назад</button>

      <div className={styles.coursePreview}>
        <div className={styles.coursePreviewBadge}>Запись на курс</div>
        <h1>{course?.title}</h1>
        <p>{course?.description}</p>
        <div className={styles.courseMeta}>
          {course?.startDate && <span>📅 {new Date(course.startDate).toLocaleDateString('ru-RU')}</span>}
          {course?.endDate && <span>🏁 до {new Date(course.endDate).toLocaleDateString('ru-RU')}</span>}
          {teachers.length > 0 && <span>👨‍🏫 {teachers.map((t) => t.teacherName).join(', ')}</span>}
        </div>
      </div>

      <div className={styles.enrollSection}>
        <h2>Запись на курс</h2>

        <div className={styles.infoCards}>
          <div className={styles.infoCard}>
            <span className={styles.infoIcon}>🏫</span>
            <div>
              <strong>{groups.length > 0 ? groups.length : 'Авто'}</strong>
              <span>групп</span>
            </div>
          </div>
          <div className={styles.infoCard}>
            <span className={styles.infoIcon}>👥</span>
            <div>
              <strong>{freeSlots}</strong>
              <span>свободных мест</span>
            </div>
          </div>
          <div className={styles.infoCard}>
            <span className={styles.infoIcon}>📏</span>
            <div>
              <strong>{GROUP_MAX_SIZE}</strong>
              <span>чел. в группе</span>
            </div>
          </div>
        </div>

        <div className={styles.enrollInfo}>
          <p>
            После записи вы будете автоматически распределены в учебную группу.
            Куратор группы будет назначен администратором.
          </p>
          {groups.length > 0 && !hasAvailableGroup && (
            <div className={styles.warningMsg}>
              ⚠️ Все текущие группы заполнены. Будет создана новая группа.
            </div>
          )}
        </div>

        {error && <div className={styles.errorMsg}>{error}</div>}

        <div className={styles.actions}>
          <button onClick={() => router.back()} className={styles.btnCancel}>Отмена</button>
          <button onClick={handleEnroll} disabled={submitting} className={styles.btnPrimary}>
            {submitting ? 'Запись...' : 'Записаться на курс'}
          </button>
        </div>
      </div>
    </div>
  );
}
