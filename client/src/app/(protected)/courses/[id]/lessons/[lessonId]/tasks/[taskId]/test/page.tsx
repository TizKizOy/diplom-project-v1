'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { tasksApi } from '@/lib/api/tasks.api';
import { attemptsApi } from '@/lib/api/attempts.api';
import { testsApi, type ITestQuestion, type ITestOption, type ITest } from '@/lib/api/tests.api';
import styles from './page.module.scss';

interface IAnswer {
  questionId: number;
  optionId: number;
}

export default function TestPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const courseId = Number(params.id);
  const lessonId = Number(params.lessonId);
  const taskId = Number(params.taskId);
  const initialized = useRef(false);

  const [test, setTest] = useState<ITest | null>(null);
  const [questions, setQuestions] = useState<(ITestQuestion & { options: ITestOption[] })[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ score: number; total: number; passed: boolean } | null>(null);
  const [existingAttempt, setExistingAttempt] = useState<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    loadData();
  }, []);

  // Timer
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || submitted) return;
    timerRef.current = setTimeout(() => setTimeLeft((t) => (t !== null ? t - 1 : null)), 1000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [timeLeft, submitted]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (timeLeft === 0 && !submitted) handleSubmit();
  }, [timeLeft]);

  const loadData = async () => {
    try {
      const tasks = await tasksApi.getByCourse(courseId);
      const task = tasks.find((t) => t.pkIdTask === taskId);
      if (!task?.fkIdTest) { setError('Тест не найден для этого задания'); return; }

      // Check existing attempt
      if (user) {
        const attempts = await attemptsApi.getByListener(user.pkIdUser);
        const existing = attempts.find((a: any) => a.fkIdTask === taskId);
        if (existing && (existing.statusName === 'Принято' || existing.statusName === 'На проверке')) {
          setExistingAttempt(existing);
          setLoading(false);
          return;
        }
      }

      const [testData, questionsData] = await Promise.all([
        testsApi.getById(task.fkIdTest),
        testsApi.getQuestionsByTest(task.fkIdTest),
      ]);

      // Load options for each question
      const questionsWithOptions = await Promise.all(
        questionsData.map(async (q) => {
          const options = await testsApi.getOptionsByQuestion(q.pkIdQuestion);
          return { ...q, options };
        }),
      );

      // Shuffle if needed
      const finalQuestions = testData.shuffleQuestions
        ? [...questionsWithOptions].sort(() => Math.random() - 0.5)
        : questionsWithOptions.sort((a, b) => a.sortOrder - b.sortOrder);

      setTest(testData);
      setQuestions(finalQuestions);
      if (testData.timeLimitMinutes) setTimeLeft(testData.timeLimitMinutes * 60);
    } catch (e) {
      setError('Ошибка загрузки теста');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId: number, optionId: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmit = useCallback(async () => {
    if (!user || !test || submitting) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setSubmitting(true);
    setError('');

    try {
      // Create attempt first
      const attempt = await attemptsApi.create({
        taskId,
        listenerId: user.pkIdUser,
        statusId: 1,
        answerText: 'Тест',
      });

      // Submit answers
      const answersJson = JSON.stringify(
        Object.entries(answers).map(([questionId, optionId]) => ({
          questionId: Number(questionId),
          optionId,
        })),
      );

      await testsApi.submitAnswers({ attemptId: attempt.pkIdAttempt, answersJson });

      // Calculate score locally for display
      let score = 0;
      let total = 0;
      questions.forEach((q) => {
        total += q.score;
        const selectedOptionId = answers[q.pkIdQuestion];
        const selectedOption = q.options.find((o) => o.pkIdOption === selectedOptionId);
        if (selectedOption?.isCorrect) score += q.score;
      });

      const passed = total > 0 ? (score / total) * 100 >= test.passingScorePercent : false;

      // Grade attempt automatically for tests
      await attemptsApi.grade(attempt.pkIdAttempt, {
        score,
        statusId: passed ? 3 : 4, // 3=Принято, 4=Отклонено
      });

      setResult({ score, total, passed });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка отправки теста');
    } finally {
      setSubmitting(false);
    }
  }, [user, test, answers, questions, taskId, submitting]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const answeredCount = Object.keys(answers).length;
  const progress = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

  if (loading) return <div className={styles.loading}>Загрузка теста...</div>;
  if (error) return <div className={styles.errorPage}><p>{error}</p><button onClick={() => router.back()} className={styles.backBtn}>← Назад</button></div>;

  // Already attempted
  if (existingAttempt) {
    return (
      <div className={styles.container}>
        <div className={styles.resultCard}>
          <div className={styles.resultIcon}>
            {existingAttempt.statusName === 'Принято' ? '✅' : '⏳'}
          </div>
          <h1>Тест уже пройден</h1>
          <p className={styles.resultStatus}>{existingAttempt.statusName}</p>
          {existingAttempt.score !== null && (
            <p className={styles.resultScore}>Балл: <strong>{existingAttempt.score}</strong></p>
          )}
          <button onClick={() => router.push(`/courses/${courseId}/lessons/${lessonId}`)} className={styles.btnPrimary}>
            ← К уроку
          </button>
        </div>
      </div>
    );
  }

  // Result screen
  if (submitted && result) {
    const percent = result.total > 0 ? Math.round((result.score / result.total) * 100) : 0;
    return (
      <div className={styles.container}>
        <div className={styles.resultCard}>
          <div className={styles.resultIcon}>{result.passed ? '🎉' : '😔'}</div>
          <h1>{result.passed ? 'Тест пройден!' : 'Тест не пройден'}</h1>
          <div className={styles.resultStats}>
            <div className={styles.resultStat}>
              <span>Набрано баллов</span>
              <strong>{result.score} / {result.total}</strong>
            </div>
            <div className={styles.resultStat}>
              <span>Процент</span>
              <strong className={result.passed ? styles.passed : styles.failed}>{percent}%</strong>
            </div>
            <div className={styles.resultStat}>
              <span>Проходной балл</span>
              <strong>{test?.passingScorePercent}%</strong>
            </div>
          </div>
          {test?.showResults && (
            <div className={styles.answersReview}>
              <h2>Разбор ответов</h2>
              {questions.map((q, i) => {
                const selectedId = answers[q.pkIdQuestion];
                const selected = q.options.find((o) => o.pkIdOption === selectedId);
                const correct = q.options.find((o) => o.isCorrect);
                const isRight = selected?.isCorrect;
                return (
                  <div key={q.pkIdQuestion} className={`${styles.reviewItem} ${isRight ? styles.correct : styles.wrong}`}>
                    <p className={styles.reviewQ}><strong>{i + 1}.</strong> {q.questionText}</p>
                    <p className={styles.reviewA}>
                      Ваш ответ: <span className={isRight ? styles.greenText : styles.redText}>{selected?.optionText || 'Не отвечено'}</span>
                    </p>
                    {!isRight && correct && (
                      <p className={styles.reviewA}>Правильный ответ: <span className={styles.greenText}>{correct.optionText}</span></p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <button onClick={() => router.push(`/courses/${courseId}/lessons/${lessonId}`)} className={styles.btnPrimary}>
            ← К уроку
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.testHeader}>
        <div className={styles.testInfo}>
          <h1>Тест</h1>
          <span className={styles.testMeta}>
            {questions.length} вопросов · Проходной балл: {test?.passingScorePercent}%
          </span>
        </div>
        {timeLeft !== null && (
          <div className={`${styles.timer} ${timeLeft < 60 ? styles.timerWarning : ''}`}>
            ⏱ {formatTime(timeLeft)}
          </div>
        )}
      </div>

      {/* Progress */}
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
      </div>
      <p className={styles.progressText}>Отвечено: {answeredCount} / {questions.length}</p>

      {/* Questions */}
      <div className={styles.questions}>
        {questions.map((q, i) => (
          <div key={q.pkIdQuestion} className={`${styles.questionCard} ${answers[q.pkIdQuestion] ? styles.answered : ''}`}>
            <div className={styles.questionHeader}>
              <span className={styles.questionNum}>{i + 1}</span>
              <p className={styles.questionText}>{q.questionText}</p>
              <span className={styles.questionScore}>{q.score} б.</span>
            </div>
            <div className={styles.options}>
              {q.options.sort((a, b) => a.sortOrder - b.sortOrder).map((opt) => (
                <label
                  key={opt.pkIdOption}
                  className={`${styles.option} ${answers[q.pkIdQuestion] === opt.pkIdOption ? styles.selectedOption : ''}`}
                >
                  <input
                    type="radio"
                    name={`q-${q.pkIdQuestion}`}
                    value={opt.pkIdOption}
                    checked={answers[q.pkIdQuestion] === opt.pkIdOption}
                    onChange={() => handleAnswer(q.pkIdQuestion, opt.pkIdOption)}
                  />
                  <span>{opt.optionText}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {error && <p className={styles.errorText}>{error}</p>}

      {/* Submit */}
      <div className={styles.submitSection}>
        <p className={styles.submitHint}>
          {answeredCount < questions.length
            ? `Осталось ответить: ${questions.length - answeredCount} вопросов`
            : 'Все вопросы отвечены. Можно отправить тест.'}
        </p>
        <div className={styles.submitActions}>
          <button onClick={() => router.back()} className={styles.btnCancel}>Отмена</button>
          <button
            onClick={handleSubmit}
            disabled={submitting || answeredCount === 0}
            className={styles.btnSubmit}
          >
            {submitting ? 'Отправка...' : 'Завершить тест'}
          </button>
        </div>
      </div>
    </div>
  );
}
