'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { AppDialogProvider } from '@/lib/hooks/useAppDialog';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from './layout.module.scss';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  roles: string[];
}

const NAV_ITEMS: NavItem[] = [
  { href: '/main',              label: 'Моё обучение',   icon: '•', roles: ['Администратор', 'Преподаватель', 'Слушатель'] },
  { href: '/courses',           label: 'Курсы',          icon: '•', roles: ['Администратор', 'Преподаватель', 'Слушатель'] },
  { href: '/admin/users',       label: 'Пользователи',   icon: '•', roles: ['Администратор'] },
  { href: '/admin/courses',     label: 'Курсы (админ)',  icon: '•', roles: ['Администратор'] },
  { href: '/admin/groups',      label: 'Группы',         icon: '•', roles: ['Администратор', 'Преподаватель'] },
  { href: '/admin/analytics',   label: 'Аналитика',      icon: '•', roles: ['Администратор', 'Преподаватель'] },
  { href: '/admin/reports',     label: 'Отчёты',         icon: '•', roles: ['Администратор'] },
  { href: '/admin/logs',        label: 'Журнал',         icon: '•', roles: ['Администратор'] },
  { href: '/messages',          label: 'Сообщения',      icon: '•', roles: ['Администратор', 'Преподаватель', 'Слушатель'] },
  { href: '/notifications',     label: 'Уведомления',    icon: '•', roles: ['Администратор', 'Преподаватель', 'Слушатель'] },
  { href: '/help',              label: 'Справка',        icon: '?', roles: ['Администратор', 'Преподаватель', 'Слушатель'] },
  { href: '/certificates',      label: 'Сертификаты',    icon: '•', roles: ['Слушатель', 'Администратор'] },
  { href: '/account',           label: 'Профиль',        icon: '•', roles: ['Администратор', 'Преподаватель', 'Слушатель'] },
];

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const { user, logout, checkRole, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.spinner} />
      </div>
    );
  }

  const visibleItems = NAV_ITEMS.filter((item) =>
    item.roles.some((r) => checkRole([r])),
  );

  const initials = user.fullName
    ?.split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('') || '?';

  return (
    <AppDialogProvider>
    <div className={styles.layout}>
      {mobileNavOpen && (
        <button
          type="button"
          className={styles.overlay}
          aria-label="Закрыть меню"
          onClick={() => setMobileNavOpen(false)}
        />
      )}
      <aside
        className={`${styles.sidebar} ${mobileNavOpen ? styles.sidebarOpen : ''}`}
      >
        <div className={styles.logo}>
          <span className={styles.logoText}>МГИРО</span>
        </div>

        <nav className={styles.nav}>
          {visibleItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                onClick={() => setMobileNavOpen(false)}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                <span className={styles.navLabel}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userBlock}>
            <div className={styles.avatar}>{initials}</div>
            <div className={styles.userMeta}>
              <span className={styles.userName}>{user.fullName}</span>
              <span className={styles.userRole}>{user.roleName}</span>
            </div>
          </div>
          <button onClick={logout} className={styles.logoutBtn} title="Выйти">
            ↩
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        <div className={styles.mobileBar}>
          <button
            type="button"
            className={styles.menuToggle}
            aria-label="Открыть меню"
            onClick={() => setMobileNavOpen(true)}
          >
            ☰
          </button>
          <span className={styles.mobileTitle}>МГИРО</span>
        </div>
        <div className={styles.content}>{children}</div>
      </main>
    </div>
    </AppDialogProvider>
  );
}
