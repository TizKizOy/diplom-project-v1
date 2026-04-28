'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { coursesApi } from '@/lib/api/courses.api';
import { usersApi } from '@/lib/api/users.api';
import { groupsApi } from '@/lib/api/groups.api';
import { attemptsApi } from '@/lib/api/attempts.api';
import { certificatesApi } from '@/lib/api/certificates.api';
import { courseTeachersApi } from '@/lib/api/courseTeachers.api';
import type { ICourse, IUser, IGroup } from '@/lib/types';
import { COURSE_STATUS, ATTEMPT_STATUS, ROLES } from '@/lib/constants';
import styles from './page.module.scss';

export default function AnalyticsPage() {
  const { user, checkRole } = useAuth();
  const initialized = useRef(false);
  const [loading, setLoading] = useState(true);

  const [courses, setCourses] = useState<ICourse[]>([]);
  const [users, setUsers] = useState<IUser[]>([]);
  const [groups, setGroups] = useState<IGroup[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<number | ''>('');

  const isAdmin = checkRole([ROLES.ADMIN]);
  const isTeacher = checkRole([ROLES.TEACHER]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    loadData();
  }, []);

  const loadData = async () => {
    try {
      if (isAdmin) {
        const [c, u, g, a, cert] = await Promise.allSettled([
          coursesApi.getAll(),
          usersApi.getAll(),
          groupsApi.getAll(),
          attemptsApi.getAll(),
          certificatesApi.getAll(),
        ]);
        if (c.status === 'fulfilled') setCourses(c.value);
        if (u.status === 'fulfilled') setUsers(u.value);
        if (g.status === 'fulfilled') setGroups(g.value);
        if (a.status === 'fulfilled') setAttempts(a.value);
        if (cert.status === 'fulfilled') setCertificates(cert.value);
      } else if (isTeacher && user) {
        // Преподаватель видит только свои курсы
        const assignments = await courseTeachersApi.getByTeacher(user.pkIdUser);
        const courseIds = new Set(assignments.map((a: any) => a.fkIdCourse));
        const allCourses = await coursesApi.getAll();
        const myCourses = allCourses.filter((c) => courseIds.has(c.pkIdCourse));
        setCourses(myCourses);

        const [g, a] = await Promise.allSettled([
          groupsApi.getAll(),
          attemptsApi.getAll(),
        ]);
        if (g.status === 'fulfilled') setGroups(g.value.filter((gr) => courseIds.has(gr.fkIdCourse)));
        if (a.status === 'fulfilled') setAttempts(a.value);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className={styles.loading}><div className={styles.spinner} /></div>;

  // Filtered data
  const filteredCourses = selectedCourse ? courses.filter((c) => c.pkIdCourse === Number(selectedCourse)) : courses;
  const filteredGroups = selectedCourse ? groups.filter((g) => g.fkIdCourse === Number(selectedCourse)) : groups;

  const teachers = users.filter((u) => u.roleName === ROLES.TEACHER);
  const listenerUsers = users.filter((u) => u.roleName === ROLES.LISTENER);
  const published = filteredCourses.filter((c) => c.fkIdStatus === COURSE_STATUS.PUBLISHED);
  const drafts = filteredCourses.filter((c) => c.fkIdStatus === COURSE_STATUS.DRAFT);

  const accepted = attempts.filter((a) => a.statusName === 'Принято');
  const pending = attempts.filter((a) => a.statusName === 'На проверке');
  const passRate = attempts.length > 0 ? Math.round((accepted.length / attempts.length) * 100) : 0;

  // Course stats
  const courseStats = filteredCourses.map((c) => {
    const courseGroups = filteredGroups.filter((g) => g.fkIdCourse === c.pkIdCourse);
    const totalListeners = courseGroups.reduce((sum, g) => sum + (g.listenerCount || 0), 0);
    const courseCerts = certificates.filter((cert: any) => cert.fkIdCourse === c.pkIdCourse || cert.courseTitle === c.title);
    return { ...c, groups: courseGroups.length, listeners: totalListeners, certs: courseCerts.length };
  });

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1>Аналитика</h1>
        {courses.length > 1 && (
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value ? Number(e.target.value) : '')}
            className={styles.courseFilter}
          >
            <option value="">Все курсы</option>
            {courses.map((c) => (
              <option key={c.pkIdCourse} value={c.pkIdCourse}>{c.title}</option>
            ))}
          </select>
        )}
      </div>

      {/* Main stats */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.blue}`}>
          <div className={styles.statValue}>{filteredCourses.length}</div>
          <div className={styles.statLabel}>Курсов</div>
          <div className={styles.statSub}>{published.length} опубликовано · {drafts.length} черновик</div>
        </div>
        {isAdmin && (
          <>
            <div className={`${styles.statCard} ${styles.purple}`}>
              <div className={styles.statValue}>{teachers.length}</div>
              <div className={styles.statLabel}>Преподавателей</div>
            </div>
            <div className={`${styles.statCard} ${styles.green}`}>
              <div className={styles.statValue}>{listenerUsers.length}</div>
              <div className={styles.statLabel}>Слушателей</div>
            </div>
          </>
        )}
        <div className={`${styles.statCard} ${styles.orange}`}>
          <div className={styles.statValue}>{filteredGroups.length}</div>
          <div className={styles.statLabel}>Групп</div>
        </div>
        <div className={`${styles.statCard} ${styles.yellow}`}>
          <div className={styles.statValue}>{pending.length}</div>
          <div className={styles.statLabel}>На проверке</div>
          <div className={styles.statSub}>работ ждут</div>
        </div>
        <div className={`${styles.statCard} ${styles.green}`}>
          <div className={styles.statValue}>{accepted.length}</div>
          <div className={styles.statLabel}>Принято работ</div>
          <div className={styles.statSub}>{passRate}% успеваемость</div>
        </div>
        {isAdmin && (
          <div className={`${styles.statCard} ${styles.blue}`}>
            <div className={styles.statValue}>{certificates.length}</div>
            <div className={styles.statLabel}>Сертификатов</div>
          </div>
        )}
      </div>

      {/* Course breakdown */}
      <div className={styles.section}>
        <h2>Курсы в деталях</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Курс</th>
                <th>Статус</th>
                <th>Групп</th>
                <th>Слушателей</th>
                {isAdmin && <th>Сертификатов</th>}
                <th>Период</th>
              </tr>
            </thead>
            <tbody>
              {courseStats.length === 0 ? (
                <tr><td colSpan={6} className={styles.empty}>Нет данных</td></tr>
              ) : courseStats.map((c) => (
                <tr key={c.pkIdCourse}>
                  <td className={styles.bold}>{c.title}</td>
                  <td>
                    <span className={`${styles.badge} ${
                      c.fkIdStatus === COURSE_STATUS.PUBLISHED ? styles.green :
                      c.fkIdStatus === COURSE_STATUS.DRAFT ? styles.yellow : styles.gray
                    }`}>{c.statusName}</span>
                  </td>
                  <td>{c.groups}</td>
                  <td>{c.listeners}</td>
                  {isAdmin && <td>{c.certs}</td>}
                  <td className={styles.muted}>
                    {c.startDate && new Date(c.startDate).toLocaleDateString('ru-RU')} —{' '}
                    {c.endDate && new Date(c.endDate).toLocaleDateString('ru-RU')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Attempts breakdown */}
      <div className={styles.section}>
        <h2>Попытки по статусам</h2>
        <div className={styles.attemptsGrid}>
          {[
            { label: 'На проверке', count: pending.length, color: styles.yellow },
            { label: 'Принято', count: accepted.length, color: styles.green },
            { label: 'Отклонено', count: attempts.filter((a) => a.statusName === 'Отклонено').length, color: styles.red },
            { label: 'На доработке', count: attempts.filter((a) => a.statusName === 'На доработке').length, color: styles.orange },
          ].map((s) => (
            <div key={s.label} className={`${styles.attemptCard} ${s.color}`}>
              <div className={styles.attemptValue}>{s.count}</div>
              <div className={styles.attemptLabel}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
