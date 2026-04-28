'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { coursesApi } from '@/lib/api/courses.api';
import { usersApi } from '@/lib/api/users.api';
import { groupsApi } from '@/lib/api/groups.api';
import { courseTeachersApi } from '@/lib/api/courseTeachers.api';
import { groupListenersApi } from '@/lib/api/groupListeners.api';
import { attemptsApi } from '@/lib/api/attempts.api';
import { notificationsApi } from '@/lib/api/notifications.api';
import { tasksApi } from '@/lib/api/tasks.api';
import { COURSE_STATUS, ATTEMPT_STATUS, ROLES } from '@/lib/constants';
import type { ICourse, IGroup } from '@/lib/types';
import Link from 'next/link';
import styles from './page.module.scss';

export default function MainPage() {
  const { user, checkRole } = useAuth();
  const initialized = useRef(false);
  const [loading, setLoading] = useState(true);

  // Admin
  const [stats, setStats] = useState({ courses: 0, published: 0, users: 0, groups: 0, teachers: 0, listeners: 0, pendingAttempts: 0 });
  const [recentCourses, setRecentCourses] = useState<ICourse[]>([]);

  // Teacher
  const [myCourses, setMyCourses] = useState<ICourse[]>([]);
  const [pendingAttempts, setPendingAttempts] = useState<any[]>([]);

  // Listener
  const [myEnrollments, setMyEnrollments] = useState<{ group: IGroup; course: ICourse }[]>([]);
  const [myAttempts, setMyAttempts] = useState<any[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const isAdmin = checkRole([ROLES.ADMIN]);
  const isTeacher = checkRole([ROLES.TEACHER]);
  const isListener = checkRole([ROLES.LISTENER]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    load();
  }, []);

  const load = async () => {
    if (!user) return;
    try {
      if (isAdmin) {
        const [courses, users, groups, attempts] = await Promise.all([
          coursesApi.getAll(),
          usersApi.getAll(),
          groupsApi.getAll(),
          attemptsApi.getByStatus(ATTEMPT_STATUS.PENDING),
        ]);
        setStats({
          courses: courses.length,
          published: courses.filter((c) => c.fkIdStatus === COURSE_STATUS.PUBLISHED).length,
          users: users.length,
          groups: groups.length,
          teachers: users.filter((u) => u.roleName === ROLES.TEACHER).length,
          listeners: users.filter((u) => u.roleName === ROLES.LISTENER).length,
          pendingAttempts: attempts.length,
        });
        setRecentCourses(courses.slice(0, 6));
      } else if (isTeacher) {
        const assignments = await courseTeachersApi.getByTeacher(user.pkIdUser);
        const courseIds = [...new Set(assignments.map((a: any) => a.fkIdCourse))];
        const allCourses = await coursesApi.getAll();
        const filtered = allCourses.filter((c) => courseIds.includes(c.pkIdCourse));
        setMyCourses(filtered);
        // Попытки только по заданиям своих курсов
        const allAttempts = await attemptsApi.getByStatus(ATTEMPT_STATUS.PENDING);
        const allTaskIds = new Set<number>();
        for (const cId of courseIds) {
          try {
            const tasks = await tasksApi.getByCourse(cId);
            tasks.forEach((t) => allTaskIds.add(t.pkIdTask));
          } catch {}
        }
        setPendingAttempts(allAttempts.filter((a: any) => allTaskIds.has(a.fkIdTask)));
      } else if (isListener) {
        const [enrollments, allGroups, allCourses, attempts, notifications] = await Promise.all([
          groupListenersApi.getByListener(user.pkIdUser),
          groupsApi.getAll(),
          coursesApi.getByStatus(COURSE_STATUS.PUBLISHED),
          attemptsApi.getByListener(user.pkIdUser),
          notificationsApi.getByUser(user.pkIdUser),
        ]);
        // Build enrollment list
        const enrolled: { group: IGroup; course: ICourse }[] = [];
        for (const e of enrollments) {
          const group = allGroups.find((g) => g.pkIdGroup === (e as any).fkIdGroup);
          if (group) {
            const course = allCourses.find((c) => c.pkIdCourse === group.fkIdCourse);
            if (course) enrolled.push({ group, course });
          }
        }
        setMyEnrollments(enrolled);
        setMyAttempts(attempts);
        setUnreadNotifications(notifications.filter((n: any) => !n.isRead).length);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className={styles.loading}>
      <div className={styles.spinner} />
    </div>
  );

  // ===== ADMIN =====
  if (isAdmin) return (
    <div className={styles.page}>
      <div className={styles.welcomeBar}>
        <div>
          <h1>Добро пожаловать, {user?.fullName?.split(' ')[1] || user?.fullName}!</h1>
          <p>Панель администратора МГИРО</p>
        </div>
        <Link href="/admin/courses/create" className={styles.btnPrimary}>+ Создать курс</Link>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statTop}><span className={styles.statIcon}>📚</span></div>
          <div className={styles.statValue}>{stats.courses}</div>
          <div className={styles.statLabel}>Всего курсов</div>
          <div className={styles.statSub}>{stats.published} опубликовано</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statTop}><span className={styles.statIcon}>👥</span></div>
          <div className={styles.statValue}>{stats.users}</div>
          <div className={styles.statLabel}>Пользователей</div>
          <div className={styles.statSub}>{stats.teachers} преп. · {stats.listeners} слуш.</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statTop}><span className={styles.statIcon}>🏫</span></div>
          <div className={styles.statValue}>{stats.groups}</div>
          <div className={styles.statLabel}>Учебных групп</div>
        </div>
        <div className={`${styles.statCard} ${stats.pendingAttempts > 0 ? styles.statAlert : ''}`}>
          <div className={styles.statTop}><span className={styles.statIcon}>📝</span></div>
          <div className={styles.statValue}>{stats.pendingAttempts}</div>
          <div className={styles.statLabel}>На проверке</div>
          <div className={styles.statSub}>работ ждут проверки</div>
        </div>
      </div>

      <div className={styles.quickActions}>
        <h2>Быстрые действия</h2>
        <div className={styles.actionsGrid}>
          {[
            { href: '/admin/users', icon: '👤', label: 'Пользователи', desc: 'Управление аккаунтами' },
            { href: '/admin/groups', icon: '🏫', label: 'Группы', desc: 'Учебные группы и слушатели' },
            { href: '/admin/analytics', icon: '📊', label: 'Аналитика', desc: 'Статистика платформы' },
            { href: '/admin/reports', icon: '📋', label: 'Отчёты', desc: 'Экспорт в PDF и Excel' },
            { href: '/admin/logs', icon: '🗒️', label: 'Журнал', desc: 'История действий' },
            { href: '/courses', icon: '📚', label: 'Каталог курсов', desc: 'Все курсы платформы' },
          ].map((a) => (
            <Link key={a.href} href={a.href} className={styles.actionCard}>
              <span className={styles.actionIcon}>{a.icon}</span>
              <div>
                <div className={styles.actionLabel}>{a.label}</div>
                <div className={styles.actionDesc}>{a.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <h2>Последние курсы</h2>
          <Link href="/courses" className={styles.seeAll}>Все курсы →</Link>
        </div>
        <div className={styles.courseGrid}>
          {recentCourses.map((c) => (
            <Link key={c.pkIdCourse} href={`/courses/${c.pkIdCourse}`} className={styles.courseCard}>
              <div className={styles.courseCardTop}>
                <span className={`${styles.statusDot} ${c.fkIdStatus === COURSE_STATUS.PUBLISHED ? styles.dotGreen : c.fkIdStatus === COURSE_STATUS.DRAFT ? styles.dotYellow : styles.dotGray}`} />
                <span className={styles.courseStatus}>{c.statusName}</span>
              </div>
              <h3>{c.title}</h3>
              <p>{c.description?.slice(0, 80)}{c.description?.length > 80 ? '...' : ''}</p>
              <div className={styles.courseDates}>
                {c.startDate && new Date(c.startDate).toLocaleDateString('ru-RU')} — {c.endDate && new Date(c.endDate).toLocaleDateString('ru-RU')}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );

  // ===== TEACHER =====
  if (isTeacher) return (
    <div className={styles.page}>
      <div className={styles.welcomeBar}>
        <div>
          <h1>Добро пожаловать, {user?.fullName?.split(' ')[1] || user?.fullName}!</h1>
          <p>Преподаватель · {myCourses.length} курсов</p>
        </div>
        {pendingAttempts.length > 0 && (
          <div className={styles.alertBadge}>
            📝 {pendingAttempts.length} работ на проверке
          </div>
        )}
      </div>

      {myCourses.length === 0 ? (
        <div className={styles.emptyState}>
          <span>📚</span>
          <h3>Курсов пока нет</h3>
          <p>Администратор назначит вас на курсы</p>
          <Link href="/courses" className={styles.btnSecondary}>Посмотреть каталог</Link>
        </div>
      ) : (
        <>
          <div className={styles.section}>
            <div className={styles.sectionHead}>
              <h2>Мои курсы</h2>
              <Link href="/courses" className={styles.seeAll}>Каталог →</Link>
            </div>
            <div className={styles.courseGrid}>
              {myCourses.map((c) => (
                <div key={c.pkIdCourse} className={styles.courseCard}>
                  <div className={styles.courseCardTop}>
                    <span className={`${styles.statusDot} ${c.fkIdStatus === COURSE_STATUS.PUBLISHED ? styles.dotGreen : styles.dotYellow}`} />
                    <span className={styles.courseStatus}>{c.statusName}</span>
                  </div>
                  <h3>{c.title}</h3>
                  <p>{c.description?.slice(0, 80)}{c.description?.length > 80 ? '...' : ''}</p>
                  <div className={styles.courseActions}>
                    <Link href={`/courses/${c.pkIdCourse}/manage`} className={styles.btnPrimary}>Управление</Link>
                    <Link href={`/courses/${c.pkIdCourse}`} className={styles.btnGhost}>Просмотр</Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {pendingAttempts.length > 0 && (
            <div className={styles.section}>
              <h2>Работы на проверке</h2>
              <div className={styles.attemptsList}>
                {pendingAttempts.slice(0, 5).map((a: any) => (
                  <div key={a.pkIdAttempt} className={styles.attemptRow}>
                    <div className={styles.attemptInfo}>
                      <strong>{a.listenerName}</strong>
                      <span>{a.taskTitle}</span>
                    </div>
                    <span className={styles.pendingBadge}>На проверке</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  // ===== LISTENER =====
  return (
    <div className={styles.page}>
      <div className={styles.welcomeBar}>
        <div>
          <h1>Добро пожаловать, {user?.fullName?.split(' ')[1] || user?.fullName}!</h1>
          <p>Слушатель · {myEnrollments.length} курсов</p>
        </div>
        {unreadNotifications > 0 && (
          <Link href="/notifications" className={styles.alertBadge}>
            🔔 {unreadNotifications} уведомлений
          </Link>
        )}
      </div>

      {myEnrollments.length === 0 ? (
        <div className={styles.emptyState}>
          <span>🎓</span>
          <h3>Вы пока не записаны на курсы</h3>
          <p>Найдите интересный курс и запишитесь</p>
          <Link href="/courses" className={styles.btnPrimary}>Перейти в каталог</Link>
        </div>
      ) : (
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <h2>Мои курсы</h2>
            <Link href="/courses" className={styles.seeAll}>Каталог →</Link>
          </div>
          <div className={styles.enrollmentGrid}>
            {myEnrollments.map(({ group, course }) => {
              const courseAttempts = myAttempts.filter((a: any) => a.fkIdCourse === course.pkIdCourse);
              const accepted = courseAttempts.filter((a: any) => a.statusName === 'Принято').length;
              return (
                <Link key={group.pkIdGroup} href={`/courses/${course.pkIdCourse}`} className={styles.enrollmentCard}>
                  <div className={styles.enrollmentTop}>
                    <span className={styles.groupBadge}>{group.name || (group as any).groupName}</span>
                  </div>
                  <h3>{course.title}</h3>
                  <p>{course.description?.slice(0, 80)}{course.description?.length > 80 ? '...' : ''}</p>
                  <div className={styles.enrollmentMeta}>
                    <span>👨‍🏫 {group.curatorName || 'Куратор не назначен'}</span>
                    {accepted > 0 && <span>✅ {accepted} принято</span>}
                  </div>
                  <div className={styles.enrollmentDates}>
                    до {course.endDate && new Date(course.endDate).toLocaleDateString('ru-RU')}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div className={styles.quickActions}>
        <h2>Быстрые действия</h2>
        <div className={styles.actionsGrid}>
          <Link href="/courses" className={styles.actionCard}>
            <span className={styles.actionIcon}>📚</span>
            <div><div className={styles.actionLabel}>Каталог курсов</div><div className={styles.actionDesc}>Найти новый курс</div></div>
          </Link>
          <Link href="/certificates" className={styles.actionCard}>
            <span className={styles.actionIcon}>🎓</span>
            <div><div className={styles.actionLabel}>Сертификаты</div><div className={styles.actionDesc}>Мои достижения</div></div>
          </Link>
          <Link href="/messages" className={styles.actionCard}>
            <span className={styles.actionIcon}>💬</span>
            <div><div className={styles.actionLabel}>Сообщения</div><div className={styles.actionDesc}>Связь с преподавателем</div></div>
          </Link>
          <Link href="/account" className={styles.actionCard}>
            <span className={styles.actionIcon}>👤</span>
            <div><div className={styles.actionLabel}>Профиль</div><div className={styles.actionDesc}>Мои данные</div></div>
          </Link>
        </div>
      </div>
    </div>
  );
}
