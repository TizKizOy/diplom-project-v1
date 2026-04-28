'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { groupsApi, type ICreateGroupDto } from '@/lib/api/groups.api';
import { groupListenersApi } from '@/lib/api/groupListeners.api';
import { coursesApi } from '@/lib/api/courses.api';
import { usersApi } from '@/lib/api/users.api';
import { courseTeachersApi } from '@/lib/api/courseTeachers.api';
import type { IGroup, ICourse, IUser } from '@/lib/types';
import { ROLES } from '@/lib/constants';
import styles from './page.module.scss';

export default function AdminGroupsPage() {
  const { user, checkRole } = useAuth();
  const initialized = useRef(false);

  const [groups, setGroups] = useState<IGroup[]>([]);
  const [courses, setCourses] = useState<ICourse[]>([]);
  const [teachers, setTeachers] = useState<IUser[]>([]);
  const [listeners, setListeners] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);

  const [showGroupForm, setShowGroupForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<IGroup | null>(null);
  const [groupForm, setGroupForm] = useState<ICreateGroupDto>({ name: '', courseId: 0, curatorId: undefined });

  const [showListeners, setShowListeners] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<IGroup | null>(null);
  const [groupListeners, setGroupListeners] = useState<any[]>([]);
  const [addListenerId, setAddListenerId] = useState<number | ''>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isAdmin = checkRole([ROLES.ADMIN]);
  const isTeacher = checkRole([ROLES.TEACHER]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const [allGroups, allCourses, allUsers] = await Promise.all([
        groupsApi.getAll(),
        coursesApi.getAll(),
        usersApi.getAll(),
      ]);

      let filteredGroups = allGroups;
      let filteredCourses = allCourses;

      // Преподаватель видит только группы своих курсов
      if (isTeacher && user) {
        const assignments = await courseTeachersApi.getByTeacher(user.pkIdUser);
        const myCourseIds = new Set(assignments.map((a: any) => a.fkIdCourse));
        filteredGroups = allGroups.filter((g) => myCourseIds.has(g.fkIdCourse));
        filteredCourses = allCourses.filter((c) => myCourseIds.has(c.pkIdCourse));
      }

      setGroups(filteredGroups);
      setCourses(filteredCourses);
      setTeachers(allUsers.filter((u) => u.roleName === ROLES.TEACHER));
      setListeners(allUsers.filter((u) => u.roleName === ROLES.LISTENER));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openGroupForm = (group?: IGroup) => {
    if (group) {
      setEditingGroup(group);
      setGroupForm({ name: group.name, courseId: group.fkIdCourse, curatorId: group.fkIdCurator });
    } else {
      setEditingGroup(null);
      setGroupForm({ name: '', courseId: 0, curatorId: undefined });
    }
    setShowGroupForm(true);
  };

  const saveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingGroup) {
        await groupsApi.update(editingGroup.pkIdGroup, groupForm);
      } else {
        await groupsApi.create(groupForm);
      }
      setShowGroupForm(false);
      await loadAll();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка');
    } finally {
      setSaving(false);
    }
  };

  const deleteGroup = async (id: number) => {
    if (!confirm('Удалить группу?')) return;
    try {
      await groupsApi.delete(id);
      await loadAll();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Ошибка');
    }
  };

  const openListeners = async (group: IGroup) => {
    setSelectedGroup(group);
    setAddListenerId('');
    setError('');
    try {
      const data = await groupListenersApi.getByGroup(group.pkIdGroup);
      setGroupListeners(data);
    } catch {
      setGroupListeners([]);
    }
    setShowListeners(true);
  };

  const addListener = async () => {
    if (!addListenerId || !selectedGroup) return;
    setSaving(true);
    setError('');
    try {
      await groupListenersApi.create({ groupId: selectedGroup.pkIdGroup, listenerId: Number(addListenerId) });
      const data = await groupListenersApi.getByGroup(selectedGroup.pkIdGroup);
      setGroupListeners(data);
      setAddListenerId('');
      await loadAll();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка');
    } finally {
      setSaving(false);
    }
  };

  const removeListener = async (glId: number) => {
    if (!confirm('Исключить слушателя?')) return;
    try {
      await groupListenersApi.delete(glId);
      if (selectedGroup) {
        const data = await groupListenersApi.getByGroup(selectedGroup.pkIdGroup);
        setGroupListeners(data);
        await loadAll();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Ошибка');
    }
  };

  // Слушатели которых ещё нет в группе
  const availableListeners = listeners.filter(
    (l) => !groupListeners.some((gl) => gl.fkIdListener === l.pkIdUser),
  );

  if (loading) return <div className={styles.loading}>Загрузка...</div>;

  if (!checkRole(['Администратор', 'Преподаватель'])) {
    return <div className={styles.loading}>Доступ запрещён</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Учебные группы</h1>
        <button onClick={() => openGroupForm()} className={styles.addBtn}>+ Создать группу</button>
      </div>

      {/* Таблица групп */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Название</th>
              <th>Курс</th>
              <th>Куратор</th>
              <th>Слушателей</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {groups.length === 0 ? (
              <tr><td colSpan={5} className={styles.empty}>Групп пока нет</td></tr>
            ) : groups.map((g) => (
              <tr key={g.pkIdGroup}>
                <td className={styles.bold}>{g.name || (g as any).groupName || '—'}</td>
                <td>{g.courseTitle || '—'}</td>
                <td>{g.curatorName || '—'}</td>
                <td>
                  <span className={styles.countBadge}>{g.listenerCount}</span>
                </td>
                <td>
                  <div className={styles.actions}>
                    <button onClick={() => openListeners(g)} className={styles.btnOutline}>Слушатели</button>
                    <button onClick={() => openGroupForm(g)} className={styles.btnIcon} title="Редактировать">✏️</button>
                    <button onClick={() => deleteGroup(g.pkIdGroup)} className={styles.btnIconDanger} title="Удалить">🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Модалка создания/редактирования группы */}
      {showGroupForm && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <h3>{editingGroup ? 'Редактировать группу' : 'Новая группа'}</h3>
            {error && <div className={styles.errorBox}>{error}</div>}
            <form onSubmit={saveGroup} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Название *</label>
                <input
                  type="text"
                  value={groupForm.name}
                  onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Курс *</label>
                <select
                  value={groupForm.courseId}
                  onChange={(e) => setGroupForm({ ...groupForm, courseId: Number(e.target.value) })}
                  required
                >
                  <option value={0} disabled>Выберите курс...</option>
                  {courses.map((c) => (
                    <option key={c.pkIdCourse} value={c.pkIdCourse}>{c.title}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Куратор</label>
                <select
                  value={groupForm.curatorId ?? ''}
                  onChange={(e) => setGroupForm({ ...groupForm, curatorId: e.target.value ? Number(e.target.value) : undefined })}
                >
                  <option value="">Без куратора</option>
                  {teachers.map((t) => (
                    <option key={t.pkIdUser} value={t.pkIdUser}>{t.fullName}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formActions}>
                <button type="submit" className={styles.btnPrimary} disabled={saving}>
                  {saving ? 'Сохранение...' : 'Сохранить'}
                </button>
                <button type="button" onClick={() => setShowGroupForm(false)} className={styles.btnSecondary}>
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модалка слушателей группы */}
      {showListeners && selectedGroup && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <h3>Слушатели: {selectedGroup.name}</h3>
            {error && <div className={styles.errorBox}>{error}</div>}

            {/* Добавить слушателя */}
            <div className={styles.addRow}>
              <select
                value={addListenerId}
                onChange={(e) => setAddListenerId(e.target.value ? Number(e.target.value) : '')}
                className={styles.selectFull}
              >
                <option value="">Выберите слушателя...</option>
                {availableListeners.map((l) => (
                  <option key={l.pkIdUser} value={l.pkIdUser}>{l.fullName}</option>
                ))}
              </select>
              <button onClick={addListener} className={styles.btnPrimary} disabled={!addListenerId || saving}>
                Добавить
              </button>
            </div>

            {/* Список слушателей */}
            <div className={styles.listenerList}>
              {groupListeners.length === 0 ? (
                <p className={styles.emptyText}>В группе пока нет слушателей</p>
              ) : groupListeners.map((gl) => (
                <div key={gl.pkIdGroupListener} className={styles.listenerRow}>
                  <div>
                    <span className={styles.bold}>{gl.listenerName}</span>
                    <span className={styles.sub}>{gl.email}</span>
                  </div>
                  <button onClick={() => removeListener(gl.pkIdGroupListener)} className={styles.btnIconDanger} title="Исключить">✕</button>
                </div>
              ))}
            </div>

            <button onClick={() => setShowListeners(false)} className={styles.btnSecondary} style={{ marginTop: '1.6rem' }}>
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
