/*
  Дополнительные демонстрационные данные (повышение квалификации педагогов).
  Запуск: после основного скрипта ActualCodeDbSqlServer.sql, в SSMS на вашей БД.
  Пароль всех учётных записей как у seed: admin / teacher_* / listener_* — тот же hash (обычно «password»).
  Скрипт идемпотентен: повторный запуск не дублирует логины и названия курсов.
*/
SET NOCOUNT ON;
GO

DECLARE @pwd NVARCHAR(255) = N'$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

--#region Теги
INSERT INTO tbTags (name)
SELECT n FROM (VALUES
  (N'Инклюзия'), (N'Цифровая грамотность'), (N'Безопасность'), (N'Проектное обучение'), (N'Родители')
) AS v(n)
WHERE NOT EXISTS (SELECT 1 FROM tbTags t WHERE t.name = v.n);
--#endregion

--#region Пользователи
INSERT INTO tbUsers (fkIdRole, fkIdPosition, fullName, login, email, phone, passwordHash)
SELECT 2, u.posId, u.fn, u.lg, u.em, u.ph, @pwd
FROM (VALUES
  (1, N'Морозов Игорь Владимирович', N'teacher_eng', N'morozov@miro.by', N'+375291010101'),
  (7, N'Лебедева Светлана Николаевна', N'teacher_primary', N'lebedeva@miro.by', N'+375291010102'),
  (8, N'Волков Андрей Станиславович', N'teacher_method', N'volkov@miro.by', N'+375291010103')
) AS u(posId, fn, lg, em, ph)
WHERE NOT EXISTS (SELECT 1 FROM tbUsers x WHERE x.login = u.lg);

INSERT INTO tbUsers (fkIdRole, fkIdPosition, fullName, login, email, phone, passwordHash)
SELECT 3, u.posId, u.fn, u.lg, u.em, u.ph, @pwd
FROM (VALUES
  (4, N'Ковалёва Дарья Сергеевна', N'listener_kovaleva', N'kovaleva@mail.by', N'+375291020201'),
  (4, N'Михайлов Павел Олегович', N'listener_mikhailov', N'mikhailov@mail.by', N'+375291020202'),
  (7, N'Новикова Екатерина Игоревна', N'listener_novikova', N'novikova@mail.by', N'+375291020203'),
  (1, N'Соколов Артём Дмитриевич', N'listener_sokolov', N'sokolov@mail.by', N'+375291020204'),
  (2, N'Фёдорова Анна Павловна', N'listener_fedorova', N'fedorova@mail.by', N'+375291020205'),
  (5, N'Зайцева Виктория Александровна', N'listener_zaitseva', N'zaitseva@mail.by', N'+375291020206'),
  (6, N'Павлов Константин Юрьевич', N'listener_pavlov', N'pavlov@mail.by', N'+375291020207'),
  (3, N'Романова Ирина Викторовна', N'listener_romanova', N'romanova@mail.by', N'+375291020208'),
  (1, N'Кузнецов Максим Андреевич', N'listener_kuznetsov', N'kuznetsov@mail.by', N'+375291020209'),
  (2, N'Орлова Людмила Петровна', N'listener_orlova', N'orlova@mail.by', N'+375291020210'),
  (7, N'Белова Наталья Сергеевна', N'listener_belova', N'belova@mail.by', N'+375291020211'),
  (4, N'Громов Сергей Николаевич', N'listener_gromov', N'gromov@mail.by', N'+375291020212')
) AS u(posId, fn, lg, em, ph)
WHERE NOT EXISTS (SELECT 1 FROM tbUsers x WHERE x.login = u.lg);
--#endregion

--#region Курсы
INSERT INTO tbCourses (fkIdStatus, title, description, startDate, endDate)
SELECT 2, v.title, v.descr, v.s, v.e
FROM (VALUES
  (N'Цифровая грамотность педагога', N'Основы цифровых инструментов, электронный журнал, безопасность в сети.', '2026-02-01', '2026-05-31'),
  (N'Инклюзивное образование: практика', N'Адаптация программ, ИОП, работа с детьми с ОВЗ.', '2026-03-01', '2026-06-30'),
  (N'Первая помощь и безопасность на занятиях', N'Действия при ЧС, эвакуация, охрана труда в школе.', '2026-04-01', '2026-07-15'),
  (N'Методика проектного обучения', N'Проекты от идеи до защиты, критерии оценивания.', '2026-05-01', '2026-08-31'),
  (N'Взаимодействие с родителями', N'Коммуникация, конфликты, родительские собрания.', '2026-03-15', '2026-06-15'),
  (N'Английский для педагогов: B1', N'Лексика и ситуации для уроков и переписки с коллегами.', '2025-09-01', '2026-02-28')
) AS v(title, descr, s, e)
WHERE NOT EXISTS (SELECT 1 FROM tbCourses c WHERE c.title = v.title AND c.isDeleted = 0);
--#endregion

