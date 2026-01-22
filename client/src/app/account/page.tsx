// app/account/page.tsx
'use client';
import { useEffect, useState } from 'react';
import styles from './page.module.scss';

interface IUser {
  pkIdUser: number;
  fio: string;
  login: string;
  phone: string;
  email: string;
  regDate: string;
  roleName: string;
}

export default function AccountPage() {
  const [user, setUser] = useState<IUser | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (raw) setUser(JSON.parse(raw));
  }, []);

  if (!user)
    return (
      <div className={styles.wrapper}>
        <h1 className={styles.title}>Не авторизованы</h1>
        <p className={styles.text}>
          <a href="/auth">Войдите</a>, чтобы увидеть профиль.
        </p>
      </div>
    );

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.heading}>Мой аккаунт</h1>

      <div className={styles.card}>
        <div className={styles.row}>
          <span>ФИО</span>
          <span>{user.fio}</span>
        </div>
        <div className={styles.row}>
          <span>Логин</span>
          <span>{user.login}</span>
        </div>
        <div className={styles.row}>
          <span>Телефон</span>
          <span>{user.phone}</span>
        </div>
        <div className={styles.row}>
          <span>Email</span>
          <span>{user.email}</span>
        </div>
        <div className={styles.row}>
          <span>Роль</span>
          <span>{user.roleName}</span>
        </div>
        <div className={styles.row}>
          <span>Дата регистрации</span>
          <span>{new Date(user.regDate).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}
