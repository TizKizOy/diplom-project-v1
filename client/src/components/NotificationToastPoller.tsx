'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '@/lib/hooks/useAuth';
import { notificationsApi } from '@/lib/api/notifications.api';

const POLL_MS = 45_000;

export function NotificationToastPoller() {
  const { user, isLoading } = useAuth();
  const seenIds = useRef<Set<number>>(new Set());
  const bootstrapped = useRef(false);

  useEffect(() => {
    if (isLoading || !user) return;

    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | undefined;

    const poll = async () => {
      try {
        const list = await notificationsApi.getByUser(user.pkIdUser);
        if (cancelled) return;

        if (!bootstrapped.current) {
          list.forEach((n) => seenIds.current.add(n.pkIdNotification));
          bootstrapped.current = true;
          return;
        }

        const fresh = [...list].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        for (const n of fresh) {
          if (seenIds.current.has(n.pkIdNotification)) continue;
          seenIds.current.add(n.pkIdNotification);
          if (!n.isRead) {
            toast.info(n.message, { toastId: `n-${n.pkIdNotification}` });
          }
        }
      } catch {
        /* сеть / 401 обрабатывает apiClient */
      }
    };

    void poll();
    timer = setInterval(poll, POLL_MS);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [user, isLoading]);

  return null;
}