--#region Связи курсов (теги, преподаватели)
INSERT INTO tbCourseTags (fkIdCourse, fkIdTag)
SELECT c.pkIdCourse, t.pkIdTag
FROM (VALUES
  (N'Цифровая грамотность педагога', N'Цифровая грамотность'),
  (N'Цифровая грамотность педагога', N'Базовый'),
  (N'Инклюзивное образование: практика', N'Инклюзия'),
  (N'Инклюзивное образование: практика', N'Педагогика'),
  (N'Первая помощь и безопасность на занятиях', N'Безопасность'),
  (N'Методика проектного обучения', N'Проектное обучение'),
  (N'Методика проектного обучения', N'Методика преподавания'),
  (N'Взаимодействие с родителями', N'Родители'),
  (N'Взаимодействие с родителями', N'Психология'),
  (N'Английский для педагогов: B1', N'Английский язык')
) AS m(ctitle, tname)
JOIN tbCourses c ON c.title = m.ctitle AND c.isDeleted = 0
JOIN tbTags t ON t.name = m.tname
WHERE NOT EXISTS (
  SELECT 1 FROM tbCourseTags x WHERE x.fkIdCourse = c.pkIdCourse AND x.fkIdTag = t.pkIdTag
);

INSERT INTO tbCourseTeacher (fkIdCourse, fkIdTeacher)
SELECT c.pkIdCourse, u.pkIdUser
FROM (VALUES
  (N'Цифровая грамотность педагога', N'teacher_it'),
  (N'Инклюзивное образование: практика', N'teacher_psy'),
  (N'Первая помощь и безопасность на занятиях', N'methodist'),
  (N'Методика проектного обучения', N'teacher_method'),
  (N'Взаимодействие с родителями', N'teacher_psy'),
  (N'Английский для педагогов: B1', N'teacher_eng')
) AS m(ctitle, tlogin)
JOIN tbCourses c ON c.title = m.ctitle AND c.isDeleted = 0
JOIN tbUsers u ON u.login = m.tlogin AND u.isDeleted = 0
WHERE NOT EXISTS (
  SELECT 1 FROM tbCourseTeacher x WHERE x.fkIdCourse = c.pkIdCourse AND x.fkIdTeacher = u.pkIdUser
);
--#endregion

--#region Группы и слушатели
INSERT INTO tbGroup (fkIdCourse, fkIdCurator, name)
SELECT c.pkIdCourse, u.pkIdUser, g.gname
FROM (VALUES
  (N'Цифровая грамотность педагога', N'teacher_it', N'Цифра-2026-А'),
  (N'Цифровая грамотность педагога', N'teacher_it', N'Цифра-2026-Б'),
  (N'Инклюзивное образование: практика', N'teacher_psy', N'Инклюзия-2026'),
  (N'Первая помощь и безопасность на занятиях', N'methodist', N'Безопасность-2026'),
  (N'Методика проектного обучения', N'teacher_method', N'Проект-2026'),
  (N'Взаимодействие с родителями', N'teacher_psy', N'Родители-2026'),
  (N'Английский для педагогов: B1', N'teacher_eng', N'English-B1-2025')
) AS g(ctitle, tlogin, gname)
JOIN tbCourses c ON c.title = g.ctitle AND c.isDeleted = 0
JOIN tbUsers u ON u.login = g.tlogin AND u.isDeleted = 0
WHERE NOT EXISTS (SELECT 1 FROM tbGroup gr WHERE gr.name = g.gname AND gr.isDeleted = 0);

INSERT INTO tbGroupListener (fkIdGroup, fkIdListener)
SELECT g.pkIdGroup, l.pkIdUser
FROM (VALUES
  (N'Цифра-2026-А', N'listener_kovaleva'),
  (N'Цифра-2026-А', N'listener_sokolov'),
  (N'Цифра-2026-А', N'listener_zaitseva'),
  (N'Цифра-2026-Б', N'listener_mikhailov'),
  (N'Цифра-2026-Б', N'listener_fedorova'),
  (N'Цифра-2026-Б', N'listener_kuznetsov'),
  (N'Инклюзия-2026', N'listener_novikova'),
  (N'Инклюзия-2026', N'listener_romanova'),
  (N'Инклюзия-2026', N'listener_belova'),
  (N'Инклюзия-2026', N'listener2'),
  (N'Безопасность-2026', N'listener_pavlov'),
  (N'Безопасность-2026', N'listener_gromov'),
  (N'Безопасность-2026', N'listener3'),
  (N'Проект-2026', N'listener_orlova'),
  (N'Проект-2026', N'listener1'),
  (N'Проект-2026', N'listener_sokolov'),
  (N'Родители-2026', N'listener_kovaleva'),
  (N'Родители-2026', N'listener4'),
  (N'English-B1-2025', N'listener_mikhailov'),
  (N'English-B1-2025', N'listener_fedorova'),
  (N'Группа Office-2026-1', N'listener_kovaleva'),
  (N'Группа Office-2026-2', N'listener_kuznetsov'),
  (N'Группа Психология-2026-1', N'listener_zaitseva'),
  (N'Группа ГОСТ-2026-1', N'listener_gromov')
) AS m(gname, llogin)
JOIN tbGroup g ON g.name = m.gname AND g.isDeleted = 0
JOIN tbUsers l ON l.login = m.llogin AND l.isDeleted = 0
WHERE NOT EXISTS (
  SELECT 1 FROM tbGroupListener gl
  WHERE gl.fkIdGroup = g.pkIdGroup AND gl.fkIdListener = l.pkIdUser AND gl.isDeleted = 0
);
GO
--#endregion

