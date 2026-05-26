'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { coursesApi, type ICreateCourseDto } from '@/lib/api/courses.api';
import { datetimeLocalToIso } from '@/lib/datetime/datetimeLocalToIso';
import { isCourseDateRangeValid, isCourseStartNotInPast } from '@/lib/datetime/datetimeGuards';
import { COURSE_STATUS } from '@/lib/constants';
import { getApiErrorMessage } from '@/lib/http/getApiErrorMessage';
import { usersApi } from '@/lib/api/users.api';
import { type IUser } from '@/lib/types/index';
import { courseTeachersApi } from '@/lib/api/courseTeachers.api';
import { groupsApi } from '@/lib/api/groups.api';
import styles from './page.module.scss';

const STATUS_OPTIONS = [
  { value: 1, label: 'Черновик' },
  { value: 3, label: 'Архивирован' },
];

function todayDatetimeLocalMin(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T00:00`;
}

export default function CreateCoursePage() {
  const router = useRouter();
  const { checkRole, isLoading: isAuthLoading } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [teachers, setTeachers] = useState<IUser[]>([]);
  const [isTeachersLoading, setIsTeachersLoading] = useState(true);

  const [formData, setFormData] = useState<ICreateCourseDto>({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    statusId: 1,
  });

  const [selectedTeacherId, setSelectedTeacherId] = useState<number | ''>('');
  const [groupName, setGroupName] = useState('');

  useEffect(() => {
    // 1. Если авторизация еще грузится — ждем и ничего не делаем
    if (isAuthLoading) return;

    // 2. Если авторизация закончилась, проверяем права
    if (!checkRole(['Администратор'])) {
      setError('Доступ запрещён');
      setIsTeachersLoading(false);
      return;
    }

    // 3. Только если мы точно Админ и данные загружены — грузим учителей
    loadTeachers();

    // Зависимости: запускаем, когда закончилась загрузка auth или изменилась роль
  }, [isAuthLoading, checkRole]);

  const loadTeachers = async () => {
    try {
      setIsTeachersLoading(true);
      setError('');

      const allUsers = await usersApi.getAll();
      const filteredTeachers = allUsers.filter(
        (u) => u.roleName === 'Преподаватель',
      );

      setTeachers(filteredTeachers);

      if (filteredTeachers.length === 0) {
        setError(
          'В системе нет преподавателей. Создайте их в разделе "Пользователи".',
        );
      }
    } catch (err: any) {
      console.error('Ошибка загрузки преподавателей:', err);
      setError(
        'Не удалось загрузить список преподавателей: ' +
          (err.message || 'Ошибка сети'),
      );
      setTeachers([]);
    } finally {
      setIsTeachersLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTeacherId) {
      setError('Обязательно выберите преподавателя');
      return;
    }

    setLoading(true);
    setError('');

    if (!isCourseDateRangeValid(formData.startDate, formData.endDate)) {
      setError('Дата окончания курса не может быть раньше даты начала.');
      setLoading(false);
      return;
    }
    if (!isCourseStartNotInPast(formData.startDate)) {
      setError('Дата начала курса не может быть в прошлом.');
      setLoading(false);
      return;
    }
    if (formData.statusId === COURSE_STATUS.PUBLISHED) {
      setError('При создании курс можно сохранить только как черновик. Опубликуйте после добавления урока с заданием.');
      setLoading(false);
      return;
    }

    try {
      const startIso = datetimeLocalToIso(formData.startDate);
      const endIso = datetimeLocalToIso(formData.endDate);
      const payload: ICreateCourseDto = {
        title: formData.title,
        description: formData.description,
        statusId: formData.statusId,
        ...(startIso ? { startDate: startIso } : {}),
        ...(endIso ? { endDate: endIso } : {}),
      };

      const course = await coursesApi.create(payload);

      await courseTeachersApi.create({
        courseId: course.pkIdCourse,
        teacherId: Number(selectedTeacherId),
      });

      if (groupName.trim()) {
        await groupsApi.create({
          name: groupName.trim(),
          courseId: course.pkIdCourse,
          curatorId: Number(selectedTeacherId),
        });
      }

      router.push(`/courses/${course.pkIdCourse}/manage`);
    } catch (err: unknown) {
      console.error(err);
      setError(getApiErrorMessage(err, 'Ошибка при создании курса'));
    } finally {
      setLoading(false);
    }
  };

  if (isAuthLoading || isTeachersLoading) {
    return (
      <div className={styles.loading}>
        Загрузка данных для создания курса...
      </div>
    );
  }

  if (!checkRole(['Администратор'])) {
    return <div className={styles.error}>Доступ запрещён</div>;
  }

  return (
    <div className={styles.container}>
      <h1>Создание нового курса</h1>

      {error && <div className={styles.errorBox}>{error}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label>Название курса *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            required
            minLength={3}
            maxLength={255}
            placeholder="Например: Основы Python"
          />
        </div>

        <div className={styles.formGroup}>
          <label>Описание</label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            rows={5}
            maxLength={2000}
            placeholder="Краткое описание программы курса..."
          />
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Дата начала</label>
            <input
              type="datetime-local"
              min={todayDatetimeLocalMin()}
              value={formData.startDate}
              onChange={(e) =>
                setFormData({ ...formData, startDate: e.target.value })
              }
            />
          </div>
          <div className={styles.formGroup}>
            <label>Дата окончания</label>
            <input
              type="datetime-local"
              min={formData.startDate || todayDatetimeLocalMin()}
              value={formData.endDate}
              onChange={(e) =>
                setFormData({ ...formData, endDate: e.target.value })
              }
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>Статус</label>
          <select
            value={formData.statusId}
            onChange={(e) =>
              setFormData({ ...formData, statusId: Number(e.target.value) })
            }
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label>Преподаватель курса *</label>

          {teachers.length === 0 ? (
            <div className={styles.warningText}>
              В системе нет преподавателей. Сначала создайте пользователя с
              ролью "Преподаватель" в разделе <b>Админ → Пользователи</b>.
            </div>
          ) : (
            <>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(Number(e.target.value))}
                required
                className={styles.selectRequired}
              >
                <option value="" disabled>
                  Выберите преподавателя...
                </option>
                {teachers.map((teacher) => (
                  <option key={teacher.pkIdUser} value={teacher.pkIdUser}>
                    {teacher.fullName}{' '}
                    {teacher.positionName ? `(${teacher.positionName})` : ''}
                  </option>
                ))}
              </select>
              <small>Преподаватель станет куратором курса.</small>
            </>
          )}
        </div>

        {selectedTeacherId && (
          <div className={styles.formGroup}>
            <label>Название учебной группы (необязательно)</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Например: Группа П-2026-1"
            />
            <small>Будет создана группа с этим куратором.</small>
          </div>
        )}

        <div className={styles.actions}>
          <button
            type="submit"
            className={styles.saveButton}
            disabled={loading || teachers.length === 0}
          >
            {loading ? 'Создание...' : 'Создать курс'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/courses')}
            className={styles.cancelButton}
            disabled={loading}
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
}
