'use client';

import { useEffect, useRef, useState } from 'react';
import { coursesApi } from '@/lib/api/courses.api';
import { usersApi } from '@/lib/api/users.api';
import { groupsApi } from '@/lib/api/groups.api';
import { attemptsApi } from '@/lib/api/attempts.api';
import { certificatesApi } from '@/lib/api/certificates.api';
import { courseTeachersApi } from '@/lib/api/courseTeachers.api';
import { groupListenersApi } from '@/lib/api/groupListeners.api';
import type { ICourse, IUser } from '@/lib/types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import styles from './page.module.scss';

type ReportType = 'courses' | 'certificates' | 'teachers' | 'period';

export default function ReportsPage() {
  const initialized = useRef(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeReport, setActiveReport] = useState<ReportType>('courses');

  // Data
  const [courses, setCourses] = useState<ICourse[]>([]);
  const [users, setUsers] = useState<IUser[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [courseTeachers, setCourseTeachers] = useState<any[]>([]);
  const [groupListeners, setGroupListeners] = useState<any[]>([]);

  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTeacher, setFilterTeacher] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterCourse, setFilterCourse] = useState('');

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const [c, u, a, cert, ct, gl] = await Promise.allSettled([
        coursesApi.getAll(),
        usersApi.getAll(),
        attemptsApi.getAll(),
        certificatesApi.getAll(),
        courseTeachersApi.getAll ? courseTeachersApi.getAll() : Promise.resolve([]),
        groupListenersApi.getAll(),
      ]);
      if (c.status === 'fulfilled') setCourses(c.value);
      if (u.status === 'fulfilled') setUsers(u.value);
      if (a.status === 'fulfilled') setAttempts(a.value);
      if (cert.status === 'fulfilled') setCertificates(cert.value);
      if (ct.status === 'fulfilled') setCourseTeachers(ct.value);
      if (gl.status === 'fulfilled') setGroupListeners(gl.value);
    } finally {
      setLoading(false);
    }
  };

  const teachers = users.filter((u) => u.roleName === 'Преподаватель');

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
    if (filterDateFrom) data = data.filter((c) => new Date(c.startDate) >= new Date(filterDateFrom));
    if (filterDateTo) data = data.filter((c) => new Date(c.endDate) <= new Date(filterDateTo));
    return data;
  };

  // ---- Export helpers ----
  const exportToCSV = (headers: string[], rows: string[][], filename: string) => {
    const BOM = '\uFEFF';
    const csvContent = BOM + [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(';')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToWord = (title: string, headers: string[], rows: string[][], filename: string) => {
    const tableRows = rows.map((r) =>
      `<tr>${r.map((c) => `<td style="border:1px solid #ccc;padding:6px 10px;font-size:12px">${c}</td>`).join('')}</tr>`
    ).join('');
    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
      <head><meta charset="utf-8"><title>${title}</title>
      <style>body{font-family:Arial,sans-serif;margin:2cm} h1{font-size:16pt;margin-bottom:8pt} p{font-size:10pt;color:#666;margin-bottom:16pt} table{border-collapse:collapse;width:100%} th{background:#1a56db;color:#fff;padding:8px 10px;font-size:11px;text-align:left} td{border:1px solid #ddd;padding:6px 10px;font-size:11px}</style>
      </head><body>
      <h1>${title}</h1>
      <p>Сформирован: ${new Date().toLocaleString('ru-RU')}</p>
      <table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
      <tbody>${tableRows}</tbody></table>
      </body></html>`;
    const blob = new Blob(['\uFEFF' + html], { type: 'application/msword;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToPDF = (title: string, headers: string[], rows: string[][], filename: string) => {
    const doc = new jsPDF('l', 'mm', 'a4');
    doc.setFont('helvetica');
    doc.setFontSize(14);
    doc.text(title, 14, 16);
    doc.setFontSize(10);
    doc.text(`Сформирован: ${new Date().toLocaleString('ru-RU')}`, 14, 23);
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 28,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [26, 86, 219], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });
    doc.save(filename);
  };

  // ---- Report 1: Courses ----
  const handleCoursesExport = (format: 'pdf' | 'csv' | 'word') => {
    setGenerating(true);
    const data = getCoursesReport();
    const headers = ['№', 'Название', 'Статус', 'Дата начала', 'Дата окончания', 'Теги'];
    const rows = data.map((c, i) => [
      String(i + 1), c.title, c.statusName,
      c.startDate ? new Date(c.startDate).toLocaleDateString('ru-RU') : '—',
      c.endDate ? new Date(c.endDate).toLocaleDateString('ru-RU') : '—',
      c.tags || '—',
    ]);
    if (format === 'pdf') exportToPDF('Отчёт по курсам', headers, rows, 'report-courses.pdf');
    else if (format === 'word') exportToWord('Отчёт по курсам', headers, rows, 'report-courses.doc');
    else exportToCSV(headers, rows, 'report-courses.csv');
    setGenerating(false);
  };

  // ---- Report 2: Certificates ----
  const handleCertificatesExport = (format: 'pdf' | 'csv' | 'word') => {
    setGenerating(true);
    const data = getCertificatesReport();
    const headers = ['№', 'Слушатель', 'Курс', 'Шаблон', 'Дата выдачи'];
    const rows = data.map((c: any, i: number) => [
      String(i + 1), c.listenerName || '—', c.courseTitle || '—', c.templateName || '—',
      c.issuedAt ? new Date(c.issuedAt).toLocaleDateString('ru-RU') : '—',
    ]);
    if (format === 'pdf') exportToPDF('Отчёт по сертификатам', headers, rows, 'report-certificates.pdf');
    else if (format === 'word') exportToWord('Отчёт по сертификатам', headers, rows, 'report-certificates.doc');
    else exportToCSV(headers, rows, 'report-certificates.csv');
    setGenerating(false);
  };

  // ---- Report 3: Teachers ----
  const handleTeachersExport = (format: 'pdf' | 'csv' | 'word') => {
    setGenerating(true);
    const data = getTeachersReport();
    const headers = ['№', 'Преподаватель', 'Курс', 'Дата назначения'];
    const rows = data.map((ct: any, i: number) => [
      String(i + 1), ct.teacherName || '—', ct.courseTitle || '—',
      ct.assignedAt ? new Date(ct.assignedAt).toLocaleDateString('ru-RU') : '—',
    ]);
    if (format === 'pdf') exportToPDF('Отчёт по преподавателям', headers, rows, 'report-teachers.pdf');
    else if (format === 'word') exportToWord('Отчёт по преподавателям', headers, rows, 'report-teachers.doc');
    else exportToCSV(headers, rows, 'report-teachers.csv');
    setGenerating(false);
  };

  // ---- Report 4: Period ----
  const handlePeriodExport = (format: 'pdf' | 'csv' | 'word') => {
    setGenerating(true);
    const data = getPeriodReport();
    const headers = ['№', 'Название', 'Статус', 'Начало', 'Окончание', 'Продолжительность (дней)'];
    const rows = data.map((c, i) => {
      const days = c.startDate && c.endDate
        ? String(Math.ceil((new Date(c.endDate).getTime() - new Date(c.startDate).getTime()) / 86400000))
        : '—';
      return [
        String(i + 1), c.title, c.statusName,
        c.startDate ? new Date(c.startDate).toLocaleDateString('ru-RU') : '—',
        c.endDate ? new Date(c.endDate).toLocaleDateString('ru-RU') : '—',
        days,
      ];
    });
    if (format === 'pdf') exportToPDF('Отчёт по периодам', headers, rows, 'report-period.pdf');
    else if (format === 'word') exportToWord('Отчёт по периодам', headers, rows, 'report-period.doc');
    else exportToCSV(headers, rows, 'report-period.csv');
    setGenerating(false);
  };

  const handleExport = (format: 'pdf' | 'csv' | 'word') => {
    if (activeReport === 'courses') handleCoursesExport(format);
    else if (activeReport === 'certificates') handleCertificatesExport(format);
    else if (activeReport === 'teachers') handleTeachersExport(format);
    else if (activeReport === 'period') handlePeriodExport(format);
  };

  const getPreviewData = () => {
    if (activeReport === 'courses') return getCoursesReport();
    if (activeReport === 'certificates') return getCertificatesReport();
    if (activeReport === 'teachers') return getTeachersReport();
    return getPeriodReport();
  };

  if (loading) return <div className={styles.loading}>Загрузка данных...</div>;

  const REPORT_TABS = [
    { id: 'courses' as ReportType, label: 'По курсам' },
    { id: 'certificates' as ReportType, label: 'По сертификатам' },
    { id: 'teachers' as ReportType, label: 'По преподавателям' },
    { id: 'period' as ReportType, label: 'По периодам' },
  ];

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Отчёты</h1>

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
          {activeReport === 'certificates' && (
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

      {/* Preview table */}
      <div className={styles.previewCard}>
        <div className={styles.previewHeader}>
          <h2>Предпросмотр <span className={styles.count}>({getPreviewData().length} записей)</span></h2>
          <div className={styles.exportBtns}>
            <button className={styles.btnPDF} onClick={() => handleExport('pdf')} disabled={generating || getPreviewData().length === 0}>
              {generating ? '...' : '↓ PDF'}
            </button>
            <button className={styles.btnCSV} onClick={() => handleExport('csv')} disabled={generating || getPreviewData().length === 0}>
              {generating ? '...' : '↓ Excel (CSV)'}
            </button>
            <button className={styles.btnWord} onClick={() => handleExport('word')} disabled={generating || getPreviewData().length === 0}>
              {generating ? '...' : '↓ Word'}
            </button>
          </div>
        </div>

        <div className={styles.tableWrap}>
          {activeReport === 'courses' && (
            <table className={styles.table}>
              <thead><tr><th>№</th><th>Название</th><th>Статус</th><th>Начало</th><th>Окончание</th><th>Теги</th></tr></thead>
              <tbody>
                {getCoursesReport().map((c, i) => (
                  <tr key={c.pkIdCourse}>
                    <td>{i + 1}</td>
                    <td className={styles.bold}>{c.title}</td>
                    <td><span className={`${styles.badge} ${c.statusName === 'Опубликован' ? styles.green : c.statusName === 'Черновик' ? styles.yellow : styles.gray}`}>{c.statusName}</span></td>
                    <td>{c.startDate ? new Date(c.startDate).toLocaleDateString('ru-RU') : '—'}</td>
                    <td>{c.endDate ? new Date(c.endDate).toLocaleDateString('ru-RU') : '—'}</td>
                    <td className={styles.muted}>{c.tags || '—'}</td>
                  </tr>
                ))}
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
                    <td>{c.issuedAt ? new Date(c.issuedAt).toLocaleDateString('ru-RU') : '—'}</td>
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
                    <td>{ct.assignedAt ? new Date(ct.assignedAt).toLocaleDateString('ru-RU') : '—'}</td>
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
                    <td>{c.startDate ? new Date(c.startDate).toLocaleDateString('ru-RU') : '—'}</td>
                    <td>{c.endDate ? new Date(c.endDate).toLocaleDateString('ru-RU') : '—'}</td>
                    <td>{c.startDate && c.endDate ? Math.ceil((new Date(c.endDate).getTime() - new Date(c.startDate).getTime()) / 86400000) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {getPreviewData().length === 0 && (
            <div className={styles.empty}>Нет данных для отображения</div>
          )}
        </div>
      </div>
    </div>
  );
}
