'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import styles from './Header.module.scss';

export const Header: React.FC = () => {
  const pathname = usePathname();
  const { user, isAuthenticated, checkRole, logout } = useAuth();

  const isAdmin = checkRole(['Администратор']);
  const isTeacher = checkRole(['Преподаватель']);
  const isListener = checkRole(['Слушатель']);

  const navLinks = [
    { href: '/main', label: 'Курсы', show: true },
    { href: '/account', label: 'Профиль', show: isAuthenticated },
    { href: '/analytics', label: 'Аналитика', show: isAdmin || isTeacher },
    { href: '/notifications', label: 'Уведомления', show: isAuthenticated },
    { href: '/messages', label: 'Сообщения', show: isAuthenticated },
  ];

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoText}>МГИРО</span>
        </Link>

        <nav className={styles.nav}>
          {navLinks
            .filter((link) => link.show)
            .map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`${styles.navLink} ${
                  pathname === link.href ? styles.active : ''
                }`}
              >
                {link.label}
              </Link>
            ))}
        </nav>

        <div className={styles.userMenu}>
          {isAuthenticated ? (
            <>
              <span className={styles.userName}>{user?.fullName}</span>
              <span className={styles.userRole}>{user?.roleName}</span>
              <button onClick={logout} className={styles.loginButton}>
                Выйти
              </button>
            </>
          ) : (
            <Link href="/auth" className={styles.loginButton}>
              Войти
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
