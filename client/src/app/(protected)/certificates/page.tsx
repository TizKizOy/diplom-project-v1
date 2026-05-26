'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { certificatesApi, type ICertificate } from '@/lib/api/certificates.api';
import { downloadCertificateStyledPdf } from '@/lib/export/certificatePdfFromHtml';
import { downloadCertificateDocx } from '@/lib/export/downloadTableDocx';
import { downloadFormattedTableXlsx } from '@/lib/export/downloadFormattedXlsx';
import styles from './page.module.scss';

function dedupeCertificates(list: ICertificate[]): ICertificate[] {
  const map = new Map<string, ICertificate>();
  for (const c of list) {
    const key = c.courseTitle?.trim().toLowerCase() || `id-${c.pkIdCertificate}`;
    const prev = map.get(key);
    if (!prev || c.pkIdCertificate > prev.pkIdCertificate) {
      map.set(key, c);
    }
  }
  return Array.from(map.values());
}

export default function CertificatesPage() {
  const { user, checkRole } = useAuth();
  const [certificates, setCertificates] = useState<ICertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<number | null>(null);
  const [exportingKind, setExportingKind] = useState<string | null>(null);

  const isAdmin = checkRole(['Администратор']);
  const formatDate = (value?: string | null) => {
    if (!value) return '—';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleDateString('ru-RU');
  };

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user, isAdmin]);

  const loadData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const data = isAdmin
        ? await certificatesApi.getAll()
        : await certificatesApi.getByListener(user.pkIdUser);
      setCertificates(
        dedupeCertificates(data).sort(
          (a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime(),
        ),
      );
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (cert: ICertificate) => {
    setDownloading(cert.pkIdCertificate);
    try {
      const dateStr =
        formatDate(cert.issuedAt) === '—'
          ? '—'
          : new Date(cert.issuedAt).toLocaleDateString('ru-RU', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            });
      await downloadCertificateStyledPdf(
        {
          listenerName: cert.listenerName,
          courseTitle: cert.courseTitle,
          issuedAtLabel: dateStr,
        },
        `certificate-${cert.pkIdCertificate}.pdf`,
      );
    } finally {
      setDownloading(null);
    }
  };

  const handleCertificateExcel = async (cert: ICertificate) => {
    const key = `xlsx-${cert.pkIdCertificate}`;
    setExportingKind(key);
    try {
      const headers = ['Слушатель', 'Курс', 'Шаблон', 'Дата выдачи'];
      const rows: string[][] = [
        [
          cert.listenerName,
          cert.courseTitle,
          cert.templateName || '—',
          formatDate(cert.issuedAt),
        ],
      ];
      await downloadFormattedTableXlsx(
        'Сертификат',
        headers,
        rows,
        `certificate-${cert.pkIdCertificate}.xlsx`,
        'Сертификат',
      );
    } finally {
      setExportingKind(null);
    }
  };

  const handleExportAllExcel = async () => {
    if (certificates.length === 0) return;
    setExportingKind('all-xlsx');
    try {
      const headers = ['№', 'Слушатель', 'Курс', 'Шаблон', 'Дата выдачи'];
      const rows = certificates.map((c, i) => [
        String(i + 1),
        c.listenerName,
        c.courseTitle,
        c.templateName || '—',
        formatDate(c.issuedAt),
      ]);
      await downloadFormattedTableXlsx(
        'Реестр сертификатов',
        headers,
        rows,
        `certificates-${new Date().toISOString().slice(0, 10)}.xlsx`,
        'Сертификаты',
      );
    } finally {
      setExportingKind(null);
    }
  };

  const handleDownloadWord = async (cert: ICertificate) => {
    const key = `word-${cert.pkIdCertificate}`;
    setExportingKind(key);
    try {
      const dateStr =
        formatDate(cert.issuedAt) === '—'
          ? '—'
          : new Date(cert.issuedAt).toLocaleDateString('ru-RU', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            });
      await downloadCertificateDocx(
        {
          listenerName: cert.listenerName,
          courseTitle: cert.courseTitle,
          issuedAtLabel: dateStr,
          templateName: cert.templateName,
        },
        `certificate-${cert.pkIdCertificate}.docx`,
      );
    } finally {
      setExportingKind(null);
    }
  };

  if (loading) return <div className={styles.loading}>Загрузка...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.titleRow}>
        <h1 className={styles.title}>
          {isAdmin ? 'Все сертификаты' : 'Мои сертификаты'}
        </h1>
        {isAdmin && certificates.length > 0 && (
          <button
            type="button"
            className={styles.toolbarBtn}
            onClick={() => void handleExportAllExcel()}
            disabled={exportingKind === 'all-xlsx'}
          >
            {exportingKind === 'all-xlsx' ? '…' : '↓ Список в Excel'}
          </button>
        )}
      </div>

      {certificates.length === 0 ? (
        <div className={styles.empty}>
          <p>{isAdmin ? 'Сертификатов пока нет' : 'У вас пока нет сертификатов'}</p>
          {!isAdmin && <span className={styles.hint}>Завершите курс, чтобы получить сертификат</span>}
        </div>
      ) : (
        <div className={styles.grid}>
          {certificates.map((cert) => (
            <div key={cert.pkIdCertificate} className={styles.card}>
              <div className={styles.cardTop}>
                <span className={styles.icon} aria-hidden />
                <span className={styles.date}>
                  {formatDate(cert.issuedAt)}
                </span>
              </div>
              <h3 className={styles.courseName}>{cert.courseTitle}</h3>
              {isAdmin && <p className={styles.listener}>{cert.listenerName}</p>}
              <p className={styles.template}>{cert.templateName}</p>
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.downloadBtn}
                  onClick={() => handleDownloadPDF(cert)}
                  disabled={downloading === cert.pkIdCertificate}
                >
                  {downloading === cert.pkIdCertificate ? '…' : 'PDF'}
                </button>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => void handleDownloadWord(cert)}
                  disabled={exportingKind === `word-${cert.pkIdCertificate}`}
                >
                  {exportingKind === `word-${cert.pkIdCertificate}` ? '…' : 'Word'}
                </button>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => void handleCertificateExcel(cert)}
                  disabled={exportingKind === `xlsx-${cert.pkIdCertificate}`}
                >
                  {exportingKind === `xlsx-${cert.pkIdCertificate}` ? '…' : 'Excel'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
