'use client';

import { useEffect, useState, useMemo } from 'react';
import { coursesApi } from '@/lib/api/courses.api';
import { groupListenersApi } from '@/lib/api/groupListeners.api';
import { groupsApi } from '@/lib/api/groups.api';
import { courseTeachersApi } from '@/lib/api/courseTeachers.api';
import type { ICourse } from '@/lib/types';
import { useAuth } from '@/lib/hooks/useAuth';
import { COURSE_STATUS, isPublishedCourse, ROLES } from '@/lib/constants';
import { listenerEnrolledCourseIds } from '@/lib/course/enrollmentFromApi';
import Link from 'next/link';
import styles from './page.module.scss';

export default function CoursesPage() {
  const { user, checkRole } = useAuth();
  const [courses, setCourses] = useState<ICourse[]>([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const isAdmin = checkRole([ROLES.ADMIN]);
  const isTeacher = checkRole([ROLES.TEACHER]);
  const isListener = checkRole([ROLES.LISTENER]);
  // ID курсов на которые назначен преподаватель
  const [teacherCourseIds, setTeacherCourseIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadData();
  }, [user, isListener, isTeacher]);

  const loadData = async () => {
    try {
      // Слушатели видят только опубликованные, преподаватели и админы — все
      const data = isListener
        ? await coursesApi.getByStatus(COURSE_STATUS.PUBLISHED)
        : await coursesApi.getAll();
      setCourses(data);

      // Для преподавателя — загружаем его назначения
      if (isTeacher && user) {
        const [assignments, allGroups] = await Promise.all([
          courseTeachersApi.getByTeacher(user.pkIdUser),
          groupsApi.getAll(),
        ]);
        const ids = new Set<number>();
        for (const a of assignments as { fkIdCourse?: number }[]) {
          if (a.fkIdCourse != null) ids.add(Number(a.fkIdCourse));
        }
        for (const g of allGroups as { fkIdCourse?: number; fkIdCurator?: number | null }[]) {
          if (
            g.fkIdCurator != null &&
            Number(g.fkIdCurator) === user.pkIdUser &&
            g.fkIdCourse != null
          ) {
            ids.add(Number(g.fkIdCourse));
          }
        }
        setTeacherCourseIds(ids);
      }

      // Для слушателя — определяем на какие курсы уже записан
      if (isListener && user) {
        const enrollments = await groupListenersApi.getByListener(user.pkIdUser);
        const allGroups = await groupsApi.getAll();
        setEnrolledCourseIds(
          listenerEnrolledCourseIds(
            enrollments as { fkIdCourse?: number; fkIdGroup?: number }[],
            allGroups,
          ),
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    let result = [...courses];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) => c.title.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q) || c.tags?.toLowerCase().includes(q),
      );
    }

    // Фильтр по статусу — сравниваем по statusName (строка) или fkIdStatus (число)
    if (statusFilter && !isListener) {
      const statusId = Number(statusFilter);
      result = result.filter((c) => {
        if (c.fkIdStatus !== undefined && c.fkIdStatus !== null) return c.fkIdStatus === statusId;
        // fallback по имени
        const nameMap: Record<number, string> = { 1: 'Черновик', 2: 'Опубликован', 3: 'Архивирован' };
        return c.statusName === nameMap[statusId];
      });
    }

    result.sort((a, b) => {
      if (sortBy === 'name') return a.title.localeCompare(b.title, 'ru');
      if (sortBy === 'oldest') return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    });

    return result;
  }, [courses, search, statusFilter, sortBy]);

  const getStatusClass = (s: string) =>
    s === 'Опубликован' ? styles.published : s === 'Черновик' ? styles.draft : styles.archived;

  if (loading) return <div className={styles.loading}><div className={styles.spinner} /></div>;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1>Каталог курсов</h1>
          <p>{isListener ? 'Доступные курсы для записи' : `Всего: ${courses.length} курсов`}</p>
        </div>
        {isAdmin && (
          <Link href="/admin/courses/create" className={styles.btnCreate}>+ Создать курс</Link>
        )}
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Поиск по названию, описанию, тегам..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
          {search && <button className={styles.clearSearch} onClick={() => setSearch('')}>×</button>}
        </div>

        <div className={styles.filterControls}>
          {!isListener && (
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={styles.select}>
              <option value="">Все статусы</option>
              <option value="1">Черновик</option>
              <option value="2">Опубликован</option>
              <option value="3">Архивирован</option>
            </select>
          )}
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={styles.select}>
            <option value="newest">Сначала новые</option>
            <option value="oldest">Сначала старые</option>
            <option value="name">По названию</option>
          </select>
        </div>
      </div>

      {/* Results count */}
      <div className={styles.resultsInfo}>
        Найдено: <strong>{filtered.length}</strong>
        {search && <span> по запросу «{search}»</span>}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className={styles.empty}>
          <span>🔍</span>
          <p>Курсы не найдены</p>
          {search && <button onClick={() => setSearch('')} className={styles.btnReset}>Сбросить поиск</button>}
        </div>
      ) : (
        <div className={styles.grid}>
          {filtered.map((course) => {
            const enrolled = enrolledCourseIds.has(course.pkIdCourse);
            return (
              <article key={course.pkIdCourse} className={styles.card}>
                <div className={styles.cardHeader}>
                  {!isListener && (
                    <span className={`${styles.statusBadge} ${getStatusClass(course.statusName)}`}>
                      {course.statusName}
                    </span>
                  )}
                  {course.tags && <span className={styles.tags}>{course.tags}</span>}
                  {enrolled && <span className={styles.enrolledBadge}>Записан</span>}
                </div>

                <h3 className={styles.cardTitle}>{course.title}</h3>
                <p className={styles.cardDesc}>
                  {course.description?.slice(0, 100)}{course.description?.length > 100 ? '...' : ''}
                </p>

                <div className={styles.cardDates}>
                  {course.startDate && new Date(course.startDate).toLocaleDateString('ru-RU')} — {course.endDate && new Date(course.endDate).toLocaleDateString('ru-RU')}
                </div>

                <div className={styles.cardActions}>
                  <Link href={`/courses/${course.pkIdCourse}`} className={styles.btnDetails}>
                    Подробнее
                  </Link>
                  {isListener && isPublishedCourse(course) && enrolled && (
                    <Link href={`/courses/${course.pkIdCourse}`} className={styles.btnEnroll}>
                      Перейти к курсу
                    </Link>
                  )}
                  {isListener && isPublishedCourse(course) && !enrolled && (
                    <Link href={`/courses/${course.pkIdCourse}/enroll`} className={styles.btnEnroll}>
                      Записаться
                    </Link>
                  )}
                  {/* Управление: админ видит все, преподаватель только свои */}
                  {(isAdmin || (isTeacher && teacherCourseIds.has(course.pkIdCourse))) && (
                    <Link href={`/courses/${course.pkIdCourse}/manage`} className={styles.btnManage}>
                      Управление
                    </Link>
                  )}                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
