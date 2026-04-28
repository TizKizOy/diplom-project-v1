'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { coursesApi } from '@/lib/api/courses.api';
import { courseTeachersApi, type ICourseTeacher } from '@/lib/api/courseTeachers.api';
import { lessonsApi } from '@/lib/api/lessons.api';
import { tasksApi } from '@/lib/api/tasks.api';
import { materialsApi } from '@/lib/api/materials.api';
import { groupsApi } from '@/lib/api/groups.api';
import { usersApi } from '@/lib/api/users.api';
import { attemptsApi, type IAttempt } from '@/lib/api/attempts.api';
import type { ICourse, ILesson, ITask, IMaterial, IGroup, IUser } from '@/lib/types';
import styles from './page.module.scss';

type Tab = 'info' | 'lessons' | 'tasks' | 'materials' | 'groups' | 'teachers' | 'attempts';

// ---- Modal component ----
function Modal({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!isOpen) return null;
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHead}>
          <h3>{title}</h3>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>
        <div className={styles.modalBody}>{children}</div>
      </div>
    </div>
  );
}

export default function ManageCoursePage() {
  const params = useParams();
  const router = useRouter();
  const { user, checkRole, isLoading: authLoading } = useAuth();
  const courseId = Number(params.id);
  const initialized = useRef(false);

  const [course, setCourse] = useState<ICourse | null>(null);
  const [teachers, setTeachers] = useState<ICourseTeacher[]>([]);
  const [lessons, setLessons] = useState<ILesson[]>([]);
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [materials, setMaterials] = useState<IMaterial[]>([]);
  const [groups, setGroups] = useState<IGroup[]>([]);
  const [allTeachers, setAllTeachers] = useState<IUser[]>([]);
  const [attempts, setAttempts] = useState<IAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('info');

  // Info form state
  const [infoForm, setInfoForm] = useState({ title: '', description: '', statusId: 1, startDate: '', endDate: '', tags: '' });
  const [infoSaving, setInfoSaving] = useState(false);

  // Lesson modal
  const [lessonModal, setLessonModal] = useState(false);
  const [editLesson, setEditLesson] = useState<ILesson | null>(null);
  const [lessonForm, setLessonForm] = useState({ title: '', description: '', content: '', sortOrder: 1, isPublished: false });

  // Task modal
  const [taskModal, setTaskModal] = useState(false);
  const [editTask, setEditTask] = useState<ITask | null>(null);
  const [taskForm, setTaskForm] = useState({ typeId: 1, title: '', description: '', maxScore: 10, deadline: '', lessonId: '' });

  // Material modal
  const [materialModal, setMaterialModal] = useState(false);
  const [editMaterial, setEditMaterial] = useState<IMaterial | null>(null);
  const [matForm, setMatForm] = useState({ typeMaterialId: 1, title: '', description: '', fileUrl: '', link: '', lessonId: '' });

  // Group modal
  const [groupModal, setGroupModal] = useState(false);
  const [editGroup, setEditGroup] = useState<IGroup | null>(null);
  const [groupForm, setGroupForm] = useState({ name: '', curatorId: '' });

  // Teacher modal
  const [teacherModal, setTeacherModal] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');

  // Grade modal
  const [gradeModal, setGradeModal] = useState(false);
  const [gradeAttempt, setGradeAttempt] = useState<IAttempt | null>(null);
  const [gradeScore, setGradeScore] = useState('');

  const isAdmin = checkRole(['Администратор']);
  const isTeacher = checkRole(['Преподаватель']);
  // canEdit вычисляется после загрузки данных
  const isCourseTeacher = teachers.some(t => t.fkIdTeacher === user?.pkIdUser);
  const canEdit = isAdmin || isCourseTeacher;

  useEffect(() => {
    if (authLoading) return; // ждём загрузки auth
    if (initialized.current) return;
    initialized.current = true;
    loadData();
  }, [authLoading]);

  const loadData = async () => {
    try {
      const [courseData, teachersData, lessonsData, tasksData, materialsData, groupsData] = await Promise.all([
        coursesApi.getById(courseId),
        courseTeachersApi.getByCourse(courseId),
        lessonsApi.getByCourse(courseId),
        tasksApi.getByCourse(courseId),
        materialsApi.getByCourse(courseId),
        groupsApi.getByCourse(courseId),
      ]);
      setCourse(courseData);
      setTeachers(teachersData);
      const sortedLessons = lessonsData.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      setLessons(sortedLessons);
      setTasks(tasksData);
      setMaterials(materialsData.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)));
      setGroups(groupsData);
      setInfoForm({
        title: courseData.title,
        description: courseData.description || '',
        statusId: courseData.fkIdStatus,
        startDate: courseData.startDate?.split('T')[0] || '',
        endDate: courseData.endDate?.split('T')[0] || '',
        tags: courseData.tags || '',
      });
      if (isAdmin) {
        const users = await usersApi.getByRole(2);
        setAllTeachers(users);
      }
      // Load attempts — отдельно, не ломаем загрузку если нет попыток
      if (tasksData.length > 0) {
        try {
          const allAttempts = await attemptsApi.getAll();
          const courseTaskIds = new Set(tasksData.map(t => t.pkIdTask));
          setAttempts(allAttempts.filter((a: any) => courseTaskIds.has(a.fkIdTask)));
        } catch {
          setAttempts([]);
        }
      }
    } catch (err: any) {
      // Редиректим только если курс не найден (404), иначе показываем ошибку
      if (err?.response?.status === 404) {
        router.push('/courses');
      } else {
        console.error('Ошибка загрузки manage:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveInfo = async () => {
    if (!course) return;
    setInfoSaving(true);
    try {
      const updated = await coursesApi.update(courseId, {
        title: infoForm.title,
        description: infoForm.description,
        statusId: Number(infoForm.statusId),
        startDate: infoForm.startDate || undefined,
        endDate: infoForm.endDate || undefined,
        tags: infoForm.tags || undefined,
      });
      setCourse(updated);
      alert('Сохранено');
    } catch {
      alert('Ошибка сохранения');
    } finally {
      setInfoSaving(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!confirm('Удалить курс?')) return;
    try {
      await coursesApi.delete(courseId);
      router.push('/courses');
    } catch {
      alert('Ошибка удаления');
    }
  };

  // ---- Lesson CRUD ----
  const openAddLesson = () => {
    setEditLesson(null);
    setLessonForm({ title: '', description: '', content: '', sortOrder: lessons.length + 1, isPublished: false });
    setLessonModal(true);
  };
  const openEditLesson = (l: ILesson) => {
    setEditLesson(l);
    setLessonForm({ title: l.title, description: l.description || '', content: l.content || '', sortOrder: l.sortOrder || 1, isPublished: l.isPublished });
    setLessonModal(true);
  };
  const handleSaveLesson = async () => {
    try {
      if (editLesson) {
        const updated = await lessonsApi.update(editLesson.pkIdLesson, { ...lessonForm, sortOrder: Number(lessonForm.sortOrder) });
        setLessons(prev => prev.map(l => l.pkIdLesson === updated.pkIdLesson ? updated : l).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)));
      } else {
        const created = await lessonsApi.create({ courseId, ...lessonForm, sortOrder: Number(lessonForm.sortOrder) });
        setLessons(prev => [...prev, created].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)));
      }
      setLessonModal(false);
    } catch {
      alert('Ошибка сохранения урока');
    }
  };
  const handleDeleteLesson = async (id: number) => {
    if (!confirm('Удалить урок?')) return;
    try {
      await lessonsApi.delete(id);
      setLessons(prev => prev.filter(l => l.pkIdLesson !== id));
    } catch {
      alert('Ошибка удаления');
    }
  };

  // ---- Task CRUD ----
  const openAddTask = () => {
    setEditTask(null);
    setTaskForm({ typeId: 1, title: '', description: '', maxScore: 10, deadline: '', lessonId: '' });
    setTaskModal(true);
  };
  const openEditTask = (t: ITask) => {
    setEditTask(t);
    setTaskForm({ typeId: t.typeId || 1, title: t.title || t.taskTitle, description: t.description || '', maxScore: t.maxScore || 10, deadline: t.deadline ? t.deadline.slice(0, 16) : '', lessonId: String(t.fkIdLesson || '') });
    setTaskModal(true);
  };
  const handleSaveTask = async () => {
    try {
      const dto = { typeId: Number(taskForm.typeId), courseId, lessonId: taskForm.lessonId ? Number(taskForm.lessonId) : undefined, title: taskForm.title, description: taskForm.description, maxScore: Number(taskForm.maxScore), deadline: taskForm.deadline || undefined };
      if (editTask) {
        const updated = await tasksApi.update(editTask.pkIdTask, dto);
        setTasks(prev => prev.map(t => t.pkIdTask === updated.pkIdTask ? updated : t));
      } else {
        const created = await tasksApi.create(dto);
        setTasks(prev => [...prev, created]);
      }
      setTaskModal(false);
    } catch {
      alert('Ошибка сохранения задания');
    }
  };
  const handleDeleteTask = async (id: number) => {
    if (!confirm('Удалить задание?')) return;
    try {
      await tasksApi.delete(id);
      setTasks(prev => prev.filter(t => t.pkIdTask !== id));
    } catch {
      alert('Ошибка удаления');
    }
  };

  // ---- Material CRUD ----
  const openAddMaterial = () => {
    setEditMaterial(null);
    setMatForm({ typeMaterialId: 1, title: '', description: '', fileUrl: '', link: '', lessonId: '' });
    setMaterialModal(true);
  };
  const openEditMaterial = (m: IMaterial) => {
    setEditMaterial(m);
    setMatForm({ typeMaterialId: m.fkIdTypeMaterial, title: m.title, description: m.description || '', fileUrl: m.fileUrl || '', link: m.link || '', lessonId: String(m.fkIdLesson || '') });
    setMaterialModal(true);
  };
  const handleSaveMaterial = async () => {
    try {
      const dto = { courseId, lessonId: matForm.lessonId ? Number(matForm.lessonId) : 0, typeMaterialId: Number(matForm.typeMaterialId), title: matForm.title, description: matForm.description, fileUrl: matForm.fileUrl || undefined, link: matForm.link || undefined };
      if (editMaterial) {
        const updated = await materialsApi.update(editMaterial.pkIdMaterial, dto);
        setMaterials(prev => prev.map(m => m.pkIdMaterial === updated.pkIdMaterial ? updated : m));
      } else {
        const created = await materialsApi.create(dto);
        setMaterials(prev => [...prev, created]);
      }
      setMaterialModal(false);
    } catch {
      alert('Ошибка сохранения материала');
    }
  };
  const handleDeleteMaterial = async (id: number) => {
    if (!confirm('Удалить материал?')) return;
    try {
      await materialsApi.delete(id);
      setMaterials(prev => prev.filter(m => m.pkIdMaterial !== id));
    } catch {
      alert('Ошибка удаления');
    }
  };

  // ---- Group CRUD ----
  const openAddGroup = () => {
    setEditGroup(null);
    setGroupForm({ name: '', curatorId: '' });
    setGroupModal(true);
  };
  const openEditGroup = (g: IGroup) => {
    setEditGroup(g);
    setGroupForm({ name: g.name, curatorId: String(g.fkIdCurator || '') });
    setGroupModal(true);
  };
  const handleSaveGroup = async () => {
    try {
      const dto = { name: groupForm.name, courseId, curatorId: groupForm.curatorId ? Number(groupForm.curatorId) : undefined };
      if (editGroup) {
        const updated = await groupsApi.update(editGroup.pkIdGroup, dto);
        setGroups(prev => prev.map(g => g.pkIdGroup === updated.pkIdGroup ? updated : g));
      } else {
        const created = await groupsApi.create(dto);
        setGroups(prev => [...prev, created]);
      }
      setGroupModal(false);
    } catch {
      alert('Ошибка сохранения группы');
    }
  };
  const handleDeleteGroup = async (id: number) => {
    if (!confirm('Удалить группу?')) return;
    try {
      await groupsApi.delete(id);
      setGroups(prev => prev.filter(g => g.pkIdGroup !== id));
    } catch {
      alert('Ошибка удаления');
    }
  };

  // ---- Teacher assign ----
  const handleAssignTeacher = async () => {
    if (!selectedTeacherId) return;
    try {
      await courseTeachersApi.create({ courseId, teacherId: Number(selectedTeacherId) });
      const updated = await courseTeachersApi.getByCourse(courseId);
      setTeachers(updated);
      setTeacherModal(false);
      setSelectedTeacherId('');
    } catch {
      alert('Ошибка назначения');
    }
  };
  const handleRemoveTeacher = async (id: number) => {
    if (!confirm('Снять преподавателя?')) return;
    try {
      await courseTeachersApi.delete(id);
      setTeachers(prev => prev.filter(t => t.pkIdCourseTeacher !== id));
    } catch {
      alert('Ошибка');
    }
  };

  // ---- Grade attempt ----
  const openGrade = (a: IAttempt) => {
    setGradeAttempt(a);
    setGradeScore('');
    setGradeModal(true);
  };
  const handleGrade = async (statusId: number) => {
    if (!gradeAttempt) return;
    if (!gradeScore && statusId === 3) { alert('Введите балл'); return; }
    try {
      await attemptsApi.grade(gradeAttempt.pkIdAttempt, { score: Number(gradeScore), statusId });
      // Отправляем уведомление слушателю
      try {
        const { notificationsApi } = await import('@/lib/api/notifications.api');
        const statusText = statusId === 3 ? 'принята' : statusId === 4 ? 'отклонена' : 'отправлена на доработку';
        const listenerId = (gradeAttempt as any).fkIdListener;
        if (listenerId) {
          await notificationsApi.create({
            userId: listenerId,
            message: `Ваша работа "${gradeAttempt.taskTitle}" ${statusText}. Балл: ${gradeScore || '—'}`,
          });
        }
      } catch {}
      const allAttempts = await attemptsApi.getAll();
      const courseTaskIds = new Set(tasks.map(t => t.pkIdTask));
      setAttempts(allAttempts.filter((a: any) => courseTaskIds.has(a.fkIdTask)));
      setGradeModal(false);
      setGradeScore('');
    } catch {
      alert('Ошибка оценивания');
    }
  };

  if (authLoading || loading) return <div className={styles.loading}>Загрузка...</div>;
  if (!course) return null;
  // Для преподавателя ждём загрузки teachers перед проверкой доступа
  // Для админа — всегда разрешаем
  if (!isAdmin && !isCourseTeacher) return <div className={styles.error}>Нет доступа к управлению этим курсом</div>;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'info', label: 'Инфо' },
    { id: 'lessons', label: `Уроки (${lessons.length})` },
    { id: 'tasks', label: `Задания (${tasks.length})` },
    { id: 'materials', label: `Материалы (${materials.length})` },
    { id: 'groups', label: `Группы (${groups.length})` },
    ...(isAdmin ? [{ id: 'teachers' as Tab, label: `Преподаватели (${teachers.length})` }] : []),
    { id: 'attempts', label: `Попытки (${attempts.length})` },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <button onClick={() => router.push(`/courses/${courseId}`)} className={styles.backBtn}>← К курсу</button>
        <h1>Управление: {course.title}</h1>
      </div>

      <div className={styles.tabs}>
        {tabs.map(tab => (
          <button key={tab.id} className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`} onClick={() => setActiveTab(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.tabContent}>
        {/* INFO TAB */}
        {activeTab === 'info' && (
          <div className={styles.infoTab}>
            <h2>Информация о курсе</h2>
            <div className={styles.form}>
              <label className={styles.field}>
                <span>Название</span>
                <input type="text" value={infoForm.title} onChange={e => setInfoForm(p => ({ ...p, title: e.target.value }))} />
              </label>
              <label className={styles.field}>
                <span>Описание</span>
                <textarea rows={4} value={infoForm.description} onChange={e => setInfoForm(p => ({ ...p, description: e.target.value }))} />
              </label>
              <label className={styles.field}>
                <span>Статус</span>
                <select value={infoForm.statusId} onChange={e => setInfoForm(p => ({ ...p, statusId: Number(e.target.value) }))}>
                  <option value={1}>Черновик</option>
                  <option value={2}>Опубликован</option>
                  <option value={3}>Архивирован</option>
                </select>
              </label>
              <div className={styles.datesRow}>
                <label className={styles.field}>
                  <span>Начало</span>
                  <input type="date" value={infoForm.startDate} onChange={e => setInfoForm(p => ({ ...p, startDate: e.target.value }))} />
                </label>
                <label className={styles.field}>
                  <span>Окончание</span>
                  <input type="date" value={infoForm.endDate} onChange={e => setInfoForm(p => ({ ...p, endDate: e.target.value }))} />
                </label>
              </div>
              <label className={styles.field}>
                <span>Теги</span>
                <input type="text" value={infoForm.tags} onChange={e => setInfoForm(p => ({ ...p, tags: e.target.value }))} placeholder="тег1, тег2" />
              </label>
              <div className={styles.formActions}>
                <button className={styles.btnPrimary} onClick={handleSaveInfo} disabled={infoSaving}>{infoSaving ? 'Сохранение...' : 'Сохранить'}</button>
                <button className={styles.btnDanger} onClick={handleDeleteCourse}>Удалить курс</button>
              </div>
            </div>
          </div>
        )}

        {/* LESSONS TAB */}
        {activeTab === 'lessons' && (
          <div>
            <div className={styles.tabHead}>
              <h2>Уроки</h2>
              <button className={styles.btnPrimary} onClick={openAddLesson}>+ Добавить урок</button>
            </div>
            {lessons.length === 0 && <p className={styles.empty}>Уроков пока нет</p>}
            <div className={styles.list}>
              {lessons.map((l, i) => (
                <div key={l.pkIdLesson} className={styles.listItem}>
                  <span className={styles.num}>{i + 1}</span>
                  <div className={styles.itemInfo}>
                    <strong>{l.title}</strong>
                    <span>{l.isPublished ? '✓ Опубликован' : 'Черновик'}</span>
                  </div>
                  <div className={styles.itemActions}>
                    <button className={styles.btnEdit} onClick={() => openEditLesson(l)}>✎</button>
                    <button className={styles.btnDel} onClick={() => handleDeleteLesson(l.pkIdLesson)}>×</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TASKS TAB */}
        {activeTab === 'tasks' && (
          <div>
            <div className={styles.tabHead}>
              <h2>Задания</h2>
              <button className={styles.btnPrimary} onClick={openAddTask}>+ Добавить задание</button>
            </div>
            {tasks.length === 0 && <p className={styles.empty}>Заданий пока нет</p>}
            <div className={styles.list}>
              {tasks.map(t => (
                <div key={t.pkIdTask} className={styles.listItem}>
                  <span className={styles.badge}>{t.taskTypeName}</span>
                  <div className={styles.itemInfo}>
                    <strong>{t.title || t.taskTitle}</strong>
                    <span>{t.maxScore} балл. · {t.lessonTitle || 'Без урока'}</span>
                  </div>
                  <div className={styles.itemActions}>
                    {/* Кнопка редактора теста для заданий типа Тест */}
                    {(t.taskTypeName === 'Тест' || t.typeId === 1) && (
                      <button
                        className={styles.btnTest}
                        onClick={() => router.push(`/courses/${courseId}/manage/test/${t.pkIdTask}`)}
                        title="Редактировать тест"
                      >
                        🎯 Тест
                      </button>
                    )}
                    <button className={styles.btnEdit} onClick={() => openEditTask(t)}>✎</button>
                    <button className={styles.btnDel} onClick={() => handleDeleteTask(t.pkIdTask)}>×</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MATERIALS TAB */}
        {activeTab === 'materials' && (
          <div>
            <div className={styles.tabHead}>
              <h2>Материалы</h2>
              <button className={styles.btnPrimary} onClick={openAddMaterial}>+ Добавить материал</button>
            </div>
            {materials.length === 0 && <p className={styles.empty}>Материалов пока нет</p>}
            <div className={styles.list}>
              {materials.map(m => (
                <div key={m.pkIdMaterial} className={styles.listItem}>
                  <span className={styles.badge}>{m.typeName}</span>
                  <div className={styles.itemInfo}>
                    <strong>{m.title}</strong>
                    <span>{m.lessonTitle || 'Без урока'}</span>
                  </div>
                  <div className={styles.itemActions}>
                    <button className={styles.btnEdit} onClick={() => openEditMaterial(m)}>✎</button>
                    <button className={styles.btnDel} onClick={() => handleDeleteMaterial(m.pkIdMaterial)}>×</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* GROUPS TAB */}
        {activeTab === 'groups' && (
          <div>
            <div className={styles.tabHead}>
              <h2>Группы</h2>
              <button className={styles.btnPrimary} onClick={openAddGroup}>+ Создать группу</button>
            </div>
            {groups.length === 0 && <p className={styles.empty}>Групп пока нет</p>}
            <div className={styles.list}>
              {groups.map(g => (
                <div key={g.pkIdGroup} className={styles.listItem}>
                  <div className={styles.itemInfo}>
                    <strong>{g.name}</strong>
                    <span>Куратор: {g.curatorName || 'Не назначен'} · {g.listenerCount} слушателей</span>
                  </div>
                  <div className={styles.itemActions}>
                    <button className={styles.btnEdit} onClick={() => openEditGroup(g)}>✎</button>
                    <button className={styles.btnDel} onClick={() => handleDeleteGroup(g.pkIdGroup)}>×</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TEACHERS TAB (admin only) */}
        {activeTab === 'teachers' && isAdmin && (
          <div>
            <div className={styles.tabHead}>
              <h2>Преподаватели</h2>
              <button className={styles.btnPrimary} onClick={() => setTeacherModal(true)}>+ Назначить</button>
            </div>
            {teachers.length === 0 && <p className={styles.empty}>Преподавателей не назначено</p>}
            <div className={styles.list}>
              {teachers.map(t => (
                <div key={t.pkIdCourseTeacher} className={styles.listItem}>
                  <div className={styles.itemInfo}>
                    <strong>{t.teacherName}</strong>
                    <span>Назначен: {new Date(t.assignedAt).toLocaleDateString('ru-RU')}</span>
                  </div>
                  <button className={styles.btnDel} onClick={() => handleRemoveTeacher(t.pkIdCourseTeacher)}>×</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ATTEMPTS TAB */}
        {activeTab === 'attempts' && (
          <div>
            <div className={styles.tabHead}>
              <h2>Попытки</h2>
            </div>
            {attempts.length === 0 && <p className={styles.empty}>Попыток пока нет</p>}
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Слушатель</th>
                    <th>Задание</th>
                    <th>Статус</th>
                    <th>Балл</th>
                    <th>Дата</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.map(a => (
                    <tr key={a.pkIdAttempt}>
                      <td>{a.listenerName}</td>
                      <td>{a.taskTitle}</td>
                      <td><span className={`${styles.statusBadge} ${styles[a.statusName?.toLowerCase().replace(/\s/g, '_')]}`}>{a.statusName}</span></td>
                      <td>{a.score ?? '—'}</td>
                      <td>{new Date(a.submittedAt).toLocaleDateString('ru-RU')}</td>
                      <td>{a.statusName === 'На проверке' && <button className={styles.btnGrade} onClick={() => openGrade(a)}>Оценить</button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* LESSON MODAL */}
      <Modal isOpen={lessonModal} onClose={() => setLessonModal(false)} title={editLesson ? 'Редактировать урок' : 'Новый урок'}>
        <div className={styles.mForm}>
          <label className={styles.field}><span>Название</span><input type="text" value={lessonForm.title} onChange={e => setLessonForm(p => ({ ...p, title: e.target.value }))} /></label>
          <label className={styles.field}><span>Описание</span><textarea rows={2} value={lessonForm.description} onChange={e => setLessonForm(p => ({ ...p, description: e.target.value }))} /></label>
          <label className={styles.field}><span>Контент</span><textarea rows={5} value={lessonForm.content} onChange={e => setLessonForm(p => ({ ...p, content: e.target.value }))} /></label>
          <label className={styles.field}><span>Порядок</span><input type="number" value={lessonForm.sortOrder} onChange={e => setLessonForm(p => ({ ...p, sortOrder: Number(e.target.value) }))} /></label>
          <label className={styles.checkField}><input type="checkbox" checked={lessonForm.isPublished} onChange={e => setLessonForm(p => ({ ...p, isPublished: e.target.checked }))} /><span>Опубликовать</span></label>
          <button className={styles.btnPrimary} onClick={handleSaveLesson}>{editLesson ? 'Сохранить' : 'Создать'}</button>
        </div>
      </Modal>

      {/* TASK MODAL */}
      <Modal isOpen={taskModal} onClose={() => setTaskModal(false)} title={editTask ? 'Редактировать задание' : 'Новое задание'}>
        <div className={styles.mForm}>
          <label className={styles.field}><span>Тип</span>
            <select value={taskForm.typeId} onChange={e => setTaskForm(p => ({ ...p, typeId: Number(e.target.value) }))}>
              <option value={1}>Тест</option>
              <option value={2}>Практическое</option>
              <option value={3}>Теоретическое</option>
            </select>
          </label>
          <label className={styles.field}><span>Название</span><input type="text" value={taskForm.title} onChange={e => setTaskForm(p => ({ ...p, title: e.target.value }))} /></label>
          <label className={styles.field}><span>Описание</span><textarea rows={3} value={taskForm.description} onChange={e => setTaskForm(p => ({ ...p, description: e.target.value }))} /></label>
          <label className={styles.field}><span>Макс. балл</span><input type="number" value={taskForm.maxScore} onChange={e => setTaskForm(p => ({ ...p, maxScore: Number(e.target.value) }))} /></label>
          <label className={styles.field}><span>Дедлайн</span><input type="datetime-local" value={taskForm.deadline} onChange={e => setTaskForm(p => ({ ...p, deadline: e.target.value }))} /></label>
          <label className={styles.field}><span>Урок</span>
            <select value={taskForm.lessonId} onChange={e => setTaskForm(p => ({ ...p, lessonId: e.target.value }))}>
              <option value="">Без урока</option>
              {lessons.map(l => <option key={l.pkIdLesson} value={l.pkIdLesson}>{l.title}</option>)}
            </select>
          </label>
          <button className={styles.btnPrimary} onClick={handleSaveTask}>{editTask ? 'Сохранить' : 'Создать'}</button>
        </div>
      </Modal>

      {/* MATERIAL MODAL */}
      <Modal isOpen={materialModal} onClose={() => setMaterialModal(false)} title={editMaterial ? 'Редактировать материал' : 'Новый материал'}>
        <div className={styles.mForm}>
          <label className={styles.field}><span>Тип</span>
            <select value={matForm.typeMaterialId} onChange={e => setMatForm(p => ({ ...p, typeMaterialId: Number(e.target.value) }))}>
              <option value={1}>Видео</option>
              <option value={2}>Презентация</option>
              <option value={3}>PDF</option>
              <option value={4}>Ссылка</option>
            </select>
          </label>
          <label className={styles.field}><span>Название</span><input type="text" value={matForm.title} onChange={e => setMatForm(p => ({ ...p, title: e.target.value }))} /></label>
          <label className={styles.field}><span>Описание</span><textarea rows={2} value={matForm.description} onChange={e => setMatForm(p => ({ ...p, description: e.target.value }))} /></label>
          <label className={styles.field}><span>URL файла</span><input type="text" value={matForm.fileUrl} onChange={e => setMatForm(p => ({ ...p, fileUrl: e.target.value }))} placeholder="https://..." /></label>
          <label className={styles.field}><span>Ссылка</span><input type="text" value={matForm.link} onChange={e => setMatForm(p => ({ ...p, link: e.target.value }))} placeholder="https://..." /></label>
          <label className={styles.field}><span>Урок</span>
            <select value={matForm.lessonId} onChange={e => setMatForm(p => ({ ...p, lessonId: e.target.value }))}>
              <option value="">Без урока</option>
              {lessons.map(l => <option key={l.pkIdLesson} value={l.pkIdLesson}>{l.title}</option>)}
            </select>
          </label>
          <button className={styles.btnPrimary} onClick={handleSaveMaterial}>{editMaterial ? 'Сохранить' : 'Создать'}</button>
        </div>
      </Modal>

      {/* GROUP MODAL */}
      <Modal isOpen={groupModal} onClose={() => setGroupModal(false)} title={editGroup ? 'Редактировать группу' : 'Новая группа'}>
        <div className={styles.mForm}>
          <label className={styles.field}><span>Название</span><input type="text" value={groupForm.name} onChange={e => setGroupForm(p => ({ ...p, name: e.target.value }))} /></label>
          <label className={styles.field}><span>Куратор</span>
            <select value={groupForm.curatorId} onChange={e => setGroupForm(p => ({ ...p, curatorId: e.target.value }))}>
              <option value="">Не назначен</option>
              {(isAdmin ? allTeachers : teachers.map(t => ({ pkIdUser: t.fkIdTeacher, fullName: t.teacherName }))).map((t: any) => (
                <option key={t.pkIdUser} value={t.pkIdUser}>{t.fullName}</option>
              ))}
            </select>
          </label>
          <button className={styles.btnPrimary} onClick={handleSaveGroup}>{editGroup ? 'Сохранить' : 'Создать'}</button>
        </div>
      </Modal>

      {/* TEACHER MODAL */}
      <Modal isOpen={teacherModal} onClose={() => setTeacherModal(false)} title="Назначить преподавателя">
        <div className={styles.mForm}>
          <label className={styles.field}><span>Преподаватель</span>
            <select value={selectedTeacherId} onChange={e => setSelectedTeacherId(e.target.value)}>
              <option value="">Выберите...</option>
              {allTeachers.filter(t => !teachers.some(ct => ct.fkIdTeacher === t.pkIdUser)).map(t => (
                <option key={t.pkIdUser} value={t.pkIdUser}>{t.fullName}</option>
              ))}
            </select>
          </label>
          <button className={styles.btnPrimary} onClick={handleAssignTeacher} disabled={!selectedTeacherId}>Назначить</button>
        </div>
      </Modal>

      {/* GRADE MODAL */}
      <Modal isOpen={gradeModal} onClose={() => setGradeModal(false)} title="Оценить попытку">
        <div className={styles.mForm}>
          {gradeAttempt && (
            <>
              <p><strong>Слушатель:</strong> {gradeAttempt.listenerName}</p>
              <p><strong>Задание:</strong> {gradeAttempt.taskTitle}</p>
              {gradeAttempt.answerText && <div className={styles.answerBox}><strong>Ответ:</strong><p>{gradeAttempt.answerText}</p></div>}
            </>
          )}
          <label className={styles.field}><span>Балл</span><input type="number" min={0} value={gradeScore} onChange={e => setGradeScore(e.target.value)} /></label>
          <div className={styles.gradeActions}>
            <button className={styles.btnPrimary} onClick={() => handleGrade(3)}>Принять</button>
            <button className={styles.btnDanger} onClick={() => handleGrade(4)}>Отклонить</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
