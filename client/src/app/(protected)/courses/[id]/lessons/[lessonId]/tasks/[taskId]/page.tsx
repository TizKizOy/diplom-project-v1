'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { tasksApi } from '@/lib/api/tasks.api';
import { attemptsApi, type IAttempt } from '@/lib/api/attempts.api';
import { checkListenerLessonSequentialAccess } from '@/lib/course/listenerLessonAccess';
import { materialsApi } from '@/lib/api/materials.api';
import { commentsApi, type IComment } from '@/lib/api/comments.api';
import { getMaterialTitle, type ITask, type IMaterial } from '@/lib/types';
import { ATTEMPT_STATUS, TASK_TYPE, MATERIAL_TYPE_ICONS } from '@/lib/constants';
import Link from 'next/link';
import { getApiErrorMessage } from '@/lib/http/getApiErrorMessage';
import { attemptAnswerFileUrl } from '@/lib/attempts/attemptTaskId';
import {
  pickActiveAttemptForTask,
  attemptHasSubmittedContent,
} from '@/lib/attempts/pickActiveAttempt';
import styles from './page.module.scss';

export default function TaskPage() {
  const params = useParams();
  const router = useRouter();
  const { user, checkRole } = useAuth();
  const courseId = Number(params.id);
  const lessonId = Number(params.lessonId);
  const taskId = Number(params.taskId);

  const [task, setTask] = useState<ITask | null>(null);
  const [materials, setMaterials] = useState<IMaterial[]>([]);
  const [attempt, setAttempt] = useState<IAttempt | null>(null);
  const [comments, setComments] = useState<IComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentSending, setCommentSending] = useState(false);
  const [answerText, setAnswerText] = useState('');
  const [answerFileUrl, setAnswerFileUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [listenerAccessMessage, setListenerAccessMessage] = useState<string | null>(null);

  const isListener = checkRole(['Слушатель']);
  const isTeacher = checkRole(['Преподаватель']);
  const isAdmin = checkRole(['Администратор']);

  useEffect(() => {
    loadData();
  }, [courseId, lessonId, taskId, user, isListener]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [tasksData, materialsData] = await Promise.all([
        tasksApi.getByCourse(courseId),
        materialsApi.getByLesson(lessonId),
      ]);

      const found = tasksData.find((t) => Number(t.pkIdTask) === taskId);
      if (!found) { setError('Задание не найдено'); return; }
      setTask(found);
      setMaterials(materialsData.filter((m) => m.fkIdLesson === lessonId));

      if (user && isListener) {
        const gate = await checkListenerLessonSequentialAccess(
          courseId,
          lessonId,
          user.pkIdUser,
        );
        setListenerAccessMessage(gate.ok ? null : gate.message);
      } else {
        setListenerAccessMessage(null);
      }

      // Загружаем попытку слушателя (сброс при смене задания / повторной загрузке)
      if (user && isListener) {
        setAttempt(null);
        setAnswerText('');
        setAnswerFileUrl('');
        setSubmitted(false);
        const attempts = await attemptsApi.getByListener(user.pkIdUser);
        const existing = pickActiveAttemptForTask(attempts, taskId);
        if (existing) {
          setAttempt(existing);
          const at = existing.answerText?.trim() || '';
          setAnswerText(at && at !== 'Тест' ? at : '');
          setAnswerFileUrl(existing.answerFileUrl?.trim() || '');
        }
      }

      // Загружаем комментарии
      try {
        const taskComments = await commentsApi.getByTask(taskId);
        setComments(taskComments);
      } catch {}
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Ошибка загрузки задания'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !task) return;
    const text = answerText.trim();
    const file = answerFileUrl.trim();
    if (!text && !file) {
      setError('Введите текст ответа и/или ссылку на файл (Google Диск, OneDrive и т.п.)');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        ...(text ? { answerText: text } : {}),
        ...(file ? { answerFileUrl: file } : {}),
      };
      const newAttempt =
        attempt?.statusName === 'На доработке'
          ? await attemptsApi.resubmit(attempt.pkIdAttempt, payload)
          : await attemptsApi.create({
              taskId,
              listenerId: user.pkIdUser,
              statusId: ATTEMPT_STATUS.PENDING,
              ...payload,
            });
      setAttempt(newAttempt);
      setSubmitted(true);
      setAnswerText('');
      setAnswerFileUrl('');
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, '');
      if (msg.includes('активная попытка') || msg.includes('активн')) {
        try {
          const attempts = await attemptsApi.getByListener(user.pkIdUser);
          const existing = pickActiveAttemptForTask(attempts, taskId);
          if (existing) {
            setAttempt(existing);
            setSubmitted(false);
            setError('');
            return;
          }
        } catch {
          /* падаем в общее сообщение */
        }
      }
      setError(getApiErrorMessage(err, 'Ошибка отправки'));
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

  if (loading) return <div className={styles.loading}><div className={styles.spinner} /></div>;
  if (error && !task) return (
    <div className={styles.errorPage}>
      <p>{error}</p>
      <button onClick={() => router.back()} className={styles.backBtn}>← Назад</button>
    </div>
  );
  if (!task) return null;

  const canResubmit = attempt?.statusName === 'На доработке';
  const attemptHasContent = attempt ? attemptHasSubmittedContent(attempt) : false;
  const canSubmitAnswer =
    !attempt || canResubmit || (attempt.statusName === 'На проверке' && !attemptHasContent);
  const taskTypeId =
    task.typeId ?? (task as { fkIdTypeTasks?: number }).fkIdTypeTasks;
  const isTestTask = taskTypeId === TASK_TYPE.TEST;
  const hasTestId = !!task.fkIdTest;
  const canActAsListener = isListener && !listenerAccessMessage;

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
      {listenerAccessMessage && isListener && (
        <div className={styles.accessBanner}>
          <p>{listenerAccessMessage}</p>
          {listenerAccessMessage.includes('Запишитесь') && (
            <Link href={`/courses/${courseId}/enroll`} className={styles.enrollLink}>
              Записаться на курс
            </Link>
          )}
        </div>
      )}

      {canResubmit && !submitted && (
        <div className={styles.reworkBanner} role="status">
          <strong>Работа отправлена на доработку</strong>
          <p>
            Преподаватель ожидает исправленный ответ. Заполните форму ниже и отправьте снова.
            {attempt?.score != null && ` Текущий балл: ${attempt.score}.`}
          </p>
        </div>
      )}

      {attempt?.statusName === 'На проверке' && attemptHasContent && !submitted && (
        <div className={styles.reviewBanner} role="status">
          <strong>Работа на проверке.</strong> Преподаватель проверит ответ и выставит оценку. Вы получите уведомление о результате.
        </div>
      )}

      <div className={styles.taskCard}>
        <div className={styles.taskTop}>
          <span className={styles.taskTypeBadge}>{task.taskTypeName}</span>
          {attempt && (
            <span
              className={`${styles.attemptStatus} ${
                styles[
                  attempt.statusName === 'Принято'
                    ? 'accepted'
                    : attempt.statusName === 'На проверке'
                      ? 'pending'
                      : attempt.statusName === 'На доработке'
                        ? 'revision'
                        : 'rejected'
                ]
              }`}
            >
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
                  {MATERIAL_TYPE_ICONS[m.fkIdTypeMaterial ?? 0] || 'Файл'}
                </span>
                <div className={styles.matInfo}>
                  <strong>{getMaterialTitle(m)}</strong>
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
          <div className={styles.resultIcon} aria-hidden />
          <div className={styles.resultInfo}>
            <h2>Задание принято!</h2>
            <p>Отправлено: {new Date(attempt.submittedAt).toLocaleDateString('ru-RU')}</p>
            {attempt.score !== null && attempt.score !== undefined && (
              <div className={styles.scoreDisplay}>
                <span>{attempt.score}</span>
                <span>/ {task.maxScore}</span>
              </div>
            )}
            {attempt.answerText && attempt.answerText !== 'Тест' && (
              <div className={styles.submittedAnswer}>
                <strong>Ваш ответ:</strong>
                <p>{attempt.answerText}</p>
              </div>
            )}
            {attemptAnswerFileUrl(attempt) && (
              <div className={styles.submittedAnswer}>
                <strong>Ссылка на файл / материалы:</strong>
                <p>
                  <a
                    href={attemptAnswerFileUrl(attempt)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {attemptAnswerFileUrl(attempt)}
                  </a>
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pending block */}
      {attempt?.statusName === 'На проверке' && !submitted && (
        <div className={styles.pendingCard}>
          <div className={styles.pendingIcon} aria-hidden />
          <div>
            <h2>Ответ на проверке</h2>
            <p>Отправлено {new Date(attempt.submittedAt).toLocaleDateString('ru-RU')} · Ожидайте проверки преподавателем</p>
            {attempt.answerText && attempt.answerText !== 'Тест' && (
              <div className={styles.submittedAnswer}>
                <strong>Ваш ответ:</strong>
                <p>{attempt.answerText}</p>
              </div>
            )}
            {attempt.answerFileUrl && (
              <div className={styles.submittedAnswer}>
                <strong>Файл / материалы:</strong>
                <p>
                  <a href={attempt.answerFileUrl} target="_blank" rel="noopener noreferrer">
                    {attempt.answerFileUrl}
                  </a>
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rejected / revision block */}
      {(attempt?.statusName === 'Отклонено' || attempt?.statusName === 'На доработке') && (
        <div className={styles.rejectedCard}>
          <div className={`${styles.rejectedIcon} ${attempt.statusName === 'Отклонено' ? styles.rejectedIconBad : styles.rejectedIconRev}`} aria-hidden />
          <div>
            <h2>{attempt.statusName}</h2>
            <p>Отправлено {new Date(attempt.submittedAt).toLocaleDateString('ru-RU')}</p>
          </div>
        </div>
      )}

      {/* Success after submit */}
      {submitted && (
        <div className={styles.successCard}>
          <div className={styles.successIcon} aria-hidden />
          <div>
            <h2>Ответ отправлен!</h2>
            <p>Ваша работа принята и ожидает проверки преподавателем.</p>
          </div>
        </div>
      )}

      {/* Test link */}
      {canActAsListener && !attempt && !submitted && isTestTask && hasTestId && (
        <div className={styles.card}>
          <h2>Тестовое задание</h2>
          <p className={styles.testHint}>Для выполнения этого задания необходимо пройти тест. Внимательно прочитайте вопросы.</p>
          <Link
            href={`/courses/${courseId}/lessons/${lessonId}/tasks/${taskId}/test`}
            className={styles.btnTest}
          >
            Начать тест
          </Link>
        </div>
      )}

      {canActAsListener && isTestTask && hasTestId === false && (
        <div className={styles.card}>
          <h2>Тест</h2>
          <p className={styles.testHint}>Тест ещё не подключён к заданию. Обратитесь к преподавателю.</p>
        </div>
      )}

      {/* Answer form */}
      {canActAsListener && !submitted && canSubmitAnswer && !isTestTask && (
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
          <label className={styles.fileLinkLabel}>
            <span>Ссылка на файл (Google Диск, Яндекс.Диск, OneDrive и т.д.)</span>
            <input
              type="url"
              className={styles.fileLinkInput}
              placeholder="https://..."
              value={answerFileUrl}
              onChange={(e) => setAnswerFileUrl(e.target.value)}
            />
          </label>
          <p className={styles.fieldHint}>
            Достаточно текста в поле выше или ссылки на файл — можно указать оба варианта.
          </p>
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
              disabled={submitting || (!answerText.trim() && !answerFileUrl.trim())}
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
