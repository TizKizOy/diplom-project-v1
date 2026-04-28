'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth'; // <-- Убедись, что импортируешь отсюда
import { usersApi, type ICreateUserDto } from '@/lib/api/users.api';
import { type IUser } from '@/lib/types/index';
import styles from './page.module.scss';

const ROLE_OPTIONS = [
  { value: 1, label: 'Администратор' },
  { value: 2, label: 'Преподаватель' },
  { value: 3, label: 'Слушатель' },
];

export default function AdminUsersPage() {
  const { checkRole, isLoading, user } = useAuth(); // <-- Добавили isLoading и user

  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true); // Локальная загрузка таблицы
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<IUser | null>(null);

  const [formData, setFormData] = useState<ICreateUserDto>({
    fullName: '',
    login: '',
    phone: '',
    email: '',
    password: '',
    roleId: 3,
    positionId: 1,
  });

  useEffect(() => {
    // 1. Ждем пока AuthProvider загрузит пользователя
    if (isLoading) {
      return;
    }

    // 2. Если загрузка закончилась, проверяем права
    if (!checkRole(['Администратор'])) {
      setError('Доступ запрещён. Требуется роль Администратор.');
      setLoading(false);
      return;
    }

    // 3. Если права есть — грузим данные
    loadUsers();
  }, [isLoading, checkRole]); // <-- Зависимости: ждем изменения isLoading или checkRole

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await usersApi.getAll();
      setUsers(data);
    } catch (err: any) {
      console.error('Ошибка загрузки пользователей:', err);
      setError(err.response?.data?.message || 'Не удалось загрузить список');
    } finally {
      setLoading(false);
    }
  };

  // ... (функции handleSubmit, handleEdit, handleDelete, resetForm без изменений) ...
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        fullName: formData.fullName,
        login: formData.login,
        phone: formData.phone,
        email: formData.email,
        roleId: formData.roleId,
        positionId: formData.positionId,
      };
      if (formData.password && formData.password.length > 0)
        payload.password = formData.password;
      else if (!editingUser) {
        alert('Пароль обязателен');
        return;
      }

      if (editingUser) await usersApi.update(editingUser.pkIdUser, payload);
      else await usersApi.create(payload);

      resetForm();
      await loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Ошибка');
    }
  };

  const handleEdit = (user: IUser) => {
    setEditingUser(user);
    let mappedRoleId = 3;
    if (user.roleName === 'Администратор') mappedRoleId = 1;
    else if (user.roleName === 'Преподаватель') mappedRoleId = 2;

    setFormData({
      fullName: user.fullName,
      login: user.login,
      phone: user.phone || '',
      email: user.email,
      password: '',
      roleId: mappedRoleId,
      positionId: 1,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить?')) return;
    try {
      await usersApi.delete(id);
      await loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Ошибка');
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingUser(null);
    setFormData({
      fullName: '',
      login: '',
      phone: '',
      email: '',
      password: '',
      roleId: 3,
      positionId: 1,
    });
  };

  // --- РЕНДЕРИНГ ---

  // 1. Пока AuthProvider грузит пользователя - показываем общий спиннер
  if (isLoading) {
    return <div className={styles.loading}>Проверка прав доступа...</div>;
  }

  // 2. Если права не прошли - показываем ошибку
  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorBox}>
          <p>❌ {error}</p>
          <button
            onClick={() => (window.location.href = '/main')}
            className={styles.retryButton}
          >
            На главную
          </button>
        </div>
      </div>
    );
  }

  // 3. Пока грузится таблица пользователей - локальный спиннер
  if (loading) {
    return (
      <div className={styles.loading}>Загрузка списка пользователей...</div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Управление пользователями</h1>
        <button onClick={() => setShowForm(true)} className={styles.addButton}>
          + Добавить
        </button>
      </div>

      {showForm && (
        <div className={styles.modalOverlay}>
          <div className={styles.formModal}>
            <h3>{editingUser ? 'Редактировать' : 'Новый пользователь'}</h3>
            <form onSubmit={handleSubmit}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>ФИО *</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Логин *</label>
                  <input
                    type="text"
                    value={formData.login}
                    onChange={(e) =>
                      setFormData({ ...formData, login: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Телефон *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Пароль {!editingUser && '*'}</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required={!editingUser}
                    minLength={5}
                    placeholder={
                      editingUser ? 'Оставьте пустым, чтобы не менять' : ''
                    }
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Роль *</label>
                  <select
                    value={formData.roleId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        roleId: Number(e.target.value),
                      })
                    }
                    required
                  >
                    {ROLE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={styles.formActions}>
                <button type="submit" className={styles.saveButton}>
                  {editingUser ? 'Сохранить' : 'Создать'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className={styles.cancelButton}
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>ФИО</th>
              <th>Логин</th>
              <th>Email</th>
              <th>Роль</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    textAlign: 'center',
                    padding: '20px',
                    color: '#999',
                  }}
                >
                  Пользователи не найдены
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.pkIdUser}>
                  <td>{u.pkIdUser}</td>
                  <td>{u.fullName}</td>
                  <td>{u.login}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={styles.roleBadge}>{u.roleName}</span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleEdit(u)}
                      className={styles.actionBtn}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(u.pkIdUser)}
                      className={styles.actionBtnDelete}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
