'use client';
import { FormEvent, useState } from 'react';
import styles from './page.module.scss';
const API_URL = 'http://localhost:3003';

type FormData = {
  fio?: string;
  phone?: string;
  email?: string;
  login: string;
  password: string;
};

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const body: FormData = {
      login: fd.get('login') as string,
      password: fd.get('password') as string,
    };

    if (!isLogin) {
      body.fio = fd.get('fio') as string;
      body.phone = fd.get('phone') as string;
      body.email = fd.get('email') as string;
    }

    // простейшая валидация
    for (const [k, v] of Object.entries(body)) {
      if (!v?.toString().trim()) {
        setError(`${k} обязательно`);
        setLoading(false);
        return;
      }
    }

    try {
      const res = await fetch(
        `http://localhost:3003/auth/${isLogin ? 'login' : 'register'}`,
        {
          method: 'POST',
          credentials: 'include', // http-only cookies
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      );
      console.log(res);

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Ошибка сервера');
      localStorage.setItem('user', JSON.stringify(data.user));
      // токены уже в куках, просто переходим
      window.location.href = '/account'; // или router.push('/account')
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        {/* переключатель */}
        <div className={styles.switcher}>
          <button
            className={isLogin ? styles.active : ''}
            onClick={() => setIsLogin(true)}
          >
            Вход
          </button>
          <button
            className={!isLogin ? styles.active : ''}
            onClick={() => setIsLogin(false)}
          >
            Регистрация
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <h2 className={styles.title}>{isLogin ? 'Вход' : 'Регистрация'}</h2>

          {!isLogin && (
            <>
              <input
                className={styles.input}
                name="fio"
                type="text"
                placeholder="ФИО"
                required
              />
              <input
                className={styles.input}
                name="phone"
                type="tel"
                placeholder="Телефон"
                required
              />
              <input
                className={styles.input}
                name="email"
                type="email"
                placeholder="Email"
                required
              />
            </>
          )}

          <input
            className={styles.input}
            name="login"
            type="text"
            placeholder="Логин"
            required
          />
          <input
            className={styles.input}
            name="password"
            type="password"
            placeholder="Пароль"
            required
          />

          {error && <div className={styles.error}>{error}</div>}

          <button className={styles.submit} type="submit" disabled={loading}>
            {loading
              ? 'Подождите...'
              : isLogin
                ? 'Войти'
                : 'Зарегистрироваться'}
          </button>
        </form>
      </div>
    </div>
  );
}
