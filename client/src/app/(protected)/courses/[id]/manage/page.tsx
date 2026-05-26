'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { coursesApi, type ICourseTag } from '@/lib/api/courses.api';
import { courseTeachersApi, type ICourseTeacher } from '@/lib/api/courseTeachers.api';
import { lessonsApi } from '@/lib/api/lessons.api';
import { tasksApi } from '@/lib/api/tasks.api';
import { materialsApi } from '@/lib/api/materials.api';
import { groupsApi } from '@/lib/api/groups.api';
import { usersApi } from '@/lib/api/users.api';
import { attemptsApi, type IAttempt } from '@/lib/api/attempts.api';
import {
  getMaterialTitle,
  type ICourse,
  type ILesson,
  type ITask,
  type IMaterial,
  type IGroup,
  type IUser,
} from '@/lib/types';
import { getApiErrorMessage } from '@/lib/http/getApiErrorMessage';
import { datetimeLocalToIso } from '@/lib/datetime/datetimeLocalToIso';
import {
  isCourseDateRangeValid,
  isCourseStartNotInPast,
  isDeadlineUnchangedOrInFuture,
  isDeadlineWithinCourseRange,
  courseHasLessonWithTask,
} from '@/lib/datetime/datetimeGuards';
import { normalizeTestAnswerRow } from '@/lib/test/normalizeTestAnswerRow';
import { COURSE_STATUS } from '@/lib/constants';
import { ATTEMPT_STATUS, attemptStatusNameToId, TASK_TYPE } from '@/lib/constants';
import { commentsApi, type IComment } from '@/lib/api/comments.api';
import { testsApi, type ITestAnswerRow } from '@/lib/api/tests.api';
import { attemptRowTaskId, attemptAnswerFileUrl } from '@/lib/attempts/attemptTaskId';
import { useAppDialog } from '@/lib/hooks/useAppDialog';
import { getGroupDisplayName } from '@/lib/groups/groupDisplayName';
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
  const { alert, confirm } = useAppDialog();
  const courseId = Number(params.id);

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
  const [infoForm, setInfoForm] = useState({
    title: '',
    description: '',
    statusId: 1,
    startDate: '',
    endDate: '',
    tagIds: [] as number[],
  });
  const [tagCatalog, setTagCatalog] = useState<ICourseTag[]>([]);
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
  const [gradeComments, setGradeComments] = useState<IComment[]>([]);
  const [gradeTestRows, setGradeTestRows] = useState<ITestAnswerRow[]>([]);

  const isAdmin = checkRole(['Администратор']);
  const isTeacher = checkRole(['Преподаватель']);
  // canEdit вычисляется после загрузки данных
  const isCourseTeacher = teachers.some(
    (t) => Number(t.fkIdTeacher) === Number(user?.pkIdUser),
  );
  const canEdit = isAdmin || isCourseTeacher;

  useEffect(() => {
    if (authLoading || !user) return;
    setLoading(true);
    loadData();
  }, [authLoading, user, courseId]);

  const loadData = async () => {
    try {
      const [courseData, teachersData, lessonsData, tasksData, materialsData, groupsData, tagsData] =
        await Promise.all([
        coursesApi.getById(courseId),
        courseTeachersApi.getByCourse(courseId),
        lessonsApi.getByCourse(courseId),
        tasksApi.getByCourse(courseId),
        materialsApi.getByCourse(courseId),
        groupsApi.getByCourse(courseId),
        coursesApi.getTagCatalog().catch(() => [] as ICourseTag[]),
      ]);
      setTagCatalog(Array.isArray(tagsData) ? tagsData : []);
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
        tagIds: Array.isArray(courseData.tagIds) ? [...courseData.tagIds] : [],
      });
      if (isAdmin) {
        const users = await usersApi.getByRole(2);
        setAllTeachers(users);
      }
      // Load attempts — отдельно, не ломаем загрузку если нет попыток
      if (tasksData.length > 0) {
        try {
          const allAttempts = isAdmin
            ? await attemptsApi.getAll()
            : await attemptsApi.getByCourse(courseId);
          const courseTaskIds = new Set(
            tasksData
              .map((t) =>
                Number(
                  (t as { pkIdTask?: unknown }).pkIdTask ??
                    (t as { PkIdTask?: unknown }).PkIdTask,
                ),
              )
              .filter((n) => Number.isFinite(n)),
          );
          setAttempts(
            isAdmin
              ? allAttempts.filter((a) => {
                  const tid = attemptRowTaskId(a);
                  return tid != null && courseTaskIds.has(tid);
                })
              : allAttempts,
          );
        } catch (e) {
          console.error(
            'Не удалось загрузить попытки курса:',
            (e as { response?: { status?: number } })?.response?.status,
            e,
          );
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

  const canPublish =
    courseHasLessonWithTask(lessons, tasks) && lessons.length > 0;

  const todayDateInputMin = () => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  const handleSaveInfo = async () => {
    if (!course) return;
    if (!isCourseDateRangeValid(infoForm.startDate, infoForm.endDate)) {
      await alert('Дата окончания курса не может быть раньше даты начала.');
      return;
    }
    if (!isCourseStartNotInPast(infoForm.startDate)) {
      await alert('Дата начала курса не может быть в прошлом.');
      return;
    }
    if (Number(infoForm.statusId) === COURSE_STATUS.PUBLISHED && !canPublish) {
      await alert(
        'Опубликовать курс можно только после добавления хотя бы одного урока с заданием.',
      );
      return;
    }
    setInfoSaving(true);
    try {
      const startIso = datetimeLocalToIso(infoForm.startDate);
      const endIso = datetimeLocalToIso(infoForm.endDate);
      const updated = await coursesApi.update(courseId, {
        title: infoForm.title,
        description: infoForm.description,
        statusId: Number(infoForm.statusId),
        ...(startIso ? { startDate: startIso } : {}),
        ...(endIso ? { endDate: endIso } : {}),
        tagIds: infoForm.tagIds,
      });
      setCourse(updated);
      await alert('Сохранено');
    } catch {
      await alert('Ошибка сохранения');
    } finally {
      setInfoSaving(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!await confirm('Удалить курс?')) return;
    try {
      await coursesApi.delete(courseId);
      router.push('/courses');
    } catch {
      await alert('Ошибка удаления');
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
    const maxOrder = editLesson ? lessons.length : lessons.length + 1;
    const order = Number(lessonForm.sortOrder);
    if (!Number.isFinite(order) || order < 1 || order > maxOrder) {
      await alert(
        `Порядок урока: целое число от 1 до ${maxOrder} (сейчас в курсе ${lessons.length} урок(ов)).`,
      );
      return;
    }
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
      await alert('Ошибка сохранения урока');
    }
  };
  const handleDeleteLesson = async (id: number) => {
    if (!await confirm('Удалить урок?')) return;
    try {
      await lessonsApi.delete(id);
      setLessons(prev => prev.filter(l => l.pkIdLesson !== id));
    } catch {
      await alert('Ошибка удаления');
    }
  };

  // ---- Task CRUD ----
  const openAddTask = () => {
    setEditTask(null);
    const firstLesson = lessons[0];
    setTaskForm({
      typeId: 1,
      title: '',
      description: '',
      maxScore: 10,
      deadline: '',
      lessonId: firstLesson ? String(firstLesson.pkIdLesson) : '',
    });
    setTaskModal(true);
  };
  const openEditTask = (t: ITask) => {
    setEditTask(t);
    setTaskForm({ typeId: t.typeId || 1, title: t.title || t.taskTitle, description: t.description || '', maxScore: t.maxScore || 10, deadline: t.deadline ? t.deadline.slice(0, 16) : '', lessonId: String(t.fkIdLesson || '') });
    setTaskModal(true);
  };
  const handleSaveTask = async () => {
    try {
      const deadlineIso = datetimeLocalToIso(taskForm.deadline);
      if (taskForm.deadline.trim() && !deadlineIso) {
        await alert('Некорректная дата дедлайна. Выберите дату и время в календаре.');
        return;
      }
      if (taskForm.deadline.trim() && !isDeadlineUnchangedOrInFuture(taskForm.deadline, editTask?.deadline ?? null)) {
        await alert('Дедлайн должен быть в будущем. Очистите поле, если срок не ограничен, или оставьте прежнюю дату без изменений.');
        return;
      }
      if (
        taskForm.deadline.trim() &&
        !isDeadlineWithinCourseRange(taskForm.deadline, infoForm.startDate, infoForm.endDate)
      ) {
        await alert('Дедлайн задания должен быть в пределах дат проведения курса.');
        return;
      }
      if (!taskForm.lessonId) {
        await alert('Выберите урок — задание должно быть привязано к уроку.');
        return;
      }
      const maxScore = Math.trunc(Number(taskForm.maxScore));
      if (!Number.isFinite(maxScore) || maxScore < 0 || maxScore > 10000) {
        await alert('Максимальный балл — целое число от 0 до 10000.');
        return;
      }
      const dto = {
        typeId: Number(taskForm.typeId),
        courseId,
        lessonId: taskForm.lessonId ? Number(taskForm.lessonId) : undefined,
        title: taskForm.title,
        description: taskForm.description,
        maxScore,
        ...(deadlineIso ? { deadline: deadlineIso } : {}),
      };
      if (editTask) {
        const updated = await tasksApi.update(editTask.pkIdTask, dto);
        setTasks(prev => prev.map(t => t.pkIdTask === updated.pkIdTask ? updated : t));
      } else {
        const created = await tasksApi.create(dto);
        setTasks(prev => [...prev, created]);
      }
      setTaskModal(false);
    } catch (err) {
      await alert(getApiErrorMessage(err, 'Ошибка сохранения задания'));
    }
  };
  const handleDeleteTask = async (id: number) => {
    if (!await confirm('Удалить задание?')) return;
    try {
      await tasksApi.delete(id);
      setTasks(prev => prev.filter(t => t.pkIdTask !== id));
    } catch {
      await alert('Ошибка удаления');
    }
  };

  // ---- Material CRUD ----
  const openAddMaterial = async () => {
    if (lessons.length === 0) {
      await alert('Сначала создайте хотя бы один урок — материал привязывается к уроку.');
      return;
    }
    setEditMaterial(null);
    setMatForm({
      typeMaterialId: 1,
      title: '',
      description: '',
      fileUrl: '',
      link: '',
      lessonId: String(lessons[0].pkIdLesson),
    });
    setMaterialModal(true);
  };
  const openEditMaterial = (m: IMaterial) => {
    setEditMaterial(m);
    setMatForm({ typeMaterialId: m.fkIdTypeMaterial ?? 1, title: getMaterialTitle(m), description: m.description || '', fileUrl: m.fileUrl || '', link: m.link || '', lessonId: String(m.fkIdLesson || '') });
    setMaterialModal(true);
  };
  const handleSaveMaterial = async () => {
    const lid = Number(matForm.lessonId);
    if (!lid || Number.isNaN(lid)) {
      await alert('Выберите урок для материала.');
      return;
    }
    try {
      const dto = {
        courseId,
        lessonId: lid,
        typeMaterialId: Number(matForm.typeMaterialId),
        title: matForm.title,
        description: matForm.description?.trim() || undefined,
        fileUrl: matForm.fileUrl?.trim() || undefined,
        link: matForm.link?.trim() || undefined,
      };
      if (editMaterial) {
        const updated = await materialsApi.update(editMaterial.pkIdMaterial, dto);
        setMaterials(prev => prev.map(m => m.pkIdMaterial === updated.pkIdMaterial ? updated : m));
      } else {
        const created = await materialsApi.create(dto);
        setMaterials(prev => [...prev, created]);
      }
      setMaterialModal(false);
    } catch (err) {
      await alert(getApiErrorMessage(err, 'Ошибка сохранения материала'));
    }
  };
  const handleDeleteMaterial = async (id: number) => {
    if (!await confirm('Удалить материал?')) return;
    try {
      await materialsApi.delete(id);
      setMaterials(prev => prev.filter(m => m.pkIdMaterial !== id));
    } catch {
      await alert('Ошибка удаления');
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
    setGroupForm({ name: getGroupDisplayName(g), curatorId: String(g.fkIdCurator || '') });
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
      await alert('Ошибка сохранения группы');
    }
  };
  const handleDeleteGroup = async (id: number) => {
    if (!await confirm('Удалить группу?')) return;
    try {
      await groupsApi.delete(id);
      setGroups(prev => prev.filter(g => g.pkIdGroup !== id));
    } catch {
      await alert('Ошибка удаления');
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
      await alert('Ошибка назначения');
    }
  };
  const handleRemoveTeacher = async (id: number) => {
    if (!await confirm('Снять преподавателя?')) return;
    try {
      await courseTeachersApi.delete(id);
      setTeachers(prev => prev.filter(t => t.pkIdCourseTeacher !== id));
    } catch {
      await alert('Ошибка');
    }
  };

  // ---- Grade attempt ----
  const openGrade = async (a: IAttempt) => {
    setGradeAttempt(a);
    setGradeScore(a.score != null && a.score !== undefined ? String(a.score) : '');
    setGradeTestRows([]);
    setGradeModal(true);
    const tid = attemptRowTaskId(a);
    if (tid != null) {
      try {
        const list = await commentsApi.getByTask(tid);
        setGradeComments(list);
      } catch {
        setGradeComments([]);
      }
      const taskRow = tasks.find(
        (t) => Number((t as { pkIdTask?: unknown }).pkIdTask) === tid,
      );
      const typeId =
        taskRow?.typeId ?? (taskRow as { fkIdTypeTasks?: number } | undefined)?.fkIdTypeTasks;
      const isTest =
        typeId === TASK_TYPE.TEST || taskRow?.taskTypeName === 'Тест';
      if (isTest) {
        try {
          const rows = await testsApi.getAnswersByAttempt(a.pkIdAttempt);
          setGradeTestRows(
            Array.isArray(rows)
              ? rows.map((r) => normalizeTestAnswerRow(r as unknown as Record<string, unknown>))
              : [],
          );
        } catch {
          setGradeTestRows([]);
        }
      }
    } else {
      setGradeComments([]);
    }
  };
  const refreshAttemptsList = async () => {
    const allAttempts = isAdmin
      ? await attemptsApi.getAll()
      : await attemptsApi.getByCourse(courseId);
    const courseTaskIds = new Set(
      tasks
        .map((t) =>
          Number(
            (t as { pkIdTask?: unknown }).pkIdTask ??
              (t as { PkIdTask?: unknown }).PkIdTask,
          ),
        )
        .filter((n) => Number.isFinite(n)),
    );
    setAttempts(
      isAdmin
        ? allAttempts.filter((a) => {
            const tid = attemptRowTaskId(a);
            return tid != null && courseTaskIds.has(tid);
          })
        : allAttempts,
    );
  };

  const handleGrade = async (statusId: number) => {
    if (!gradeAttempt) return;
    const gTask = tasks.find(
      (t) => Number((t as { pkIdTask?: unknown }).pkIdTask) === attemptRowTaskId(gradeAttempt),
    );
    const maxForTask = gTask?.maxScore;
    const parseScore = (): number | null => {
      if (gradeScore.trim() === '') return null;
      const n = Math.trunc(Number(gradeScore));
      if (!Number.isFinite(n) || n < 0) return null;
      if (maxForTask != null && Number.isFinite(maxForTask) && n > maxForTask) return null;
      return n;
    };
    if (statusId === ATTEMPT_STATUS.ACCEPTED) {
      if (gradeScore.trim() === '') {
        await alert('Введите балл при принятии работы');
        return;
      }
      const sc = parseScore();
      if (sc === null) {
        await alert(
          maxForTask != null && Number.isFinite(maxForTask)
            ? `Некорректный балл: целое число от 0 до ${maxForTask}`
            : 'Некорректное значение балла',
        );
        return;
      }
    }
    try {
      const gradePayload: { statusId: number; score?: number } = { statusId };
      if (gradeScore.trim() !== '' && !Number.isNaN(Number(gradeScore))) {
        const sc = parseScore();
        if (sc === null) {
          await alert(
            maxForTask != null && Number.isFinite(maxForTask)
              ? `Балл: целое число от 0 до ${maxForTask}`
              : 'Некорректное значение балла',
          );
          return;
        }
        gradePayload.score = sc;
      }
      await attemptsApi.grade(gradeAttempt.pkIdAttempt, gradePayload);
      await refreshAttemptsList();
      setGradeModal(false);
      setGradeScore('');
      setGradeComments([]);
      setGradeTestRows([]);
    } catch (e: unknown) {
      await alert(getApiErrorMessage(e, 'Ошибка оценивания'));
    }
  };

  const handleDeleteAttempt = async (a: IAttempt) => {
    const rowNum =
      [...attempts]
        .sort(
          (x, y) =>
            new Date(x.submittedAt).getTime() - new Date(y.submittedAt).getTime(),
        )
        .findIndex((x) => x.pkIdAttempt === a.pkIdAttempt) + 1;
    if (
      !await confirm(
        `Удалить попытку №${rowNum} (${a.listenerName}, ${a.taskTitle})?`,
      )
    )
      return;
    try {
      await attemptsApi.delete(a.pkIdAttempt);
      if (gradeAttempt?.pkIdAttempt === a.pkIdAttempt) {
        setGradeModal(false);
        setGradeAttempt(null);
      }
      await refreshAttemptsList();
    } catch (e: unknown) {
      await alert(getApiErrorMessage(e, 'Не удалось удалить попытку'));
    }
  };

  const handleSaveScoreOnly = async () => {
    if (!gradeAttempt) return;
    const sid = attemptStatusNameToId(gradeAttempt.statusName);
    if (sid == null) {
      await alert('Не удалось определить текущий статус попытки');
      return;
    }
    const gTask = tasks.find(
      (t) => Number((t as { pkIdTask?: unknown }).pkIdTask) === attemptRowTaskId(gradeAttempt),
    );
    const maxForTask = gTask?.maxScore;
    if (gradeScore.trim() === '') {
      await alert('Введите корректный балл');
      return;
    }
    const n = Math.trunc(Number(gradeScore));
    if (!Number.isFinite(n) || n < 0) {
      await alert('Балл — целое число не меньше 0');
      return;
    }
    if (maxForTask != null && Number.isFinite(maxForTask) && n > maxForTask) {
      await alert(`Балл не может быть больше максимума задания (${maxForTask})`);
      return;
    }
    try {
      await attemptsApi.grade(gradeAttempt.pkIdAttempt, {
        score: n,
        statusId: sid,
      });
      await refreshAttemptsList();
    } catch (e: unknown) {
      await alert(getApiErrorMessage(e, 'Ошибка сохранения балла'));
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
                  <option value={2} disabled={!canPublish}>
                    Опубликован{!canPublish ? ' (нужен урок с заданием)' : ''}
                  </option>
                  <option value={3}>Архивирован</option>
                </select>
                {!canPublish && (
                  <small className={styles.hintMuted}>
                    Для публикации добавьте урок и хотя бы одно задание в этом уроке.
                  </small>
                )}
              </label>
              <div className={styles.datesRow}>
                <label className={styles.field}>
                  <span>Начало</span>
                  <input type="date" min={todayDateInputMin()} value={infoForm.startDate} onChange={e => setInfoForm(p => ({ ...p, startDate: e.target.value }))} />
                </label>
                <label className={styles.field}>
                  <span>Окончание</span>
                  <input type="date" min={infoForm.startDate || todayDateInputMin()} value={infoForm.endDate} onChange={e => setInfoForm(p => ({ ...p, endDate: e.target.value }))} />
                </label>
              </div>
              <label className={styles.field}>
                <span>Теги</span>
                <select
                  className={styles.tagMulti}
                  multiple
                  size={Math.min(10, Math.max(3, tagCatalog.length))}
                  value={infoForm.tagIds.map(String)}
                  onChange={(e) => {
                    const next = Array.from(e.target.selectedOptions, (o) => Number(o.value));
                    setInfoForm((p) => ({ ...p, tagIds: next }));
                  }}
                >
                  {tagCatalog.map((t) => (
                    <option key={t.pkIdTag} value={t.pkIdTag}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <small className={styles.hintMuted}>Выберите один или несколько (Ctrl / Shift). Справочник из базы данных.</small>
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
                        Тест
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
                    <strong>{getMaterialTitle(m)}</strong>
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
            <p className={styles.tabHint}>
              Группы привязывают слушателей к курсу: запись со страницы «Записаться» добавляет человека в группу курса (при необходимости группа создаётся автоматически).
              Здесь можно заранее завести потоки, задать название и куратора — удобно для нескольких параллельных наборов.
            </p>
            {groups.length === 0 && <p className={styles.empty}>Групп пока нет</p>}
            <div className={styles.list}>
              {groups.map(g => (
                <div key={g.pkIdGroup} className={styles.listItem}>
                  <div className={styles.itemInfo}>
                    <strong>{getGroupDisplayName(g) || '—'}</strong>
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
              <h2>Попытки сдачи</h2>
            </div>
            <p className={styles.fieldHint} style={{ marginBottom: '1.6rem' }}>
              Все попытки по заданиям этого курса (тесты и работы на проверку). Откройте запись, чтобы просмотреть ответ, для тестов — выбранные варианты, выставить балл и изменить статус. Кнопка «Сохранить только балл» оставляет текущий статус (удобно для исправления оценки у уже принятой работы).
            </p>
            {attempts.length === 0 && <p className={styles.empty}>Попыток пока нет</p>}
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>№</th>
                    <th>Слушатель</th>
                    <th>Задание</th>
                    <th>Статус</th>
                    <th>Балл</th>
                    <th>Дата</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {[...attempts]
                    .sort(
                      (a, b) =>
                        new Date(a.submittedAt).getTime() -
                        new Date(b.submittedAt).getTime(),
                    )
                    .map((a, index) => (
                    <tr key={a.pkIdAttempt}>
                      <td style={{ color: '#94a3b8', fontSize: '1.2rem' }}>{index + 1}</td>
                      <td>{a.listenerName}</td>
                      <td>{a.taskTitle}</td>
                      <td>
                        <span
                          className={`${styles.statusBadge} ${styles[a.statusName?.toLowerCase().replace(/\s/g, '_') || '']}`}
                        >
                          {a.statusName}
                        </span>
                      </td>
                      <td>{a.score ?? '—'}</td>
                      <td>{new Date(a.submittedAt).toLocaleDateString('ru-RU')}</td>
                      <td className={styles.attemptActions}>
                        <button type="button" className={styles.btnGrade} onClick={() => openGrade(a)}>
                          Просмотр и оценка
                        </button>
                        <button
                          type="button"
                          className={styles.btnDangerOutline}
                          onClick={() => handleDeleteAttempt(a)}
                        >
                          Удалить
                        </button>
                      </td>
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
          <label className={styles.field}>
            <span>Порядок (1–{editLesson ? lessons.length : lessons.length + 1})</span>
            <input
              type="number"
              min={1}
              max={editLesson ? lessons.length : lessons.length + 1}
              value={lessonForm.sortOrder}
              onChange={e => setLessonForm(p => ({ ...p, sortOrder: Number(e.target.value) }))}
            />
          </label>
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
          <label className={styles.field}><span>Макс. балл</span><input type="number" min={0} max={10000} step={1} value={taskForm.maxScore} onChange={e => setTaskForm(p => ({ ...p, maxScore: Number(e.target.value) }))} /></label>
          <label className={styles.field}><span>Дедлайн</span><input type="datetime-local" value={taskForm.deadline} onChange={e => setTaskForm(p => ({ ...p, deadline: e.target.value }))} /></label>
          <label className={styles.field}><span>Урок</span>
            <select value={taskForm.lessonId} onChange={e => setTaskForm(p => ({ ...p, lessonId: e.target.value }))}>
              <option value="">Без урока (общее задание курса)</option>
              {lessons.map(l => <option key={l.pkIdLesson} value={l.pkIdLesson}>{l.title}</option>)}
            </select>
          </label>
          <p className={styles.fieldHint}>Для поочередного прохождения как в тренажёре привяжите задание к уроку.</p>
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
              {lessons.map(l => <option key={l.pkIdLesson} value={l.pkIdLesson}>{l.title}</option>)}
            </select>
          </label>
          <p className={styles.fieldHint}>Материал всегда привязан к уроку (в БД нельзя сохранить «без урока»).</p>
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
      <Modal
        isOpen={gradeModal}
        onClose={() => {
          setGradeModal(false);
          setGradeTestRows([]);
          setGradeComments([]);
        }}
        title="Просмотр и оценка попытки"
      >
        <div className={styles.mForm}>
          {gradeAttempt && (
            <>
              <p>
                <strong>Слушатель:</strong> {gradeAttempt.listenerName}
              </p>
              <p>
                <strong>Задание:</strong> {gradeAttempt.taskTitle}
              </p>
              <p>
                <strong>Текущий статус:</strong> {gradeAttempt.statusName}
              </p>
              {gradeAttempt.score != null && gradeAttempt.score !== undefined && (
                <p>
                  <strong>Балл в системе:</strong> {gradeAttempt.score}
                </p>
              )}
              {(() => {
                const gTask = tasks.find(
                  (t) =>
                    Number((t as { pkIdTask?: unknown }).pkIdTask) ===
                    attemptRowTaskId(gradeAttempt),
                );
                const typeId =
                  gTask?.typeId ?? (gTask as { fkIdTypeTasks?: number } | undefined)?.fkIdTypeTasks;
                const fileUrl = attemptAnswerFileUrl(gradeAttempt);
                return (
                  <>
                    {gTask && (
                      <p>
                        <strong>Максимум баллов:</strong> {gTask.maxScore}
                      </p>
                    )}
                    {gradeAttempt.answerText && typeId !== TASK_TYPE.TEST && (
                      <div className={styles.answerBox}>
                        <strong>Текстовый ответ:</strong>
                        <p>{gradeAttempt.answerText}</p>
                      </div>
                    )}
                    {fileUrl && typeId !== TASK_TYPE.TEST && (
                      <div className={styles.answerBox}>
                        <strong>Ссылка на файл / облако:</strong>
                        <p>
                          <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                            {fileUrl}
                          </a>
                        </p>
                      </div>
                    )}
                  </>
                );
              })()}
              {(() => {
                const gTask = tasks.find(
                  (t) =>
                    Number((t as { pkIdTask?: unknown }).pkIdTask) ===
                    attemptRowTaskId(gradeAttempt),
                );
                const typeId =
                  gTask?.typeId ?? (gTask as { fkIdTypeTasks?: number } | undefined)?.fkIdTypeTasks;
                if (typeId !== TASK_TYPE.TEST) return null;
                if (gradeTestRows.length > 0) return null;
                return (
                  <p className={styles.fieldHint}>
                    Ответы теста пока не найдены (попытка без отправленных вариантов или ошибка загрузки).
                  </p>
                );
              })()}
              {gradeTestRows.length > 0 && (
                <div className={styles.answerBox}>
                  <strong>Ответы на тест:</strong>
                  <table className={styles.table} style={{ marginTop: '1rem', fontSize: '1.3rem' }}>
                    <thead>
                      <tr>
                        <th>Вопрос</th>
                        <th>Выбранный вариант</th>
                        <th>Верно</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gradeTestRows.map((row, qi) => (
                        <tr key={row.pkIdTestAnswer || qi}>
                          <td>
                            <strong>Вопрос {qi + 1}.</strong> {row.questionText}
                          </td>
                          <td>{row.optionText || '—'}</td>
                          <td>{row.isCorrect ? 'Да' : 'Нет'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {gradeComments.length > 0 && (
                <div className={styles.answerBox}>
                  <strong>Комментарии к заданию:</strong>
                  <ul style={{ margin: '0.8rem 0 0', paddingLeft: '1.6rem' }}>
                    {gradeComments.map((c) => (
                      <li key={c.pkIdComment}>
                        <strong>{c.userName}</strong>{' '}
                        <span style={{ color: '#64748b', fontSize: '1.2rem' }}>
                          {new Date(c.createdAt).toLocaleString('ru-RU')}
                        </span>
                        <div>{c.message}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
          <label className={styles.field}>
            <span>Балл</span>
            <input
              type="number"
              min={0}
              max={
                gradeAttempt
                  ? tasks.find(
                      (t) =>
                        Number((t as { pkIdTask?: unknown }).pkIdTask) ===
                        attemptRowTaskId(gradeAttempt),
                    )?.maxScore
                  : undefined
              }
              step={1}
              value={gradeScore}
              onChange={(e) => setGradeScore(e.target.value)}
            />
          </label>
          <div className={styles.gradeActions}>
            <button type="button" className={styles.btnSecondary} onClick={handleSaveScoreOnly}>
              Сохранить только балл
            </button>
            <button type="button" className={styles.btnPrimary} onClick={() => handleGrade(ATTEMPT_STATUS.ACCEPTED)}>
              Принять
            </button>
            <button type="button" className={styles.btnSecondary} onClick={() => handleGrade(ATTEMPT_STATUS.REVISION)}>
              На доработку
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
