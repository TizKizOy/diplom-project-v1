'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { usersApi } from '@/lib/api/users.api';
import type { IUpdateUserDto } from '@/lib/api/users.api';
import styles from './page.module.scss';

export default function AccountPage() {
  const { user: authUser, checkRole, setUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    login: '',
    email: '',
    phone: '',
    password: '',
  });

  // Заполняем форму из authUser (не делаем отдельный API запрос)
  useEffect(() => {
    if (authUser) {
      setFormData({
        fullName: authUser.fullName || '',
        login: authUser.login || '',
        email: authUser.email || '',
        phone: authUser.phone || '',
        password: '',
      });
    }
  }, [authUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser?.pkIdUser) return;

    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const updateData: IUpdateUserDto = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
      };

      if (formData.password && formData.password.length >= 5) {
        updateData.password = formData.password;
      }

      // Логин меняет только админ
      if (isAdmin && formData.login) {
        updateData.login = formData.login;
      }

      const updated = await usersApi.update(authUser.pkIdUser, updateData);
      // Обновляем контекст
      setUser({ ...authUser, ...updated });
      setIsEditing(false);
      setSuccess('Профиль успешно обновлён');
      setFormData((prev) => ({ ...prev, password: '' }));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка обновления профиля');
    } finally {
      setSaving(false);
    }
  };

  const isAdmin = checkRole(['Администратор']);

  if (!authUser) return <div className={styles.loading}>Загрузка...</div>;

  const initials = authUser.fullName?.split(' ').slice(0, 2).map((w) => w[0]).join('') || '?';

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Профиль</h1>

      {success && <div className={styles.success}>{success}</div>}
      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.profileCard}>
        <div className={styles.header}>
          <div className={styles.avatar}>{initials}</div>
          <div className={styles.userInfo}>
            <h2>{authUser.fullName}</h2>
            <span className={styles.role}>{authUser.roleName}</span>
            {authUser.positionName && (
              <span className={styles.position}>{authUser.positionName}</span>
            )}
          </div>
          {!isEditing && (
            <button onClick={() => setIsEditing(true)} className={styles.editButton}>
              Редактировать
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>ФИО</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                disabled={!isEditing}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Логин</label>
              <input
                type="text"
                value={formData.login}
                onChange={(e) => setFormData({ ...formData, login: e.target.value })}
                disabled={!isEditing || !isAdmin}
              />
              {!isAdmin && isEditing && (
                <span className={styles.hint}>Логин может изменить только администратор</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!isEditing}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Телефон</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={!isEditing}
              />
            </div>

            {isEditing && (
              <div className={styles.formGroup}>
                <label>Новый пароль</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Минимум 5 символов"
                  minLength={5}
                />
                <span className={styles.hint}>Оставьте пустым, чтобы не менять</span>
              </div>
            )}

            <div className={styles.formGroup}>
              <label>Роль</label>
              <input type="text" value={authUser.roleName || ''} disabled />
            </div>

            {authUser.positionName && (
              <div className={styles.formGroup}>
                <label>Должность</label>
                <input type="text" value={authUser.positionName} disabled />
              </div>
            )}

            <div className={styles.formGroup}>
              <label>Дата регистрации</label>
              <input
                type="text"
                value={authUser.regData ? new Date(authUser.regData).toLocaleDateString('ru-RU') : ''}
                disabled
              />
            </div>
          </div>

          {isEditing && (
            <div className={styles.formActions}>
              <button type="submit" className={styles.saveButton} disabled={saving}>
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button
                type="button"
                onClick={() => { setIsEditing(false); setError(''); }}
                className={styles.cancelButton}
              >
                Отмена
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
