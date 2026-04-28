'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import Link from 'next/link';
import styles from './page.module.scss';

const POSITION_OPTIONS = [
  { value: 1, label: 'Учитель информатики' },
  { value: 2, label: 'Учитель математики' },
  { value: 3, label: 'Учитель физики' },
  { value: 4, label: 'Учитель русского языка' },
  { value: 5, label: 'Учитель английского языка' },
  { value: 6, label: 'Учитель психологии' },
  { value: 7, label: 'Учитель начальных классов' },
  { value: 8, label: 'Методист' },
];

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    login: '',
    phone: '',
    email: '',
    password: '',
    positionId: 1,
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await register({
        fullName: formData.fullName,
        login: formData.login,
        phone: formData.phone,
        email: formData.email,
        password: formData.password,
        positionId: Number(formData.positionId),
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка регистрации');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <div className={styles.logo}>МГИРО</div>
        <h1 className={styles.title}>Регистрация</h1>
        <p className={styles.subtitle}>
          Заполните данные для создания аккаунта
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>ФИО</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className={styles.input}
              required
              minLength={5}
              maxLength={30}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Логин</label>
            <input
              type="text"
              name="login"
              value={formData.login}
              onChange={handleChange}
              className={styles.input}
              required
              minLength={3}
              maxLength={30}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Телефон</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={styles.input}
              required
              placeholder="+375291234567"
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={styles.input}
              required
              maxLength={50}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Пароль</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={styles.input}
              required
              minLength={5}
              maxLength={55}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Должность</label>
            <select
              name="positionId"
              value={formData.positionId}
              onChange={handleChange}
              className={styles.input}
            >
              {POSITION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" className={styles.button} disabled={isLoading}>
            {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>

        <div className={styles.links}>
          <span>Уже есть аккаунт?</span>
          <Link href="/auth/login" className={styles.link}>
            Войти
          </Link>
        </div>
      </div>
    </div>
  );
}
