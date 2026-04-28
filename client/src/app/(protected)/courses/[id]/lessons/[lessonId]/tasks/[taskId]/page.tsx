'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { tasksApi } from '@/lib/api/tasks.api';
import { attemptsApi, type IAttempt } from '@/lib/api/attempts.api';
import { materialsApi } from '@/lib/api/materials.api';
import { commentsApi, type IComment } from '@/lib/api/comments.api';
import type { ITask, IMaterial } from '@/lib/types';
import { ATTEMPT_STATUS, TASK_TYPE, MATERIAL_TYPE_ICONS } from '@/lib/constants';
import Link from 'next/link';
import styles from './page.module.scss';

export default function TaskPage() {
  const params = useParams();
  const router = useRouter();
  const { user, checkRole } = useAuth();
  const courseId = Number(params.id);
  const lessonId = Number(params.lessonId);
  const taskId = Number(params.taskId);
  const initialized = useRef(false);

  const [task, setTask] = useState<ITask | null>(null);
  const [materials, setMaterials] = useState<IMaterial[]>([]);
  const [attempt, setAttempt] = useState<IAttempt | null>(null);
  const [comments, setComments] = useState<IComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentSending, setCommentSending] = useState(false);
  const [answerText, setAnswerText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const isListener = checkRole(['Слушатель']);
  const isTeacher = checkRole(['Преподаватель']);
  const isAdmin = checkRole(['Администратор']);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tasksData, materialsData] = await Promise.all([
        tasksApi.getByCourse(courseId),
        materialsApi.getByLesson(lessonId),
      ]);

      const found = tasksData.find((t) => t.pkIdTask === taskId);
      if (!found) { setError('Задание не найдено'); return; }
      setTask(found);
      setMaterials(materialsData.filter((m) => m.fkIdLesson === lessonId));

      // Загружаем попытку слушателя
      if (user && isListener) {
        const attempts = await attemptsApi.getByListener(user.pkIdUser);
        const existing = attempts.find((a: any) => a.fkIdTask === taskId || a.pkIdTask === taskId);
        if (existing) setAttempt(existing);
      }

      // Загружаем комментарии
      try {
        const taskComments = await commentsApi.getByTask(taskId);
        setComments(taskComments);
      } catch {}
    } catch {
      setError('Ошибка загрузки задания');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !task || !answerText.trim()) {
      setError('Введите ответ перед отправкой');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const newAttempt = await attemptsApi.create({
        taskId,
        listenerId: user.pkIdUser,
        statusId: ATTEMPT_STATUS.PENDING,
        answerText: answerText.trim(),
      });
      setAttempt(newAttempt);
      setSubmitted(true);
      setAnswerText('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка отправки');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendComment = async () => {
    if (!user || !newComment.trim()) return;
    setCommentSending(true);
    try {
      const comment = await commentsApi.create({
        taskId,
        userId: user.pkIdUser,
        message: newComment.trim(),
      });
      setComments((prev) => [...prev, comment]);
      setNewComment('');
    } catch {}
    finally { setCommentSending(false); }
  };

  const canResubmit = attempt?.statusName === 'Отклонено' || attempt?.statusName === 'На доработке';
  const isTest = task?.taskTypeName === 'Тест' || (task as any)?.fkIdTypeTasks === TASK_TYPE.TEST;
  const hasTestId = !!(task as any)?.fkIdTest;

  if (loading) return <div className={styles.loading}><div className={styles.spinner} /></div>;
  if (error && !task) return (
    <div className={styles.errorPage}>
      <p>{error}</p>
      <button onClick={() => router.back()} className={styles.backBtn}>← Назад</button>
    </div>
  );
  if (!task) return null;

  return (
    <div className={styles.container}>
      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        <button onClick={() => router.push(`/courses/${courseId}`)} className={styles.breadLink}>Курс</button>
        <span>/</span>
        <button onClick={() => router.push(`/courses/${courseId}/lessons/${lessonId}`)} className={styles.breadLink}>Урок</button>
        <span>/</span>
        <span className={styles.breadCurrent}>{task.title || task.taskTitle}</span>
      </div>

      {/* Task header */}
      <div className={styles.taskCard}>
        <div className={styles.taskTop}>
          <span className={styles.taskTypeBadge}>{task.taskTypeName}</span>
          {attempt && (
            <span className={`${styles.attemptStatus} ${styles[attempt.statusName === 'Принято' ? 'accepted' : attempt.statusName === 'На проверке' ? 'pending' : 'rejected']}`}>
              {attempt.statusName}
            </span>
          )}
        </div>
        <h1>{task.title || task.taskTitle}</h1>
        {task.description && <p className={styles.taskDesc}>{task.description}</p>}

        <div className={styles.taskMeta}>
          <div className={styles.metaItem}>
            <span>Максимальный балл</span>
            <strong>{task.maxScore}</strong>
          </div>
          {task.deadline && (
            <div className={styles.metaItem}>
              <span>Срок сдачи</span>
              <strong className={new Date(task.deadline) < new Date() ? styles.overdue : ''}>
                {new Date(task.deadline).toLocaleString('ru-RU', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </strong>
            </div>
          )}
          {attempt?.score !== null && attempt?.score !== undefined && (
            <div className={styles.metaItem}>
              <span>Ваш балл</span>
              <strong className={styles.scoreValue}>{attempt.score} / {task.maxScore}</strong>
            </div>
          )}
        </div>
      </div>

      {/* Materials */}
      {materials.length > 0 && (
        <div className={styles.card}>
          <h2>Материалы к заданию</h2>
          <div className={styles.materialsList}>
            {materials.map((m) => (
              <a
                key={m.pkIdMaterial}
                href={m.fileUrl || m.link || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.materialItem}
              >
                <span className={styles.matIcon}>
                  {MATERIAL_TYPE_ICONS[m.fkIdTypeMaterial] || '📎'}
                </span>
                <div className={styles.matInfo}>
                  <strong>{m.title}</strong>
                  {m.description && <span>{m.description}</span>}
                </div>
                <span className={styles.matArrow}>→</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Result block (accepted) */}
      {attempt?.statusName === 'Принято' && (
        <div className={styles.resultCard}>
          <div className={styles.resultIcon}>✅</div>
          <div className={styles.resultInfo}>
            <h2>Задание принято!</h2>
            <p>Отправлено: {new Date(attempt.submittedAt).toLocaleDateString('ru-RU')}</p>
            {attempt.score !== null && attempt.score !== undefined && (
              <div className={styles.scoreDisplay}>
                <span>{attempt.score}</span>
                <span>/ {task.maxScore}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pending block */}
      {attempt?.statusName === 'На проверке' && !submitted && (
        <div className={styles.pendingCard}>
          <div className={styles.pendingIcon}>⏳</div>
          <div>
            <h2>Ответ на проверке</h2>
            <p>Отправлено {new Date(attempt.submittedAt).toLocaleDateString('ru-RU')} · Ожидайте проверки преподавателем</p>
            {attempt.answerText && (
              <div className={styles.submittedAnswer}>
                <strong>Ваш ответ:</strong>
                <p>{attempt.answerText}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rejected / revision block */}
      {(attempt?.statusName === 'Отклонено' || attempt?.statusName === 'На доработке') && (
        <div className={styles.rejectedCard}>
          <div className={styles.rejectedIcon}>{attempt.statusName === 'Отклонено' ? '❌' : '🔄'}</div>
          <div>
            <h2>{attempt.statusName}</h2>
            <p>Отправлено {new Date(attempt.submittedAt).toLocaleDateString('ru-RU')}</p>
          </div>
        </div>
      )}

      {/* Success after submit */}
      {submitted && (
        <div className={styles.successCard}>
          <div className={styles.successIcon}>✓</div>
          <div>
            <h2>Ответ отправлен!</h2>
            <p>Ваша работа принята и ожидает проверки преподавателем.</p>
          </div>
        </div>
      )}

      {/* Test link */}
      {isListener && !attempt && !submitted && isTest && hasTestId && (
        <div className={styles.card}>
          <h2>Тестовое задание</h2>
          <p className={styles.testHint}>Для выполнения этого задания необходимо пройти тест. Внимательно прочитайте вопросы.</p>
          <Link
            href={`/courses/${courseId}/lessons/${lessonId}/tasks/${taskId}/test`}
            className={styles.btnTest}
          >
            🎯 Начать тест
          </Link>
        </div>
      )}

      {/* Answer form */}
      {isListener && !submitted && (attempt === null || canResubmit) && !isTest && (
        <div className={styles.card}>
          <h2>{canResubmit ? 'Отправить повторно' : 'Ваш ответ'}</h2>
          {canResubmit && (
            <div className={styles.resubmitHint}>
              Предыдущий ответ был {attempt?.statusName?.toLowerCase()}. Исправьте и отправьте снова.
            </div>
          )}
          <textarea
            className={styles.answerInput}
            rows={8}
            placeholder="Введите ваш ответ здесь..."
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
          />
          {error && <p className={styles.errorText}>{error}</p>}
          <div className={styles.formActions}>
            <button
              className={styles.btnCancel}
              onClick={() => router.push(`/courses/${courseId}/lessons/${lessonId}`)}
            >
              Отмена
            </button>
            <button
              className={styles.btnSubmit}
              onClick={handleSubmit}
              disabled={submitting || !answerText.trim()}
            >
              {submitting ? 'Отправка...' : 'Отправить на проверку'}
            </button>
          </div>
        </div>
      )}

      {/* Comments */}
      <div className={styles.card}>
        <h2>Обсуждение {comments.length > 0 && <span className={styles.commentCount}>{comments.length}</span>}</h2>
        <div className={styles.commentsList}>
          {comments.length === 0 && (
            <p className={styles.noComments}>Комментариев пока нет. Задайте вопрос преподавателю!</p>
          )}
          {comments.map((c) => (
            <div key={c.pkIdComment} className={styles.commentItem}>
              <div className={styles.commentAvatar}>{c.userName?.[0]?.toUpperCase() || '?'}</div>
              <div className={styles.commentBody}>
                <div className={styles.commentHeader}>
                  <strong>{c.userName}</strong>
                  <span>{new Date(c.createdAt).toLocaleString('ru-RU', {
                    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                  })}</span>
                </div>
                <p>{c.message}</p>
              </div>
            </div>
          ))}
        </div>
        <div className={styles.commentForm}>
          <textarea
            className={styles.commentInput}
            rows={3}
            placeholder="Написать комментарий..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) handleSendComment(); }}
          />
          <button
            className={styles.btnComment}
            onClick={handleSendComment}
            disabled={commentSending || !newComment.trim()}
          >
            {commentSending ? '...' : 'Отправить'}
          </button>
        </div>
      </div>
    </div>
  );
}
