'use client';

import { useEffect, useState } from 'react';
import { coursesApi } from '@/lib/api/courses.api';
import { usersApi } from '@/lib/api/users.api';
import { certificatesApi } from '@/lib/api/certificates.api';
import { courseTeachersApi } from '@/lib/api/courseTeachers.api';
import { groupsApi } from '@/lib/api/groups.api';
import { groupListenersApi } from '@/lib/api/groupListeners.api';
import { attemptsApi } from '@/lib/api/attempts.api';
import type { ICourse, IUser, IGroup } from '@/lib/types';
import type { IGroupListener } from '@/lib/api/groupListeners.api';
import type { IAttempt } from '@/lib/api/attempts.api';
import { downloadTableDocx } from '@/lib/export/downloadTableDocx';
import { downloadFormattedTableXlsx } from '@/lib/export/downloadFormattedXlsx';
import { exportHtmlTableToPdf } from '@/lib/export/htmlTableToPdf';
import {
  AttemptsByCourseChart,
  AttemptsStatusPieChart,
  CoursesListenersChart,
} from '@/components/reports/ReportCharts';
import styles from './page.module.scss';

type ReportType =
  | 'courses'
  | 'certificates'
  | 'teachers'
  | 'period'
  | 'enrollments'
  | 'attempts';

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeReport, setActiveReport] = useState<ReportType>('courses');

  // Data
  const [courses, setCourses] = useState<ICourse[]>([]);
  const [users, setUsers] = useState<IUser[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [courseTeachers, setCourseTeachers] = useState<any[]>([]);
  const [groups, setGroups] = useState<IGroup[]>([]);
  const [groupListeners, setGroupListeners] = useState<IGroupListener[]>([]);
  const [attempts, setAttempts] = useState<IAttempt[]>([]);

  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTeacher, setFilterTeacher] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterCourse, setFilterCourse] = useState('');

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const [c, u, cert, ct, g, gl, att] = await Promise.allSettled([
        coursesApi.getAll(),
        usersApi.getAll(),
        certificatesApi.getAll(),
        courseTeachersApi.getAll(),
        groupsApi.getAll(),
        groupListenersApi.getAll(),
        attemptsApi.getAll(),
      ]);
      if (c.status === 'fulfilled') setCourses(c.value);
      if (u.status === 'fulfilled') setUsers(u.value);
      if (cert.status === 'fulfilled') setCertificates(cert.value);
      if (ct.status === 'fulfilled') setCourseTeachers(ct.value);
      if (g.status === 'fulfilled') setGroups(g.value);
      if (gl.status === 'fulfilled') setGroupListeners(gl.value);
      if (att.status === 'fulfilled') setAttempts(att.value);
    } finally {
      setLoading(false);
    }
  };

  const teachers = users.filter((u) => u.roleName === 'Преподаватель');
  const formatDate = (value?: string | null) => {
    if (!value) return '—';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleDateString('ru-RU');
  };

  const courseMetrics = (courseId: number) => {
    const gs = groups.filter((g) => g.fkIdCourse === courseId);
    const listeners = gs.reduce((s, g) => s + (g.listenerCount || 0), 0);
    return { groupCount: gs.length, listeners };
  };

  // ---- Filtered data per report ----
  const getCoursesReport = () => {
    let data = [...courses];
    if (filterStatus) data = data.filter((c) => c.statusName === filterStatus);
    if (filterDateFrom) data = data.filter((c) => new Date(c.startDate) >= new Date(filterDateFrom));
    if (filterDateTo) data = data.filter((c) => new Date(c.startDate) <= new Date(filterDateTo));
    return data;
  };

  const getCertificatesReport = () => {
    let data = [...certificates];
    if (filterCourse) data = data.filter((c: any) => String(c.fkIdCourse) === filterCourse || c.courseTitle?.includes(filterCourse));
    return data;
  };

  const getTeachersReport = () => {
    let data = [...courseTeachers];
    if (filterTeacher) data = data.filter((ct: any) => String(ct.fkIdTeacher) === filterTeacher);
    return data;
  };

  const getPeriodReport = () => {
    let data = [...courses];
    if (filterStatus) data = data.filter((c) => c.statusName === filterStatus);
    if (filterDateFrom) data = data.filter((c) => new Date(c.startDate) >= new Date(filterDateFrom));
    if (filterDateTo) data = data.filter((c) => new Date(c.endDate) <= new Date(filterDateTo));
    return data;
  };

  const getEnrollmentsReport = () => {
    let data = [...groupListeners];
    if (filterCourse) data = data.filter((x) => String(x.fkIdCourse ?? '') === filterCourse);
    return data;
  };

  type AttemptCourseAgg = {
    courseId: number;
    title: string;
    total: number;
    pending: number;
    accepted: number;
    rejected: number;
    rework: number;
    avgAccepted: string;
  };

  const getAttemptsCourseSummary = (): AttemptCourseAgg[] => {
    type Acc = {
      title: string;
      total: number;
      pending: number;
      accepted: number;
      rejected: number;
      rework: number;
      scoreSum: number;
      scoreN: number;
    };
    const map = new Map<number, Acc>();
    const titleOf = (cid: number) => courses.find((c) => c.pkIdCourse === cid)?.title ?? `Курс #${cid}`;

    for (const a of attempts) {
      const cid = a.fkIdCourse != null ? Number(a.fkIdCourse) : NaN;
      if (!Number.isFinite(cid)) continue;
      let acc = map.get(cid);
      if (!acc) {
        acc = {
          title: titleOf(cid),
          total: 0,
          pending: 0,
          accepted: 0,
          rejected: 0,
          rework: 0,
          scoreSum: 0,
          scoreN: 0,
        };
        map.set(cid, acc);
      }
      acc.total += 1;
      const s = a.statusName || '';
      if (s === 'На проверке') acc.pending += 1;
      else if (s === 'Принято') {
        acc.accepted += 1;
        const sc = Number(a.score);
        if (Number.isFinite(sc)) {
          acc.scoreSum += sc;
          acc.scoreN += 1;
        }
      } else if (s === 'Отклонено') acc.rejected += 1;
      else if (s === 'На доработке') acc.rework += 1;
    }

    let rows: AttemptCourseAgg[] = [...map.entries()]
      .filter(([, v]) => v.total > 0)
      .map(([courseId, v]) => ({
        courseId,
        title: v.title,
        total: v.total,
        pending: v.pending,
        accepted: v.accepted,
        rejected: v.rejected,
        rework: v.rework,
        avgAccepted: v.scoreN > 0 ? (v.scoreSum / v.scoreN).toFixed(1) : '—',
      }))
      .sort((a, b) => b.total - a.total);

    if (filterCourse) {
      rows = rows.filter((r) => String(r.courseId) === filterCourse);
    }
    return rows;
  };

  const exportToPDF = async (
    title: string,
    headers: string[],
    rows: string[][],
    filename: string,
  ) => {
    await exportHtmlTableToPdf(title, headers, rows, filename);
  };

  // ---- Report 1: Courses ----
  const handleCoursesExport = async (format: 'pdf' | 'xlsx' | 'word') => {
    setGenerating(true);
    try {
      const data = getCoursesReport();
      const headers = ['№', 'Название', 'Статус', 'Групп', 'Слушателей', 'Дата начала', 'Дата окончания', 'Теги'];
      const rows = data.map((c, i) => {
        const m = courseMetrics(c.pkIdCourse);
        return [
          String(i + 1),
          c.title,
          c.statusName,
          String(m.groupCount),
          String(m.listeners),
          formatDate(c.startDate),
          formatDate(c.endDate),
          c.tags || '—',
        ];
      });
      if (format === 'pdf') await exportToPDF('Отчёт по курсам', headers, rows, 'report-courses.pdf');
      else if (format === 'word') await downloadTableDocx('Отчёт по курсам', headers, rows, 'report-courses.docx');
      else await downloadFormattedTableXlsx('Отчёт по курсам', headers, rows, 'report-courses.xlsx', 'Курсы');
    } finally {
      setGenerating(false);
    }
  };

  const handleEnrollmentsExport = async (format: 'pdf' | 'xlsx' | 'word') => {
    setGenerating(true);
    try {
      const data = getEnrollmentsReport();
      const headers = ['№', 'Курс', 'Группа', 'Слушатель', 'E-mail'];
      const rows = data.map((r, i) => [
        String(i + 1),
        r.courseTitle || '—',
        r.groupName || '—',
        r.listenerName || '—',
        r.email || '—',
      ]);
      if (format === 'pdf') await exportToPDF('Запись слушателей в группы (учебный процесс)', headers, rows, 'report-enrollments.pdf');
      else if (format === 'word') await downloadTableDocx('Запись слушателей в группы', headers, rows, 'report-enrollments.docx');
      else await downloadFormattedTableXlsx('Запись слушателей в группы', headers, rows, 'report-enrollments.xlsx', 'Записи');
    } finally {
      setGenerating(false);
    }
  };

  const handleAttemptsExport = async (format: 'pdf' | 'xlsx' | 'word') => {
    setGenerating(true);
    try {
      const data = getAttemptsCourseSummary();
      const headers = [
        '№',
        'Курс',
        'Всего попыток',
        'На проверке',
        'Принято',
        'Отклонено',
        'На доработке',
        'Ср. балл (принятые)',
      ];
      const rows = data.map((r, i) => [
        String(i + 1),
        r.title,
        String(r.total),
        String(r.pending),
        String(r.accepted),
        String(r.rejected),
        String(r.rework),
        r.avgAccepted,
      ]);
      if (format === 'pdf') await exportToPDF('Сводка по проверке заданий (попытки по курсам)', headers, rows, 'report-attempts-summary.pdf');
      else if (format === 'word') await downloadTableDocx('Сводка по попыткам', headers, rows, 'report-attempts-summary.docx');
      else await downloadFormattedTableXlsx('Сводка по попыткам', headers, rows, 'report-attempts-summary.xlsx', 'Попытки');
    } finally {
      setGenerating(false);
    }
  };
  const handleCertificatesExport = async (format: 'pdf' | 'xlsx' | 'word') => {
    setGenerating(true);
    try {
      const data = getCertificatesReport();
      const headers = ['№', 'Слушатель', 'Курс', 'Шаблон', 'Дата выдачи'];
      const rows = data.map((c: any, i: number) => [
        String(i + 1), c.listenerName || '—', c.courseTitle || '—', c.templateName || '—',
        formatDate(c.issuedAt),
      ]);
      if (format === 'pdf') await exportToPDF('Отчёт по сертификатам', headers, rows, 'report-certificates.pdf');
      else if (format === 'word') await downloadTableDocx('Отчёт по сертификатам', headers, rows, 'report-certificates.docx');
      else await downloadFormattedTableXlsx('Отчёт по сертификатам', headers, rows, 'report-certificates.xlsx', 'Сертификаты');
    } finally {
      setGenerating(false);
    }
  };

  // ---- Report 3: Teachers ----
  const handleTeachersExport = async (format: 'pdf' | 'xlsx' | 'word') => {
    setGenerating(true);
    try {
      const data = getTeachersReport();
      const headers = ['№', 'Преподаватель', 'Курс', 'Дата назначения'];
      const rows = data.map((ct: any, i: number) => [
        String(i + 1), ct.teacherName || '—', ct.courseTitle || '—',
        ct.assignedAt ? new Date(ct.assignedAt).toLocaleDateString('ru-RU') : '—',
      ]);
      if (format === 'pdf') await exportToPDF('Отчёт по преподавателям', headers, rows, 'report-teachers.pdf');
      else if (format === 'word') await downloadTableDocx('Отчёт по преподавателям', headers, rows, 'report-teachers.docx');
      else await downloadFormattedTableXlsx('Отчёт по преподавателям', headers, rows, 'report-teachers.xlsx', 'Преподаватели');
    } finally {
      setGenerating(false);
    }
  };

  // ---- Report 4: Period ----
  const handlePeriodExport = async (format: 'pdf' | 'xlsx' | 'word') => {
    setGenerating(true);
    try {
      const data = getPeriodReport();
      const headers = ['№', 'Название', 'Статус', 'Начало', 'Окончание', 'Продолжительность (дней)'];
      const rows = data.map((c, i) => {
        const days = c.startDate && c.endDate
          ? String(Math.ceil((new Date(c.endDate).getTime() - new Date(c.startDate).getTime()) / 86400000))
          : '—';
        return [
          String(i + 1), c.title, c.statusName,
          formatDate(c.startDate),
          formatDate(c.endDate),
          days,
        ];
      });
      if (format === 'pdf') await exportToPDF('Отчёт по периодам', headers, rows, 'report-period.pdf');
      else if (format === 'word') await downloadTableDocx('Отчёт по периодам', headers, rows, 'report-period.docx');
      else await downloadFormattedTableXlsx('Отчёт по периодам', headers, rows, 'report-period.xlsx', 'Периоды');
    } finally {
      setGenerating(false);
    }
  };

  const handleExport = async (format: 'pdf' | 'xlsx' | 'word') => {
    if (activeReport === 'courses') await handleCoursesExport(format);
    else if (activeReport === 'certificates') await handleCertificatesExport(format);
    else if (activeReport === 'teachers') await handleTeachersExport(format);
    else if (activeReport === 'period') await handlePeriodExport(format);
    else if (activeReport === 'enrollments') await handleEnrollmentsExport(format);
    else if (activeReport === 'attempts') await handleAttemptsExport(format);
  };

  const previewCount = () => getPreviewRows().length;

  const getPreviewRows = (): unknown[] => {
    if (activeReport === 'courses') return getCoursesReport();
    if (activeReport === 'certificates') return getCertificatesReport();
    if (activeReport === 'teachers') return getTeachersReport();
    if (activeReport === 'period') return getPeriodReport();
    if (activeReport === 'enrollments') return getEnrollmentsReport();
    return getAttemptsCourseSummary();
  };

  if (loading) return <div className={styles.loading}>Загрузка данных...</div>;

  const REPORT_TABS = [
    { id: 'courses' as ReportType, label: 'Курсы и охват' },
    { id: 'enrollments' as ReportType, label: 'Запись в группы' },
    { id: 'attempts' as ReportType, label: 'Проверка заданий' },
    { id: 'certificates' as ReportType, label: 'Сертификаты' },
    { id: 'teachers' as ReportType, label: 'Преподаватели' },
    { id: 'period' as ReportType, label: 'Периоды обучения' },
  ];

  const summaryForTab = () => {
    if (activeReport === 'courses') {
      const list = getCoursesReport();
      const pub = list.filter((c) => c.statusName === 'Опубликован').length;
      const groupsN = new Set(list.flatMap((c) => groups.filter((g) => g.fkIdCourse === c.pkIdCourse).map((g) => g.pkIdGroup))).size;
      const listeners = list.reduce((s, c) => s + courseMetrics(c.pkIdCourse).listeners, 0);
      return [
        { label: 'Курсов в выборке', value: String(list.length) },
        { label: 'Опубликовано', value: String(pub) },
        { label: 'Групп (уник.)', value: String(groupsN) },
        { label: 'Слушателей по группам', value: String(listeners) },
      ];
    }
    if (activeReport === 'enrollments') {
      const list = getEnrollmentsReport();
      const coursesN = new Set(list.map((x) => x.fkIdCourse).filter(Boolean)).size;
      return [
        { label: 'Записей', value: String(list.length) },
        { label: 'Курсов', value: String(coursesN) },
      ];
    }
    if (activeReport === 'attempts') {
      const list = getAttemptsCourseSummary();
      const tot = list.reduce((s, r) => s + r.total, 0);
      const pend = list.reduce((s, r) => s + r.pending, 0);
      const ok = list.reduce((s, r) => s + r.accepted, 0);
      return [
        { label: 'Курсов с попытками', value: String(list.length) },
        { label: 'Всего попыток', value: String(tot) },
        { label: 'На проверке', value: String(pend) },
        { label: 'Принято', value: String(ok) },
      ];
    }
    if (activeReport === 'certificates') {
      const list = getCertificatesReport();
      return [
        { label: 'Сертификатов', value: String(list.length) },
        { label: 'Курсов (уник.)', value: String(new Set(list.map((c: any) => c.fkIdCourse ?? c.courseTitle)).size) },
      ];
    }
    if (activeReport === 'teachers') {
      const list = getTeachersReport();
      const teachersN = new Set(list.map((ct: any) => ct.fkIdTeacher)).size;
      return [
        { label: 'Назначений', value: String(list.length) },
        { label: 'Преподавателей', value: String(teachersN) },
      ];
    }
    const list = getPeriodReport();
    const withDates = list.filter((c) => c.startDate && c.endDate);
    const sumDays = withDates.reduce((s, c) => {
      return s + Math.ceil((new Date(c.endDate!).getTime() - new Date(c.startDate!).getTime()) / 86400000);
    }, 0);
    const avgDays = withDates.length > 0 ? Math.round(sumDays / withDates.length) : null;
    return [
      { label: 'Курсов в периоде', value: String(list.length) },
      { label: 'Средняя длительность, дн.', value: avgDays != null ? String(avgDays) : '—' },
    ];
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Отчёты</h1>
      <p className={styles.lead}>
        Разделы отражают разные стороны учебного процесса: охват курсов, фактическую запись в группы,
        нагрузку по проверке заданий, выдачу сертификатов, назначения преподавателей и календарные периоды.
        Сводные карточки считаются по текущим фильтрам; экспорт сохраняет то же содержимое, что предпросмотр.
      </p>

      {/* Report type tabs */}
      <div className={styles.tabs}>
        {REPORT_TABS.map((t) => (
          <button
            key={t.id}
            className={`${styles.tab} ${activeReport === t.id ? styles.activeTab : ''}`}
            onClick={() => setActiveReport(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className={styles.summaryStrip}>
        {summaryForTab().map((s) => (
          <div key={s.label} className={styles.summaryCard}>
            <div className={styles.summaryValue}>{s.value}</div>
            <div className={styles.summaryLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className={styles.filtersCard}>
        <h2>Фильтры</h2>
        <div className={styles.filtersRow}>
          {(activeReport === 'courses' || activeReport === 'period') && (
            <>
              <div className={styles.filterGroup}>
                <label>Статус</label>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="">Все статусы</option>
                  <option value="Черновик">Черновик</option>
                  <option value="Опубликован">Опубликован</option>
                  <option value="Архивирован">Архивирован</option>
                </select>
              </div>
              <div className={styles.filterGroup}>
                <label>Дата начала от</label>
                <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} />
              </div>
              <div className={styles.filterGroup}>
                <label>Дата начала до</label>
                <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} />
              </div>
            </>
          )}
          {(activeReport === 'certificates' || activeReport === 'enrollments' || activeReport === 'attempts') && (
            <div className={styles.filterGroup}>
              <label>Курс</label>
              <select value={filterCourse} onChange={(e) => setFilterCourse(e.target.value)}>
                <option value="">Все курсы</option>
                {courses.map((c) => (
                  <option key={c.pkIdCourse} value={String(c.pkIdCourse)}>{c.title}</option>
                ))}
              </select>
            </div>
          )}
          {activeReport === 'teachers' && (
            <div className={styles.filterGroup}>
              <label>Преподаватель</label>
              <select value={filterTeacher} onChange={(e) => setFilterTeacher(e.target.value)}>
                <option value="">Все преподаватели</option>
                {teachers.map((t) => (
                  <option key={t.pkIdUser} value={String(t.pkIdUser)}>{t.fullName}</option>
                ))}
              </select>
            </div>
          )}
          <button
            className={styles.btnReset}
            onClick={() => { setFilterStatus(''); setFilterTeacher(''); setFilterDateFrom(''); setFilterDateTo(''); setFilterCourse(''); }}
          >
            Сбросить
          </button>
        </div>
      </div>

      {activeReport === 'courses' && getCoursesReport().length > 0 && (
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Охват слушателями по курсам</h3>
          <p className={styles.chartHint}>
            Число слушателей, записанных в группы каждого курса (по текущим фильтрам).
          </p>
          <CoursesListenersChart
            data={getCoursesReport().map((c) => ({
              name: c.title.length > 42 ? `${c.title.slice(0, 40)}…` : c.title,
              listeners: courseMetrics(c.pkIdCourse).listeners,
            }))}
          />
        </div>
      )}

      {activeReport === 'attempts' && getAttemptsCourseSummary().length > 0 && (
        <div className={styles.chartsRow}>
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Статусы попыток (сводно)</h3>
            <p className={styles.chartHint}>Доля сдач по всем курсам в выборке.</p>
            <AttemptsStatusPieChart
              data={getAttemptsCourseSummary().map((r) => ({
                name: r.title,
                pending: r.pending,
                accepted: r.accepted,
                rejected: r.rejected,
                rework: r.rework,
              }))}
            />
          </div>
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Попытки по курсам</h3>
            <p className={styles.chartHint}>Стек: принято, на проверке, доработка, отклонено.</p>
            <AttemptsByCourseChart
              data={getAttemptsCourseSummary().map((r) => ({
                name: r.title.length > 28 ? `${r.title.slice(0, 26)}…` : r.title,
                pending: r.pending,
                accepted: r.accepted,
                rejected: r.rejected,
                rework: r.rework,
              }))}
            />
          </div>
        </div>
      )}

      {/* Preview table */}
      <div className={styles.previewCard}>
        <div className={styles.previewHeader}>
          <h2>Предпросмотр <span className={styles.count}>({previewCount()} записей)</span></h2>
          <div className={styles.exportBtns}>
            <button className={styles.btnPDF} onClick={() => void handleExport('pdf')} disabled={generating || previewCount() === 0}>
              {generating ? '...' : '↓ PDF'}
            </button>
            <button className={styles.btnCSV} onClick={() => void handleExport('xlsx')} disabled={generating || previewCount() === 0}>
              {generating ? '...' : '↓ Excel (.xlsx)'}
            </button>
            <button className={styles.btnWord} onClick={() => void handleExport('word')} disabled={generating || previewCount() === 0}>
              {generating ? '...' : '↓ Word (.docx)'}
            </button>
          </div>
        </div>

        <div className={styles.tableWrap}>
          {activeReport === 'courses' && (
            <table className={styles.table}>
              <thead><tr><th>№</th><th>Название</th><th>Статус</th><th>Групп</th><th>Слушателей</th><th>Начало</th><th>Окончание</th><th>Теги</th></tr></thead>
              <tbody>
                {getCoursesReport().map((c, i) => {
                  const m = courseMetrics(c.pkIdCourse);
                  return (
                  <tr key={c.pkIdCourse}>
                    <td>{i + 1}</td>
                    <td className={styles.bold}>{c.title}</td>
                    <td><span className={`${styles.badge} ${c.statusName === 'Опубликован' ? styles.green : c.statusName === 'Черновик' ? styles.yellow : styles.gray}`}>{c.statusName}</span></td>
                    <td>{m.groupCount}</td>
                    <td>{m.listeners}</td>
                    <td>{formatDate(c.startDate)}</td>
                    <td>{formatDate(c.endDate)}</td>
                    <td className={styles.muted}>{c.tags || '—'}</td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {activeReport === 'certificates' && (
            <table className={styles.table}>
              <thead><tr><th>№</th><th>Слушатель</th><th>Курс</th><th>Шаблон</th><th>Дата выдачи</th></tr></thead>
              <tbody>
                {getCertificatesReport().map((c: any, i: number) => (
                  <tr key={c.pkIdCertificate}>
                    <td>{i + 1}</td>
                    <td className={styles.bold}>{c.listenerName}</td>
                    <td>{c.courseTitle}</td>
                    <td>{c.templateName}</td>
                    <td>{formatDate(c.issuedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeReport === 'teachers' && (
            <table className={styles.table}>
              <thead><tr><th>№</th><th>Преподаватель</th><th>Курс</th><th>Дата назначения</th></tr></thead>
              <tbody>
                {getTeachersReport().map((ct: any, i: number) => (
                  <tr key={ct.pkIdCourseTeacher || i}>
                    <td>{i + 1}</td>
                    <td className={styles.bold}>{ct.teacherName}</td>
                    <td>{ct.courseTitle}</td>
                    <td>{formatDate(ct.assignedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeReport === 'period' && (
            <table className={styles.table}>
              <thead><tr><th>№</th><th>Название</th><th>Статус</th><th>Начало</th><th>Окончание</th><th>Дней</th></tr></thead>
              <tbody>
                {getPeriodReport().map((c, i) => (
                  <tr key={c.pkIdCourse}>
                    <td>{i + 1}</td>
                    <td className={styles.bold}>{c.title}</td>
                    <td><span className={`${styles.badge} ${c.statusName === 'Опубликован' ? styles.green : c.statusName === 'Черновик' ? styles.yellow : styles.gray}`}>{c.statusName}</span></td>
                    <td>{formatDate(c.startDate)}</td>
                    <td>{formatDate(c.endDate)}</td>
                    <td>{c.startDate && c.endDate ? Math.ceil((new Date(c.endDate).getTime() - new Date(c.startDate).getTime()) / 86400000) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeReport === 'enrollments' && (
            <table className={styles.table}>
              <thead><tr><th>№</th><th>Курс</th><th>Группа</th><th>Слушатель</th><th>E-mail</th></tr></thead>
              <tbody>
                {getEnrollmentsReport().map((r, i) => (
                  <tr key={r.pkIdGroupListener}>
                    <td>{i + 1}</td>
                    <td className={styles.bold}>{r.courseTitle}</td>
                    <td>{r.groupName}</td>
                    <td>{r.listenerName}</td>
                    <td className={styles.muted}>{r.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeReport === 'attempts' && (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>№</th>
                  <th>Курс</th>
                  <th>Всего</th>
                  <th>На проверке</th>
                  <th>Принято</th>
                  <th>Отклонено</th>
                  <th>Доработка</th>
                  <th>Ср. балл</th>
                </tr>
              </thead>
              <tbody>
                {getAttemptsCourseSummary().map((r, i) => (
                  <tr key={r.courseId}>
                    <td>{i + 1}</td>
                    <td className={styles.bold}>{r.title}</td>
                    <td>{r.total}</td>
                    <td>{r.pending}</td>
                    <td>{r.accepted}</td>
                    <td>{r.rejected}</td>
                    <td>{r.rework}</td>
                    <td>{r.avgAccepted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {previewCount() === 0 && (
            <div className={styles.empty}>Нет данных для отображения</div>
          )}
        </div>
      </div>
    </div>
  );
}
