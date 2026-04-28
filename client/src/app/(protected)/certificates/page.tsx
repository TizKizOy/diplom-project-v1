'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { certificatesApi, type ICertificate } from '@/lib/api/certificates.api';
import jsPDF from 'jspdf';
import styles from './page.module.scss';

export default function CertificatesPage() {
  const { user, checkRole } = useAuth();
  const initialized = useRef(false);
  const [certificates, setCertificates] = useState<ICertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<number | null>(null);

  const isAdmin = checkRole(['Администратор']);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    loadData();
  }, []);

  const loadData = async () => {
    if (!user) return;
    try {
      const data = isAdmin
        ? await certificatesApi.getAll()
        : await certificatesApi.getByListener(user.pkIdUser);
      setCertificates(data.sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime()));
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (cert: ICertificate) => {
    setDownloading(cert.pkIdCertificate);
    try {
      const doc = new jsPDF('l', 'mm', 'a4');
      const w = doc.internal.pageSize.getWidth();
      const h = doc.internal.pageSize.getHeight();

      // Background
      doc.setFillColor(26, 86, 219);
      doc.rect(0, 0, w, 20, 'F');
      doc.rect(0, h - 20, w, 20, 'F');

      // Border
      doc.setDrawColor(26, 86, 219);
      doc.setLineWidth(1);
      doc.rect(10, 22, w - 20, h - 44);

      // Header
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('МГИРО', w / 2, 13, { align: 'center' });

      // Title
      doc.setTextColor(26, 86, 219);
      doc.setFontSize(28);
      doc.text('СЕРТИФИКАТ', w / 2, 50, { align: 'center' });

      doc.setFontSize(14);
      doc.setTextColor(100, 116, 139);
      doc.text('об успешном прохождении курса', w / 2, 60, { align: 'center' });

      // Divider
      doc.setDrawColor(26, 86, 219);
      doc.setLineWidth(0.5);
      doc.line(40, 65, w - 40, 65);

      // Listener name
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('Настоящим подтверждается, что', w / 2, 78, { align: 'center' });

      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(26, 86, 219);
      doc.text(cert.listenerName, w / 2, 92, { align: 'center' });

      // Course
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text('успешно прошёл(а) курс повышения квалификации', w / 2, 105, { align: 'center' });

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(26, 86, 219);
      const courseLines = doc.splitTextToSize(cert.courseTitle, w - 80);
      doc.text(courseLines, w / 2, 118, { align: 'center' });

      // Date
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      const dateStr = new Date(cert.issuedAt).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
      doc.text(`Дата выдачи: ${dateStr}`, w / 2, 148, { align: 'center' });

      // Footer
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.text('Минский государственный институт развития образования', w / 2, h - 12, { align: 'center' });

      doc.save(`certificate-${cert.pkIdCertificate}.pdf`);
    } finally {
      setDownloading(null);
    }
  };

  if (loading) return <div className={styles.loading}>Загрузка...</div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        {isAdmin ? 'Все сертификаты' : 'Мои сертификаты'}
      </h1>

      {certificates.length === 0 ? (
        <div className={styles.empty}>
          <span>🎓</span>
          <p>{isAdmin ? 'Сертификатов пока нет' : 'У вас пока нет сертификатов'}</p>
          {!isAdmin && <span className={styles.hint}>Завершите курс, чтобы получить сертификат</span>}
        </div>
      ) : (
        <div className={styles.grid}>
          {certificates.map((cert) => (
            <div key={cert.pkIdCertificate} className={styles.card}>
              <div className={styles.cardTop}>
                <span className={styles.icon}>🎓</span>
                <span className={styles.date}>
                  {new Date(cert.issuedAt).toLocaleDateString('ru-RU')}
                </span>
              </div>
              <h3 className={styles.courseName}>{cert.courseTitle}</h3>
              {isAdmin && <p className={styles.listener}>{cert.listenerName}</p>}
              <p className={styles.template}>{cert.templateName}</p>
              <button
                className={styles.downloadBtn}
                onClick={() => handleDownloadPDF(cert)}
                disabled={downloading === cert.pkIdCertificate}
              >
                {downloading === cert.pkIdCertificate ? 'Генерация...' : '↓ Скачать PDF'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
