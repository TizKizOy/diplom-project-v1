'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { coursesApi } from '@/lib/api/courses.api';
import type { ICourse } from '@/lib/types';
import { useAuth } from '@/lib/hooks/useAuth';
import { ROLES } from '@/lib/constants';

export default function AdminCoursesPage() {
  const { checkRole } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<ICourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!checkRole([ROLES.ADMIN])) {
      router.replace('/main');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await coursesApi.getAll();
        if (!cancelled) setCourses(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [checkRole, router]);

  if (loading) {
    return <div style={{ padding: '2rem' }}>Загрузка курсов…</div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '96rem', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1.6rem', fontSize: '2.4rem' }}>Курсы — администрирование</h1>
      <p style={{ marginBottom: '2rem' }}>
        <Link href="/admin/courses/create" style={{ fontWeight: 600 }}>
          + Создать курс
        </Link>
        <span style={{ margin: '0 0.8rem', color: '#94a3b8' }}>|</span>
        <Link href="/courses">Каталог для всех ролей</Link>
      </p>
      {courses.length === 0 ? (
        <p>Курсов пока нет.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {courses.map((c) => (
            <li
              key={c.pkIdCourse}
              style={{
                borderBottom: '1px solid #e2e8f0',
                padding: '1.2rem 0',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '0.8rem',
              }}
            >
              <Link href={`/courses/${c.pkIdCourse}/manage`} style={{ fontWeight: 600 }}>
                {c.title}
              </Link>
              <span style={{ color: '#64748b', fontSize: '1.4rem' }}>{c.statusName}</span>
              <Link href={`/courses/${c.pkIdCourse}`} style={{ marginLeft: 'auto', fontSize: '1.4rem' }}>
                Просмотр
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
