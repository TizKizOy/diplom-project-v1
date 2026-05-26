'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { tasksApi } from '@/lib/api/tasks.api';
import { testsApi, type ITestQuestion, type ITestOption } from '@/lib/api/tests.api';
import apiClient from '@/lib/api/apiClient';
import { getApiErrorMessage } from '@/lib/http/getApiErrorMessage';
import styles from './page.module.scss';

interface QuestionForm {
  pkIdQuestion?: number;
  questionText: string;
  score: number;
  sortOrder: number;
  options: OptionForm[];
}

interface OptionForm {
  pkIdOption?: number;
  optionText: string;
  isCorrect: boolean;
  sortOrder: number;
}

export default function TestEditorPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = Number(params.id);
  const taskId = Number(params.taskId);

  const [taskTitle, setTaskTitle] = useState('');
  const [testId, setTestId] = useState<number | null>(null);
  const [testSettings, setTestSettings] = useState({
    timeLimitMinutes: '',
    shuffleQuestions: false,
    maxAttempts: 1,
    showResults: true,
    passingScorePercent: 60,
  });
  const [questions, setQuestions] = useState<QuestionForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const saveLockRef = useRef(false);

  useEffect(() => {
    loadData();
  }, [courseId, taskId]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const tasks = await tasksApi.getByCourse(courseId);
      const task = tasks.find((t) => t.pkIdTask === taskId);
      if (!task) { setError('Задание не найдено'); return; }
      setTaskTitle(task.title || task.taskTitle || '');

      const fkIdTest = (task as any).fkIdTest;
      if (fkIdTest) {
        setTestId(fkIdTest);
        // Load test settings
        const test = await testsApi.getById(fkIdTest);
        setTestSettings({
          timeLimitMinutes: test.timeLimitMinutes ? String(test.timeLimitMinutes) : '',
          shuffleQuestions: test.shuffleQuestions,
          maxAttempts: test.maxAttempts,
          showResults: test.showResults,
          passingScorePercent: test.passingScorePercent,
        });
        // Load questions with options
        const qs = await testsApi.getQuestionsByTest(fkIdTest);
        const questionsWithOptions: QuestionForm[] = await Promise.all(
          qs.map(async (q) => {
            const opts = await testsApi.getOptionsByQuestion(q.pkIdQuestion);
            return {
              pkIdQuestion: q.pkIdQuestion,
              questionText: q.questionText,
              score: q.score,
              sortOrder: q.sortOrder,
              options: opts.map((o) => ({
                pkIdOption: o.pkIdOption,
                optionText: o.optionText,
                isCorrect: o.isCorrect || false,
                sortOrder: o.sortOrder,
              })),
            };
          }),
        );
        setQuestions(questionsWithOptions.sort((a, b) => a.sortOrder - b.sortOrder));
      }
    } catch {
      setError('Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        questionText: '',
        score: 10,
        sortOrder: prev.length + 1,
        options: [
          { optionText: '', isCorrect: true, sortOrder: 1 },
          { optionText: '', isCorrect: false, sortOrder: 2 },
          { optionText: '', isCorrect: false, sortOrder: 3 },
          { optionText: '', isCorrect: false, sortOrder: 4 },
        ],
      },
    ]);
  };

  const removeQuestion = (idx: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateQuestion = (idx: number, field: keyof QuestionForm, value: any) => {
    setQuestions((prev) => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q));
  };

  const updateOption = (qIdx: number, oIdx: number, field: keyof OptionForm, value: any) => {
    setQuestions((prev) => prev.map((q, i) => {
      if (i !== qIdx) return q;
      const newOptions = q.options.map((o, j) => {
        if (j !== oIdx) return o;
        return { ...o, [field]: value };
      });
      // Если меняем isCorrect — сбрасываем остальные (одиночный выбор)
      if (field === 'isCorrect' && value === true) {
        return { ...q, options: newOptions.map((o, j) => ({ ...o, isCorrect: j === oIdx })) };
      }
      return { ...q, options: newOptions };
    }));
  };

  const addOption = (qIdx: number) => {
    setQuestions((prev) => prev.map((q, i) => {
      if (i !== qIdx) return q;
      return { ...q, options: [...q.options, { optionText: '', isCorrect: false, sortOrder: q.options.length + 1 }] };
    }));
  };

  const removeOption = (qIdx: number, oIdx: number) => {
    setQuestions((prev) => prev.map((q, i) => {
      if (i !== qIdx) return q;
      return { ...q, options: q.options.filter((_, j) => j !== oIdx) };
    }));
  };

  const handleSave = async () => {
    if (saveLockRef.current) return;
    setError('');
    setSuccess('');

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) { setError(`Вопрос ${i + 1}: введите текст вопроса`); return; }
      if (q.options.length < 2) { setError(`Вопрос ${i + 1}: минимум 2 варианта ответа`); return; }
      if (!q.options.some((o) => o.isCorrect)) { setError(`Вопрос ${i + 1}: отметьте правильный ответ`); return; }
      const qs = Math.trunc(Number(q.score));
      if (!Number.isFinite(qs) || qs < 0 || qs > 1000) {
        setError(`Вопрос ${i + 1}: балл за вопрос — целое число от 0 до 1000`);
        return;
      }
      for (const o of q.options) {
        if (!o.optionText.trim()) { setError(`Вопрос ${i + 1}: заполните все варианты ответа`); return; }
      }
    }

    saveLockRef.current = true;
    setSaving(true);
    try {
      let currentTestId = testId;
      const pickFirstRow = (data: unknown): Record<string, unknown> | undefined => {
        if (data == null) return undefined;
        if (Array.isArray(data)) return data[0] as Record<string, unknown>;
        return data as Record<string, unknown>;
      };
      const pickId = (data: unknown, key: string): number | undefined => {
        const row = pickFirstRow(data);
        if (!row) return undefined;
        const v = row[key] ?? row[key.charAt(0).toUpperCase() + key.slice(1)];
        const n = Number(v);
        return Number.isFinite(n) ? n : undefined;
      };

      if (!currentTestId) {
        const newTest = await apiClient.post('/tests', {
          timeLimitMinutes: testSettings.timeLimitMinutes ? Number(testSettings.timeLimitMinutes) : null,
          shuffleQuestions: testSettings.shuffleQuestions,
          maxAttempts: testSettings.maxAttempts,
          showResults: testSettings.showResults,
          passingScorePercent: testSettings.passingScorePercent,
        });
        const newTestId = pickId(newTest.data, 'pkIdTest');
        if (newTestId == null) {
          throw new Error('Не удалось создать тест: нет идентификатора в ответе сервера');
        }
        currentTestId = newTestId;
        setTestId(newTestId);
        await tasksApi.update(taskId, { testId: newTestId });
      } else {
        await apiClient.put(`/tests/${currentTestId}`, {
          timeLimitMinutes: testSettings.timeLimitMinutes ? Number(testSettings.timeLimitMinutes) : null,
          shuffleQuestions: testSettings.shuffleQuestions,
          maxAttempts: testSettings.maxAttempts,
          showResults: testSettings.showResults,
          passingScorePercent: testSettings.passingScorePercent,
        });
      }

      const nextQuestions: QuestionForm[] = questions.map((q) => ({
        ...q,
        options: q.options.map((o) => ({ ...o })),
      }));

      for (let i = 0; i < nextQuestions.length; i++) {
        const q = nextQuestions[i];
        let questionId = q.pkIdQuestion;

        if (!questionId) {
          const newQ = await apiClient.post('/test-questions', {
            testId: currentTestId,
            questionText: q.questionText,
            score: q.score,
            sortOrder: i + 1,
          });
          questionId = pickId(newQ.data, 'pkIdQuestion');
          if (questionId == null) {
            throw new Error(`Не удалось создать вопрос ${i + 1}`);
          }
          nextQuestions[i] = { ...q, pkIdQuestion: questionId };
        } else {
          await apiClient.put(`/test-questions/${questionId}`, {
            questionText: q.questionText,
            score: q.score,
            sortOrder: i + 1,
          });
        }

        const qRef = nextQuestions[i];
        for (let j = 0; j < qRef.options.length; j++) {
          const o = qRef.options[j];
          if (!o.pkIdOption) {
            const newO = await apiClient.post('/test-options', {
              questionId,
              optionText: o.optionText,
              isCorrect: o.isCorrect,
              sortOrder: j + 1,
            });
            const newOptionId = pickId(newO.data, 'pkIdOption');
            if (newOptionId != null) {
              qRef.options[j] = { ...o, pkIdOption: newOptionId };
            }
          } else {
            await apiClient.put(`/test-options/${o.pkIdOption}`, {
              optionText: o.optionText,
              isCorrect: o.isCorrect,
              sortOrder: j + 1,
            });
          }
        }
      }

      setQuestions(nextQuestions);
      setSuccess('Тест сохранён успешно!');
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Ошибка сохранения теста'));
    } finally {
      saveLockRef.current = false;
      setSaving(false);
    }
  };

  if (loading) return <div className={styles.loading}><div className={styles.spinner} /></div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => router.push(`/courses/${courseId}/manage`)} className={styles.backBtn}>
          ← К управлению курсом
        </button>
        <h1>Редактор теста: {taskTitle}</h1>
      </div>

      {error && <div className={styles.errorBox}>{error}</div>}
      {success && <div className={styles.successBox}>{success}</div>}

      {/* Test settings */}
      <div className={styles.card}>
        <h2>Настройки теста</h2>
        <div className={styles.settingsGrid}>
          <div className={styles.field}>
            <label>Лимит времени (мин)</label>
            <input
              type="number"
              min={0}
              placeholder="Без ограничения"
              value={testSettings.timeLimitMinutes}
              onChange={(e) => setTestSettings((p) => ({ ...p, timeLimitMinutes: e.target.value }))}
            />
          </div>
          <div className={styles.field}>
            <label>Макс. попыток</label>
            <input
              type="number"
              min={1}
              value={testSettings.maxAttempts}
              onChange={(e) => setTestSettings((p) => ({ ...p, maxAttempts: Number(e.target.value) }))}
            />
          </div>
          <div className={styles.field}>
            <label>Проходной балл (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={testSettings.passingScorePercent}
              onChange={(e) => setTestSettings((p) => ({ ...p, passingScorePercent: Number(e.target.value) }))}
            />
          </div>
          <div className={styles.checkboxField}>
            <label>
              <input
                type="checkbox"
                checked={testSettings.shuffleQuestions}
                onChange={(e) => setTestSettings((p) => ({ ...p, shuffleQuestions: e.target.checked }))}
              />
              Перемешивать вопросы
            </label>
          </div>
          <div className={styles.checkboxField}>
            <label>
              <input
                type="checkbox"
                checked={testSettings.showResults}
                onChange={(e) => setTestSettings((p) => ({ ...p, showResults: e.target.checked }))}
              />
              Показывать результаты после прохождения
            </label>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className={styles.questionsSection}>
        <div className={styles.sectionHead}>
          <h2>Вопросы ({questions.length})</h2>
          <button onClick={addQuestion} className={styles.btnAdd}>+ Добавить вопрос</button>
        </div>

        {questions.length === 0 && (
          <div className={styles.emptyQuestions}>
            <p>Добавьте вопросы для теста</p>
            <button onClick={addQuestion} className={styles.btnPrimary}>+ Добавить первый вопрос</button>
          </div>
        )}

        {questions.map((q, qIdx) => (
          <div key={qIdx} className={styles.questionCard}>
            <div className={styles.questionHeader}>
              <span className={styles.questionNum}>Вопрос {qIdx + 1}</span>
              <div className={styles.questionMeta}>
                <label className={styles.scoreLabel}>
                  Баллов:
                  <input
                    type="number"
                    min={0}
                    max={1000}
                    step={1}
                    value={q.score}
                    onChange={(e) => updateQuestion(qIdx, 'score', Number(e.target.value))}
                    className={styles.scoreInput}
                  />
                </label>
                <button onClick={() => removeQuestion(qIdx)} className={styles.btnRemove} title="Удалить вопрос">✕</button>
              </div>
            </div>

            <textarea
              className={styles.questionInput}
              rows={3}
              placeholder="Введите текст вопроса..."
              value={q.questionText}
              onChange={(e) => updateQuestion(qIdx, 'questionText', e.target.value)}
            />

            <div className={styles.optionsSection}>
              <div className={styles.optionsHead}>
                <span>Варианты ответов</span>
                <span className={styles.optionsHint}>Отметьте правильный ответ</span>
              </div>
              {q.options.map((o, oIdx) => (
                <div key={oIdx} className={`${styles.optionRow} ${o.isCorrect ? styles.correctOption : ''}`}>
                  <input
                    type="radio"
                    name={`correct-${qIdx}`}
                    checked={o.isCorrect}
                    onChange={() => updateOption(qIdx, oIdx, 'isCorrect', true)}
                    className={styles.radioInput}
                    title="Правильный ответ"
                  />
                  <input
                    type="text"
                    placeholder={`Вариант ${oIdx + 1}`}
                    value={o.optionText}
                    onChange={(e) => updateOption(qIdx, oIdx, 'optionText', e.target.value)}
                    className={styles.optionInput}
                  />
                  {q.options.length > 2 && (
                    <button onClick={() => removeOption(qIdx, oIdx)} className={styles.btnRemoveOption} title="Удалить вариант">✕</button>
                  )}
                </div>
              ))}
              <button onClick={() => addOption(qIdx)} className={styles.btnAddOption}>+ Добавить вариант</button>
            </div>
          </div>
        ))}
      </div>

      {/* Save */}
      <div className={styles.saveBar}>
        <div className={styles.saveInfo}>
          {questions.length} вопросов · {questions.reduce((s, q) => s + q.score, 0)} баллов всего
        </div>
        <div className={styles.saveActions}>
          <button onClick={() => router.push(`/courses/${courseId}/manage`)} className={styles.btnCancel}>
            Отмена
          </button>
          <button onClick={handleSave} disabled={saving || questions.length === 0} className={styles.btnSave}>
            {saving ? 'Сохранение...' : testId ? 'Сохранить изменения' : 'Создать тест'}
          </button>
        </div>
      </div>
    </div>
  );
}