--#region Уроки и задания (по одному уроку с заданием — для публикации и логики)
DECLARE @cid INT, @lid INT;

-- Цифровая грамотность
SELECT @cid = pkIdCourse FROM tbCourses WHERE title = N'Цифровая грамотность педагога' AND isDeleted = 0;
IF @cid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM tbLessons WHERE fkIdCourse = @cid)
BEGIN
  INSERT INTO tbLessons (fkIdCourse, title, description, content, sortOrder, isPublished) VALUES
  (@cid, N'1. Цифровая среда школы', N'Платформы и правила', N'Обзор электронного журнала и регламентов...', 1, 1),
  (@cid, N'2. Безопасность данных', N'Пароли и фишинг', N'Как защитить личные и школьные данные...', 2, 1);
  SELECT @lid = pkIdLesson FROM tbLessons WHERE fkIdCourse = @cid AND sortOrder = 1;
  INSERT INTO tbTasks (fkIdTypeTasks, fkIdCourse, fkIdLesson, title, description, deadline, maxScore, sortOrder) VALUES
  (3, @cid, @lid, N'Теория: Цифровой этикет', N'Краткий конспект правил', '2026-05-01', 100, 1);
  SELECT @lid = pkIdLesson FROM tbLessons WHERE fkIdCourse = @cid AND sortOrder = 2;
  INSERT INTO tbTasks (fkIdTypeTasks, fkIdCourse, fkIdLesson, title, description, deadline, maxScore, sortOrder) VALUES
  (2, @cid, @lid, N'Практика: Чек-лист безопасности', N'Составить чек-лист для кабинета', '2026-05-20', 100, 1);
END

-- Инклюзия
SELECT @cid = pkIdCourse FROM tbCourses WHERE title = N'Инклюзивное образование: практика' AND isDeleted = 0;
IF @cid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM tbLessons WHERE fkIdCourse = @cid)
BEGIN
  INSERT INTO tbLessons (fkIdCourse, title, description, content, sortOrder, isPublished) VALUES
  (@cid, N'1. Нормативная база', N'Законы и приказы', N'Правовые основы инклюзии...', 1, 1),
  (@cid, N'2. Индивидуальный маршрут', N'ИОП на практике', N'Разработка целей ИОП...', 2, 1);
  SELECT @lid = pkIdLesson FROM tbLessons WHERE fkIdCourse = @cid AND sortOrder = 1;
  INSERT INTO tbTasks (fkIdTypeTasks, fkIdCourse, fkIdLesson, title, description, deadline, maxScore, sortOrder) VALUES
  (3, @cid, @lid, N'Теория: Принципы инклюзии', N'Ответы на вопросы модуля', '2026-06-01', 100, 1);
END

-- Безопасность
SELECT @cid = pkIdCourse FROM tbCourses WHERE title = N'Первая помощь и безопасность на занятиях' AND isDeleted = 0;
IF @cid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM tbLessons WHERE fkIdCourse = @cid)
BEGIN
  INSERT INTO tbLessons (fkIdCourse, title, description, content, sortOrder, isPublished) VALUES
  (@cid, N'1. Первая помощь', N'Алгоритмы', N'Последовательность действий при травме...', 1, 1);
  SELECT @lid = pkIdLesson FROM tbLessons WHERE fkIdCourse = @cid AND sortOrder = 1;
  INSERT INTO tbTasks (fkIdTypeTasks, fkIdCourse, fkIdLesson, title, description, deadline, maxScore, sortOrder) VALUES
  (2, @cid, @lid, N'Практика: План эвакуации', N'Схема для своего кабинета', '2026-07-01', 100, 1);
END

