'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { notificationsApi, type INotification } from '@/lib/api/notifications.api';
import styles from './page.module.scss';

export default function NotificationsPage() {
  const { user } = useAuth();
  const initialized = useRef(false);

  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    loadData();
  }, []);

  const loadData = async () => {
    if (!user) return;
    try {
      const data = await notificationsApi.getByUser(user.pkIdUser);
      setNotifications(
        data.sort((a: INotification, b: INotification) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
      );
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.pkIdNotification === id ? { ...n, isRead: true } : n)),
      );
    } catch {
      alert('Ошибка');
    }
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter((n) => !n.isRead);
    if (unread.length === 0) return;
    setMarkingAll(true);
    try {
      await Promise.all(unread.map((n) => notificationsApi.markRead(n.pkIdNotification)));
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      alert('Ошибка');
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading) return <div className={styles.loading}>Загрузка...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div className={styles.titleRow}>
          <h1>Уведомления</h1>
          {unreadCount > 0 && <span className={styles.unreadCount}>{unreadCount} непрочитанных</span>}
        </div>
        {unreadCount > 0 && (
          <button className={styles.btnMarkAll} onClick={handleMarkAllRead} disabled={markingAll}>
            {markingAll ? 'Отмечаем...' : 'Отметить все прочитанными'}
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className={styles.empty}>
          <span>🔔</span>
          <p>Уведомлений нет</p>
        </div>
      ) : (
        <div className={styles.list}>
          {notifications.map((n) => (
            <div
              key={n.pkIdNotification}
              className={`${styles.item} ${!n.isRead ? styles.unread : ''}`}
            >
              <div className={styles.itemDot} />
              <div className={styles.itemContent}>
                <p className={styles.itemMessage}>{n.message}</p>
                <span className={styles.itemDate}>
                  {new Date(n.createdAt).toLocaleString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              {!n.isRead && (
                <button className={styles.btnRead} onClick={() => handleMarkRead(n.pkIdNotification)}>
                  Прочитано
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