-- Проектное обучение
SELECT @cid = pkIdCourse FROM tbCourses WHERE title = N'Методика проектного обучения' AND isDeleted = 0;
IF @cid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM tbLessons WHERE fkIdCourse = @cid)
BEGIN
  INSERT INTO tbLessons (fkIdCourse, title, description, content, sortOrder, isPublished) VALUES
  (@cid, N'1. Этапы проекта', N'От темы до защиты', N'Календарное планирование проекта...', 1, 1);
  SELECT @lid = pkIdLesson FROM tbLessons WHERE fkIdCourse = @cid AND sortOrder = 1;
  INSERT INTO tbTasks (fkIdTypeTasks, fkIdCourse, fkIdLesson, title, description, deadline, maxScore, sortOrder) VALUES
  (2, @cid, @lid, N'Практика: Паспорт проекта', N'Заполнить шаблон паспорта', '2026-08-15', 100, 1);
END

-- Родители
SELECT @cid = pkIdCourse FROM tbCourses WHERE title = N'Взаимодействие с родителями' AND isDeleted = 0;
IF @cid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM tbLessons WHERE fkIdCourse = @cid)
BEGIN
  INSERT INTO tbLessons (fkIdCourse, title, description, content, sortOrder, isPublished) VALUES
  (@cid, N'1. Диалог с родителями', N'Форматы общения', N'Собрания, чаты, индивидуальные беседы...', 1, 1);
  SELECT @lid = pkIdLesson FROM tbLessons WHERE fkIdCourse = @cid AND sortOrder = 1;
  INSERT INTO tbTasks (fkIdTypeTasks, fkIdCourse, fkIdLesson, title, description, deadline, maxScore, sortOrder) VALUES
  (3, @cid, @lid, N'Теория: Сложные ситуации', N'Разбор кейсов', '2026-06-10', 100, 1);
END
GO

--#region Попытки (разные статусы для отчётов)
INSERT INTO tbAttempt (fkIdTask, fkIdListener, fkIdStatusAttempt, submittedAt, answerText, score)
SELECT t.pkIdTask, u.pkIdUser, a.st, a.sub, a.txt, a.sc
FROM (VALUES
  (N'Теория: Цифровой этикет', N'listener_kovaleva', 2, '2026-04-10 12:00:00', N'Конспект выполнен', 92),
  (N'Теория: Цифровой этикет', N'listener_sokolov', 1, '2026-04-12 09:00:00', N'Черновик ответа', NULL),
  (N'Практика: Чек-лист безопасности', N'listener_zaitseva', 4, '2026-04-15 14:00:00', N'Нужно добавить пункт про Wi-Fi', 70),
  (N'Теория: Принципы инклюзии', N'listener_novikova', 2, '2026-05-01 11:00:00', N'Ответ по модулю', 88),
  (N'Теория: Принципы инклюзии', N'listener_belova', 2, '2026-05-02 10:30:00', N'Все вопросы', 95),
  (N'Практика: План эвакуации', N'listener_pavlov', 1, '2026-05-20 16:00:00', N'Схема кабинета 204', NULL),
  (N'Практика: Паспорт проекта', N'listener_orlova', 2, '2026-06-01 13:00:00', N'Проект «Экология школы»', 90),
  (N'Теория: Сложные ситуации', N'listener4', 2, '2026-05-15 08:00:00', N'Кейс 1–3', 85)
) AS a(ttitle, llogin, st, sub, txt, sc)
JOIN tbTasks t ON t.title = a.ttitle AND t.isDeleted = 0
JOIN tbUsers u ON u.login = a.llogin AND u.isDeleted = 0
WHERE NOT EXISTS (
  SELECT 1 FROM tbAttempt x
  WHERE x.fkIdTask = t.pkIdTask AND x.fkIdListener = u.pkIdUser AND x.isDeleted = 0
    AND x.fkIdStatusAttempt IN (1, 2, 4)
);
GO

--#region Шаблоны сертификатов для новых курсов
INSERT INTO tbCertificateTemplates (fkIdCourse, name, templateHtml, minScorePercent, isActive)
SELECT c.pkIdCourse, N'Сертификат: ' + LEFT(c.title, 60),
  N'<html><body><h1>Сертификат</h1><p>{{name}}</p><p>{{course}}</p></body></html>', 60, 1
FROM tbCourses c
WHERE c.isDeleted = 0
  AND c.title IN (
    N'Цифровая грамотность педагога',
    N'Инклюзивное образование: практика',
    N'Первая помощь и безопасность на занятиях',
    N'Методика проектного обучения',
    N'Взаимодействие с родителями'
  )
  AND NOT EXISTS (
    SELECT 1 FROM tbCertificateTemplates ct
    WHERE ct.fkIdCourse = c.pkIdCourse AND ct.isDeleted = 0 AND ct.isActive = 1
  );
GO

PRINT N'Дополнительные данные SeedExtendedData.sql применены.';
GO
