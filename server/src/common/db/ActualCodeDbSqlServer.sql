USE master
GO

--ALTER DATABASE dbTestDip SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
DROP DATABASE IF EXISTS dbDiplom
GO

USE master
GO

CREATE DATABASE dbDiplom;
GO

USE dbDiplom;
GO

/*
  ОСНОВНОЙ СКРИПТ БД (единственный источник правды для развёртывания).
  Создаёт БД dbDiplom, таблицы, процедуры и тестовые данные.

  Важно для NestJS / Next.js-клиента (актуальные поля в SELECT):
  - prGetAttemptsWithUsersAndStatus — fkIdTask, fkIdListener, fkIdLesson, fkIdCourse (= COALESCE(t.fkIdCourse, l.fkIdCourse)), answerText, answerFileUrl
  - prGetTasksWithTypesAndLessons — fkIdCourse, fkIdLesson, typeId (fkIdTypeTasks), fkIdTest, sortOrder
  - prGetGroupListenersWithUserInfo — fkIdGroup, fkIdListener, fkIdCourse

  На уже существующей БД достаточно выполнить только изменённые CREATE OR ALTER PROCEDURE из этого файла.
*/

--#region ===== СПРАВОЧНИКИ =====
-- Таблицы без внешних ключей
IF EXISTS (SELECT * FROM dbo.sysobjects WHERE id = OBJECT_ID('tbPositions')) DROP TABLE tbPositions;
GO
CREATE TABLE tbPositions(
    pkIdPosition INT NOT NULL IDENTITY (1,1),
    name VARCHAR(100) UNIQUE NOT NULL,
    CONSTRAINT pos_pk PRIMARY KEY (pkIdPosition)
);
GO

IF EXISTS (SELECT * FROM dbo.sysobjects WHERE id = OBJECT_ID('tbRoles')) DROP TABLE tbRoles;
GO
CREATE TABLE tbRoles(
    pkIdRole INT NOT NULL IDENTITY (1,1),
    name VARCHAR(30) UNIQUE NOT NULL,
    CONSTRAINT ro_pk PRIMARY KEY (pkIdRole)
);
GO

IF EXISTS (SELECT * FROM dbo.sysobjects WHERE id = OBJECT_ID('tbTags')) DROP TABLE tbTags;
GO
CREATE TABLE tbTags(
    pkIdTag INT NOT NULL IDENTITY (1,1),
    name VARCHAR(50) UNIQUE NOT NULL,
    CONSTRAINT tag_pk PRIMARY KEY (pkIdTag)
);
GO
CREATE INDEX idx_tags_name ON tbTags(name);
GO

IF EXISTS (SELECT * FROM dbo.sysobjects WHERE id = OBJECT_ID('tbStatusCourses')) DROP TABLE tbStatusCourses;
GO
CREATE TABLE tbStatusCourses(
    pkIdStatusCourse INT NOT NULL IDENTITY (1,1),
    name VARCHAR(30) UNIQUE NOT NULL,
    CONSTRAINT sc_pk PRIMARY KEY (pkIdStatusCourse)
);
GO

IF EXISTS (SELECT * FROM dbo.sysobjects WHERE id = OBJECT_ID('tbStatusAttempt')) DROP TABLE tbStatusAttempt;
GO
CREATE TABLE tbStatusAttempt(
    pkIdStatusAttempt INT NOT NULL IDENTITY (1,1),
    name VARCHAR(30) UNIQUE NOT NULL,
    CONSTRAINT sa_pk PRIMARY KEY (pkIdStatusAttempt)
);
GO

IF EXISTS (SELECT * FROM dbo.sysobjects WHERE id = OBJECT_ID('tbTypeTasks')) DROP TABLE tbTypeTasks;
GO
CREATE TABLE tbTypeTasks(
    pkIdTypeTask INT NOT NULL IDENTITY (1,1),
    name VARCHAR(30) UNIQUE NOT NULL,
    CONSTRAINT tt_pk PRIMARY KEY (pkIdTypeTask)
);
GO

IF EXISTS (SELECT * FROM dbo.sysobjects WHERE id = OBJECT_ID('tbTypeMaterials')) DROP TABLE tbTypeMaterials;
GO
CREATE TABLE tbTypeMaterials(
    pkIdTypeMaterial INT NOT NULL IDENTITY (1,1),
    name VARCHAR(30) UNIQUE NOT NULL,
    CONSTRAINT tm_pk PRIMARY KEY (pkIdTypeMaterial)
);
GO
--#endregion

--#region ===== ТАБЛИЦЫ ПЕРВОГО УРОВНЯ =====
-- Таблицы, зависящие только от справочников
IF EXISTS (SELECT * FROM dbo.sysobjects WHERE id = OBJECT_ID('tbUsers')) DROP TABLE tbUsers;
GO
CREATE TABLE tbUsers(
    pkIdUser INT NOT NULL IDENTITY (1,1),
    fkIdRole INT NULL,
    fkIdPosition INT NULL,
    fullName VARCHAR(100) NULL,
    login VARCHAR(30) UNIQUE NULL,
    email VARCHAR(50) UNIQUE NULL,
    phone VARCHAR(15) NULL,
    passwordHash VARCHAR(255) NULL,
    regData DATETIME2 DEFAULT GETDATE(),
    isDeleted BIT DEFAULT 0,
    CONSTRAINT us_pk PRIMARY KEY (pkIdUser),
    CONSTRAINT us_fk_role FOREIGN KEY (fkIdRole) REFERENCES tbRoles(pkIdRole) ON DELETE NO ACTION,
    CONSTRAINT us_fk_position FOREIGN KEY (fkIdPosition) REFERENCES tbPositions(pkIdPosition) ON DELETE SET NULL
);
GO
CREATE INDEX idx_users_role ON tbUsers(fkIdRole);
CREATE INDEX idx_users_deleted ON tbUsers(isDeleted);
CREATE INDEX idx_users_position ON tbUsers(fkIdPosition);
GO

IF EXISTS (SELECT * FROM dbo.sysobjects WHERE id = OBJECT_ID('tbCourses')) DROP TABLE tbCourses;
GO
CREATE TABLE tbCourses(
    pkIdCourse INT NOT NULL IDENTITY (1,1),
    fkIdStatus INT NULL,
    title VARCHAR(255) UNIQUE NULL,
    description NVARCHAR(MAX) NULL,
    startDate DATETIME2 NULL,
    endDate DATETIME2 NULL,
    isDeleted BIT DEFAULT 0,
    CONSTRAINT co_pk PRIMARY KEY (pkIdCourse),
    CONSTRAINT co_fk_status FOREIGN KEY (fkIdStatus) REFERENCES tbStatusCourses(pkIdStatusCourse) ON DELETE NO ACTION,
    CONSTRAINT co_chk_dates CHECK (endDate IS NULL OR startDate IS NULL OR endDate > startDate)
);
GO
CREATE INDEX idx_courses_status ON tbCourses(fkIdStatus);
CREATE INDEX idx_courses_deleted ON tbCourses(isDeleted);
GO
--#endregion

--#region ===== ТАБЛИЦЫ ВТОРОГО УРОВНЯ =====
-- Таблицы, зависящие от таблиц первого уровня
IF EXISTS (SELECT * FROM dbo.sysobjects WHERE id = OBJECT_ID('tbCourseTags')) DROP TABLE tbCourseTags;
GO
CREATE TABLE tbCourseTags(
    pkIdCourseTag INT NOT NULL IDENTITY (1,1),
    fkIdCourse INT NOT NULL,
    fkIdTag INT NOT NULL,
    CONSTRAINT ctag_pk PRIMARY KEY (pkIdCourseTag),
    CONSTRAINT ctag_uq UNIQUE (fkIdCourse, fkIdTag),
    CONSTRAINT ctag_fk_course FOREIGN KEY (fkIdCourse) REFERENCES tbCourses(pkIdCourse) ON DELETE CASCADE,
    CONSTRAINT ctag_fk_tag FOREIGN KEY (fkIdTag) REFERENCES tbTags(pkIdTag) ON DELETE CASCADE
);
GO
CREATE INDEX idx_coursetags_course ON tbCourseTags(fkIdCourse);
CREATE INDEX idx_coursetags_tag ON tbCourseTags(fkIdTag);
GO

IF EXISTS (SELECT * FROM dbo.sysobjects WHERE id = OBJECT_ID('tbCourseTeacher')) DROP TABLE tbCourseTeacher;
GO
CREATE TABLE tbCourseTeacher(
    pkIdCourseTeacher INT NOT NULL IDENTITY (1,1),
    fkIdCourse INT NOT NULL,
    fkIdTeacher INT NOT NULL,
    assignedAt DATETIME2 DEFAULT GETDATE(),
    isDeleted BIT DEFAULT 0,
    CONSTRAINT ct_pk PRIMARY KEY (pkIdCourseTeacher),
    CONSTRAINT ct_uq UNIQUE (fkIdCourse, fkIdTeacher),
    CONSTRAINT ct_fk_course FOREIGN KEY (fkIdCourse) REFERENCES tbCourses(pkIdCourse) ON DELETE CASCADE,
    CONSTRAINT ct_fk_teacher FOREIGN KEY (fkIdTeacher) REFERENCES tbUsers(pkIdUser) ON DELETE CASCADE
);
GO
CREATE INDEX idx_courseteacher_course ON tbCourseTeacher(fkIdCourse);
CREATE INDEX idx_courseteacher_teacher ON tbCourseTeacher(fkIdTeacher);
CREATE INDEX idx_courseteacher_deleted ON tbCourseTeacher(isDeleted);
GO

IF EXISTS (SELECT * FROM dbo.sysobjects WHERE id = OBJECT_ID('tbLessons')) DROP TABLE tbLessons;
GO
CREATE TABLE tbLessons(
    pkIdLesson INT NOT NULL IDENTITY (1,1),
    fkIdCourse INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description NVARCHAR(MAX) NULL,
    content NVARCHAR(MAX) NULL,
    sortOrder INT DEFAULT 0,
    isPublished BIT DEFAULT 0,
    createdAt DATETIME2 DEFAULT GETDATE(),
    isDeleted BIT DEFAULT 0,
    CONSTRAINT le_pk PRIMARY KEY (pkIdLesson),
    CONSTRAINT le_fk_course FOREIGN KEY (fkIdCourse) REFERENCES tbCourses(pkIdCourse) ON DELETE CASCADE
);
GO
CREATE INDEX idx_lessons_course ON tbLessons(fkIdCourse);
CREATE INDEX idx_lessons_order ON tbLessons(sortOrder);
CREATE INDEX idx_lessons_deleted ON tbLessons(isDeleted);
GO

IF EXISTS (SELECT * FROM dbo.sysobjects WHERE id = OBJECT_ID('tbGroup')) DROP TABLE tbGroup;
GO
CREATE TABLE tbGroup(
    pkIdGroup INT NOT NULL IDENTITY (1,1),
    fkIdCourse INT NULL,
    fkIdCurator INT NULL,
    name VARCHAR(100) UNIQUE NOT NULL DEFAULT 'Без названия',
    isDeleted BIT DEFAULT 0,
    CONSTRAINT gr_pk PRIMARY KEY (pkIdGroup),
    CONSTRAINT gr_fk_course FOREIGN KEY (fkIdCourse) REFERENCES tbCourses(pkIdCourse) ON DELETE CASCADE,
    CONSTRAINT gr_fk_curator FOREIGN KEY (fkIdCurator) REFERENCES tbUsers(pkIdUser) ON DELETE SET NULL
);
GO
CREATE INDEX idx_group_course ON tbGroup(fkIdCourse);
CREATE INDEX idx_group_curator ON tbGroup(fkIdCurator);
CREATE INDEX idx_group_deleted ON tbGroup(isDeleted);
GO

IF EXISTS (SELECT * FROM dbo.sysobjects WHERE id = OBJECT_ID('tbTest')) DROP TABLE tbTest;
GO
CREATE TABLE tbTest(
    pkIdTest INT NOT NULL IDENTITY (1,1),
    timeLimitMinutes INT NULL,
    shuffleQuestions BIT DEFAULT 0,
    maxAttempts INT DEFAULT 1,
    showResults BIT DEFAULT 1,
    passingScorePercent INT DEFAULT 60 CHECK (passingScorePercent BETWEEN 0 AND 100),
    isDeleted BIT DEFAULT 0,
    CONSTRAINT test_pk PRIMARY KEY (pkIdTest)
);
GO
CREATE INDEX idx_test_pk ON tbTest(pkIdTest);
GO
--#endregion

--#region ===== ТАБЛИЦЫ ТРЕТЬЕГО УРОВНЯ =====
-- Таблицы, зависящие от таблиц второго уровня
IF EXISTS (SELECT * FROM dbo.sysobjects WHERE id = OBJECT_ID('tbGroupListener')) DROP TABLE tbGroupListener;
GO
CREATE TABLE tbGroupListener(
    pkIdGroupListener INT NOT NULL IDENTITY (1,1),
    fkIdGroup INT NULL,
    fkIdListener INT NULL,
    isDeleted BIT DEFAULT 0,
    CONSTRAINT gl_pk PRIMARY KEY (pkIdGroupListener),
    CONSTRAINT gl_uq UNIQUE (fkIdGroup, fkIdListener),
    CONSTRAINT gl_fk_group FOREIGN KEY (fkIdGroup) REFERENCES tbGroup(pkIdGroup) ON DELETE CASCADE,
    CONSTRAINT gl_fk_listener FOREIGN KEY (fkIdListener) REFERENCES tbUsers(pkIdUser) ON DELETE CASCADE
);
GO
CREATE INDEX idx_grouplistener_group ON tbGroupListener(fkIdGroup);
CREATE INDEX idx_grouplistener_listener ON tbGroupListener(fkIdListener);
CREATE INDEX idx_grouplistener_deleted ON tbGroupListener(isDeleted);
GO

IF EXISTS (SELECT * FROM dbo.sysobjects WHERE id = OBJECT_ID('tbTasks')) DROP TABLE tbTasks;
GO
CREATE TABLE tbTasks(
    pkIdTask INT NOT NULL IDENTITY (1,1),
    fkIdTypeTasks INT NULL,
    fkIdCourse INT NULL,
    fkIdLesson INT NULL,
    fkIdTest INT NULL,
    title VARCHAR(255) NULL,
    description NVARCHAR(MAX) NULL,
    content NVARCHAR(MAX) NULL,
    contentFileUrl VARCHAR(255) NULL,
    deadline DATETIME2 NULL,
    maxScore INT DEFAULT 100,
    sortOrder INT DEFAULT 0,
    isDeleted BIT DEFAULT 0,
    CONSTRAINT ta_pk PRIMARY KEY (pkIdTask),
    CONSTRAINT ta_fk_type FOREIGN KEY (fkIdTypeTasks) REFERENCES tbTypeTasks(pkIdTypeTask) ON DELETE NO ACTION,
    CONSTRAINT ta_fk_course FOREIGN KEY (fkIdCourse) REFERENCES tbCourses(pkIdCourse) ON DELETE CASCADE,
    CONSTRAINT ta_fk_lesson FOREIGN KEY (fkIdLesson) REFERENCES tbLessons(pkIdLesson) ON DELETE NO ACTION,
    CONSTRAINT ta_fk_test FOREIGN KEY (fkIdTest) REFERENCES tbTest(pkIdTest) ON DELETE SET NULL
);
GO
CREATE INDEX idx_tasks_course ON tbTasks(fkIdCourse);
CREATE INDEX idx_tasks_lesson ON tbTasks(fkIdLesson);
CREATE INDEX idx_tasks_type ON tbTasks(fkIdTypeTasks);
CREATE INDEX idx_tasks_test ON tbTasks(fkIdTest);
CREATE INDEX idx_tasks_order ON tbTasks(sortOrder);
CREATE INDEX idx_tasks_deleted ON tbTasks(isDeleted);
GO

IF EXISTS (SELECT * FROM dbo.sysobjects WHERE id = OBJECT_ID('tbMaterial')) DROP TABLE tbMaterial;
GO
CREATE TABLE tbMaterial(
    pkIdMaterial INT NOT NULL IDENTITY (1,1),
    fkIdCourse INT NULL,
    fkIdLesson INT NULL,
    fkIdTypeMaterial INT NULL,
    title VARCHAR(255) NULL,
    description NVARCHAR(MAX) NULL,
    fileUrl VARCHAR(255) NULL,
    link VARCHAR(255) NULL,
    sortOrder INT DEFAULT 0,
    isAdditional BIT DEFAULT 0,
    isDeleted BIT DEFAULT 0,
    CONSTRAINT ma_pk PRIMARY KEY (pkIdMaterial),
    CONSTRAINT ma_fk_course FOREIGN KEY (fkIdCourse) REFERENCES tbCourses(pkIdCourse) ON DELETE CASCADE,
    CONSTRAINT ma_fk_lesson FOREIGN KEY (fkIdLesson) REFERENCES tbLessons(pkIdLesson) ON DELETE NO ACTION,
    CONSTRAINT ma_fk_type FOREIGN KEY (fkIdTypeMaterial) REFERENCES tbTypeMaterials(pkIdTypeMaterial) ON DELETE NO ACTION
);
GO
CREATE INDEX idx_material_course ON tbMaterial(fkIdCourse);
CREATE INDEX idx_material_lesson ON tbMaterial(fkIdLesson);
CREATE INDEX idx_material_type ON tbMaterial(fkIdTypeMaterial);
CREATE INDEX idx_material_order ON tbMaterial(sortOrder);
CREATE INDEX idx_material_deleted ON tbMaterial(isDeleted);
GO

IF EXISTS (SELECT * FROM dbo.sysobjects WHERE id = OBJECT_ID('tbTestQuestions')) DROP TABLE tbTestQuestions;
GO
CREATE TABLE tbTestQuestions(
    pkIdQuestion INT NOT NULL IDENTITY (1,1),
    fkIdTest INT NOT NULL,
    questionText NVARCHAR(MAX) NOT NULL,
    sortOrder INT DEFAULT 0,
    score INT DEFAULT 1,
    isDeleted BIT DEFAULT 0,
    CONSTRAINT tq_pk PRIMARY KEY (pkIdQuestion),
    CONSTRAINT tq_fk_test FOREIGN KEY (fkIdTest) REFERENCES tbTest(pkIdTest) ON DELETE CASCADE
);
GO
CREATE INDEX idx_testquestions_test ON tbTestQuestions(fkIdTest);
CREATE INDEX idx_testquestions_order ON tbTestQuestions(sortOrder);
GO
--#endregion

--#region ===== ТАБЛИЦЫ ЧЕТВЁРТОГО УРОВНЯ =====
-- Таблицы, зависящие от таблиц третьего уровня
IF EXISTS (SELECT * FROM dbo.sysobjects WHERE id = OBJECT_ID('tbTestOptions')) DROP TABLE tbTestOptions;
GO
CREATE TABLE tbTestOptions(
    pkIdOption INT NOT NULL IDENTITY (1,1),
    fkIdQuestion INT NOT NULL,
    optionText NVARCHAR(500) NOT NULL,
    isCorrect BIT DEFAULT 0,
    sortOrder INT DEFAULT 0,
    isDeleted BIT DEFAULT 0,
    CONSTRAINT to_pk PRIMARY KEY (pkIdOption),
    CONSTRAINT to_fk_question FOREIGN KEY (fkIdQuestion) REFERENCES tbTestQuestions(pkIdQuestion) ON DELETE CASCADE
);
GO
CREATE INDEX idx_testoptions_question ON tbTestOptions(fkIdQuestion);
GO

IF EXISTS (SELECT * FROM dbo.sysobjects WHERE id = OBJECT_ID('tbAttempt')) DROP TABLE tbAttempt;
GO
CREATE TABLE tbAttempt(
    pkIdAttempt INT NOT NULL IDENTITY (1,1),
    fkIdTask INT NULL,
    fkIdListener INT NULL,
    fkIdStatusAttempt INT NULL,
    submittedAt DATETIME2 DEFAULT GETDATE(),
    answerText NVARCHAR(MAX) NULL,
    answerFileUrl VARCHAR(255) NULL,
    score INT NULL,
    isDeleted BIT DEFAULT 0,
    CONSTRAINT at_pk PRIMARY KEY (pkIdAttempt),
    CONSTRAINT at_fk_task FOREIGN KEY (fkIdTask) REFERENCES tbTasks(pkIdTask) ON DELETE CASCADE,
    CONSTRAINT at_fk_listener FOREIGN KEY (fkIdListener) REFERENCES tbUsers(pkIdUser) ON DELETE CASCADE,
    CONSTRAINT at_fk_status FOREIGN KEY (fkIdStatusAttempt) REFERENCES tbStatusAttempt(pkIdStatusAttempt) ON DELETE SET NULL
);
GO
CREATE INDEX idx_attempt_task ON tbAttempt(fkIdTask);
CREATE INDEX idx_attempt_listener ON tbAttempt(fkIdListener);
CREATE INDEX idx_attempt_status ON tbAttempt(fkIdStatusAttempt);
CREATE INDEX idx_attempt_deleted ON tbAttempt(isDeleted);
GO
--#endregion

--#region ===== ТАБЛИЦЫ ПЯТОГО УРОВНЯ =====
-- Таблицы, зависящие от таблиц четвёртого уровня
IF EXISTS (SELECT * FROM dbo.sysobjects WHERE id = OBJECT_ID('tbTestAnswers')) DROP TABLE tbTestAnswers;
GO
CREATE TABLE tbTestAnswers(
    pkIdTestAnswer INT NOT NULL IDENTITY (1,1),
    fkIdAttempt INT NOT NULL,
    fkIdQuestion INT NOT NULL,
    fkIdSelectedOption INT NOT NULL,
    answeredAt DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT tans_pk PRIMARY KEY (pkIdTestAnswer),
    CONSTRAINT tans_uq UNIQUE (fkIdAttempt, fkIdQuestion),
    CONSTRAINT tans_fk_attempt FOREIGN KEY (fkIdAttempt) REFERENCES tbAttempt(pkIdAttempt) ON DELETE CASCADE,
    CONSTRAINT tans_fk_question FOREIGN KEY (fkIdQuestion) REFERENCES tbTestQuestions(pkIdQuestion) ON DELETE NO ACTION,
    CONSTRAINT tans_fk_option FOREIGN KEY (fkIdSelectedOption) REFERENCES tbTestOptions(pkIdOption) ON DELETE NO ACTION
);
GO
CREATE INDEX idx_testanswers_attempt ON tbTestAnswers(fkIdAttempt);
GO
ALTER TABLE tbTestAnswers ADD isDeleted BIT DEFAULT 0;
go

IF EXISTS (SELECT * FROM dbo.sysobjects WHERE id = OBJECT_ID('tbComment')) DROP TABLE tbComment;
GO
CREATE TABLE tbComment(
    pkIdComment INT NOT NULL IDENTITY (1,1),
    fkIdTask INT NULL,
    fkIdAttempt INT NULL,
    fkIdUser INT NOT NULL,
    message NVARCHAR(MAX) NOT NULL,
    createdAt DATETIME2 DEFAULT GETDATE(),
    isDeleted BIT DEFAULT 0,
    CONSTRAINT cm_pk PRIMARY KEY (pkIdComment),
    CONSTRAINT cm_chk_target CHECK (
        (fkIdTask IS NOT NULL AND fkIdAttempt IS NULL) OR
        (fkIdTask IS NULL AND fkIdAttempt IS NOT NULL)
    ),
    CONSTRAINT cm_fk_task FOREIGN KEY (fkIdTask) REFERENCES tbTasks(pkIdTask) ON DELETE NO ACTION,
    CONSTRAINT cm_fk_attempt FOREIGN KEY (fkIdAttempt) REFERENCES tbAttempt(pkIdAttempt) ON DELETE NO ACTION,
    CONSTRAINT cm_fk_user FOREIGN KEY (fkIdUser) REFERENCES tbUsers(pkIdUser) ON DELETE NO ACTION
);
GO
CREATE INDEX idx_comment_task ON tbComment(fkIdTask);
CREATE INDEX idx_comment_attempt ON tbComment(fkIdAttempt);
CREATE INDEX idx_comment_user ON tbComment(fkIdUser);
CREATE INDEX idx_comment_deleted ON tbComment(isDeleted);
GO
--#endregion

--#region ===== ТАБЛИЦЫ ШЕСТОГО УРОВНЯ =====
-- Таблицы, зависящие от таблиц пятого уровня
IF EXISTS (SELECT * FROM dbo.sysobjects WHERE id = OBJECT_ID('tbMessage')) DROP TABLE tbMessage;
GO
CREATE TABLE tbMessage(
    pkIdMessage INT NOT NULL IDENTITY (1,1),
    fkIdSender INT NULL,
    fkIdReceiver INT NULL,
    message NVARCHAR(MAX) NOT NULL,
    isRead BIT DEFAULT 0,
    createdAt DATETIME2 DEFAULT GETDATE(),
    isDeleted BIT DEFAULT 0,
    CONSTRAINT ms_pk PRIMARY KEY (pkIdMessage),
    CONSTRAINT ms_fk_sender FOREIGN KEY (fkIdSender) REFERENCES tbUsers(pkIdUser) ON DELETE NO ACTION,
    CONSTRAINT ms_fk_receiver FOREIGN KEY (fkIdReceiver) REFERENCES tbUsers(pkIdUser) ON DELETE NO ACTION
);
GO
CREATE INDEX idx_message_sender ON tbMessage(fkIdSender);
CREATE INDEX idx_message_receiver ON tbMessage(fkIdReceiver);
CREATE INDEX idx_message_read ON tbMessage(isRead);
CREATE INDEX idx_message_deleted ON tbMessage(isDeleted);
GO

IF EXISTS (SELECT * FROM dbo.sysobjects WHERE id = OBJECT_ID('tbNotification')) DROP TABLE tbNotification;
GO
CREATE TABLE tbNotification(
    pkIdNotification INT NOT NULL IDENTITY (1,1),
    fkIdUser INT NULL,
    message VARCHAR(527) NULL,
    isRead BIT DEFAULT 0,
    createdAt DATETIME2 DEFAULT GETDATE(),
    isDeleted BIT DEFAULT 0,
    CONSTRAINT nt_pk PRIMARY KEY (pkIdNotification),
    CONSTRAINT nt_fk_user FOREIGN KEY (fkIdUser) REFERENCES tbUsers(pkIdUser) ON DELETE CASCADE
);
GO
CREATE INDEX idx_notif_user ON tbNotification(fkIdUser);
CREATE INDEX idx_notif_deleted ON tbNotification(isDeleted);
GO

IF EXISTS (SELECT * FROM dbo.sysobjects WHERE id = OBJECT_ID('tbAdminLog')) DROP TABLE tbAdminLog;
GO
CREATE TABLE tbAdminLog(
    pkIdLog INT NOT NULL IDENTITY (1,1),
    fkIdAdminUser INT NULL,
    actionTime DATETIME2 DEFAULT GETDATE(),
    tableName VARCHAR(50) NULL,
    action VARCHAR(20) NULL,
    oldData NVARCHAR(MAX) NULL,
    newData NVARCHAR(MAX) NULL,
    CONSTRAINT al_pk PRIMARY KEY (pkIdLog),
    CONSTRAINT al_fk_admin FOREIGN KEY (fkIdAdminUser) REFERENCES tbUsers(pkIdUser) ON DELETE SET NULL
);
GO
CREATE INDEX idx_log_time ON tbAdminLog(actionTime);
CREATE INDEX idx_log_table ON tbAdminLog(tableName);
CREATE INDEX idx_log_admin ON tbAdminLog(fkIdAdminUser);
GO
--#endregion

--#region ===== СЕРТИФИКАТЫ =====
IF EXISTS (SELECT * FROM dbo.sysobjects WHERE id = OBJECT_ID('tbCertificateTemplates')) DROP TABLE tbCertificateTemplates;
GO
CREATE TABLE tbCertificateTemplates(
    pkIdTemplate INT NOT NULL IDENTITY (1,1),
    fkIdCourse INT NULL,
    name VARCHAR(100) NOT NULL,
    templateHtml NVARCHAR(MAX) NOT NULL,
    minScorePercent INT DEFAULT 60,
    isActive BIT DEFAULT 1,
    isDeleted BIT DEFAULT 0,
    CONSTRAINT ctte_pk PRIMARY KEY (pkIdTemplate),
    CONSTRAINT ctte_fk_course FOREIGN KEY (fkIdCourse) REFERENCES tbCourses(pkIdCourse) ON DELETE CASCADE,
    CONSTRAINT ctte_chk_score CHECK (minScorePercent BETWEEN 0 AND 100)
);
CREATE UNIQUE INDEX IX_Certificate_Listener_Course_Active 
ON tbCertificate(fkIdListener, fkIdCourse) 
WHERE isDeleted = 0;
GO

IF EXISTS (SELECT * FROM dbo.sysobjects WHERE id = OBJECT_ID('tbCertificate')) DROP TABLE tbCertificate;
GO
CREATE TABLE tbCertificate(
    pkIdCertificate INT NOT NULL IDENTITY (1,1),
    fkIdListener INT NOT NULL,
    fkIdCourse INT NOT NULL,
    fkIdTemplate INT NOT NULL,
    issuedAt DATETIME2 DEFAULT GETDATE(),
    pdfUrl VARCHAR(255) NULL,
    isDeleted BIT DEFAULT 0,
    CONSTRAINT cert_pk PRIMARY KEY (pkIdCertificate),
    CONSTRAINT cert_fk_listener FOREIGN KEY (fkIdListener) REFERENCES tbUsers(pkIdUser) ON DELETE NO ACTION,
    CONSTRAINT cert_fk_course FOREIGN KEY (fkIdCourse) REFERENCES tbCourses(pkIdCourse) ON DELETE NO ACTION,
    CONSTRAINT cert_fk_template FOREIGN KEY (fkIdTemplate) REFERENCES tbCertificateTemplates(pkIdTemplate) ON DELETE NO ACTION
);
GO
--#endregion

--#region ===== СПРАВОЧНИКИ =====
INSERT INTO tbRoles (name) VALUES
('Администратор'),
('Преподаватель'),
('Слушатель');

INSERT INTO tbTags (name) VALUES
('Информатика'),
('Математика'),
('Физика'),
('Русский язык'),
('Английский язык'),
('Психология'),
('Педагогика'),
('Методика преподавания'),
('Базовый'),
('Продвинутый'),
('ГОСТ'),
('Microsoft Office');

INSERT INTO tbPositions (name) VALUES
('Учитель информатики'),
('Учитель математики'),
('Учитель физики'),
('Учитель русского языка'),
('Учитель английского языка'),
('Учитель психологии'),
('Учитель начальных классов'),
('Методист');

INSERT INTO tbStatusCourses (name) VALUES
('Черновик'),
('Опубликован'),
('Архивирован');

INSERT INTO tbStatusAttempt (name) VALUES
('На проверке'),
('Принято'),
('Отклонено'),
('На доработке');

INSERT INTO tbTypeTasks (name) VALUES
('Тест'),
('Практическое задание'),
('Теоретическое задание');

INSERT INTO tbTypeMaterials (name) VALUES
('Видео'),
('Презентация'),
('PDF-документ'),
('Ссылка');
--#endregion

--#region ===== ПОЛЬЗОВАТЕЛИ =====
-- Администраторы
INSERT INTO tbUsers (fkIdRole, fkIdPosition, fullName, login, email, phone, passwordHash) VALUES
(1, NULL, 'Иванов Иван Иванович', 'admin', 'admin@miro.by', '+375291111111', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy');

-- Преподаватели
INSERT INTO tbUsers (fkIdRole, fkIdPosition, fullName, login, email, phone, passwordHash) VALUES
(2, 1, 'Петров Петр Петрович', 'teacher_it', 'petrov@miro.by', '+375292222222', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'),
(2, 2, 'Сидорова Анна Владимировна', 'teacher_math', 'sidorova@miro.by', '+375293333333', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'),
(2, 6, 'Козлова Елена Сергеевна', 'teacher_psy', 'kozlova@miro.by', '+375294444444', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'),
(2, 8, 'Николаев Дмитрий Алексеевич', 'methodist', 'nikolaev@miro.by', '+375295555555', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy');

-- Слушатели
INSERT INTO tbUsers (fkIdRole, fkIdPosition, fullName, login, email, phone, passwordHash) VALUES
(3, 1, 'Алексеев Алексей Алексеевич', 'listener1', 'alexeev@mail.by', '+375296666666', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'),
(3, 1, 'Борисова Мария Ивановна', 'listener2', 'borisova@mail.by', '+375297777777', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'),
(3, 2, 'Васильев Виктор Петрович', 'listener3', 'vasiliev@mail.by', '+375298888888', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'),
(3, 6, 'Григорьева Ольга Дмитриевна', 'listener4', 'grigoreva@mail.by', '+375299999999', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy');
--#endregion

--#region ===== КУРСЫ =====
INSERT INTO tbCourses (fkIdStatus, title, description, startDate, endDate) VALUES
(2, 'Стандарты и ГОСТы: легко и просто', 'Курс по оформлению документации по ГОСТ. Для учителей всех специальностей.', '2026-03-01', '2026-04-30'),
(2, 'Microsoft Office для педагогов', 'Углубленное изучение Word, Excel, PowerPoint. Повышение эффективности работы.', '2026-03-15', '2026-05-15'),
(2, 'Психология общения в образовании', 'Методы эффективного общения с учениками и коллегами.', '2026-04-01', '2026-06-01'),
(1, 'Программирование на Python', 'Основы Python для учителей информатики. Черновик.', '2026-09-01', '2026-12-01');
--#endregion

--#region ===== СВЯЗИ КУРСОВ =====
-- Теги курсов
INSERT INTO tbCourseTags (fkIdCourse, fkIdTag) VALUES
(1, 11), -- ГОСТы → ГОСТ
(1, 9),  -- ГОСТы → Базовый
(2, 12), -- Office → Microsoft Office
(2, 1),  -- Office → Информатика
(2, 9),  -- Office → Базовый
(3, 6),  -- Психология → Психология
(3, 7),  -- Психология → Педагогика
(4, 1),  -- Python → Информатика
(4, 10); -- Python → Продвинутый

-- Преподаватели курсов
INSERT INTO tbCourseTeacher (fkIdCourse, fkIdTeacher) VALUES
(1, 4), -- ГОСТы → Николаев (методист)
(2, 2), -- Office → Петров (информатика)
(3, 3), -- Психология → Козлова (психолог)
(4, 2); -- Python → Петров (информатика)
--#endregion

-- Материалы для курса "Стандарты и ГОСТы: легко и просто"
INSERT INTO tbMaterial (fkIdCourse, fkIdLesson, fkIdTypeMaterial, title, description, fileUrl, link, sortOrder, isAdditional, isDeleted)
VALUES
(1, 1, 3, 'ГОСТ Р 7.0.97-2016', 'Основной документ по оформлению текстовых документов', '/materials/gost_7.0.97.pdf', NULL, 1, 0, 0),
(1, 1, 1, 'Введение в ГОСТы', 'Видеоурок по основам стандартов', '/materials/intro_gost.mp4', NULL, 2, 0, 0),
(1, 2, 3, 'Примеры титульных листов', 'Архив с примерами оформления титульных листов', '/materials/title_examples.zip', NULL, 1, 0, 0),
(1, 3, 4, 'Полезные ресурсы по ГОСТ', 'Ссылки на официальные сайты и методички', NULL, 'https://gost.ru', 1, 1, 0);

-- Материалы для курса "Microsoft Office для педагогов"
INSERT INTO tbMaterial (fkIdCourse, fkIdLesson, fkIdTypeMaterial, title, description, fileUrl, link, sortOrder, isAdditional, isDeleted)
VALUES
(2, 4, 2, 'Презентация по Word', 'Основные функции и возможности Microsoft Word', '/materials/word_presentation.pptx', NULL, 1, 0, 0),
(2, 4, 1, 'Видеоурок по Word', 'Расширенные возможности Microsoft Word', '/materials/word_advanced.mp4', NULL, 2, 0, 0),
(2, 5, 2, 'Презентация по Excel', 'Сводные таблицы и диаграммы в Excel', '/materials/excel_pivot.pptx', NULL, 1, 0, 0),
(2, 5, 3, 'Шаблоны Excel', 'Готовые шаблоны для анализа данных', '/materials/excel_templates.xlsx', NULL, 2, 0, 0),
(2, 6, 4, 'Шаблоны презентаций', 'Ссылка на коллекцию шаблонов PowerPoint', NULL, 'https://templates.office.com', 1, 1, 0);

-- Материалы для курса "Психология общения в образовании"
INSERT INTO tbMaterial (fkIdCourse, fkIdLesson, fkIdTypeMaterial, title, description, fileUrl, link, sortOrder, isAdditional, isDeleted)
VALUES
(3, 7, 3, 'Основы коммуникации', 'Учебное пособие по основам общения', '/materials/communication_basics.pdf', NULL, 1, 0, 0),
(3, 7, 1, 'Видеолекция по коммуникации', 'Лекция о стилях общения', '/materials/communication_lecture.mp4', NULL, 2, 0, 0),
(3, 8, 3, 'Конфликтология', 'Методическое пособие по управлению конфликтами', '/materials/conflict_management.pdf', NULL, 1, 0, 0),
(3, 8, 4, 'Тесты по психологии', 'Ссылка на онлайн-тесты по психологии общения', NULL, 'https://psychology-tests.ru', 1, 1, 0);

--#region ===== ГРУППЫ И СЛУШАТЕЛИ =====
-- Группы
INSERT INTO tbGroup (fkIdCourse, fkIdCurator, name) VALUES
(1, 4, 'Группа ГОСТ-2026-1'),
(2, 2, 'Группа Office-2026-1'),
(3, 3, 'Группа Психология-2026-1'),
(2, 2, 'Группа Office-2026-2');

-- Слушатели в группах
INSERT INTO tbGroupListener (fkIdGroup, fkIdListener) VALUES
(1, 5), -- Борисова → ГОСТы
(1, 6), -- Васильев → ГОСТы
(2, 5), -- Борисова → Office
(2, 7), -- Григорьева → Office
(3, 7), -- Григорьева → Психология
(4, 6); -- Васильев → Office (вторая группа)
--#endregion

--#region ===== УРОКИ =====
-- Курс "ГОСТы"
INSERT INTO tbLessons (fkIdCourse, title, description, content, sortOrder, isPublished) VALUES
(1, '1. Введение. Зачем нужны ГОСТы', 'Обзор стандартов документооборота', 'Дорогие коллеги! Когда мы говорим о стандартах документооборота...', 1, 1),
(1, '2. Оформление титульного листа', 'Требования к титульной странице', 'Титульный лист — лицо документа...', 2, 1),
(1, '3. Структура документа', 'Разделы, подразделы, пункты', 'Правильная структура облегчает восприятие...', 3, 1);

-- Курс "Office"
INSERT INTO tbLessons (fkIdCourse, title, description, content, sortOrder, isPublished) VALUES
(2, '1. Введение. Углубленное изучение пакета Word', 'Расширенные возможности Word', 'Microsoft Word — самый массовый инструмент...', 1, 1),
(2, '2. Углубленное изучение пакета Excel', 'Формулы, диаграммы, сводные таблицы', 'Excel — мощный инструмент для анализа данных...', 2, 1),
(2, '3. Углубленное изучение пакета PowerPoint', 'Создание эффективных презентаций', 'PowerPoint позволяет создавать запоминающиеся презентации...', 3, 0);

-- Курс "Психология"
INSERT INTO tbLessons (fkIdCourse, title, description, content, sortOrder, isPublished) VALUES
(3, '1. Основы коммуникации', 'Базовые принципы общения', 'Коммуникация — основа педагогической деятельности...', 1, 1),
(3, '2. Конфликтология', 'Управление конфликтами', 'Конфликты неизбежны, важно уметь их разрешать...', 2, 1);
--#endregion

--#region ===== ЗАДАНИЯ =====
-- Курс "ГОСТы" - Урок 1
INSERT INTO tbTasks (fkIdTypeTasks, fkIdCourse, fkIdLesson, title, description, deadline, maxScore, sortOrder) VALUES
(1, 1, 1, 'Тест: Основы ГОСТ 7.0.97-2016', 'Проверка знаний по стандарту оформления документов', '2026-03-15', 100, 1),
(2, 1, 1, 'Практическое: Оформить титульный лист', 'Создать титульный лист по ГОСТ', '2026-03-20', 100, 2);

-- Курс "ГОСТы" - Урок 2
INSERT INTO tbTasks (fkIdTypeTasks, fkIdCourse, fkIdLesson, title, description, deadline, maxScore, sortOrder) VALUES
(1, 1, 2, 'Тест: Структура документа', 'Вопросы по разделам и подразделам', '2026-03-25', 100, 1);

-- Курс "Office" - Урок 1
INSERT INTO tbTasks (fkIdTypeTasks, fkIdCourse, fkIdLesson, title, description, deadline, maxScore, sortOrder) VALUES
(1, 2, 4, 'Тест: Возможности Word', 'Проверка знаний расширенных функций Word', '2026-04-01', 50, 1),
(2, 2, 4, 'Практическое: Автоматическое оглавление', 'Создать документ с автособираемым оглавлением', '2026-04-05', 50, 2);

-- Курс "Office" - Урок 2
INSERT INTO tbTasks (fkIdTypeTasks, fkIdCourse, fkIdLesson, title, description, deadline, maxScore, sortOrder) VALUES
(2, 2, 5, 'Практическое: Сводная таблица', 'Создать сводную таблицу по данным', '2026-04-15', 100, 1);

-- Курс "Психология" - Урок 1
INSERT INTO tbTasks (fkIdTypeTasks, fkIdCourse, fkIdLesson, title, description, deadline, maxScore, sortOrder) VALUES
(1, 3, 7, 'Тест: Стили общения', 'Определение своего стиля общения', '2026-04-10', 100, 1);
--#endregion

--#region ===== ТЕСТЫ =====
INSERT INTO tbTest (timeLimitMinutes, shuffleQuestions, maxAttempts, showResults, passingScorePercent) VALUES
(30, 1, 3, 1, 60),   -- Тест ГОСТ 7.0.97
(20, 0, 2, 1, 70),   -- Тест структура документа
(25, 1, 3, 1, 60),   -- Тест Word
(15, 0, 2, 1, 50);   -- Тест стили общения

-- Обновляем tbTasks с fkIdTest
UPDATE tbTasks SET fkIdTest = 1 WHERE pkIdTask = 1;
UPDATE tbTasks SET fkIdTest = 2 WHERE pkIdTask = 3;
UPDATE tbTasks SET fkIdTest = 3 WHERE pkIdTask = 5;
UPDATE tbTasks SET fkIdTest = 4 WHERE pkIdTask = 7;
--#endregion

--#region ===== ВОПРОСЫ ТЕСТОВ =====
-- Тест 1: ГОСТ 7.0.97 (id=1)
INSERT INTO tbTestQuestions (fkIdTest, questionText, sortOrder, score) VALUES
(1, 'Какой шрифт и размер установлены ГОСТ Р 7.0.97-2016 для основного текста служебных документов?', 1, 10),
(1, 'Что произойдёт с автособираемым оглавлением при изменении текста заголовка в документе?', 2, 10),
(1, 'Какой отступ первой строки абзаца соответствует ГОСТу?', 3, 10),
(1, 'Для чего используется вкладка «Разработчик» в Word?', 4, 10);

-- Тест 2: Структура документа (id=2)
INSERT INTO tbTestQuestions (fkIdTest, questionText, sortOrder, score) VALUES
(2, 'Какой раздел должен идти после титульного листа?', 1, 10),
(2, 'Сколько уровней заголовков предусмотрено в ГОСТ?', 2, 10);

-- Тест 3: Word (id=3)
INSERT INTO tbTestQuestions (fkIdTest, questionText, sortOrder, score) VALUES
(3, 'Как создать автособираемое оглавление?', 1, 10),
(3, 'Что такое поля формы?', 2, 10);

-- Тест 4: Стили общения (id=4)
INSERT INTO tbTestQuestions (fkIdTest, questionText, sortOrder, score) VALUES
(4, 'Какой стиль общения наиболее эффективен в педагогике?', 1, 20),
(4, 'Что такое активное слушание?', 2, 20);
--#endregion

--#region ===== ВАРИАНТЫ ОТВЕТОВ =====
-- Вопрос 1 (ГОСТ шрифт)
INSERT INTO tbTestOptions (fkIdQuestion, optionText, isCorrect, sortOrder) VALUES
(1, 'Arial, 12 пт', 0, 1),
(1, 'Times New Roman, 14 пт', 1, 2),
(1, 'Calibri, 11 пт', 0, 3),
(1, 'Courier New, 12 пт', 0, 4);

-- Вопрос 2 (Оглавление)
INSERT INTO tbTestOptions (fkIdQuestion, optionText, isCorrect, sortOrder) VALUES
(2, 'Оглавление удалится', 0, 1),
(2, 'Оглавление обновится автоматически', 1, 2),
(2, 'Оглавление станет неактивным', 0, 3),
(2, 'Ничего, нужно обновлять вручную', 0, 4);

-- Вопрос 3 (Отступ)
INSERT INTO tbTestOptions (fkIdQuestion, optionText, isCorrect, sortOrder) VALUES
(3, '0,5 см', 0, 1),
(3, '1 см', 0, 2),
(3, '1,25 см', 1, 3),
(3, '1,5 см', 0, 4);

-- Вопрос 4 (Разработчик)
INSERT INTO tbTestOptions (fkIdQuestion, optionText, isCorrect, sortOrder) VALUES
(4, 'Только для программирования на VBA', 0, 1),
(4, 'Для создания шаблонов с полями форм и макросов', 1, 2),
(4, 'Для разработки игр', 0, 3),
(4, 'Для создания веб-страниц', 0, 4);

-- Вопрос 5 (Раздел после титульного)
INSERT INTO tbTestOptions (fkIdQuestion, optionText, isCorrect, sortOrder) VALUES
(5, 'Введение', 0, 1),
(5, 'Реферат', 1, 2),
(5, 'Содержание', 0, 3),
(5, 'Заключение', 0, 4);

-- Вопрос 6 (Уровни заголовков)
INSERT INTO tbTestOptions (fkIdQuestion, optionText, isCorrect, sortOrder) VALUES
(6, '2', 0, 1),
(6, '3', 0, 2),
(6, '4', 1, 3),
(6, '5', 0, 4);

-- Вопрос 7 (Автооглавление)
INSERT INTO tbTestOptions (fkIdQuestion, optionText, isCorrect, sortOrder) VALUES
(7, 'Вставка → Оглавление → Автособираемое', 1, 1),
(7, 'Файл → Создать → Оглавление', 0, 2),
(7, 'Главная → Стили → Оглавление', 0, 3),
(7, 'Вид → Навигация → Оглавление', 0, 4);

-- Вопрос 8 (Поля формы)
INSERT INTO tbTestOptions (fkIdQuestion, optionText, isCorrect, sortOrder) VALUES
(8, 'Элементы для ввода данных в шаблоне', 1, 1),
(8, 'Границы страницы', 0, 2),
(8, 'Колонтитулы', 0, 3),
(8, 'Рамки для текста', 0, 4);

-- Вопрос 9 (Стиль общения)
INSERT INTO tbTestOptions (fkIdQuestion, optionText, isCorrect, sortOrder) VALUES
(9, 'Авторитарный', 0, 1),
(9, 'Демократический', 1, 2),
(9, 'Либеральный', 0, 3),
(9, 'Агрессивный', 0, 4);

-- Вопрос 10 (Активное слушание)
INSERT INTO tbTestOptions (fkIdQuestion, optionText, isCorrect, sortOrder) VALUES
(10, 'Внимательное выслушивание с обратной связью', 1, 1),
(10, 'Простое молчание', 0, 2),
(10, 'Перебивание собеседника', 0, 3),
(10, 'Запись разговора', 0, 4);
--#endregion

--#region ===== ПОПЫТКИ И ОТВЕТЫ =====
-- Попытка 1: Слушатель 5 (Борисова) - Тест ГОСТ
INSERT INTO tbAttempt (fkIdTask, fkIdListener, fkIdStatusAttempt, submittedAt, score) VALUES
(1, 5, 2, '2026-03-10 14:30:00', 80);

-- Ответы на тест ГОСТ (попытка 1)
INSERT INTO tbTestAnswers (fkIdAttempt, fkIdQuestion, fkIdSelectedOption, answeredAt) VALUES
(1, 1, 2, '2026-03-10 14:25:00'),  -- Правильно (Times New Roman)
(1, 2, 2, '2026-03-10 14:26:00'),  -- Правильно (обновится автоматически)
(1, 3, 3, '2026-03-10 14:27:00'),  -- Правильно (1,25 см)
(1, 4, 2, '2026-03-10 14:28:00'); -- Правильно (для разработки шаблонов)

-- Попытка 2: Слушатель 5 (Борисова) - Практическое задание
INSERT INTO tbAttempt (fkIdTask, fkIdListener, fkIdStatusAttempt, submittedAt, answerFileUrl, score) VALUES
(2, 5, 1, '2026-03-12 10:15:00', '/attempts/title_borisova.docx', NULL);

-- Попытка 3: Слушатель 6 (Васильев) - Тест ГОСТ
INSERT INTO tbAttempt (fkIdTask, fkIdListener, fkIdStatusAttempt, submittedAt, score) VALUES
(1, 6, 2, '2026-03-11 16:45:00', 100);

-- Ответы на тест ГОСТ (попытка 3)
INSERT INTO tbTestAnswers (fkIdAttempt, fkIdQuestion, fkIdSelectedOption, answeredAt) VALUES
(2, 1, 2, '2026-03-11 16:40:00'),  -- Правильно (Times New Roman)
(2, 2, 2, '2026-03-11 16:41:00'),  -- Правильно (обновится автоматически)
(2, 3, 3, '2026-03-11 16:42:00'),  -- Правильно (1,25 см)
(2, 4, 2, '2026-03-11 16:43:00');  -- Правильно (для разработки шаблонов)

-- Попытка 4: Слушатель 7 (Григорьева) - Тест стили общения
INSERT INTO tbAttempt (fkIdTask, fkIdListener, fkIdStatusAttempt, submittedAt, score) VALUES
(7, 7, 2, '2026-04-05 11:20:00', 90);

-- Ответы на тест психологии (попытка 4)
INSERT INTO tbTestAnswers (fkIdAttempt, fkIdQuestion, fkIdSelectedOption, answeredAt) VALUES
(3, 9, 2, '2026-04-05 11:15:00'),   -- Правильно (Демократический)
(3, 10, 1, '2026-04-05 11:18:00');  -- Правильно (Активное слушание)

-- Попытка 5: Слушатель 5 (Борисова) - Тест Word (неудачная)
INSERT INTO tbAttempt (fkIdTask, fkIdListener, fkIdStatusAttempt, submittedAt, score) VALUES
(5, 5, 3, '2026-03-25 09:10:00', 40);

-- Ответы на тест Word (попытка 5)
INSERT INTO tbTestAnswers (fkIdAttempt, fkIdQuestion, fkIdSelectedOption, answeredAt) VALUES
(4, 5, 2, '2026-03-25 09:05:00'),  -- Неправильно (должно быть 1)
(4, 6, 3, '2026-03-25 09:07:00');  -- Неправильно (должно быть 3)

-- Попытка 6: Слушатель 5 (Борисова) - Практическое Word
INSERT INTO tbAttempt (fkIdTask, fkIdListener, fkIdStatusAttempt, submittedAt, answerFileUrl, score) VALUES
(6, 5, 2, '2026-03-28 14:00:00', '/attempts/auto_content_borisova.docx', 85);

-- Попытка 7: Слушатель 6 (Васильев) - Практическое Excel
INSERT INTO tbAttempt (fkIdTask, fkIdListener, fkIdStatusAttempt, submittedAt, answerFileUrl, score) VALUES
(7, 6, 1, '2026-04-10 16:30:00', '/attempts/pivot_vasilyev.xlsx', NULL);
--#endregion

--#region ===== КОММЕНТАРИИ =====
-- Комментарии к заданиям (вопросы слушателей)
INSERT INTO tbComment (fkIdTask, fkIdAttempt, fkIdUser, message, createdAt) VALUES
(2, NULL, 5, 'А можно использовать шаблон из методички или нужно создавать с нуля?', '2026-03-11 09:00:00'),
(2, NULL, 4, 'Можно использовать шаблон, но поля должны быть заполнены своими данными', '2026-03-11 10:30:00'),
(6, NULL, 5, 'Как обновить оглавление если добавил новый раздел?', '2026-03-26 11:15:00'),
(6, NULL, 2, 'ПКМ на оглавлении → Обновить поле → Обновить целиком', '2026-03-26 12:00:00'),
(7, NULL, 7, 'А как определить свой стиль общения?', '2026-04-06 10:00:00'),
(7, NULL, 3, 'Пройдите тест, затем проанализируйте свое поведение в конфликтных ситуациях', '2026-04-06 11:30:00');

-- Комментарии к попыткам (проверка преподавателей)
INSERT INTO tbComment (fkIdTask, fkIdAttempt, fkIdUser, message, createdAt) VALUES
(NULL, 2, 4, 'Отличная работа! Все требования ГОСТ соблюдены.', '2026-03-13 10:00:00'),
(NULL, 2, 5, 'Спасибо!', '2026-03-13 11:00:00'),
(NULL, 5, 4, 'Нужно переделать. Титульный лист не по ГОСТу: неверные отступы.', '2026-03-14 09:30:00'),
(NULL, 5, 5, 'А какие должны быть отступы?', '2026-03-14 10:00:00'),
(NULL, 5, 4, 'Смотрите материал "ГОСТ Р 7.0.97-2016", страница 12', '2026-03-14 10:15:00'),
(NULL, 6, 2, 'Хорошо, но оглавление не полностью автособираемое. Исправьте стили заголовков.', '2026-03-29 09:00:00'),
(NULL, 7, 2, 'Проверяю... Сводная таблица создана верно, но нет фильтров.', '2026-04-11 10:00:00');
--#endregion

--#region ===== СЕРТИФИКАТЫ =====
-- Шаблоны сертификатов
INSERT INTO tbCertificateTemplates (fkIdCourse, name, templateHtml, minScorePercent, isActive) VALUES
(1, 'Стандартный ГОСТ', '<html><body><h1>Сертификат</h1><p>Выдан {{name}}</p><p>Курс: {{course}}</p><p>Оценка: {{score}}%</p></body></html>', 60, 1),
(2, 'Стандартный Office', '<html><body><h1>Сертификат</h1><p>Выдан {{name}}</p><p>Курс: {{course}}</p><p>Оценка: {{score}}%</p></body></html>', 70, 1),
(3, 'Стандартный Психология', '<html><body><h1>Сертификат</h1><p>Выдан {{name}}</p><p>Курс: {{course}}</p><p>Оценка: {{score}}%</p></body></html>', 60, 1);

-- Выданные сертификаты
INSERT INTO tbCertificate (fkIdListener, fkIdCourse, fkIdTemplate, issuedAt, pdfUrl) VALUES
(5, 1, 1, '2026-04-01 10:00:00', '/certificates/borisova_gost.pdf'),
(6, 1, 1, '2026-04-01 11:00:00', '/certificates/vasilyev_gost.pdf'),
(5, 2, 2, '2026-05-20 14:00:00', '/certificates/borisova_office.pdf'),
(7, 3, 3, '2026-06-05 09:30:00', '/certificates/grigoreva_psy.pdf');
--#endregion

--#region ===== СООБЩЕНИЯ =====
INSERT INTO tbMessage (fkIdSender, fkIdReceiver, message, isRead, createdAt) VALUES
(2, 5, 'Добрый день! Проверил вашу работу по Word.', 1, '2026-03-29 09:05:00'),
(5, 2, 'Спасибо! А когда будет проверена работа по Excel?', 0, '2026-04-12 10:00:00'),
(3, 7, 'Здравствуйте! Отлично справились с тестом.', 1, '2026-04-06 12:00:00'),
(7, 3, 'Благодарю! Буду ждать следующего модуля.', 1, '2026-04-06 12:30:00'),
(4, 5, 'Вам выдан сертификат по курсу ГОСТы', 1, '2026-04-01 10:05:00'),
(4, 6, 'Вам выдан сертификат по курсу ГОСТы', 1, '2026-04-01 11:05:00');
--#endregion

--#region ===== УВЕДОМЛЕНИЯ =====
INSERT INTO tbNotification (fkIdUser, message, isRead, createdAt) VALUES
(5, 'Новое задание: Практическое задание по циклам', 1, '2026-03-15 08:00:00'),
(5, 'Ваша работа проверена: Тест по основам Python', 1, '2026-03-10 14:35:00'),
(5, 'Новый комментарий к заданию', 0, '2026-03-29 09:01:00'),
(5, 'Вам выдан сертификат!', 1, '2026-04-01 10:05:00'),
(6, 'Вы зачислены в группу ГОСТ-2026-1', 1, '2026-03-01 09:00:00'),
(6, 'Вам выдан сертификат!', 1, '2026-04-01 11:05:00'),
(7, 'Новое задание: Тест: Стили общения', 1, '2026-04-05 08:00:00'),
(7, 'Вам выдан сертификат!', 1, '2026-06-05 09:35:00'),
(2, 'Новый слушатель в группе Office-2026-1', 0, '2026-03-15 10:00:00');
--#endregion

--#region ===== ЖУРНАЛ АДМИНИСТРАТОРА =====
INSERT INTO tbAdminLog (fkIdAdminUser, tableName, action, oldData, newData) VALUES
(1, 'tbCourses', 'INSERT', NULL, '{"pkIdCourse": 1, "title": "Стандарты и ГОСТы"}'),
(1, 'tbCourses', 'INSERT', NULL, '{"pkIdCourse": 2, "title": "Microsoft Office для педагогов"}'),
(1, 'tbUsers', 'INSERT', NULL, '{"pkIdUser": 2, "login": "teacher_it", "role": "Преподаватель"}'),
(1, 'tbGroup', 'INSERT', NULL, '{"pkIdGroup": 1, "name": "Группа ГОСТ-2026-1"}'),
(1, 'tbCourses', 'UPDATE', '{"fkIdStatus": 1}', '{"fkIdStatus": 2, "status": "Опубликован"}'),
(1, 'tbCertificateTemplates', 'INSERT', NULL, '{"pkIdTemplate": 1, "course": "ГОСТы"}');
--#endregion

PRINT 'База данных успешно заполнена тестовыми данными!';
PRINT 'Для расширенного демо-наполнения выполните также SeedExtendedData.sql в этой же БД.';
GO

--#region ===== ПРЕДСТАВЛЕНИЯ =====
	CREATE or alter VIEW vwAdminLogs AS
	SELECT al.pkIdLog, al.actionTime, al.tableName,
		al.action, al.oldData, al.newData, u.fullName AS adminName
	FROM tbAdminLog al
	LEFT JOIN tbUsers u ON al.fkIdAdminUser = u.pkIdUser
	GO
--#endregion

select * from vwAdminLogs
go


--#region ===== CRUD =====
	--#region ===== USER =====
		CREATE OR ALTER PROCEDURE prGetUsersWithRolesAndPositions
			@pkIdUser INT = NULL, @login NVARCHAR(30) = NULL, @roleId INT = NULL, @isDeleted BIT = 0
		AS BEGIN
			SELECT u.pkIdUser, u.fullName, u.login, u.email, u.phone, u.passwordHash, u.regData,
				r.name AS roleName, p.name AS positionName
			FROM tbUsers u
			LEFT JOIN tbRoles r ON u.fkIdRole = r.pkIdRole
			LEFT JOIN tbPositions p ON u.fkIdPosition = p.pkIdPosition
			WHERE u.isDeleted = @isDeleted
				AND (@login IS NULL OR u.login = @login)
				AND (@roleId IS NULL OR u.fkIdRole = @roleId)
				AND (@pkIdUser IS NULL OR u.pkIdUser = @pkIdUser)
		END
		GO

		CREATE OR ALTER PROCEDURE spUsersCreate
			@fullName NVARCHAR(100), @login NVARCHAR(30),
			@phone NVARCHAR(15), @email NVARCHAR(50),
			@passwordHash NVARCHAR(255), @fkIdRole INT, @fkIdPosition INT = NULL
		AS
		BEGIN
			SET NOCOUNT ON;
			BEGIN TRY
				BEGIN TRANSACTION;
				IF EXISTS (SELECT 1 FROM tbUsers WHERE login = @login AND isDeleted = 0)
				BEGIN
					RAISERROR('Логин %s уже занят', 16, 1, @login);
					ROLLBACK TRANSACTION;
					RETURN;
				END
				IF EXISTS (SELECT 1 FROM tbUsers WHERE email = @email AND isDeleted = 0)
				BEGIN
					RAISERROR('Email %s уже занят', 16, 1, @email);
					ROLLBACK TRANSACTION;
					RETURN;
				END
				INSERT INTO tbUsers (fullName, login, phone, email, passwordHash, fkIdRole, fkIdPosition)
				VALUES (@fullName, @login, @phone, @email, @passwordHash, @fkIdRole, @fkIdPosition);
				DECLARE @newUserId INT = SCOPE_IDENTITY();
				COMMIT TRANSACTION;
				EXEC prGetUsersWithRolesAndPositions @pkIdUser = @newUserId;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END
		GO

		CREATE OR ALTER PROCEDURE spUsersUpdate
			@pkIdUser INT, @fullName NVARCHAR(100) = NULL, @login NVARCHAR(30) = NULL,
			@phone NVARCHAR(15) = NULL, @email NVARCHAR(50) = NULL, @passwordHash NVARCHAR(255) = NULL,
			@fkIdRole INT = NULL, @fkIdPosition INT = NULL
		AS
		BEGIN
			SET NOCOUNT ON;
			BEGIN TRY
				BEGIN TRANSACTION;
				IF @login IS NOT NULL AND EXISTS (SELECT 1 FROM tbUsers WHERE login = @login AND pkIdUser != @pkIdUser AND isDeleted = 0)
				BEGIN
					RAISERROR('Логин %s уже занят', 16, 1, @login);
					ROLLBACK TRANSACTION;
					RETURN;
				END
				IF @email IS NOT NULL AND EXISTS (SELECT 1 FROM tbUsers WHERE email = @email AND pkIdUser != @pkIdUser AND isDeleted = 0)
				BEGIN
					RAISERROR('Email %s уже занят', 16, 1, @email);
					ROLLBACK TRANSACTION;
					RETURN;
				END
				UPDATE tbUsers
				SET fullName = ISNULL(@fullName, fullName), login = ISNULL(@login, login),
					phone = ISNULL(@phone, phone), email = ISNULL(@email, email),
					passwordHash = ISNULL(@passwordHash, passwordHash), fkIdRole = ISNULL(@fkIdRole, fkIdRole),
					fkIdPosition = ISNULL(@fkIdPosition, fkIdPosition)
				WHERE pkIdUser = @pkIdUser AND isDeleted = 0;
				IF @@ROWCOUNT = 0 
				BEGIN
					RAISERROR('Пользователь %d не найден или удалён', 16, 1, @pkIdUser);
					ROLLBACK TRANSACTION;
					RETURN;
				END
				COMMIT TRANSACTION;
				EXEC prGetUsersWithRolesAndPositions @pkIdUser = @pkIdUser;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END
		GO

		CREATE OR ALTER PROCEDURE spUsersDelete
			@pkIdUser INT
		AS
		BEGIN
			SET NOCOUNT ON;
			BEGIN TRY
				BEGIN TRANSACTION;
				UPDATE tbNotification SET isDeleted = 1 WHERE fkIdUser = @pkIdUser AND isDeleted = 0;
				UPDATE tbCertificate SET isDeleted = 1 WHERE fkIdListener = @pkIdUser AND isDeleted = 0;
				UPDATE tbAttempt SET isDeleted = 1 WHERE fkIdListener = @pkIdUser AND isDeleted = 0;
				UPDATE tbComment SET isDeleted = 1 WHERE fkIdUser = @pkIdUser AND isDeleted = 0;
				UPDATE tbGroupListener SET isDeleted = 1 WHERE fkIdListener = @pkIdUser AND isDeleted = 0;
				UPDATE tbGroup SET isDeleted = 1 WHERE fkIdCurator = @pkIdUser AND isDeleted = 0;
				UPDATE tbCourseTeacher SET isDeleted = 1 WHERE fkIdTeacher = @pkIdUser AND isDeleted = 0;
				UPDATE tbMessage SET isDeleted = 1 WHERE fkIdSender = @pkIdUser AND isDeleted = 0;
				UPDATE tbUsers SET isDeleted = 1 WHERE pkIdUser = @pkIdUser AND isDeleted = 0;
				IF @@ROWCOUNT = 0 
				BEGIN
					RAISERROR('Пользователь %d не найден или уже удалён', 16, 1, @pkIdUser);
					ROLLBACK TRANSACTION;
					RETURN;
				END
				COMMIT TRANSACTION;
				SELECT @pkIdUser AS deletedId, 'Пользователь помечен как удалён' AS message;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END
		GO

		CREATE OR ALTER PROCEDURE spUsersRestore
			@pkIdUser INT
		AS
		BEGIN
			SET NOCOUNT ON;
			BEGIN TRY
				BEGIN TRANSACTION;
				UPDATE tbUsers SET isDeleted = 0 WHERE pkIdUser = @pkIdUser AND isDeleted = 1;
				IF @@ROWCOUNT = 0 
				BEGIN
					RAISERROR('Пользователь %d не найден или не был удалён', 16, 1, @pkIdUser);
					ROLLBACK TRANSACTION;
					RETURN;
				END
				COMMIT TRANSACTION;
				SELECT @pkIdUser AS restoredId, 'Пользователь восстановлен' AS message;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END
		GO

		CREATE OR ALTER PROCEDURE spUsersHardDelete
			@pkIdUser INT
		AS
		BEGIN
			SET NOCOUNT ON;
			BEGIN TRY
				IF NOT EXISTS (SELECT 1 FROM tbUsers WHERE pkIdUser = @pkIdUser)
				BEGIN
					RAISERROR('Пользователь %d не найден', 16, 1, @pkIdUser);
					RETURN;
				END
				IF EXISTS (SELECT 1 FROM tbUsers WHERE pkIdUser = @pkIdUser AND isDeleted = 0)
				BEGIN
					RAISERROR('Пользователь %d необходимо сначала пометить как удалённого', 16, 1, @pkIdUser);
					RETURN;
				END
				BEGIN TRANSACTION;
				DELETE FROM tbNotification WHERE fkIdUser = @pkIdUser;
				DELETE FROM tbCertificate WHERE fkIdListener = @pkIdUser;
				DELETE FROM tbTestAnswers WHERE fkIdAttempt IN (SELECT pkIdAttempt FROM tbAttempt WHERE fkIdListener = @pkIdUser);
				DELETE FROM tbComment WHERE fkIdUser = @pkIdUser OR fkIdAttempt IN (SELECT pkIdAttempt FROM tbAttempt WHERE fkIdListener = @pkIdUser);
				DELETE FROM tbAttempt WHERE fkIdListener = @pkIdUser;
				DELETE FROM tbGroupListener WHERE fkIdListener = @pkIdUser;
				DELETE FROM tbMessage WHERE fkIdSender = @pkIdUser OR fkIdReceiver = @pkIdUser;
				DELETE FROM tbAdminLog WHERE fkIdAdminUser = @pkIdUser;
				DELETE FROM tbUsers WHERE pkIdUser = @pkIdUser;
				COMMIT TRANSACTION;
				SELECT @pkIdUser AS deletedId, 'Пользователь физически удалён из базы данных' AS message;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END
		GO
	--#endregion

	--#region ===== COURSE =====
		CREATE OR ALTER PROCEDURE prGetCoursesWithStatusAndTags
			@pkIdCourse INT = NULL, @fkIdStatus INT = NULL, @title NVARCHAR(255) = NULL, @isDeleted BIT = 0
		AS BEGIN
			SELECT c.pkIdCourse, c.fkIdStatus, c.title, c.description, c.startDate, c.endDate, sc.name AS statusName,
				STRING_AGG(t.name, ', ') AS tags
			FROM tbCourses c
			LEFT JOIN tbStatusCourses sc ON c.fkIdStatus = sc.pkIdStatusCourse
			LEFT JOIN tbCourseTags ct ON c.pkIdCourse = ct.fkIdCourse
			LEFT JOIN tbTags t ON ct.fkIdTag = t.pkIdTag
			WHERE c.isDeleted = @isDeleted
				AND (@pkIdCourse IS NULL OR c.pkIdCourse = @pkIdCourse)
				AND (@fkIdStatus IS NULL OR c.fkIdStatus = @fkIdStatus)
				AND (@title IS NULL OR c.title LIKE '%' + @title + '%')
			GROUP BY c.pkIdCourse, c.fkIdStatus, c.title, c.description, c.startDate, c.endDate, sc.name
		END
		GO

		CREATE OR ALTER PROCEDURE spCoursesCreate
			@fkIdStatus INT, @title NVARCHAR(255), @description NVARCHAR(MAX),
			@startDate DATETIME2, @endDate DATETIME2
		AS
		BEGIN
			BEGIN TRY
				BEGIN TRANSACTION;
				IF EXISTS (SELECT 1 FROM tbCourses WHERE title = @title AND isDeleted = 0)
				BEGIN
					RAISERROR('Курс с названием "%s" уже существует', 16, 1, @title);
					ROLLBACK TRANSACTION;
					RETURN;
				END
				IF @startDate IS NOT NULL AND @endDate IS NOT NULL AND @endDate < @startDate
				BEGIN
					RAISERROR(N'Дата окончания курса не может быть раньше даты начала', 16, 1);
					ROLLBACK TRANSACTION;
					RETURN;
				END
				INSERT INTO tbCourses (fkIdStatus, title, description, startDate, endDate)
				VALUES (@fkIdStatus, @title, @description, @startDate, @endDate);
				DECLARE @newCourseId INT = SCOPE_IDENTITY();
				COMMIT TRANSACTION;
				EXEC prGetCoursesWithStatusAndTags @pkIdCourse = @newCourseId;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END
		GO

		CREATE OR ALTER PROCEDURE spCoursesUpdate
			@pkIdCourse INT, @fkIdStatus INT = NULL, @title NVARCHAR(255) = NULL,
			@description NVARCHAR(MAX) = NULL, @startDate DATETIME2 = NULL, @endDate DATETIME2 = NULL
		AS
		BEGIN
			BEGIN TRY
				BEGIN TRANSACTION;
				 IF @title IS NOT NULL AND EXISTS (SELECT 1 FROM tbCourses WHERE title = @title AND pkIdCourse != @pkIdCourse AND isDeleted = 0)
				BEGIN
					RAISERROR('Курс с названием "%s" уже существует', 16, 1, @title);
					ROLLBACK TRANSACTION;
					RETURN;
				END
				DECLARE @curStart DATETIME2, @curEnd DATETIME2;
				SELECT @curStart = startDate, @curEnd = endDate FROM tbCourses WHERE pkIdCourse = @pkIdCourse AND isDeleted = 0;
				DECLARE @newStart DATETIME2 = ISNULL(@startDate, @curStart);
				DECLARE @newEnd DATETIME2 = ISNULL(@endDate, @curEnd);
				IF @newStart IS NOT NULL AND @newEnd IS NOT NULL AND @newEnd < @newStart
				BEGIN
					RAISERROR(N'Дата окончания курса не может быть раньше даты начала', 16, 1);
					ROLLBACK TRANSACTION;
					RETURN;
				END
				UPDATE tbCourses
				SET fkIdStatus = ISNULL(@fkIdStatus, fkIdStatus), title = ISNULL(@title, title),
					description = ISNULL(@description, description), startDate = ISNULL(@startDate, startDate),
					endDate = ISNULL(@endDate, endDate)
				WHERE pkIdCourse = @pkIdCourse AND isDeleted = 0;
				IF @@ROWCOUNT = 0 
				BEGIN
					RAISERROR('Курс %d не найден или удалён', 16, 1, @pkIdCourse);
					ROLLBACK TRANSACTION;
					RETURN;
				END
				COMMIT TRANSACTION;
				EXEC prGetCoursesWithStatusAndTags @pkIdCourse = @pkIdCourse;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END
		GO

		CREATE OR ALTER PROCEDURE spCoursesDelete
			@pkIdCourse INT
		AS
		BEGIN
			SET NOCOUNT ON;
			BEGIN TRY
				BEGIN TRANSACTION;
				UPDATE tbLessons SET isDeleted = 1 WHERE fkIdCourse = @pkIdCourse AND isDeleted = 0;
				UPDATE tbTasks SET isDeleted = 1 WHERE fkIdCourse = @pkIdCourse AND isDeleted = 0;
				UPDATE tbMaterial SET isDeleted = 1 WHERE fkIdCourse = @pkIdCourse AND isDeleted = 0;
				UPDATE tbCourseTeacher SET isDeleted = 1 WHERE fkIdCourse = @pkIdCourse AND isDeleted = 0;
				UPDATE tbGroup SET isDeleted = 1 WHERE fkIdCourse = @pkIdCourse AND isDeleted = 0;
				UPDATE tbCourses SET isDeleted = 1 WHERE pkIdCourse = @pkIdCourse AND isDeleted = 0;
				IF @@ROWCOUNT = 0 
				BEGIN
					RAISERROR('Курс %d не найден или уже удалён', 16, 1, @pkIdCourse);
					ROLLBACK TRANSACTION;
					RETURN;
				END
				COMMIT TRANSACTION;
				SELECT @pkIdCourse AS deletedId, 'Курс помечен как удалённый' AS message;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END
		GO

		CREATE OR ALTER PROCEDURE spCoursesRestore
			@pkIdCourse INT
		AS
		BEGIN
			SET NOCOUNT ON;
			BEGIN TRY
				BEGIN TRANSACTION;
				UPDATE tbCourses SET isDeleted = 0 WHERE pkIdCourse = @pkIdCourse AND isDeleted = 1;
				IF @@ROWCOUNT = 0 
				BEGIN
					RAISERROR('Курс %d не найден или не был удалён', 16, 1, @pkIdCourse);
					ROLLBACK TRANSACTION;
					RETURN;
				END
				COMMIT TRANSACTION;
				SELECT @pkIdCourse AS restoredId, 'Курс восстановлен' AS message;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END
		GO

		CREATE OR ALTER PROCEDURE spCoursesHardDelete
			@pkIdCourse INT
		AS
		BEGIN
			SET NOCOUNT ON;
			BEGIN TRY
				IF NOT EXISTS (SELECT 1 FROM tbCourses WHERE pkIdCourse = @pkIdCourse)
				BEGIN
					RAISERROR('Курс %d не найден', 16, 1, @pkIdCourse);
					RETURN;
				END
				IF EXISTS (SELECT 1 FROM tbCourses WHERE pkIdCourse = @pkIdCourse AND isDeleted = 0)
				BEGIN
					RAISERROR('Курс %d необходимо сначала пометить как удалённый', 16, 1, @pkIdCourse);
					RETURN;
				END
				BEGIN TRANSACTION;
				DELETE FROM tbTestAnswers WHERE fkIdAttempt IN (SELECT pkIdAttempt FROM tbAttempt WHERE fkIdTask IN (SELECT pkIdTask FROM tbTasks WHERE fkIdCourse = @pkIdCourse));
				DELETE FROM tbComment WHERE fkIdTask IN (SELECT pkIdTask FROM tbTasks WHERE fkIdCourse = @pkIdCourse) OR fkIdAttempt IN (SELECT pkIdAttempt FROM tbAttempt WHERE fkIdTask IN (SELECT pkIdTask FROM tbTasks WHERE fkIdCourse = @pkIdCourse));
				DELETE FROM tbAttempt WHERE fkIdTask IN (SELECT pkIdTask FROM tbTasks WHERE fkIdCourse = @pkIdCourse);
				DELETE FROM tbTasks WHERE fkIdCourse = @pkIdCourse;
				DELETE FROM tbMaterial WHERE fkIdCourse = @pkIdCourse;
				DELETE FROM tbLessons WHERE fkIdCourse = @pkIdCourse;
				DELETE FROM tbCourseTeacher WHERE fkIdCourse = @pkIdCourse;
				DELETE FROM tbGroupListener WHERE fkIdGroup IN (SELECT pkIdGroup FROM tbGroup WHERE fkIdCourse = @pkIdCourse);
				DELETE FROM tbGroup WHERE fkIdCourse = @pkIdCourse;
				DELETE FROM tbCourses WHERE pkIdCourse = @pkIdCourse;
				COMMIT TRANSACTION;
				SELECT @pkIdCourse AS deletedId, 'Курс физически удалён из базы данных' AS message;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END
		GO
	--#endregion

	--#region ===== COURSE-TEACHERS =====
		CREATE OR ALTER PROCEDURE prGetCourseTeachers
			@pkIdCourseTeacher INT = NULL, @fkIdCourse INT = NULL, @fkIdTeacher INT = NULL, @isDeleted BIT = 0
		AS BEGIN
			SELECT ct.pkIdCourseTeacher, ct.fkIdCourse, ct.fkIdTeacher, ct.assignedAt, c.title AS courseTitle, u.fullName AS teacherName
			FROM tbCourseTeacher ct
			LEFT JOIN tbCourses c ON ct.fkIdCourse = c.pkIdCourse
			LEFT JOIN tbUsers u ON ct.fkIdTeacher = u.pkIdUser
			WHERE ct.isDeleted = @isDeleted
				AND (@pkIdCourseTeacher IS NULL OR ct.pkIdCourseTeacher = @pkIdCourseTeacher)
				AND (@fkIdCourse IS NULL OR ct.fkIdCourse = @fkIdCourse)
				AND (@fkIdTeacher IS NULL OR ct.fkIdTeacher = @fkIdTeacher)
		END
		GO

		CREATE OR ALTER PROCEDURE spCreateCourseTeacher
			@fkIdCourse INT, @fkIdTeacher INT
		AS
		BEGIN
			IF EXISTS ( SELECT 1 FROM tbCourseTeacher  WHERE fkIdCourse = @fkIdCourse  AND fkIdTeacher = @fkIdTeacher  AND isDeleted = 0 )
		BEGIN
			RAISERROR('Преподаватель уже назначен на данный курс', 16, 1);
			RETURN;
		END

		DECLARE @deletedId INT; 
		SELECT @deletedId = pkIdCourseTeacher  FROM tbCourseTeacher WHERE fkIdCourse = @fkIdCourse  AND fkIdTeacher = @fkIdTeacher  AND isDeleted = 1;

		IF @deletedId IS NOT NULL
		BEGIN
			RAISERROR('Данный преподаватель ранее был назначен на курс и удалён. Используйте восстановление записи ID=%d', 16, 1, @deletedId);
			RETURN;
		END
			BEGIN TRY
				BEGIN TRANSACTION;
				INSERT INTO tbCourseTeacher (fkIdCourse, fkIdTeacher, isDeleted)
				VALUES (@fkIdCourse, @fkIdTeacher, 0);
				DECLARE @newId INT = SCOPE_IDENTITY();
				COMMIT TRANSACTION;
				EXEC prGetCourseTeachers @pkIdCourseTeacher = @newId;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END
		GO

		CREATE OR ALTER PROCEDURE spCourseTeacherDelete
			@pkIdCourseTeacher INT
		AS
		BEGIN
			SET NOCOUNT ON;
			BEGIN TRY
				BEGIN TRANSACTION;
				UPDATE tbCourseTeacher SET isDeleted = 1 WHERE pkIdCourseTeacher = @pkIdCourseTeacher AND isDeleted = 0;
				IF @@ROWCOUNT = 0
				BEGIN
					RAISERROR('Запись о преподавателе курса %d не найдена или уже удалена', 16, 1, @pkIdCourseTeacher);
					ROLLBACK TRANSACTION;
					RETURN;
				END
				COMMIT TRANSACTION;
				SELECT @pkIdCourseTeacher AS deletedId, 'Запись помечена как удалённая' AS message;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END
		GO

		CREATE OR ALTER PROCEDURE spCourseTeacherRestore
			@pkIdCourseTeacher INT
		AS
		BEGIN
			SET NOCOUNT ON;
			BEGIN TRY
				BEGIN TRANSACTION;
				UPDATE tbCourseTeacher SET isDeleted = 0 WHERE pkIdCourseTeacher = @pkIdCourseTeacher AND isDeleted = 1;
				IF @@ROWCOUNT = 0
				BEGIN
					RAISERROR('Запись о преподавателе курса %d не найдена или не была удалена', 16, 1, @pkIdCourseTeacher);
					ROLLBACK TRANSACTION;
					RETURN;
				END
				COMMIT TRANSACTION;
				SELECT @pkIdCourseTeacher AS restoredId, 'Запись восстановлена' AS message;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END
		GO

		CREATE OR ALTER PROCEDURE spCourseTeacherHardDelete
			@pkIdCourseTeacher INT
		AS
		BEGIN
			SET NOCOUNT ON;
			BEGIN TRY
				IF NOT EXISTS (SELECT 1 FROM tbCourseTeacher WHERE pkIdCourseTeacher = @pkIdCourseTeacher)
				BEGIN
					RAISERROR('Запись о преподавателе курса %d не найдена', 16, 1, @pkIdCourseTeacher);
					RETURN;
				END
				IF EXISTS (SELECT 1 FROM tbCourseTeacher WHERE pkIdCourseTeacher = @pkIdCourseTeacher AND isDeleted = 0)
				BEGIN
					RAISERROR('Запись %d необходимо сначала пометить как удалённую', 16, 1, @pkIdCourseTeacher);
					RETURN;
				END
				BEGIN TRANSACTION;
				DELETE FROM tbCourseTeacher WHERE pkIdCourseTeacher = @pkIdCourseTeacher;
				COMMIT TRANSACTION;
				SELECT @pkIdCourseTeacher AS deletedId, 'Запись физически удалена' AS message;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END
		GO
	--#endregion

	--#region ===== GROUP =====
		CREATE OR ALTER PROCEDURE prGetGroupsWithCuratorsAndCourses
			@pkIdGroup INT = NULL, @fkIdCourse INT = NULL, @fkIdCurator INT = NULL, @groupName NVARCHAR(100) = NULL, @isDeleted BIT = 0
		AS BEGIN
			SELECT g.pkIdGroup, g.fkIdCourse, g.fkIdCurator, g.name AS groupName, c.title AS courseTitle, u.fullName AS curatorName,
				COUNT(gl.fkIdListener) AS listenerCount
			FROM tbGroup g
			LEFT JOIN tbCourses c ON g.fkIdCourse = c.pkIdCourse
			LEFT JOIN tbUsers u ON g.fkIdCurator = u.pkIdUser
			LEFT JOIN tbGroupListener gl ON g.pkIdGroup = gl.fkIdGroup AND gl.isDeleted = 0
			WHERE g.isDeleted = @isDeleted
				AND (@pkIdGroup IS NULL OR g.pkIdGroup = @pkIdGroup)
				AND (@fkIdCourse IS NULL OR g.fkIdCourse = @fkIdCourse)
				AND (@fkIdCurator IS NULL OR g.fkIdCurator = @fkIdCurator)
				AND (@groupName IS NULL OR g.name LIKE '%' + @groupName + '%')
			GROUP BY g.pkIdGroup, g.fkIdCourse, g.fkIdCurator, g.name, c.title, u.fullName
		END
		GO

		CREATE OR ALTER PROCEDURE spGroupsCreate
			@fkIdCourse INT, @fkIdCurator INT, @name NVARCHAR(100)
		AS
		BEGIN
			BEGIN TRY
				BEGIN TRANSACTION;
				IF EXISTS (SELECT 1 FROM tbGroup WHERE name = @name AND isDeleted = 0)
				BEGIN
					RAISERROR('Группа с названием "%s" уже существует', 16, 1, @name);
					ROLLBACK TRANSACTION;
					RETURN;
				END
				INSERT INTO tbGroup (fkIdCourse, fkIdCurator, name)
				VALUES (@fkIdCourse, @fkIdCurator, @name);
				DECLARE @newGroupId INT = SCOPE_IDENTITY();
				COMMIT TRANSACTION;
				EXEC prGetGroupsWithCuratorsAndCourses @pkIdGroup = @newGroupId;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END
		GO

		CREATE OR ALTER PROCEDURE spGroupsUpdate
			@pkIdGroup INT, @fkIdCourse INT = NULL, @fkIdCurator INT = NULL, @name NVARCHAR(100) = NULL
		AS
		BEGIN
			BEGIN TRY
				BEGIN TRANSACTION;
				IF EXISTS (SELECT 1 FROM tbGroup WHERE name = @name AND isDeleted = 0)
				BEGIN
					RAISERROR('Группа с названием "%s" уже существует', 16, 1, @name);
					ROLLBACK TRANSACTION;
					RETURN;
				END
				UPDATE tbGroup
				SET fkIdCourse = ISNULL(@fkIdCourse, fkIdCourse), fkIdCurator = ISNULL(@fkIdCurator, fkIdCurator), name = ISNULL(@name, name)
				WHERE pkIdGroup = @pkIdGroup AND isDeleted = 0;
				IF @@ROWCOUNT = 0 
				BEGIN
					RAISERROR('Группа %d не найдена или удалена', 16, 1, @pkIdGroup);
					ROLLBACK TRANSACTION;
					RETURN;
				END
				COMMIT TRANSACTION;
				EXEC prGetGroupsWithCuratorsAndCourses @pkIdGroup = @pkIdGroup;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END
		GO

		CREATE OR ALTER PROCEDURE spGroupsDelete
			@pkIdGroup INT
		AS
		BEGIN
			SET NOCOUNT ON;
			BEGIN TRY
				BEGIN TRANSACTION;
				UPDATE tbGroupListener SET isDeleted = 1 WHERE fkIdGroup = @pkIdGroup AND isDeleted = 0;
				UPDATE tbGroup SET isDeleted = 1 WHERE pkIdGroup = @pkIdGroup AND isDeleted = 0;
				IF @@ROWCOUNT = 0 
				BEGIN
					RAISERROR('Группа %d не найдена или уже удалена', 16, 1, @pkIdGroup);
					ROLLBACK TRANSACTION;
					RETURN;
				END
				COMMIT TRANSACTION;
				SELECT @pkIdGroup AS deletedId, 'Группа помечена как удалённая' AS message;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END
		GO

		CREATE OR ALTER PROCEDURE spGroupsRestore
			@pkIdGroup INT
		AS
		BEGIN
			SET NOCOUNT ON;
			BEGIN TRY
				BEGIN TRANSACTION;
				UPDATE tbGroup SET isDeleted = 0 WHERE pkIdGroup = @pkIdGroup AND isDeleted = 1;
				IF @@ROWCOUNT = 0 
				BEGIN
					RAISERROR('Группа %d не найдена или не была удалена', 16, 1, @pkIdGroup);
					ROLLBACK TRANSACTION;
					RETURN;
				END
				COMMIT TRANSACTION;
				SELECT @pkIdGroup AS restoredId, 'Группа восстановлена' AS message;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END
		GO

		CREATE OR ALTER PROCEDURE spGroupsHardDelete
			@pkIdGroup INT
		AS
		BEGIN
			SET NOCOUNT ON;
			BEGIN TRY
				IF NOT EXISTS (SELECT 1 FROM tbGroup WHERE pkIdGroup = @pkIdGroup)
				BEGIN
					RAISERROR('Группа %d не найдена', 16, 1, @pkIdGroup);
					RETURN;
				END
				IF EXISTS (SELECT 1 FROM tbGroup WHERE pkIdGroup = @pkIdGroup AND isDeleted = 0)
				BEGIN
					RAISERROR('Группа %d необходимо сначала пометить как удалённую', 16, 1, @pkIdGroup);
					RETURN;
				END
				BEGIN TRANSACTION;
				DELETE FROM tbGroupListener WHERE fkIdGroup = @pkIdGroup;
				DELETE FROM tbGroup WHERE pkIdGroup = @pkIdGroup;
				COMMIT TRANSACTION;
				SELECT @pkIdGroup AS deletedId, 'Группа физически удалена из базы данных' AS message;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END
		GO
	--#endregion

	--#region ===== GROUPLISTENER =====
		CREATE OR ALTER PROCEDURE prGetGroupListenersWithUserInfo
			@pkIdGroupListener INT = NULL, @fkIdGroup INT = NULL, @fkIdListener INT = NULL, @isDeleted BIT = 0
		AS BEGIN
			SET NOCOUNT ON;
			SELECT gl.pkIdGroupListener, gl.fkIdGroup, gl.fkIdListener, g.fkIdCourse, g.name AS groupName, c.title AS courseTitle, u.fullName as listenerName, u.email, u.phone
			FROM tbGroupListener gl
			JOIN tbGroup g ON gl.fkIdGroup = g.pkIdGroup
			JOIN tbUsers u ON gl.fkIdListener = u.pkIdUser
			JOIN tbCourses c ON g.fkIdCourse = c.pkIdCourse
			WHERE gl.isDeleted = @isDeleted
				AND (@pkIdGroupListener IS NULL OR gl.pkIdGroupListener = @pkIdGroupListener)
				AND (@fkIdGroup IS NULL OR gl.fkIdGroup = @fkIdGroup)
				AND (@fkIdListener IS NULL OR gl.fkIdListener = @fkIdListener)
		END
		GO
		
		CREATE OR ALTER PROCEDURE spGroupListenersCreate
			@fkIdGroup INT, @fkIdListener INT
		AS
		BEGIN
			SET NOCOUNT ON;
			BEGIN TRY
				BEGIN TRANSACTION;
				IF EXISTS (SELECT 1 FROM tbGroupListener WHERE fkIdGroup = @fkIdGroup AND fkIdListener = @fkIdListener AND isDeleted = 0)
				BEGIN
					RAISERROR('Слушатель уже добавлен в эту группу', 16, 1);
					ROLLBACK TRANSACTION;
					RETURN;
				END
				INSERT INTO tbGroupListener (fkIdGroup, fkIdListener) VALUES (@fkIdGroup, @fkIdListener);
				DECLARE @newListenerId INT = SCOPE_IDENTITY();
				COMMIT TRANSACTION;
				EXEC prGetGroupListenersWithUserInfo @pkIdGroupListener = @newListenerId;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END
		GO

		CREATE OR ALTER PROCEDURE spGroupListenersDelete
			@pkIdGroupListener INT
		AS
		BEGIN
			SET NOCOUNT ON;
			BEGIN TRY
				BEGIN TRANSACTION;
				UPDATE tbGroupListener SET isDeleted = 1 WHERE pkIdGroupListener = @pkIdGroupListener AND isDeleted = 0;
				IF @@ROWCOUNT = 0 
				BEGIN
					RAISERROR('Слушатель %d не найден или уже удалён', 16, 1, @pkIdGroupListener);
					ROLLBACK TRANSACTION;
					RETURN;
				END
				COMMIT TRANSACTION;
				SELECT @pkIdGroupListener AS deletedId, 'Слушатель помечен как удалённый' AS message;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END
		GO

		CREATE OR ALTER PROCEDURE spGroupListenersRestore
			@pkIdGroupListener INT
		AS
		BEGIN
			SET NOCOUNT ON;
			BEGIN TRY
				BEGIN TRANSACTION;
				UPDATE tbGroupListener SET isDeleted = 0 WHERE pkIdGroupListener = @pkIdGroupListener AND isDeleted = 1;
				IF @@ROWCOUNT = 0 
				BEGIN
					RAISERROR('Слушатель %d не найден или не был удалён', 16, 1, @pkIdGroupListener);
					ROLLBACK TRANSACTION;
					RETURN;
				END
				COMMIT TRANSACTION;
				SELECT @pkIdGroupListener AS restoredId, 'Слушатель восстановлен' AS message;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END
		GO

		CREATE OR ALTER PROCEDURE spGroupListenersHardDelete
			@pkIdGroupListener INT
		AS
		BEGIN
			SET NOCOUNT ON;
			BEGIN TRY
				IF NOT EXISTS (SELECT 1 FROM tbGroupListener WHERE pkIdGroupListener = @pkIdGroupListener)
				BEGIN
					RAISERROR('Слушатель %d не найден', 16, 1, @pkIdGroupListener);
					RETURN;
				END
				IF EXISTS (SELECT 1 FROM tbGroupListener WHERE pkIdGroupListener = @pkIdGroupListener AND isDeleted = 0)
				BEGIN
					RAISERROR('Слушатель %d необходимо сначала пометить как удалённого', 16, 1, @pkIdGroupListener);
					RETURN;
				END
				BEGIN TRANSACTION;
				DELETE FROM tbGroupListener WHERE pkIdGroupListener = @pkIdGroupListener;
				COMMIT TRANSACTION;
				SELECT @pkIdGroupListener AS deletedId, 'Слушатель физически удалён из базы данных' AS message;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END
		GO
	--#endregion

	--#region ===== LESSON =====
		CREATE OR ALTER PROCEDURE prGetLessonsWithCourse
			@pkIdLesson INT = NULL,
			@fkIdCourse INT = NULL,
			@title NVARCHAR(255) = NULL,
			@isPublished BIT = NULL,
			@isDeleted BIT = 0
		AS BEGIN
			SELECT l.pkIdLesson, l.title, l.description, l.content, l.sortOrder,
				l.isPublished, l.createdAt, c.title AS courseTitle
			FROM tbLessons l
			LEFT JOIN tbCourses c ON l.fkIdCourse = c.pkIdCourse
			WHERE l.isDeleted = @isDeleted
				AND (@pkIdLesson IS NULL OR l.pkIdLesson = @pkIdLesson)
				AND (@fkIdCourse IS NULL OR l.fkIdCourse = @fkIdCourse)
				AND (@title IS NULL OR l.title LIKE '%' + @title + '%')
				AND (@isPublished IS NULL OR l.isPublished = @isPublished)
		END
		GO

		CREATE OR ALTER PROCEDURE spLessonsCreate
			@fkIdCourse INT, @title NVARCHAR(255), @description NVARCHAR(MAX),
			@content NVARCHAR(MAX), @sortOrder INT, @isPublished BIT
		AS
		BEGIN
			SET NOCOUNT ON;
				BEGIN TRY
				IF EXISTS ( SELECT 1 FROM tbLessons  WHERE fkIdCourse = @fkIdCourse  AND title = @title  AND isDeleted = 0)
				BEGIN
					RAISERROR('Урок с названием "%s" уже существует в данном курсе', 16, 1, @title);
					RETURN;
				END
				BEGIN TRANSACTION;
				INSERT INTO tbLessons (fkIdCourse, title, description, content, sortOrder, isPublished)
				VALUES (@fkIdCourse, @title, @description, @content, @sortOrder, @isPublished);
				DECLARE @newLessonId INT = SCOPE_IDENTITY();
				COMMIT TRANSACTION;
				SELECT * FROM tbLessons WHERE pkIdLesson = @newLessonId;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END
		GO

		CREATE OR ALTER PROCEDURE spLessonsUpdate
			@pkIdLesson INT, @fkIdCourse INT = NULL, @title NVARCHAR(255) = NULL,
			@description NVARCHAR(MAX) = NULL, @content NVARCHAR(MAX) = NULL,
			@sortOrder INT = NULL, @isPublished BIT = NULL
		AS
		BEGIN
			BEGIN TRY
				IF EXISTS ( SELECT 1 FROM tbLessons  WHERE fkIdCourse = @fkIdCourse  AND title = @title  AND isDeleted = 0)
				BEGIN
					RAISERROR('Урок с названием "%s" уже существует в данном курсе', 16, 1, @title);
					RETURN;
				END
				BEGIN TRANSACTION;
				UPDATE tbLessons
				SET fkIdCourse = ISNULL(@fkIdCourse, fkIdCourse), title = ISNULL(@title, title),
					description = ISNULL(@description, description), content = ISNULL(@content, content),
					sortOrder = ISNULL(@sortOrder, sortOrder), isPublished = ISNULL(@isPublished, isPublished)
				WHERE pkIdLesson = @pkIdLesson AND isDeleted = 0;
				IF @@ROWCOUNT = 0 
				BEGIN
					RAISERROR('Урок %d не найден или удалён', 16, 1, @pkIdLesson);
					ROLLBACK TRANSACTION;
					RETURN;
				END
				COMMIT TRANSACTION;
				SELECT * FROM tbLessons WHERE pkIdLesson = @pkIdLesson;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END
		GO

		CREATE OR ALTER PROCEDURE spLessonsDelete
			@pkIdLesson INT
		AS
		BEGIN
			SET NOCOUNT ON;
			BEGIN TRY
				BEGIN TRANSACTION;
				UPDATE tbTasks SET isDeleted = 1 WHERE fkIdLesson = @pkIdLesson AND isDeleted = 0;
				UPDATE tbMaterial SET isDeleted = 1 WHERE fkIdLesson = @pkIdLesson AND isDeleted = 0;
				UPDATE tbLessons SET isDeleted = 1 WHERE pkIdLesson = @pkIdLesson AND isDeleted = 0;
				IF @@ROWCOUNT = 0 
				BEGIN
					RAISERROR('Урок %d не найден или уже удалён', 16, 1, @pkIdLesson);
					ROLLBACK TRANSACTION;
					RETURN;
				END
				COMMIT TRANSACTION;
				SELECT @pkIdLesson AS deletedId, 'Урок помечен как удалённый' AS message;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END
		GO

		CREATE OR ALTER PROCEDURE spLessonsRestore
			@pkIdLesson INT
		AS
		BEGIN
			SET NOCOUNT ON;
			BEGIN TRY
				BEGIN TRANSACTION;
				UPDATE tbLessons SET isDeleted = 0 WHERE pkIdLesson = @pkIdLesson AND isDeleted = 1;
				IF @@ROWCOUNT = 0 
				BEGIN
					RAISERROR('Урок %d не найден или не был удалён', 16, 1, @pkIdLesson);
					ROLLBACK TRANSACTION;
					RETURN;
				END
				COMMIT TRANSACTION;
				SELECT @pkIdLesson AS restoredId, 'Урок восстановлен' AS message;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END
		GO

		CREATE OR ALTER PROCEDURE spLessonsHardDelete
			@pkIdLesson INT
		AS
		BEGIN
			SET NOCOUNT ON;
			BEGIN TRY
				IF NOT EXISTS (SELECT 1 FROM tbLessons WHERE pkIdLesson = @pkIdLesson)
				BEGIN
					RAISERROR('Урок %d не найден', 16, 1, @pkIdLesson);
					RETURN;
				END
				IF EXISTS (SELECT 1 FROM tbLessons WHERE pkIdLesson = @pkIdLesson AND isDeleted = 0)
				BEGIN
					RAISERROR('Урок %d необходимо сначала пометить как удалённый', 16, 1, @pkIdLesson);
					RETURN;
				END
				BEGIN TRANSACTION;
				DELETE FROM tbTasks WHERE fkIdLesson = @pkIdLesson;
				DELETE FROM tbMaterial WHERE fkIdLesson = @pkIdLesson;
				DELETE FROM tbLessons WHERE pkIdLesson = @pkIdLesson;
				COMMIT TRANSACTION;
				SELECT @pkIdLesson AS deletedId, 'Урок физически удалён из базы данных' AS message;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END
		GO
		--#endregion

	--#region ===== TASK =====
		CREATE OR ALTER PROCEDURE prGetTasksWithTypesAndLessons
			@pkIdTask INT = NULL, @fkIdTypeTasks INT = NULL, @fkIdCourse INT = NULL, @fkIdLesson INT = NULL, @taskTitle NVARCHAR(255) = NULL, @isDeleted BIT = 0
		AS BEGIN
			SET NOCOUNT ON;
			SELECT t.pkIdTask, t.fkIdCourse, t.fkIdLesson, t.fkIdTypeTasks AS typeId, t.fkIdTest, t.sortOrder,
				t.title AS taskTitle, t.description, t.deadline, t.maxScore,
				tt.name AS taskTypeName, l.title AS lessonTitle, c.title AS courseTitle
			FROM tbTasks t
			LEFT JOIN tbTypeTasks tt ON t.fkIdTypeTasks = tt.pkIdTypeTask
			LEFT JOIN tbLessons l ON t.fkIdLesson = l.pkIdLesson
			LEFT JOIN tbCourses c ON t.fkIdCourse = c.pkIdCourse
			WHERE t.isDeleted = @isDeleted
				AND (@pkIdTask IS NULL OR t.pkIdTask = @pkIdTask)
				AND (@fkIdTypeTasks IS NULL OR t.fkIdTypeTasks = @fkIdTypeTasks)
				AND (@fkIdCourse IS NULL OR t.fkIdCourse = @fkIdCourse)
				AND (@fkIdLesson IS NULL OR t.fkIdLesson = @fkIdLesson)
				AND (@taskTitle IS NULL OR t.title LIKE '%' + @taskTitle + '%')
		END
		GO

		CREATE OR ALTER PROCEDURE spTasksCreate
			@fkIdTypeTasks INT, @fkIdCourse INT, @fkIdLesson INT, @fkIdTest INT = null, @title NVARCHAR(255),
			@description NVARCHAR(MAX), @content NVARCHAR(MAX), @contentFileUrl NVARCHAR(255),
			@deadline DATETIME2, @maxScore INT, @sortOrder INT
		AS
		BEGIN
			BEGIN TRY
				BEGIN TRANSACTION;
				IF @fkIdLesson IS NOT NULL
				BEGIN
					IF EXISTS (SELECT 1 FROM tbTasks  WHERE title = @title AND fkIdLesson = @fkIdLesson AND isDeleted = 0)
					BEGIN
						RAISERROR('Задача с названием "%s" уже существует в данном уроке', 16, 1, @title);
						ROLLBACK TRANSACTION;
						RETURN;
					END
				END
				ELSE
				BEGIN
					IF EXISTS (SELECT 1 FROM tbTasks  WHERE title = @title AND fkIdCourse = @fkIdCourse AND fkIdLesson IS NULL AND isDeleted = 0)
					BEGIN
						RAISERROR('Задача с названием "%s" уже существует в данном курсе', 16, 1, @title);
						ROLLBACK TRANSACTION;
						RETURN;
					END
				END
				IF @deadline IS NOT NULL AND @deadline <= SYSUTCDATETIME()
				BEGIN
					RAISERROR(N'Дедлайн задания должен быть в будущем', 16, 1);
					ROLLBACK TRANSACTION;
					RETURN;
				END
				IF @maxScore IS NOT NULL AND (@maxScore < 0 OR @maxScore > 10000)
				BEGIN
					RAISERROR(N'Максимальный балл задания должен быть от 0 до 10000', 16, 1);
					ROLLBACK TRANSACTION;
					RETURN;
				END
				INSERT INTO tbTasks (fkIdTypeTasks, fkIdCourse, fkIdLesson, fkIdTest, title, description, content, contentFileUrl, deadline, maxScore, sortOrder)
				VALUES (@fkIdTypeTasks, @fkIdCourse, @fkIdLesson, @fkIdTest, @title, @description, @content, @contentFileUrl, @deadline, @maxScore, @sortOrder);
				DECLARE @newTaskId INT = SCOPE_IDENTITY();
				COMMIT TRANSACTION;
				EXEC prGetTasksWithTypesAndLessons @pkIdTask = @newTaskId;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END
		GO

		CREATE OR ALTER PROCEDURE spTasksUpdate
			@pkIdTask INT, @fkIdTypeTasks INT = NULL, @fkIdCourse INT = NULL, @fkIdLesson INT = NULL, @fkIdTest INT = null,
			@title NVARCHAR(255) = NULL, @description NVARCHAR(MAX) = NULL, @content NVARCHAR(MAX) = NULL,
			@contentFileUrl NVARCHAR(255) = NULL, @deadline DATETIME2 = NULL, @maxScore INT = NULL, @sortOrder INT = NULL
		AS
		BEGIN
			BEGIN TRY
				BEGIN TRANSACTION;
				IF @fkIdLesson IS NOT NULL
				BEGIN
					IF EXISTS (SELECT 1 FROM tbTasks  WHERE title = @title AND fkIdLesson = @fkIdLesson AND isDeleted = 0 AND pkIdTask <> @pkIdTask)
					BEGIN
						RAISERROR('Задача с названием "%s" уже существует в данном уроке', 16, 1, @title);
						ROLLBACK TRANSACTION;
						RETURN;
					END
				END
				ELSE
				BEGIN
					IF EXISTS (SELECT 1 FROM tbTasks WHERE title = @title AND fkIdCourse = @fkIdCourse AND fkIdLesson IS NULL AND isDeleted = 0 AND pkIdTask <> @pkIdTask)
					BEGIN
						RAISERROR('Задача с названием "%s" уже существует в данном курсе', 16, 1, @title);
						ROLLBACK TRANSACTION;
						RETURN;
					END
				END
				DECLARE @oldDeadlineUpd DATETIME2;
				SELECT @oldDeadlineUpd = deadline FROM tbTasks WHERE pkIdTask = @pkIdTask AND isDeleted = 0;
				IF @deadline IS NOT NULL
					AND @deadline <= SYSUTCDATETIME()
					AND (@oldDeadlineUpd IS NULL OR @deadline <> @oldDeadlineUpd)
				BEGIN
					RAISERROR(N'Дедлайн задания должен быть в будущем', 16, 1);
					ROLLBACK TRANSACTION;
					RETURN;
				END
				IF @maxScore IS NOT NULL AND (@maxScore < 0 OR @maxScore > 10000)
				BEGIN
					RAISERROR(N'Максимальный балл задания должен быть от 0 до 10000', 16, 1);
					ROLLBACK TRANSACTION;
					RETURN;
				END
				UPDATE tbTasks
				SET fkIdTypeTasks = ISNULL(@fkIdTypeTasks, fkIdTypeTasks), fkIdCourse = ISNULL(@fkIdCourse, fkIdCourse),
					fkIdLesson = ISNULL(@fkIdLesson, fkIdLesson), fkIdTest = ISNULL(@fkIdTest, fkIdTest),  title = ISNULL(@title, title),
					description = ISNULL(@description, description), content = ISNULL(@content, content),
					contentFileUrl = ISNULL(@contentFileUrl, contentFileUrl), deadline = ISNULL(@deadline, deadline),
					maxScore = ISNULL(@maxScore, maxScore), sortOrder = ISNULL(@sortOrder, sortOrder)
				WHERE pkIdTask = @pkIdTask AND isDeleted = 0;
				IF @@ROWCOUNT = 0 
				BEGIN
					RAISERROR('Задание %d не найдено или удалено', 16, 1, @pkIdTask);
					ROLLBACK TRANSACTION;
					RETURN;
				END
				COMMIT TRANSACTION;
				EXEC prGetTasksWithTypesAndLessons @pkIdTask = @pkIdTask;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END
		GO

		CREATE OR ALTER PROCEDURE spTasksDelete
			@pkIdTask INT
		AS
		BEGIN
			SET NOCOUNT ON;
			BEGIN TRY
				BEGIN TRANSACTION;
				UPDATE tbAttempt SET isDeleted = 1 WHERE fkIdTask = @pkIdTask AND isDeleted = 0;
				UPDATE tbTasks SET isDeleted = 1 WHERE pkIdTask = @pkIdTask AND isDeleted = 0;
				IF @@ROWCOUNT = 0 
				BEGIN
					RAISERROR('Задание %d не найдено или уже удалено', 16, 1, @pkIdTask);
					ROLLBACK TRANSACTION;
					RETURN;
				END
				COMMIT TRANSACTION;
				SELECT @pkIdTask AS deletedId, 'Задание помечено как удалённое' AS message;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END
		GO

		CREATE OR ALTER PROCEDURE spTasksRestore
			@pkIdTask INT
		AS
		BEGIN
			SET NOCOUNT ON;
			BEGIN TRY
				BEGIN TRANSACTION;
				UPDATE tbTasks SET isDeleted = 0 WHERE pkIdTask = @pkIdTask AND isDeleted = 1;
				IF @@ROWCOUNT = 0 
				BEGIN
					RAISERROR('Задание %d не найдено или не было удалено', 16, 1, @pkIdTask);
					ROLLBACK TRANSACTION;
					RETURN;
				END
				COMMIT TRANSACTION;
				SELECT @pkIdTask AS restoredId, 'Задание восстановлено' AS message;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END
		GO

		CREATE OR ALTER PROCEDURE spTasksHardDelete
			@pkIdTask INT
		AS
		BEGIN
			SET NOCOUNT ON;
			BEGIN TRY
				IF NOT EXISTS (SELECT 1 FROM tbTasks WHERE pkIdTask = @pkIdTask)
				BEGIN
					RAISERROR('Задание %d не найдено', 16, 1, @pkIdTask);
					RETURN;
				END
				IF EXISTS (SELECT 1 FROM tbTasks WHERE pkIdTask = @pkIdTask AND isDeleted = 0)
				BEGIN
					RAISERROR('Задание %d необходимо сначала пометить как удалённое', 16, 1, @pkIdTask);
					RETURN;
				END
				BEGIN TRANSACTION;
				DELETE FROM tbTestAnswers WHERE fkIdAttempt IN (SELECT pkIdAttempt FROM tbAttempt WHERE fkIdTask = @pkIdTask);
				DELETE FROM tbComment WHERE fkIdTask = @pkIdTask OR fkIdAttempt IN (SELECT pkIdAttempt FROM tbAttempt WHERE fkIdTask = @pkIdTask);
				DELETE FROM tbAttempt WHERE fkIdTask = @pkIdTask;
				DELETE FROM tbTasks WHERE pkIdTask = @pkIdTask;
				COMMIT TRANSACTION;
				SELECT @pkIdTask AS deletedId, 'Задание физически удалено из базы данных' AS message;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END
		GO
		--#endregion

	--#region ===== MATERIAL =====
		CREATE OR ALTER PROCEDURE prGetMaterialsWithTypesAndLessons
			@pkIdMaterial INT = NULL, @fkIdCourse INT = NULL, @fkIdLesson INT = NULL, @fkIdTypeMaterial INT = NULL, @isDeleted BIT = 0
		AS BEGIN
			SELECT m.pkIdMaterial, m.fkIdCourse, m.fkIdLesson, m.fkIdTypeMaterial, m.sortOrder, m.isAdditional,
				m.title AS materialTitle, m.description, m.fileUrl, m.link,
				tm.name AS typeName, l.title AS lessonTitle, c.title AS courseTitle
			FROM tbMaterial m
			LEFT JOIN tbTypeMaterials tm ON m.fkIdTypeMaterial = tm.pkIdTypeMaterial
			LEFT JOIN tbLessons l ON m.fkIdLesson = l.pkIdLesson
			LEFT JOIN tbCourses c ON m.fkIdCourse = c.pkIdCourse
			WHERE m.isDeleted = @isDeleted
				AND (@pkIdMaterial IS NULL OR m.pkIdMaterial = @pkIdMaterial)
				AND (@fkIdCourse IS NULL OR m.fkIdCourse = @fkIdCourse)
				AND (@fkIdLesson IS NULL OR m.fkIdLesson = @fkIdLesson)
				AND (@fkIdTypeMaterial IS NULL OR m.fkIdTypeMaterial = @fkIdTypeMaterial)
		END
		GO

		CREATE OR ALTER PROCEDURE spMaterialsCreate
			@fkIdCourse INT, @fkIdLesson INT, @fkIdTypeMaterial INT, @title NVARCHAR(255),
			@description NVARCHAR(MAX), @fileUrl NVARCHAR(255), @link NVARCHAR(255),
			@sortOrder INT, @isAdditional BIT
		AS
		BEGIN
			BEGIN TRY
			SET NOCOUNT ON;
			IF @fkIdCourse IS NOT NULL AND NOT EXISTS (SELECT 1 FROM tbCourses WHERE pkIdCourse = @fkIdCourse)
			BEGIN
				RAISERROR('Курс %d не найден', 16, 1, @fkIdCourse);
				RETURN;
			END
			IF @fkIdLesson IS NOT NULL AND NOT EXISTS (SELECT 1 FROM tbLessons WHERE pkIdLesson = @fkIdLesson)
			BEGIN
				RAISERROR('Урок %d не найден', 16, 1, @fkIdLesson);
				RETURN;
			END
			IF @fkIdTypeMaterial IS NOT NULL AND NOT EXISTS (SELECT 1 FROM tbTypeMaterials WHERE pkIdTypeMaterial = @fkIdTypeMaterial)
			BEGIN
				RAISERROR('Тип материала %d не найден', 16, 1, @fkIdTypeMaterial);
				RETURN;
			END
			IF @fkIdLesson IS NOT NULL
			BEGIN
				IF EXISTS (SELECT 1 FROM tbMaterial WHERE fkIdLesson = @fkIdLesson AND title = @title AND isDeleted = 0)
				BEGIN
					RAISERROR('Материал с названием "%s" уже существует в данном уроке', 16, 1, @title);
					RETURN;
				END
			END
				BEGIN TRANSACTION;
				INSERT INTO tbMaterial (fkIdCourse, fkIdLesson, fkIdTypeMaterial, title, description, fileUrl, link, sortOrder, isAdditional)
				VALUES (@fkIdCourse, @fkIdLesson, @fkIdTypeMaterial, @title, @description, @fileUrl, @link, @sortOrder, @isAdditional);
				DECLARE @newMaterialId INT = SCOPE_IDENTITY();
				COMMIT TRANSACTION;
				EXEC prGetMaterialsWithTypesAndLessons @pkIdMaterial = @newMaterialId;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END
		GO

		CREATE OR ALTER PROCEDURE spMaterialsUpdate
			@pkIdMaterial INT, @fkIdCourse INT = NULL, @fkIdLesson INT = NULL, @fkIdTypeMaterial INT = NULL,
			@title NVARCHAR(255) = NULL, @description NVARCHAR(MAX) = NULL, @fileUrl NVARCHAR(255) = NULL,
			@link NVARCHAR(255) = NULL, @sortOrder INT = NULL, @isAdditional BIT = NULL
		AS
		BEGIN
			BEGIN TRY
			DECLARE @currentCourse INT, @currentLesson INT, @currentTitle NVARCHAR(255);
			SELECT @currentCourse = fkIdCourse, 
				   @currentLesson = fkIdLesson, 
				   @currentTitle = title
			FROM tbMaterial 
			WHERE pkIdMaterial = @pkIdMaterial;
			IF @currentCourse IS NULL
			BEGIN
				RAISERROR('Материал %d не найден или удалён', 16, 1, @pkIdMaterial);
				RETURN;
			END
			DECLARE @targetCourse INT = ISNULL(@fkIdCourse, @currentCourse);
			DECLARE @targetLesson INT = @fkIdLesson;  -- может быть NULL - это нормально
			DECLARE @targetTitle NVARCHAR(255) = ISNULL(@title, @currentTitle);
			IF @fkIdCourse IS NULL AND @fkIdLesson IS NULL
				SET @targetLesson = @currentLesson;
			IF @fkIdCourse IS NOT NULL AND NOT EXISTS (SELECT 1 FROM tbCourses WHERE pkIdCourse = @fkIdCourse)
			BEGIN
				RAISERROR('Курс %d не найден', 16, 1, @fkIdCourse);
				RETURN;
			END
			IF @fkIdLesson IS NOT NULL AND NOT EXISTS (SELECT 1 FROM tbLessons WHERE pkIdLesson = @fkIdLesson)
			BEGIN
				RAISERROR('Урок %d не найден', 16, 1, @fkIdLesson);
				RETURN;
			END
			IF @fkIdTypeMaterial IS NOT NULL AND NOT EXISTS (SELECT 1 FROM tbTypeMaterials WHERE pkIdTypeMaterial = @fkIdTypeMaterial)
			BEGIN
				RAISERROR('Тип материала %d не найден', 16, 1, @fkIdTypeMaterial);
				RETURN;
			END
			IF @targetLesson IS NOT NULL
			BEGIN
				IF EXISTS (SELECT 1 FROM tbMaterial WHERE fkIdLesson = @targetLesson  AND title = @targetTitle AND isDeleted = 0 AND pkIdMaterial != @pkIdMaterial)
				BEGIN
					RAISERROR('Материал с названием "%s" уже существует в данном уроке', 16, 1, @targetTitle);
					RETURN;
				END
			END
				BEGIN TRANSACTION;
				UPDATE tbMaterial
				SET fkIdCourse = ISNULL(@fkIdCourse, fkIdCourse), fkIdLesson = ISNULL(@fkIdLesson, fkIdLesson),
					fkIdTypeMaterial = ISNULL(@fkIdTypeMaterial, fkIdTypeMaterial), title = ISNULL(@title, title),
					description = ISNULL(@description, description), fileUrl = ISNULL(@fileUrl, fileUrl),
					link = ISNULL(@link, link), sortOrder = ISNULL(@sortOrder, sortOrder),
					isAdditional = ISNULL(@isAdditional, isAdditional)
				WHERE pkIdMaterial = @pkIdMaterial AND isDeleted = 0;
				IF @@ROWCOUNT = 0 
				BEGIN
					RAISERROR('Материал %d не найден или удалён', 16, 1, @pkIdMaterial);
					ROLLBACK TRANSACTION;
					RETURN;
				END
				COMMIT TRANSACTION;
				EXEC prGetMaterialsWithTypesAndLessons @pkIdMaterial = @pkIdMaterial;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END
		GO

		CREATE OR ALTER PROCEDURE spMaterialsDelete
			@pkIdMaterial INT
		AS
		BEGIN
			SET NOCOUNT ON;
			BEGIN TRY
				BEGIN TRANSACTION;
				UPDATE tbMaterial SET isDeleted = 1 WHERE pkIdMaterial = @pkIdMaterial AND isDeleted = 0;
				IF @@ROWCOUNT = 0 
				BEGIN
					RAISERROR('Материал %d не найден или уже удалён', 16, 1, @pkIdMaterial);
					ROLLBACK TRANSACTION;
					RETURN;
				END
				COMMIT TRANSACTION;
				SELECT @pkIdMaterial AS deletedId, 'Материал помечен как удалённый' AS message;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END
		GO

		CREATE OR ALTER PROCEDURE spMaterialsRestore
			@pkIdMaterial INT
		AS
		BEGIN
			SET NOCOUNT ON;
			BEGIN TRY
				BEGIN TRANSACTION;
				UPDATE tbMaterial SET isDeleted = 0 WHERE pkIdMaterial = @pkIdMaterial AND isDeleted = 1;
				IF @@ROWCOUNT = 0 
				BEGIN
					RAISERROR('Материал %d не найден или не был удалён', 16, 1, @pkIdMaterial);
					ROLLBACK TRANSACTION;
					RETURN;
				END
				COMMIT TRANSACTION;
				SELECT @pkIdMaterial AS restoredId, 'Материал восстановлен' AS message;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END
		GO

		CREATE OR ALTER PROCEDURE spMaterialsHardDelete
			@pkIdMaterial INT
		AS
		BEGIN
			SET NOCOUNT ON;
			BEGIN TRY
				IF NOT EXISTS (SELECT 1 FROM tbMaterial WHERE pkIdMaterial = @pkIdMaterial)
				BEGIN
					RAISERROR('Материал %d не найден', 16, 1, @pkIdMaterial);
					RETURN;
				END
				IF EXISTS (SELECT 1 FROM tbMaterial WHERE pkIdMaterial = @pkIdMaterial AND isDeleted = 0)
				BEGIN
					RAISERROR('Материал %d необходимо сначала пометить как удалённый', 16, 1, @pkIdMaterial);
					RETURN;
				END
				BEGIN TRANSACTION;
				DELETE FROM tbMaterial WHERE pkIdMaterial = @pkIdMaterial;
				COMMIT TRANSACTION;
				SELECT @pkIdMaterial AS deletedId, 'Материал физически удалён из базы данных' AS message;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END
		GO
	--#endregion

	--#region ===== ATTEMPT =====
		CREATE OR ALTER PROCEDURE prGetAttemptsWithUsersAndStatus
			@pkIdAttempt INT = NULL, @fkIdTask INT = NULL, @fkIdListener INT = NULL, @fkIdStatusAttempt INT = NULL, @isDeleted BIT = 0, @fkIdCourse INT = NULL
		AS BEGIN
			SET NOCOUNT ON;
			SELECT a.pkIdAttempt, a.fkIdTask, a.fkIdListener, t.fkIdLesson,
				COALESCE(t.fkIdCourse, l.fkIdCourse) AS fkIdCourse,
				t.title AS taskTitle, u.fullName AS listenerName,
				 sa.name AS statusName, a.submittedAt, a.score, a.answerText, a.answerFileUrl
			FROM tbAttempt a
			LEFT JOIN tbTasks t ON a.fkIdTask = t.pkIdTask
			LEFT JOIN tbLessons l ON t.fkIdLesson = l.pkIdLesson
			LEFT JOIN tbUsers u ON a.fkIdListener = u.pkIdUser
			LEFT JOIN tbStatusAttempt sa ON a.fkIdStatusAttempt = sa.pkIdStatusAttempt
			WHERE a.isDeleted = @isDeleted
				AND (@pkIdAttempt IS NULL OR a.pkIdAttempt = @pkIdAttempt)
				AND (@fkIdTask IS NULL OR a.fkIdTask = @fkIdTask)
				AND (@fkIdListener IS NULL OR a.fkIdListener = @fkIdListener)
				AND (@fkIdStatusAttempt IS NULL OR a.fkIdStatusAttempt = @fkIdStatusAttempt)
				AND (@fkIdCourse IS NULL OR COALESCE(t.fkIdCourse, l.fkIdCourse) = @fkIdCourse)
		END
		GO

		CREATE OR ALTER PROCEDURE spAttemptsCreate
			@fkIdTask INT, @fkIdListener INT, @fkIdStatusAttempt INT,
			@answerText NVARCHAR(MAX) = NULL, @answerFileUrl NVARCHAR(255) = NULL
		AS
		BEGIN
			BEGIN TRY
				BEGIN TRANSACTION;
				IF EXISTS (SELECT 1 FROM tbAttempt WHERE fkIdTask = @fkIdTask AND fkIdListener = @fkIdListener 
					AND isDeleted = 0 AND fkIdStatusAttempt IN (1, 2))
				BEGIN
					RAISERROR('У слушателя уже есть активная попытка по этой задаче. Завершите или удалите её перед созданием новой', 16, 1);
					ROLLBACK TRANSACTION;
					RETURN;
				END
				INSERT INTO tbAttempt (fkIdTask, fkIdListener, fkIdStatusAttempt, answerText, answerFileUrl)
				VALUES (@fkIdTask, @fkIdListener, @fkIdStatusAttempt, @answerText, @answerFileUrl);
				DECLARE @newId INT = SCOPE_IDENTITY();
				COMMIT TRANSACTION;
				EXEC prGetAttemptsWithUsersAndStatus @pkIdAttempt = @newId;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END
		GO

		CREATE OR ALTER PROCEDURE spAttemptsUpdate
			@pkIdAttempt INT, 
			@fkIdStatusAttempt INT = NULL, 
			@answerText NVARCHAR(MAX) = NULL,
			@answerFileUrl NVARCHAR(255) = NULL, 
			@score INT = NULL
		AS
		BEGIN
			SET NOCOUNT ON;
			BEGIN TRY
				BEGIN TRANSACTION;

				DECLARE @currentStatus INT, @currentScore INT, @taskId INT, @listenerId INT;
				SELECT @currentStatus = fkIdStatusAttempt,
					   @currentScore = score,
					   @taskId = fkIdTask,
					   @listenerId = fkIdListener
				FROM tbAttempt 
				WHERE pkIdAttempt = @pkIdAttempt AND isDeleted = 0;

				IF @taskId IS NULL
				BEGIN
					RAISERROR('Попытка %d не найдена или удалена', 16, 1, @pkIdAttempt);
					ROLLBACK TRANSACTION;
					RETURN;
				END

				IF @currentStatus = 3 AND (@answerText IS NOT NULL OR @answerFileUrl IS NOT NULL)
				BEGIN
					RAISERROR('Нельзя изменить ответ в завершённой попытке', 16, 1);
					ROLLBACK TRANSACTION;
					RETURN;
				END

				IF @currentStatus = 4 AND (@answerText IS NOT NULL OR @answerFileUrl IS NOT NULL)
				BEGIN
					SET @fkIdStatusAttempt = 1;
				END

				IF @score IS NOT NULL
				BEGIN
					IF @score < 0
					BEGIN
						RAISERROR(N'Оценка не может быть отрицательной', 16, 1);
						ROLLBACK TRANSACTION;
						RETURN;
					END
					DECLARE @maxTaskScore INT;
					SELECT @maxTaskScore = maxScore FROM tbTasks WHERE pkIdTask = @taskId AND isDeleted = 0;
					IF @maxTaskScore IS NOT NULL AND @score > @maxTaskScore
					BEGIN
						RAISERROR(N'Оценка должна быть от 0 до %d (максимум задания)', 16, 1, @maxTaskScore);
						ROLLBACK TRANSACTION;
						RETURN;
					END
				END

				UPDATE tbAttempt
				SET fkIdStatusAttempt = ISNULL(@fkIdStatusAttempt, fkIdStatusAttempt),
					answerText = ISNULL(@answerText, answerText),
					answerFileUrl = ISNULL(@answerFileUrl, answerFileUrl),
					score = ISNULL(@score, score)
				WHERE pkIdAttempt = @pkIdAttempt;

				COMMIT TRANSACTION;
				EXEC prGetAttemptsWithUsersAndStatus @pkIdAttempt = @pkIdAttempt;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				THROW;
			END CATCH
		END
		GO

		CREATE OR ALTER PROCEDURE spAttemptsDelete
			@pkIdAttempt INT
		AS
		BEGIN
			SET NOCOUNT ON;
			BEGIN TRY
				BEGIN TRANSACTION;
				UPDATE tbTestAnswers SET isDeleted = 1 WHERE fkIdAttempt = @pkIdAttempt AND isDeleted = 0;
				UPDATE tbComment SET isDeleted = 1 WHERE fkIdAttempt = @pkIdAttempt AND isDeleted = 0;
				UPDATE tbAttempt SET isDeleted = 1 WHERE pkIdAttempt = @pkIdAttempt AND isDeleted = 0;
				IF @@ROWCOUNT = 0 
				BEGIN
					RAISERROR('Попытка %d не найдена или уже удалена', 16, 1, @pkIdAttempt);
					ROLLBACK TRANSACTION;
					RETURN;
				END
				COMMIT TRANSACTION;
				SELECT @pkIdAttempt AS deletedId, 'Попытка помечена как удалённая' AS message;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END
		GO

		CREATE OR ALTER PROCEDURE spAttemptsRestore
			@pkIdAttempt INT
		AS
		BEGIN
			SET NOCOUNT ON;
			BEGIN TRY
				BEGIN TRANSACTION;

				DECLARE @taskId INT, @listenerId INT, @attemptStatus INT;
        
				SELECT @taskId = fkIdTask, 
					   @listenerId = fkIdListener,
					   @attemptStatus = fkIdStatusAttempt
				FROM tbAttempt 
				WHERE pkIdAttempt = @pkIdAttempt AND isDeleted = 1;

				IF @taskId IS NULL
				BEGIN
					RAISERROR('Попытка %d не найдена или не была удалена', 16, 1, @pkIdAttempt);
					ROLLBACK TRANSACTION;
					RETURN;
				END

				IF @attemptStatus IN (1, 2) 
				   AND EXISTS (
					   SELECT 1 FROM tbAttempt 
					   WHERE fkIdTask = @taskId 
					   AND fkIdListener = @listenerId 
					   AND pkIdAttempt != @pkIdAttempt
					   AND isDeleted = 0
					   AND fkIdStatusAttempt IN (1, 2)
				   )
				BEGIN
					RAISERROR('Нельзя восстановить: у слушателя уже есть активная попытка по этой задаче', 16, 1);
					ROLLBACK TRANSACTION;
					RETURN;
				END

				UPDATE tbAttempt 
				SET isDeleted = 0 
				WHERE pkIdAttempt = @pkIdAttempt;

				COMMIT TRANSACTION;
				SELECT @pkIdAttempt AS restoredId, 'Попытка восстановлена' AS message;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				THROW;
			END CATCH
		END
		GO

		CREATE OR ALTER PROCEDURE spAttemptsHardDelete
			@pkIdAttempt INT
		AS
		BEGIN
			SET NOCOUNT ON;
			BEGIN TRY
				IF NOT EXISTS (SELECT 1 FROM tbAttempt WHERE pkIdAttempt = @pkIdAttempt)
				BEGIN
					RAISERROR('Попытка %d не найдена', 16, 1, @pkIdAttempt);
					RETURN;
				END
				IF EXISTS (SELECT 1 FROM tbAttempt WHERE pkIdAttempt = @pkIdAttempt AND isDeleted = 0)
				BEGIN
					RAISERROR('Попытка %d необходимо сначала пометить как удалённую', 16, 1, @pkIdAttempt);
					RETURN;
				END
				BEGIN TRANSACTION;
				DELETE FROM tbTestAnswers WHERE fkIdAttempt = @pkIdAttempt;
				DELETE FROM tbComment WHERE fkIdAttempt = @pkIdAttempt;
				DELETE FROM tbAttempt WHERE pkIdAttempt = @pkIdAttempt;
				COMMIT TRANSACTION;
				SELECT @pkIdAttempt AS deletedId, 'Попытка физически удалена из базы данных' AS message;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END
		GO
	--#endregion

	--#region ===== TEST-QUESTIONS =====
		CREATE OR ALTER PROCEDURE prGetTestQuestionsWithOptions
			@pkIdQuestion INT = NULL, @fkIdTest INT = NULL, @isDeleted BIT = 0
		AS BEGIN
			SELECT tq.pkIdQuestion, tq.fkIdTest, tq.questionText, tq.score, tq.sortOrder AS questionSortOrder,
				   tto.pkIdOption, tto.optionText, tto.isCorrect, tto.sortOrder AS optionSortOrder
			FROM tbTestQuestions tq
			LEFT JOIN tbTestOptions tto ON tq.pkIdQuestion = tto.fkIdQuestion
			WHERE tq.isDeleted = @isDeleted
			  AND (@pkIdQuestion IS NULL OR tq.pkIdQuestion = @pkIdQuestion)
			  AND (@fkIdTest IS NULL OR tq.fkIdTest = @fkIdTest)
			ORDER BY tq.sortOrder, tto.sortOrder
		END;
		GO

		CREATE OR ALTER PROCEDURE spTestQuestionCreate
			@fkIdTest INT, @questionText NVARCHAR(MAX), @score INT = 1, @sortOrder INT = 0
		AS 
		BEGIN
		SET NOCOUNT ON;
			IF NOT EXISTS (SELECT 1 FROM tbTest WHERE pkIdTest = @fkIdTest AND isDeleted = 0)
		BEGIN
			RAISERROR('Тест %d не найден или удалён', 16, 1, @fkIdTest);
			RETURN;
		END
    
		IF EXISTS (SELECT 1 FROM tbTestQuestions WHERE fkIdTest = @fkIdTest AND questionText = @questionText AND isDeleted = 0)
		BEGIN
			RAISERROR('Вопрос с таким текстом уже существует в данном тесте', 16, 1);
			RETURN;
		END

		DECLARE @deletedId INT;
		SELECT @deletedId = pkIdQuestion FROM tbTestQuestions WHERE fkIdTest = @fkIdTest AND questionText = @questionText AND isDeleted = 1;

		IF @deletedId IS NOT NULL
		BEGIN
			RAISERROR('Такой вопрос ранее существовал и был удалён (ID=%d). Используйте восстановление.', 16, 1, @deletedId);
			RETURN;
		END
			BEGIN TRY
				BEGIN TRANSACTION;
				INSERT INTO tbTestQuestions (fkIdTest, questionText, score, sortOrder, isDeleted)
				VALUES (@fkIdTest, @questionText, @score, @sortOrder, 0);
				DECLARE @newId INT = SCOPE_IDENTITY();
				COMMIT TRANSACTION;
				EXEC prGetTestQuestionsWithOptions @pkIdQuestion = @newId;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END;
		GO

		CREATE OR ALTER PROCEDURE spTestQuestionUpdate
			@pkIdQuestion INT, @fkIdTest INT = NULL, @questionText NVARCHAR(MAX) = NULL, @score INT = NULL, @sortOrder INT = NULL
		AS 
		BEGIN
		DECLARE @currentTest INT, @currentText NVARCHAR(MAX);
		SELECT @currentTest = fkIdTest, 
			   @currentText = questionText
		FROM tbTestQuestions 
		WHERE pkIdQuestion = @pkIdQuestion AND isDeleted = 0;

		IF @currentTest IS NULL
		BEGIN
			RAISERROR('Вопрос %d не найден или удалён', 16, 1, @pkIdQuestion);
			RETURN;
		END
    
		DECLARE @targetTest INT = ISNULL(@fkIdTest, @currentTest);
		DECLARE @targetText NVARCHAR(MAX) = ISNULL(@questionText, @currentText);

		IF (@targetTest != @currentTest OR @targetText != @currentText)
		BEGIN
			IF @fkIdTest IS NOT NULL AND NOT EXISTS (SELECT 1 FROM tbTest WHERE pkIdTest = @fkIdTest AND isDeleted = 0)
			BEGIN
				RAISERROR('Тест %d не найден или удалён', 16, 1, @fkIdTest);
				RETURN;
			END

			IF EXISTS (SELECT 1 FROM tbTestQuestions WHERE fkIdTest = @targetTest AND questionText = @targetText AND isDeleted = 0 AND pkIdQuestion != @pkIdQuestion)
			BEGIN
				RAISERROR('Вопрос с таким текстом уже существует в данном тесте', 16, 1);
				RETURN;
			END
		 END
			BEGIN TRY
				BEGIN TRANSACTION;
				UPDATE tbTestQuestions 
				SET fkIdTest = ISNULL(@fkIdTest, fkIdTest),
					questionText = ISNULL(@questionText, questionText),
					score = ISNULL(@score, score),
					sortOrder = ISNULL(@sortOrder, sortOrder)
				WHERE pkIdQuestion = @pkIdQuestion;
				IF @@ROWCOUNT = 0 
				BEGIN
					RAISERROR('Вопрос %d не найден', 16, 1, @pkIdQuestion);
					ROLLBACK TRANSACTION;
					RETURN;
				END
				COMMIT TRANSACTION;
				EXEC prGetTestQuestionsWithOptions @pkIdQuestion = @pkIdQuestion;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END;
		GO

		CREATE OR ALTER PROCEDURE spTestQuestionDelete 
			@pkIdQuestion INT
		AS 
		BEGIN
			SET NOCOUNT ON;
			BEGIN TRY
				BEGIN TRANSACTION;
				UPDATE tbTestOptions SET isDeleted = 1 WHERE fkIdQuestion = @pkIdQuestion AND isDeleted = 0;
				UPDATE tbTestAnswers SET isDeleted = 1 WHERE fkIdQuestion = @pkIdQuestion AND isDeleted = 0;
				UPDATE tbTestQuestions SET isDeleted = 1 WHERE pkIdQuestion = @pkIdQuestion;
				IF @@ROWCOUNT = 0 
				BEGIN
					RAISERROR('Вопрос %d не найден или уже удалён', 16, 1, @pkIdQuestion);
					ROLLBACK TRANSACTION;
					RETURN;
				END
				COMMIT TRANSACTION;
				SELECT @pkIdQuestion AS deletedId, 'Вопрос помечен как удалённый' AS message;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END;
		GO

		CREATE OR ALTER PROCEDURE spTestQuestionRestore 
			@pkIdQuestion INT
		AS 
		BEGIN
			SET NOCOUNT ON;
			BEGIN TRY
				BEGIN TRANSACTION;
				UPDATE tbTestQuestions SET isDeleted = 0 WHERE pkIdQuestion = @pkIdQuestion AND isDeleted = 1;
				IF @@ROWCOUNT = 0 
				BEGIN
					RAISERROR('Вопрос %d не найден или не был удалён', 16, 1, @pkIdQuestion);
					ROLLBACK TRANSACTION;
					RETURN;
				END
				COMMIT TRANSACTION;
				SELECT @pkIdQuestion AS restoredId, 'Вопрос восстановлен' AS message;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END;
		GO

		CREATE OR ALTER PROCEDURE spTestQuestionsHardDelete
			@pkIdQuestion INT
		AS
		BEGIN
			SET NOCOUNT ON;
			BEGIN TRY
				IF NOT EXISTS (SELECT 1 FROM tbTestQuestions WHERE pkIdQuestion = @pkIdQuestion)
				BEGIN
					RAISERROR('Вопрос %d не найден', 16, 1, @pkIdQuestion);
					RETURN;
				END
				IF EXISTS (SELECT 1 FROM tbTestQuestions WHERE pkIdQuestion = @pkIdQuestion AND isDeleted = 0)
				BEGIN
					RAISERROR('Вопрос %d необходимо сначала пометить как удалённый', 16, 1, @pkIdQuestion);
					RETURN;
				END
				BEGIN TRANSACTION;
				DELETE FROM tbTestAnswers WHERE fkIdQuestion = @pkIdQuestion;
				DELETE FROM tbTestOptions WHERE fkIdQuestion = @pkIdQuestion;
				DELETE FROM tbTestQuestions WHERE pkIdQuestion = @pkIdQuestion;
				COMMIT TRANSACTION;
				SELECT @pkIdQuestion AS deletedId, 'Вопрос физически удалён' AS message;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END
		GO
		--#endregion

	--#region ===== TEST =====
		CREATE OR ALTER PROCEDURE prGetTestsWithTasks
			@pkIdTest INT = NULL, @fkIdTask INT = NULL, @isDeleted BIT = 0
		AS BEGIN
			SELECT t.pkIdTest, t.timeLimitMinutes, t.shuffleQuestions, t.maxAttempts, t.showResults,
				t.passingScorePercent,task.title AS taskTitle
			FROM tbTest t 
			LEFT JOIN tbTasks task ON t.pkIdTest = task.fkIdTest AND task.isDeleted = 0
			WHERE t.isDeleted = @isDeleted 
				  AND (@pkIdTest IS NULL OR t.pkIdTest = @pkIdTest)
				  AND (@fkIdTask IS NULL OR task.pkIdTask = @fkIdTask) 
		END;
		GO

		CREATE OR ALTER PROCEDURE spTestCreate 
			@timeLimitMinutes INT = NULL, @shuffleQuestions BIT = 0, @maxAttempts INT = NULL, @showResults BIT = 0, @passingScorePercent INT = NULL
		AS 
		BEGIN
			BEGIN TRY
			IF @passingScorePercent IS NOT NULL AND (@passingScorePercent < 0 OR @passingScorePercent > 100)
			BEGIN
				RAISERROR('Проходной балл должен быть между 0 и 100 процентами', 16, 1);
				RETURN;
			END
    
			IF @timeLimitMinutes IS NOT NULL AND @timeLimitMinutes <= 0
			BEGIN
				RAISERROR('Лимит времени должен быть больше 0 минут', 16, 1);
				RETURN;
			END
    
			IF @maxAttempts IS NOT NULL AND @maxAttempts <= 0
			BEGIN
				RAISERROR('Максимальное количество попыток должно быть больше 0', 16, 1);
				RETURN;
			END
				BEGIN TRANSACTION;
				INSERT INTO tbTest (timeLimitMinutes, shuffleQuestions, maxAttempts, showResults, passingScorePercent, isDeleted)
				VALUES (@timeLimitMinutes, @shuffleQuestions, @maxAttempts, @showResults, @passingScorePercent, 0);
				DECLARE @newId INT = SCOPE_IDENTITY();
				COMMIT TRANSACTION;
				EXEC prGetTestsWithTasks @pkIdTest = @newId;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END;
		GO

		CREATE OR ALTER PROCEDURE spTestUpdate
			@pkIdTest INT, @timeLimitMinutes INT = NULL, @shuffleQuestions BIT = NULL, @maxAttempts INT = NULL, @showResults BIT = NULL, @passingScorePercent INT = NULL
		AS 
		BEGIN
			BEGIN TRY
			IF NOT EXISTS (SELECT 1 FROM tbTest WHERE pkIdTest = @pkIdTest AND isDeleted = 0)
			BEGIN
				RAISERROR('Тест %d не найден или удалён', 16, 1, @pkIdTest);
				RETURN;
			END
    
			IF @passingScorePercent IS NOT NULL AND (@passingScorePercent < 0 OR @passingScorePercent > 100)
			BEGIN
				RAISERROR('Проходной балл должен быть между 0 и 100 процентами', 16, 1);
				RETURN;
			END
    
			IF @timeLimitMinutes IS NOT NULL AND @timeLimitMinutes <= 0
			BEGIN
				RAISERROR('Лимит времени должен быть больше 0 минут', 16, 1);
				RETURN;
			END
    
			IF @maxAttempts IS NOT NULL AND @maxAttempts <= 0
			BEGIN
				RAISERROR('Максимальное количество попыток должно быть больше 0', 16, 1);
				RETURN;
			END
				BEGIN TRANSACTION;
				UPDATE tbTest 
				SET timeLimitMinutes = ISNULL(@timeLimitMinutes, timeLimitMinutes), 
					shuffleQuestions = ISNULL(@shuffleQuestions, shuffleQuestions),
					maxAttempts = ISNULL(@maxAttempts, maxAttempts), 
					showResults = ISNULL(@showResults, showResults),
					passingScorePercent = ISNULL(@passingScorePercent, passingScorePercent)
				WHERE pkIdTest = @pkIdTest;
				IF @@ROWCOUNT = 0 
				BEGIN
					RAISERROR('Тест %d не найден', 16, 1, @pkIdTest);
					ROLLBACK TRANSACTION;
					RETURN;
				END
				COMMIT TRANSACTION;
				EXEC prGetTestsWithTasks @pkIdTest = @pkIdTest;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END;
		GO

		CREATE OR ALTER PROCEDURE spTestDelete 
			@pkIdTest INT
		AS 
		BEGIN
			SET NOCOUNT ON;
			BEGIN TRY
				BEGIN TRANSACTION;
				UPDATE tbTestQuestions SET isDeleted = 1 WHERE fkIdTest = @pkIdTest AND isDeleted = 0;
				UPDATE tbTest SET isDeleted = 1 WHERE pkIdTest = @pkIdTest AND isDeleted = 0;
				IF @@ROWCOUNT = 0 
				BEGIN
					RAISERROR('Тест %d не найден или уже удалён', 16, 1, @pkIdTest);
					ROLLBACK TRANSACTION;
					RETURN;
				END
				COMMIT TRANSACTION;
				SELECT @pkIdTest AS deletedId, 'Тест помечен как удалённый' AS message;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END;
		GO

		CREATE OR ALTER PROCEDURE spTestRestore 
			@pkIdTest INT
		AS 
		BEGIN
			SET NOCOUNT ON;
			BEGIN TRY
				BEGIN TRANSACTION;
				UPDATE tbTest SET isDeleted = 0 WHERE pkIdTest = @pkIdTest AND isDeleted = 1;
				IF @@ROWCOUNT = 0 
				BEGIN
					RAISERROR('Тест %d не найден или не был удалён', 16, 1, @pkIdTest);
					ROLLBACK TRANSACTION;
					RETURN;
				END
				COMMIT TRANSACTION;
				SELECT @pkIdTest AS restoredId, 'Тест восстановлен' AS message;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END;
		GO

		CREATE OR ALTER PROCEDURE spTestHardDelete 
			@pkIdTest INT
		AS 
		BEGIN
			SET NOCOUNT ON;
			BEGIN TRY
				IF NOT EXISTS (SELECT 1 FROM tbTest WHERE pkIdTest = @pkIdTest)
				BEGIN
					RAISERROR('Тест %d не найден', 16, 1, @pkIdTest);
					RETURN;
				END
				IF EXISTS (SELECT 1 FROM tbTest WHERE pkIdTest = @pkIdTest AND isDeleted = 0)
				BEGIN
					RAISERROR('Тест %d необходимо сначала пометить как удалённый', 16, 1, @pkIdTest);
					RETURN;
				END
				BEGIN TRANSACTION;
				DELETE FROM tbTestAnswers WHERE fkIdAttempt IN (SELECT pkIdAttempt FROM tbAttempt WHERE fkIdTask IN (SELECT pkIdTask FROM tbTasks WHERE fkIdTest = @pkIdTest));
				DELETE FROM tbComment WHERE fkIdAttempt IN (SELECT pkIdAttempt FROM tbAttempt WHERE fkIdTask IN (SELECT pkIdTask FROM tbTasks WHERE fkIdTest = @pkIdTest));
				DELETE FROM tbAttempt WHERE fkIdTask IN (SELECT pkIdTask FROM tbTasks WHERE fkIdTest = @pkIdTest);
				DELETE FROM tbTestOptions WHERE fkIdQuestion IN (SELECT pkIdQuestion FROM tbTestQuestions WHERE fkIdTest = @pkIdTest);
				DELETE FROM tbTestQuestions WHERE fkIdTest = @pkIdTest;
				UPDATE tbTasks SET fkIdTest = NULL WHERE fkIdTest = @pkIdTest;
				DELETE FROM tbTest WHERE pkIdTest = @pkIdTest;
				COMMIT TRANSACTION;
				SELECT @pkIdTest AS deletedId, 'Тест физически удалён' AS message;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END;
		GO
	--#endregion

	--#region ===== TEST-ANSWERS =====
		CREATE OR ALTER PROCEDURE prGetTestAnswersWithDetails
			@pkIdTestAnswer INT = NULL, @fkIdAttempt INT = NULL, @fkIdQuestion INT = NULL, @isDeleted BIT = 0
		AS BEGIN
			SELECT ta.pkIdTestAnswer, ta.answeredAt, u.fullName AS listenerName,
				   tq.questionText, tto.optionText, tto.isCorrect
			FROM tbTestAnswers ta
			LEFT JOIN tbAttempt a ON ta.fkIdAttempt = a.pkIdAttempt
			LEFT JOIN tbUsers u ON a.fkIdListener = u.pkIdUser
			LEFT JOIN tbTestQuestions tq ON ta.fkIdQuestion = tq.pkIdQuestion
			LEFT JOIN tbTestOptions tto ON ta.fkIdSelectedOption = tto.pkIdOption
			WHERE ta.fkIdAttempt IS NOT NULL
			  AND (@pkIdTestAnswer IS NULL OR ta.pkIdTestAnswer = @pkIdTestAnswer)
			  AND (@fkIdAttempt IS NULL OR ta.fkIdAttempt = @fkIdAttempt)
			  AND (@fkIdQuestion IS NULL OR ta.fkIdQuestion = @fkIdQuestion);
		END;
		GO

		CREATE OR ALTER PROCEDURE spTestAnswerCreate
			@fkIdAttempt INT, @fkIdQuestion INT, @fkIdSelectedOption INT
		AS 
		BEGIN
			BEGIN TRY
			IF NOT EXISTS (SELECT 1 FROM tbAttempt WHERE pkIdAttempt = @fkIdAttempt AND isDeleted = 0)
			BEGIN
				RAISERROR('Попытка %d не найдена или удалена', 16, 1, @fkIdAttempt);
				RETURN;
			END
    
			IF NOT EXISTS (SELECT 1 FROM tbTestQuestions WHERE pkIdQuestion = @fkIdQuestion AND isDeleted = 0)
			BEGIN
				RAISERROR('Вопрос %d не найден или удален', 16, 1, @fkIdQuestion);
				RETURN;
			END
    
			IF NOT EXISTS (SELECT 1 FROM tbTestOptions WHERE pkIdOption = @fkIdSelectedOption AND isDeleted = 0)
			BEGIN
				RAISERROR('Вариант ответа %d не найден или удален', 16, 1, @fkIdSelectedOption);
				RETURN;
			END
    
			IF NOT EXISTS ( SELECT 1 FROM tbAttempt a JOIN tbTasks t ON a.fkIdTask = t.pkIdTask JOIN tbTestQuestions tq ON t.fkIdTest = tq.fkIdTest WHERE a.pkIdAttempt = @fkIdAttempt AND tq.pkIdQuestion = @fkIdQuestion)
			BEGIN
				RAISERROR('Данный вопрос не относится к тесту данной попытки', 16, 1);
				RETURN;
			END
    
			IF NOT EXISTS (SELECT 1 FROM tbTestOptions WHERE pkIdOption = @fkIdSelectedOption AND fkIdQuestion = @fkIdQuestion
			)
			BEGIN
				RAISERROR('Выбранный вариант ответа не принадлежит к данному вопросу', 16, 1);
				RETURN;
			END

			IF EXISTS (SELECT 1 FROM tbTestAnswers WHERE fkIdAttempt = @fkIdAttempt AND fkIdQuestion = @fkIdQuestion AND isDeleted = 0)
			BEGIN
				RAISERROR('На данный вопрос уже дан ответ в рамках этой попытки', 16, 1);
				RETURN;
			END
				BEGIN TRANSACTION;
				INSERT INTO tbTestAnswers (fkIdAttempt, fkIdQuestion, fkIdSelectedOption)
				VALUES (@fkIdAttempt, @fkIdQuestion, @fkIdSelectedOption);
				DECLARE @newId INT = SCOPE_IDENTITY();
				COMMIT TRANSACTION;
				EXEC prGetTestAnswersWithDetails @pkIdTestAnswer = @newId;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END;
		GO

		CREATE OR ALTER PROCEDURE spTestAnswersBulkCreate
			@fkIdAttempt INT,
			@answersJson NVARCHAR(MAX)
		AS
		BEGIN
			SET NOCOUNT ON;
			DECLARE @insertedCount INT = 0;
			DECLARE @lastId INT = 0;
			DECLARE @questionId INT;
			DECLARE @optionId INT;

			BEGIN TRY
				IF NOT EXISTS (SELECT 1 FROM tbAttempt WHERE pkIdAttempt = @fkIdAttempt AND isDeleted = 0)
				BEGIN
					RAISERROR('Попытка %d не найдена или удалена', 16, 1, @fkIdAttempt);
					RETURN;
				END

				IF @answersJson IS NULL OR LTRIM(RTRIM(@answersJson)) = '' OR ISJSON(@answersJson) <> 1
				BEGIN
					RAISERROR('Некорректный JSON с ответами', 16, 1);
					RETURN;
				END

				BEGIN TRANSACTION;

				DECLARE answer_cursor CURSOR LOCAL FAST_FORWARD FOR
					SELECT questionId, optionId
					FROM OPENJSON(@answersJson)
					WITH (
						questionId INT '$.questionId',
						optionId INT '$.optionId'
					);

				OPEN answer_cursor;
				FETCH NEXT FROM answer_cursor INTO @questionId, @optionId;

				WHILE @@FETCH_STATUS = 0
				BEGIN
					IF NOT EXISTS (SELECT 1 FROM tbTestQuestions WHERE pkIdQuestion = @questionId AND isDeleted = 0)
					BEGIN
						RAISERROR('Вопрос %d не найден или удален', 16, 1, @questionId);
						ROLLBACK TRANSACTION;
						CLOSE answer_cursor;
						DEALLOCATE answer_cursor;
						RETURN;
					END

					IF NOT EXISTS (SELECT 1 FROM tbTestOptions WHERE pkIdOption = @optionId AND isDeleted = 0)
					BEGIN
						RAISERROR('Вариант ответа %d не найден или удален', 16, 1, @optionId);
						ROLLBACK TRANSACTION;
						CLOSE answer_cursor;
						DEALLOCATE answer_cursor;
						RETURN;
					END

					IF NOT EXISTS (
						SELECT 1
						FROM tbAttempt a
						JOIN tbTasks t ON a.fkIdTask = t.pkIdTask
						JOIN tbTestQuestions tq ON t.fkIdTest = tq.fkIdTest
						WHERE a.pkIdAttempt = @fkIdAttempt AND tq.pkIdQuestion = @questionId
					)
					BEGIN
						RAISERROR('Вопрос %d не относится к тесту данной попытки', 16, 1, @questionId);
						ROLLBACK TRANSACTION;
						CLOSE answer_cursor;
						DEALLOCATE answer_cursor;
						RETURN;
					END

					IF NOT EXISTS (
						SELECT 1 FROM tbTestOptions
						WHERE pkIdOption = @optionId AND fkIdQuestion = @questionId
					)
					BEGIN
						RAISERROR('Вариант ответа не принадлежит к данному вопросу', 16, 1);
						ROLLBACK TRANSACTION;
						CLOSE answer_cursor;
						DEALLOCATE answer_cursor;
						RETURN;
					END

					IF EXISTS (
						SELECT 1 FROM tbTestAnswers
						WHERE fkIdAttempt = @fkIdAttempt AND fkIdQuestion = @questionId AND isDeleted = 0
					)
					BEGIN
						RAISERROR('На вопрос %d уже дан ответ в рамках этой попытки', 16, 1, @questionId);
						ROLLBACK TRANSACTION;
						CLOSE answer_cursor;
						DEALLOCATE answer_cursor;
						RETURN;
					END

					INSERT INTO tbTestAnswers (fkIdAttempt, fkIdQuestion, fkIdSelectedOption)
					VALUES (@fkIdAttempt, @questionId, @optionId);
					SET @lastId = SCOPE_IDENTITY();
					SET @insertedCount = @insertedCount + 1;

					FETCH NEXT FROM answer_cursor INTO @questionId, @optionId;
				END

				CLOSE answer_cursor;
				DEALLOCATE answer_cursor;

				COMMIT TRANSACTION;
				SELECT @lastId AS lastId, @insertedCount AS insertedCount;
			END TRY
			BEGIN CATCH
				IF CURSOR_STATUS('local', 'answer_cursor') >= 0
				BEGIN
					CLOSE answer_cursor;
					DEALLOCATE answer_cursor;
				END
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END;
		GO

		CREATE OR ALTER PROCEDURE spTestAnswerUpdate
			@pkIdTestAnswer INT, @fkIdAttempt INT = NULL, @fkIdQuestion INT = NULL, @fkIdSelectedOption INT = NULL
		AS 
		BEGIN
			BEGIN TRY
			DECLARE @currentAttempt INT, @currentQuestion INT;
			SELECT @currentAttempt = fkIdAttempt, 
				   @currentQuestion = fkIdQuestion
			FROM tbTestAnswers 
			WHERE pkIdTestAnswer = @pkIdTestAnswer AND isDeleted = 0;

			IF @currentAttempt IS NULL
			BEGIN
				RAISERROR('Ответ %d не найден или удален', 16, 1, @pkIdTestAnswer);
				RETURN;
			END
    
			DECLARE @targetAttempt INT = ISNULL(@fkIdAttempt, @currentAttempt);
			DECLARE @targetQuestion INT = ISNULL(@fkIdQuestion, @currentQuestion);
			DECLARE @targetOption INT = @fkIdSelectedOption;

			IF (@targetAttempt != @currentAttempt OR @targetQuestion != @currentQuestion)
			BEGIN
				IF EXISTS (SELECT 1 FROM tbTestAnswers WHERE fkIdAttempt = @targetAttempt  AND fkIdQuestion = @targetQuestion  AND isDeleted = 0 AND pkIdTestAnswer != @pkIdTestAnswer)
				BEGIN
					RAISERROR('На данный вопрос уже дан ответ в рамках целевой попытки', 16, 1);
					RETURN;
				END
        
				IF @fkIdAttempt IS NOT NULL AND NOT EXISTS (SELECT 1 FROM tbAttempt WHERE pkIdAttempt = @fkIdAttempt AND isDeleted = 0)
				BEGIN
					RAISERROR('Попытка %d не найдена или удалена', 16, 1, @fkIdAttempt);
					RETURN;
				END
        
				IF @fkIdQuestion IS NOT NULL AND NOT EXISTS (SELECT 1 FROM tbTestQuestions WHERE pkIdQuestion = @fkIdQuestion AND isDeleted = 0)
				BEGIN
					RAISERROR('Вопрос %d не найден или удален', 16, 1, @fkIdQuestion);
					RETURN;
				END
			END
    
			IF @targetOption IS NOT NULL
			BEGIN
				IF NOT EXISTS (SELECT 1 FROM tbTestOptions WHERE pkIdOption = @targetOption AND isDeleted = 0)
				BEGIN
					RAISERROR('Вариант ответа %d не найден или удален', 16, 1, @targetOption);
					RETURN;
				END
        
				IF NOT EXISTS (SELECT 1 FROM tbTestOptions WHERE pkIdOption = @targetOption AND fkIdQuestion = @targetQuestion)
				BEGIN
					RAISERROR('Выбранный вариант ответа не принадлежит к данному вопросу', 16, 1);
					RETURN;
				END
			END
				BEGIN TRANSACTION;
				UPDATE tbTestAnswers 
				SET fkIdAttempt = ISNULL(@fkIdAttempt, fkIdAttempt),
					fkIdQuestion = ISNULL(@fkIdQuestion, fkIdQuestion),
					fkIdSelectedOption = ISNULL(@fkIdSelectedOption, fkIdSelectedOption)
				WHERE pkIdTestAnswer = @pkIdTestAnswer;
				IF @@ROWCOUNT = 0 
				BEGIN
					RAISERROR('Ответ %d не найден', 16, 1, @pkIdTestAnswer);
					ROLLBACK TRANSACTION;
					RETURN;
				END
				COMMIT TRANSACTION;
				EXEC prGetTestAnswersWithDetails @pkIdTestAnswer = @pkIdTestAnswer;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END;
		GO

		CREATE OR ALTER PROCEDURE spTestAnswerDelete
		@pkIdTestAnswer INT
		AS 
		BEGIN
			SET NOCOUNT ON;
			BEGIN TRY
				BEGIN TRANSACTION;
				UPDATE tbTestAnswers SET isDeleted = 1 WHERE pkIdTestAnswer = @pkIdTestAnswer AND isDeleted = 0;
				IF @@ROWCOUNT = 0 
				BEGIN
					RAISERROR('Ответ %d не найден или уже удалён', 16, 1, @pkIdTestAnswer);
					ROLLBACK TRANSACTION;
					RETURN;
				END
				COMMIT TRANSACTION;
				SELECT @pkIdTestAnswer AS deletedId, 'Ответ на вопрос помечен как удалённый' AS message;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END;
		GO

		CREATE OR ALTER PROCEDURE spTestAnswerRestore
			@pkIdTestAnswer INT
		AS 
		BEGIN
			SET NOCOUNT ON;
			BEGIN TRY
				BEGIN TRANSACTION;
				UPDATE tbTestAnswers SET isDeleted = 0 WHERE pkIdTestAnswer = @pkIdTestAnswer AND isDeleted = 1;
				IF @@ROWCOUNT = 0 
				BEGIN
					RAISERROR('Ответ %d не найден или не был удалён', 16, 1, @pkIdTestAnswer);
					ROLLBACK TRANSACTION;
					RETURN;
				END
				COMMIT TRANSACTION;
				SELECT @pkIdTestAnswer AS restoredId, 'Ответ на вопрос восстановлен' AS message;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END;
		GO

		CREATE OR ALTER PROCEDURE spTestAnswerHardDelete
			@pkIdTestAnswer INT
		AS 
		BEGIN
			SET NOCOUNT ON;
			BEGIN TRY
				IF NOT EXISTS (SELECT 1 FROM tbTestAnswers WHERE pkIdTestAnswer = @pkIdTestAnswer)
				BEGIN
					RAISERROR('Ответ %d не найден', 16, 1, @pkIdTestAnswer);
					RETURN;
				END
				IF EXISTS (SELECT 1 FROM tbTestAnswers WHERE pkIdTestAnswer = @pkIdTestAnswer AND isDeleted = 0)
				BEGIN
					RAISERROR('Ответ %d необходимо сначала пометить как удалённый', 16, 1, @pkIdTestAnswer);
					RETURN;
				END
				BEGIN TRANSACTION;
				DELETE FROM tbTestAnswers WHERE pkIdTestAnswer = @pkIdTestAnswer;
				COMMIT TRANSACTION;
				SELECT @pkIdTestAnswer AS deletedId, 'Ответ на вопрос физически удалён' AS message;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END;
		GO
	--#endregion

	--#region ===== TEST-OPTIONS =====
		CREATE OR ALTER PROCEDURE prGetTestOptions
			@pkIdOption INT = NULL, 
			@fkIdQuestion INT = NULL, 
			@isDeleted BIT = 0
		AS 
		BEGIN
			SET NOCOUNT ON;
    
			SELECT pkIdOption, fkIdQuestion, optionText, isCorrect, sortOrder, isDeleted
			FROM tbTestOptions 
			WHERE isDeleted = @isDeleted
			  AND (@pkIdOption IS NULL OR pkIdOption = @pkIdOption)
			  AND (@fkIdQuestion IS NULL OR fkIdQuestion = @fkIdQuestion)
			ORDER BY fkIdQuestion, sortOrder, pkIdOption;
		END;
		GO

		CREATE OR ALTER PROCEDURE spTestOptionCreate
			@fkIdQuestion INT, @optionText NVARCHAR(500), @isCorrect BIT = 0, @sortOrder INT = 0
		AS 
		BEGIN
			BEGIN TRY
				IF NOT EXISTS (SELECT 1 FROM tbTestQuestions WHERE pkIdQuestion = @fkIdQuestion AND isDeleted = 0)
			BEGIN
				RAISERROR('Вопрос %d не найден или удалён', 16, 1, @fkIdQuestion);
				RETURN;
			END
    
			IF EXISTS ( SELECT 1 FROM tbTestOptions  WHERE fkIdQuestion = @fkIdQuestion AND optionText = @optionText AND isDeleted = 0)
			BEGIN
				RAISERROR('Вариант ответа с таким текстом уже существует для данного вопроса', 16, 1);
				RETURN;
			END

			DECLARE @deletedId INT;
			SELECT @deletedId = pkIdOption FROM tbTestOptions WHERE fkIdQuestion = @fkIdQuestion AND optionText = @optionText AND isDeleted = 1;

			IF @deletedId IS NOT NULL
			BEGIN
				RAISERROR('Такой вариант ответа ранее существовал и был удалён (ID=%d). Используйте восстановление.', 16, 1, @deletedId);
				RETURN;
			END
				BEGIN TRANSACTION;
				INSERT INTO tbTestOptions (fkIdQuestion, optionText, isCorrect, sortOrder, isDeleted)
				VALUES (@fkIdQuestion, @optionText, @isCorrect, @sortOrder, 0);
				DECLARE @newId INT = SCOPE_IDENTITY();
				COMMIT TRANSACTION;
				EXEC prGetTestOptions @pkIdOption = @newId;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END;
		GO

		CREATE OR ALTER PROCEDURE spTestOptionUpdate
			@pkIdOption INT, @fkIdQuestion INT = NULL, @optionText NVARCHAR(500) = NULL, @isCorrect BIT = NULL, @sortOrder INT = NULL
		AS 
		BEGIN
			BEGIN TRY
				DECLARE @currentQuestion INT, @currentText NVARCHAR(500);
			SELECT @currentQuestion = fkIdQuestion, 
				   @currentText = optionText
			FROM tbTestOptions 
			WHERE pkIdOption = @pkIdOption AND isDeleted = 0;

			IF @currentQuestion IS NULL
			BEGIN
				RAISERROR('Вариант ответа %d не найден или удалён', 16, 1, @pkIdOption);
				RETURN;
			END
    
			DECLARE @targetQuestion INT = ISNULL(@fkIdQuestion, @currentQuestion);
			DECLARE @targetText NVARCHAR(500) = ISNULL(@optionText, @currentText);

			IF (@targetQuestion != @currentQuestion OR @targetText != @currentText)
			BEGIN
				IF @fkIdQuestion IS NOT NULL AND NOT EXISTS (SELECT 1 FROM tbTestQuestions WHERE pkIdQuestion = @fkIdQuestion AND isDeleted = 0)
				BEGIN
					RAISERROR('Вопрос %d не найден или удалён', 16, 1, @fkIdQuestion);
					RETURN;
				END
        
				IF EXISTS (SELECT 1 FROM tbTestOptions WHERE fkIdQuestion = @targetQuestion AND optionText = @targetText  AND isDeleted = 0 AND pkIdOption != @pkIdOption)
				BEGIN
					RAISERROR('Вариант ответа с таким текстом уже существует для данного вопроса', 16, 1);
					RETURN;
				END
        
				DECLARE @existingDeletedId INT;
				SELECT @existingDeletedId = pkIdOption FROM tbTestOptions WHERE fkIdQuestion = @targetQuestion  AND optionText = @targetText  AND isDeleted = 1AND pkIdOption != @pkIdOption;

				IF @existingDeletedId IS NOT NULL
				BEGIN
					RAISERROR('Невозможно обновить: существует удалённый такой же вариант (ID=%d)', 16, 1, @existingDeletedId);
					RETURN;
				END
			END
				BEGIN TRANSACTION;
				UPDATE tbTestOptions 
				SET fkIdQuestion = ISNULL(@fkIdQuestion, fkIdQuestion),
					optionText = ISNULL(@optionText, optionText),
					isCorrect = ISNULL(@isCorrect, isCorrect),
					sortOrder = ISNULL(@sortOrder, sortOrder)
				WHERE pkIdOption = @pkIdOption;
				IF @@ROWCOUNT = 0 
				BEGIN
					RAISERROR('Вариант ответа %d не найден', 16, 1, @pkIdOption);
					ROLLBACK TRANSACTION;
					RETURN;
				END
				COMMIT TRANSACTION;
				EXEC prGetTestOptions @pkIdOption = @pkIdOption;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END;
		GO

		CREATE OR ALTER PROCEDURE spTestOptionDelete 
			@pkIdOption INT
		AS 
		BEGIN
			SET NOCOUNT ON;
			BEGIN TRY
				BEGIN TRANSACTION;
				UPDATE tbTestAnswers SET isDeleted = 1 WHERE fkIdSelectedOption = @pkIdOption AND isDeleted = 0;
				UPDATE tbTestOptions SET isDeleted = 1 WHERE pkIdOption = @pkIdOption;
				IF @@ROWCOUNT = 0 
				BEGIN
					RAISERROR('Вариант ответа %d не найден или уже удалён', 16, 1, @pkIdOption);
					ROLLBACK TRANSACTION;
					RETURN;
				END
				COMMIT TRANSACTION;
				SELECT @pkIdOption AS deletedId, 'Вариант ответа помечен как удалённый' AS message;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END;
		GO

		CREATE OR ALTER PROCEDURE spTestOptionRestore
			@pkIdOption INT
		AS 
		BEGIN
			SET NOCOUNT ON;
			BEGIN TRY
				BEGIN TRANSACTION;
				UPDATE tbTestOptions SET isDeleted = 0 WHERE pkIdOption = @pkIdOption AND isDeleted = 1;
				IF @@ROWCOUNT = 0 
				BEGIN
					RAISERROR('Вариант ответа %d не найден или не был удалён', 16, 1, @pkIdOption);
					ROLLBACK TRANSACTION;
					RETURN;
				END
				COMMIT TRANSACTION;
				SELECT @pkIdOption AS restoredId, 'Вариант ответа восстановлен' AS message;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END;
		GO

		CREATE OR ALTER PROCEDURE spTestOptionsHardDelete
			@pkIdOption INT
		AS
		BEGIN
			SET NOCOUNT ON;
			BEGIN TRY
				IF NOT EXISTS (SELECT 1 FROM tbTestOptions WHERE pkIdOption = @pkIdOption)
				BEGIN
					RAISERROR('Вариант ответа %d не найден', 16, 1, @pkIdOption);
					RETURN;
				END
				IF EXISTS (SELECT 1 FROM tbTestOptions WHERE pkIdOption = @pkIdOption AND isDeleted = 0)
				BEGIN
					RAISERROR('Вариант ответа %d необходимо сначала пометить как удалённый', 16, 1, @pkIdOption);
					RETURN;
				END
				BEGIN TRANSACTION;
				DELETE FROM tbTestAnswers WHERE fkIdSelectedOption = @pkIdOption;
				DELETE FROM tbTestOptions WHERE pkIdOption = @pkIdOption;
				COMMIT TRANSACTION;
				SELECT @pkIdOption AS deletedId, 'Вариант ответа физически удалён' AS message;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END
		GO
	--#endregion

	--#region ===== COMMENT =====
		CREATE OR ALTER PROCEDURE prGetCommentsWithAttempts
			@pkIdComment INT = NULL, @fkIdAttempt INT = NULL, @fkIdUser INT = NULL, @fkIdTask int = null, @isDeleted BIT = 0
		AS BEGIN
			SELECT c.pkIdComment AS id, c.message, c.createdAt, c.fkIdUser AS userId, u.fullName AS userName,
        CASE 
            WHEN c.fkIdAttempt IS NOT NULL THEN 'attempt'
            WHEN c.fkIdTask IS NOT NULL THEN 'task'
            ELSE 'general'
        END AS targetType,
			t.pkIdTask AS taskId, t.title AS taskTitle,a.pkIdAttempt AS attemptId, st.name AS attemptStatus
		FROM tbComment c
		LEFT JOIN tbUsers u ON c.fkIdUser = u.pkIdUser
		LEFT JOIN tbAttempt a ON c.fkIdAttempt = a.pkIdAttempt
		LEFT JOIN tbTasks t ON c.fkIdTask = t.pkIdTask
		LEFT JOIN tbStatusAttempt st ON a.fkIdStatusAttempt = st.pkIdStatusAttempt
		WHERE c.isDeleted = @isDeleted
			AND (@pkIdComment IS NULL OR c.pkIdComment = @pkIdComment)
			AND (@fkIdAttempt IS NULL OR c.fkIdAttempt = @fkIdAttempt)
			AND (@fkIdUser IS NULL OR c.fkIdUser = @fkIdUser)
			AND (@fkIdTask IS NULL OR c.fkIdTask = @fkIdTask)
		ORDER BY c.createdAt DESC
		END
		GO

		CREATE OR ALTER PROCEDURE spCommentsCreate
			@fkIdTask INT = null, @fkIdAttempt INT = null, @fkIdUser INT, @message NVARCHAR(MAX)
		AS
		BEGIN
			SET NOCOUNT ON;
			IF EXISTS ( SELECT 1 FROM tbComment  WHERE fkIdUser = @fkIdUser  AND isDeleted = 0 AND createdAt >= DATEADD(MINUTE, -1, GETDATE()))
			BEGIN
				RAISERROR('Можно оставлять комментарий не чаще одного раза в минуту', 16, 1);
				RETURN;
			END
			BEGIN TRY
				BEGIN TRANSACTION;
				INSERT INTO tbComment (fkIdTask, fkIdAttempt, fkIdUser, message)
				VALUES (@fkIdTask, @fkIdAttempt, @fkIdUser, @message);
				DECLARE @newCommentId INT = SCOPE_IDENTITY();
				COMMIT TRANSACTION;
				EXEC prGetCommentsWithAttempts @pkIdComment = @newCommentId;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END
		GO

		CREATE OR ALTER PROCEDURE spCommentsUpdate
			@pkIdComment INT, @fkIdTask INT = null, @fkIdAttempt INT = null, @fkIdUser INT = null, @message NVARCHAR(MAX) = NULL
		AS
		BEGIN
			BEGIN TRY
				DECLARE @currentUser INT, @currentMessage NVARCHAR(MAX);
				SELECT @currentUser = fkIdUser, 
					   @currentMessage = message
				FROM tbComment 
				WHERE pkIdComment = @pkIdComment AND isDeleted = 0;

				IF @currentUser IS NULL
				BEGIN
					RAISERROR('Комментарий %d не найден или удалён', 16, 1, @pkIdComment);
					RETURN;
				END
    
				DECLARE @targetUser INT = ISNULL(@fkIdUser, @currentUser);
    
				IF @targetUser != @currentUser
				BEGIN
					IF EXISTS ( SELECT 1 FROM tbComment  WHERE fkIdUser = @targetUser  AND isDeleted = 0 AND createdAt >= DATEADD(MINUTE, -1, GETDATE()) AND pkIdComment != @pkIdComment)
					BEGIN
						RAISERROR('Можно оставлять комментарий не чаще одного раза в минуту', 16, 1);
						RETURN;
					END
				END

				BEGIN TRANSACTION;
				UPDATE tbComment
				SET message = ISNULL(@message, message),
					fkIdAttempt = ISNULL(@fkIdAttempt, fkIdAttempt),
					fkIdUser = ISNULL(@fkIdUser, fkIdUser)
				WHERE pkIdComment = @pkIdComment AND isDeleted = 0;
				IF @@ROWCOUNT = 0 
				BEGIN
					RAISERROR('Комментарий %d не найден или удалён', 16, 1, @pkIdComment);
					ROLLBACK TRANSACTION;
					RETURN;
				END
				COMMIT TRANSACTION;
				EXEC prGetCommentsWithAttempts @pkIdComment = @pkIdComment;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END
		GO

		CREATE OR ALTER PROCEDURE spCommentsDelete
			@pkIdComment INT
		AS
		BEGIN
			SET NOCOUNT ON;
			BEGIN TRY
				BEGIN TRANSACTION;
				UPDATE tbComment SET isDeleted = 1 WHERE pkIdComment = @pkIdComment AND isDeleted = 0;
				IF @@ROWCOUNT = 0 
				BEGIN
					RAISERROR('Комментарий %d не найден или уже удалён', 16, 1, @pkIdComment);
					ROLLBACK TRANSACTION;
					RETURN;
				END
				COMMIT TRANSACTION;
				SELECT @pkIdComment AS deletedId, 'Комментарий помечен как удалённый' AS message;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END
		GO

		CREATE OR ALTER PROCEDURE spCommentsRestore
			@pkIdComment INT
		AS
		BEGIN
			SET NOCOUNT ON;
			BEGIN TRY
				BEGIN TRANSACTION;
				UPDATE tbComment SET isDeleted = 0 WHERE pkIdComment = @pkIdComment AND isDeleted = 1;
				IF @@ROWCOUNT = 0 
				BEGIN
					RAISERROR('Комментарий %d не найден или не был удалён', 16, 1, @pkIdComment);
					ROLLBACK TRANSACTION;
					RETURN;
				END
				COMMIT TRANSACTION;
				SELECT @pkIdComment AS restoredId, 'Комментарий восстановлен' AS message;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END
		GO

		CREATE OR ALTER PROCEDURE spCommentsHardDelete
			@pkIdComment INT
		AS
		BEGIN
			SET NOCOUNT ON;
			BEGIN TRY
				IF NOT EXISTS (SELECT 1 FROM tbComment WHERE pkIdComment = @pkIdComment)
				BEGIN
					RAISERROR('Комментарий %d не найден', 16, 1, @pkIdComment);
					RETURN;
				END
				IF EXISTS (SELECT 1 FROM tbComment WHERE pkIdComment = @pkIdComment AND isDeleted = 0)
				BEGIN
					RAISERROR('Комментарий %d необходимо сначала пометить как удалённый', 16, 1, @pkIdComment);
					RETURN;
				END
				BEGIN TRANSACTION;
				DELETE FROM tbComment WHERE pkIdComment = @pkIdComment;
				COMMIT TRANSACTION;
				SELECT @pkIdComment AS deletedId, 'Комментарий физически удалён из базы данных' AS message;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END
		GO
	--#endregion
	
	--#region ===== MESSAGE =====
		CREATE OR ALTER PROCEDURE prGetMessages
			@pkIdMessage INT = NULL, @fkIdSender INT = NULL, @fkIdReceiver INT = NULL, @isDeleted BIT = 0
		AS BEGIN
			SELECT m.pkIdMessage, m.fkIdSender, m.fkIdReceiver, m.message, m.isRead, m.createdAt, sender.fullName AS senderName, receiver.fullName AS receiverName
			FROM tbMessage m
			LEFT JOIN tbUsers sender ON m.fkIdSender = sender.pkIdUser
			LEFT JOIN tbUsers receiver ON m.fkIdReceiver = receiver.pkIdUser
			WHERE m.isDeleted = @isDeleted
				AND (@pkIdMessage IS NULL OR m.pkIdMessage = @pkIdMessage)
				AND (@fkIdSender IS NULL OR m.fkIdSender = @fkIdSender)
				AND (@fkIdReceiver IS NULL OR m.fkIdReceiver = @fkIdReceiver)
		END
		GO

		CREATE OR ALTER PROCEDURE spMessagesCreate
			@fkIdSender INT, @fkIdReceiver INT, @message NVARCHAR(MAX)
		AS
		BEGIN
			BEGIN TRY
				BEGIN TRANSACTION;
				INSERT INTO tbMessage (fkIdSender, fkIdReceiver, message)
				VALUES (@fkIdSender, @fkIdReceiver, @message);
				DECLARE @newMessageId INT = SCOPE_IDENTITY();
				COMMIT TRANSACTION;
				EXEC prGetMessages @pkIdMessage = @newMessageId;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END
		GO

		CREATE OR ALTER PROCEDURE spMessagesUpdate
			@pkIdMessage INT, @message NVARCHAR(MAX) = NULL, @isRead BIT = NULL
		AS
		BEGIN
			BEGIN TRY
				BEGIN TRANSACTION;
				UPDATE tbMessage
				SET message = ISNULL(@message, message), isRead = ISNULL(@isRead, isRead)
				WHERE pkIdMessage = @pkIdMessage AND isDeleted = 0;
				IF @@ROWCOUNT = 0 
				BEGIN
					RAISERROR('Сообщение %d не найдено или удалено', 16, 1, @pkIdMessage);
					ROLLBACK TRANSACTION;
					RETURN;
				END
				COMMIT TRANSACTION;
				EXEC prGetMessages @pkIdMessage = @pkIdMessage;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END
		GO

		CREATE OR ALTER PROCEDURE spMessagesDelete
			@pkIdMessage INT
		AS
		BEGIN
			SET NOCOUNT ON;
			BEGIN TRY
				BEGIN TRANSACTION;
				UPDATE tbMessage SET isDeleted = 1 WHERE pkIdMessage = @pkIdMessage AND isDeleted = 0;
				IF @@ROWCOUNT = 0 
				BEGIN
					RAISERROR('Сообщение %d не найдено или уже удалено', 16, 1, @pkIdMessage);
					ROLLBACK TRANSACTION;
					RETURN;
				END
				COMMIT TRANSACTION;
				SELECT @pkIdMessage AS deletedId, 'Сообщение помечено как удалённое' AS message;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END
		GO

		CREATE OR ALTER PROCEDURE spMessagesRestore
			@pkIdMessage INT
		AS
		BEGIN
			SET NOCOUNT ON;
			BEGIN TRY
				BEGIN TRANSACTION;
				UPDATE tbMessage SET isDeleted = 0 WHERE pkIdMessage = @pkIdMessage AND isDeleted = 1;
				IF @@ROWCOUNT = 0 
				BEGIN
					RAISERROR('Сообщение %d не найдено или не было удалено', 16, 1, @pkIdMessage);
					ROLLBACK TRANSACTION;
					RETURN;
				END
				COMMIT TRANSACTION;
				SELECT @pkIdMessage AS restoredId, 'Сообщение восстановлено' AS message;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END
		GO

		CREATE OR ALTER PROCEDURE spMessagesHardDelete
			@pkIdMessage INT
		AS
		BEGIN
			SET NOCOUNT ON;
			BEGIN TRY
				IF NOT EXISTS (SELECT 1 FROM tbMessage WHERE pkIdMessage = @pkIdMessage)
				BEGIN
					RAISERROR('Сообщение %d не найдено', 16, 1, @pkIdMessage);
					RETURN;
				END
				IF EXISTS (SELECT 1 FROM tbMessage WHERE pkIdMessage = @pkIdMessage AND isDeleted = 0)
				BEGIN
					RAISERROR('Сообщение %d необходимо сначала пометить как удалённое', 16, 1, @pkIdMessage);
					RETURN;
				END
				BEGIN TRANSACTION;
				DELETE FROM tbMessage WHERE pkIdMessage = @pkIdMessage;
				COMMIT TRANSACTION;
				SELECT @pkIdMessage AS deletedId, 'Сообщение физически удалено из базы данных' AS message;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END
		GO
	--#endregion
	
	--#region ===== NOTIFICATION =====
		CREATE OR ALTER PROCEDURE prGetNotifications
			@pkIdNotification INT = NULL, @fkIdUser INT = NULL, @onlyUnread  bit = 0, @isDeleted BIT = 0
		AS BEGIN
			SELECT n.pkIdNotification, n.message, n.isRead, n.createdAt, u.fullName AS userName
			FROM tbNotification n
			LEFT JOIN tbUsers u ON n.fkIdUser = u.pkIdUser
			WHERE n.isDeleted = @isDeleted
				AND (@pkIdNotification IS NULL OR n.pkIdNotification = @pkIdNotification)
				AND (@fkIdUser IS NULL OR n.fkIdUser = @fkIdUser)
				AND (@onlyUnread = 0 OR n.isRead = @onlyUnread)
		END
		GO

		CREATE OR ALTER PROCEDURE spNotificationsCreate
			@fkIdUser INT,
			@message NVARCHAR(527)
		AS
		BEGIN
			SET NOCOUNT ON;
			BEGIN TRY
				IF NOT EXISTS (SELECT 1 FROM tbUsers WHERE pkIdUser = @fkIdUser AND isDeleted = 0)
				BEGIN
					RAISERROR('Пользователь %d не найден или удалён', 16, 1, @fkIdUser);
					RETURN;
				END
				BEGIN TRANSACTION;
				INSERT INTO tbNotification (fkIdUser, message, isRead, createdAt)
				VALUES (@fkIdUser, @message, 0, GETDATE());
				DECLARE @newId INT = SCOPE_IDENTITY();
				COMMIT TRANSACTION;
				EXEC prGetNotifications @pkIdNotification = @newId;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END
		GO

		CREATE OR ALTER PROCEDURE spNotificationsUpdate
			@pkIdNotification INT, @isRead BIT = NULL
		AS
		BEGIN
			BEGIN TRY
				BEGIN TRANSACTION;
				UPDATE tbNotification SET isRead = ISNULL(@isRead, isRead)
				WHERE pkIdNotification = @pkIdNotification AND isDeleted = 0;
				IF @@ROWCOUNT = 0 
				BEGIN
					RAISERROR('Уведомление %d не найдено или удалено', 16, 1, @pkIdNotification);
					ROLLBACK TRANSACTION;
					RETURN;
				END
				COMMIT TRANSACTION;
				EXEC prGetNotifications @pkIdNotification = @pkIdNotification;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END
		GO

		CREATE OR ALTER PROCEDURE spNotificationsDelete
			@pkIdNotification INT
		AS
		BEGIN
			SET NOCOUNT ON;
			BEGIN TRY
				BEGIN TRANSACTION;
				UPDATE tbNotification SET isDeleted = 1 WHERE pkIdNotification = @pkIdNotification AND isDeleted = 0;
				IF @@ROWCOUNT = 0 
				BEGIN
					RAISERROR('Уведомление %d не найдено или уже удалено', 16, 1, @pkIdNotification);
					ROLLBACK TRANSACTION;
					RETURN;
				END
				COMMIT TRANSACTION;
				SELECT @pkIdNotification AS deletedId, 'Уведомление помечено как удалённое' AS message;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END
		GO

		CREATE OR ALTER PROCEDURE spNotificationsHardDelete
			@pkIdNotification INT
		AS
		BEGIN
			SET NOCOUNT ON;
			BEGIN TRY
				IF NOT EXISTS (SELECT 1 FROM tbNotification WHERE pkIdNotification = @pkIdNotification)
				BEGIN
					RAISERROR('Уведомление %d не найдено', 16, 1, @pkIdNotification);
					RETURN;
				END
				IF EXISTS (SELECT 1 FROM tbNotification WHERE pkIdNotification = @pkIdNotification AND isDeleted = 0)
				BEGIN
					RAISERROR('Уведомление %d необходимо сначала пометить как удалённое', 16, 1, @pkIdNotification);
					RETURN;
				END
				BEGIN TRANSACTION;
				DELETE FROM tbNotification WHERE pkIdNotification = @pkIdNotification;
				COMMIT TRANSACTION;
				SELECT @pkIdNotification AS deletedId, 'Уведомление физически удалено из базы данных' AS message;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END
		GO
		--#endregion

	--#region ===== CERTIFICATE =====
		CREATE OR ALTER PROCEDURE prGetCertificatesWithTemplates
			@pkIdCertificate INT = NULL, @fkIdListener INT = NULL, @fkIdCourse INT = NULL, @isDeleted BIT = 0
		AS BEGIN
			SELECT c.pkIdCertificate, c.fkIdListener, c.fkIdCourse,
				u.fullName AS listenerName,
				course.title AS courseTitle, c.issuedAt, c.pdfUrl,  ct.name AS templateName, ct.templateHtml
			FROM tbCertificate c
			LEFT JOIN tbUsers u ON c.fkIdListener = u.pkIdUser
			LEFT JOIN tbCourses course ON c.fkIdCourse = course.pkIdCourse
			LEFT JOIN tbCertificateTemplates ct ON c.fkIdTemplate = ct.pkIdTemplate
			WHERE c.isDeleted = @isDeleted
				AND (@pkIdCertificate IS NULL OR c.pkIdCertificate = @pkIdCertificate)
				AND (@fkIdListener IS NULL OR c.fkIdListener = @fkIdListener)
				AND (@fkIdCourse IS NULL OR c.fkIdCourse = @fkIdCourse)
		END
		GO

		CREATE OR ALTER PROCEDURE spCertificateCreate
			@fkIdListener INT, @fkIdCourse INT,  @fkIdTemplate INT,  @pdfUrl VARCHAR(255) = NULL
		AS
		BEGIN
			SET NOCOUNT ON;
			BEGIN TRY
				BEGIN TRANSACTION;

				IF EXISTS (
					SELECT 1 FROM tbCertificate WITH (UPDLOCK, HOLDLOCK)
					WHERE fkIdListener = @fkIdListener AND fkIdCourse = @fkIdCourse AND isDeleted = 0
				)
				BEGIN
					RAISERROR('Сертификат для данного пользователя по данному курсу уже существует', 16, 1);
					ROLLBACK TRANSACTION;
					RETURN;
				END

				INSERT INTO tbCertificate (fkIdListener, fkIdCourse, fkIdTemplate, pdfUrl, isDeleted)
				VALUES (@fkIdListener, @fkIdCourse, @fkIdTemplate, @pdfUrl, 0);
				DECLARE @newId INT = SCOPE_IDENTITY();
				COMMIT TRANSACTION;
				EXEC prGetCertificatesWithTemplates @pkIdCertificate = @newId;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END
		GO

		CREATE OR ALTER PROCEDURE spCertificateUpdate
			@pkIdCertificate INT, @fkIdListener INT = NULL, @fkIdCourse INT = NULL, @fkIdTemplate INT = NULL,  @pdfUrl VARCHAR(255) = NULL
		AS
		BEGIN
			SET NOCOUNT ON;
			DECLARE @currentListener INT, @currentCourse INT;
			SELECT @currentListener = fkIdListener, @currentCourse = fkIdCourse 
			FROM tbCertificate 
			WHERE pkIdCertificate = @pkIdCertificate;
			IF @currentListener IS NULL
			BEGIN
				RAISERROR('Сертификат %d не найден или удалён', 16, 1, @pkIdCertificate);
				RETURN;
			END
			DECLARE @targetListener INT = ISNULL(@fkIdListener, @currentListener);
			DECLARE @targetCourse INT = ISNULL(@fkIdCourse, @currentCourse);
			IF EXISTS (
				SELECT 1 FROM tbCertificate 
				WHERE fkIdListener = @targetListener 
				  AND fkIdCourse = @targetCourse 
				  AND isDeleted = 0
				  AND pkIdCertificate != @pkIdCertificate  -- исключаем сам обновляемый сертификат
			)
			BEGIN
				RAISERROR('Невозможно обновить: у пользователя уже есть сертификат по данному курсу', 16, 1);
				RETURN;
			END
			BEGIN TRY
				BEGIN TRANSACTION;
				UPDATE tbCertificate
				SET fkIdListener = @targetListener,
					fkIdCourse = @targetCourse,
					fkIdTemplate = ISNULL(@fkIdTemplate, fkIdTemplate),
					pdfUrl = ISNULL(@pdfUrl, pdfUrl)
				WHERE pkIdCertificate = @pkIdCertificate;
				COMMIT TRANSACTION;
				EXEC prGetCertificatesWithTemplates @pkIdCertificate = @pkIdCertificate;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END
		GO

		CREATE OR ALTER PROCEDURE spCertificateDelete
			@pkIdCertificate INT
		AS
		BEGIN
			SET NOCOUNT ON;
			BEGIN TRY
				BEGIN TRANSACTION;
				UPDATE tbCertificate SET isDeleted = 1 WHERE pkIdCertificate = @pkIdCertificate AND isDeleted = 0;
				IF @@ROWCOUNT = 0 
				BEGIN
					RAISERROR('Сертификат %d не найден или уже удалён', 16, 1, @pkIdCertificate);
					ROLLBACK TRANSACTION;
					RETURN;
				END
				COMMIT TRANSACTION;
				SELECT @pkIdCertificate AS deletedId, 'Сертификат помечен как удалённый' AS message;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END
		GO

		CREATE OR ALTER PROCEDURE spCertificateRestore
			@pkIdCertificate INT
		AS
		BEGIN
			SET NOCOUNT ON;
			BEGIN TRY
				BEGIN TRANSACTION;
				UPDATE tbCertificate SET isDeleted = 0 WHERE pkIdCertificate = @pkIdCertificate AND isDeleted = 1;
				IF @@ROWCOUNT = 0 
				BEGIN
					RAISERROR('Сертификат %d не найден или не был удалён', 16, 1, @pkIdCertificate);
					ROLLBACK TRANSACTION;
					RETURN;
				END
				COMMIT TRANSACTION;
				SELECT @pkIdCertificate AS restoredId, 'Сертификат восстановлен' AS message;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END
		GO

		CREATE OR ALTER PROCEDURE spCertificateHardDelete
			@pkIdCertificate INT
		AS
		BEGIN
			SET NOCOUNT ON;
			BEGIN TRY
				IF NOT EXISTS (SELECT 1 FROM tbCertificate WHERE pkIdCertificate = @pkIdCertificate)
				BEGIN
					RAISERROR('Сертификат %d не найден', 16, 1, @pkIdCertificate);
					RETURN;
				END
				IF EXISTS (SELECT 1 FROM tbCertificate WHERE pkIdCertificate = @pkIdCertificate AND isDeleted = 0)
				BEGIN
					RAISERROR('Сертификат %d необходимо сначала пометить как удалённый', 16, 1, @pkIdCertificate);
					RETURN;
				END
				BEGIN TRANSACTION;
				DELETE FROM tbCertificate WHERE pkIdCertificate = @pkIdCertificate;
				COMMIT TRANSACTION;
				SELECT @pkIdCertificate AS deletedId, 'Сертификат физически удалён' AS message;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END
		GO
	--#endregion

	--#region ===== CERTIFICATE-TEMPL =====
		CREATE OR ALTER PROCEDURE prGetCertificateTemplates
			@pkIdTemplate INT = NULL, @fkIdCourse INT = NULL, @templateName NVARCHAR(100) = NULL, @isActive BIT = NULL, @isDeleted BIT = 0
		AS BEGIN
			SELECT ct.pkIdTemplate, ct.name AS templateName, ct.templateHtml, ct.minScorePercent,
				ct.isActive, c.title AS courseTitle
			FROM tbCertificateTemplates ct
			LEFT JOIN tbCourses c ON ct.fkIdCourse = c.pkIdCourse
			WHERE ct.isDeleted = @isDeleted
				AND (@pkIdTemplate IS NULL OR ct.pkIdTemplate = @pkIdTemplate)
				AND (@fkIdCourse IS NULL OR ct.fkIdCourse = @fkIdCourse)
				AND (@templateName IS NULL OR ct.name LIKE '%' + @templateName + '%')
				AND (@isActive IS NULL OR ct.isActive = @isActive)
		END
		GO

		CREATE OR ALTER PROCEDURE spCertificateTemplatesCreate
			@fkIdCourse INT, @name NVARCHAR(100), @templateHtml NVARCHAR(MAX), 
			@minScorePercent INT = 60, @isActive BIT = 1
		AS
		BEGIN
			SET NOCOUNT ON;
			BEGIN TRY
				BEGIN TRANSACTION;
				IF @minScorePercent NOT BETWEEN 0 AND 100
				BEGIN
					RAISERROR('Процент должен быть между 0 и 100', 16, 1);
					ROLLBACK TRANSACTION;
					RETURN;
				END
				INSERT INTO tbCertificateTemplates (fkIdCourse, name, templateHtml, minScorePercent, isActive)
				VALUES (@fkIdCourse, @name, @templateHtml, @minScorePercent, @isActive);
				DECLARE @newId INT = SCOPE_IDENTITY();
				COMMIT TRANSACTION;
				EXEC prGetCertificateTemplates @pkIdTemplate = @newId;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END
		GO

		CREATE OR ALTER PROCEDURE spCertificateTemplatesUpdate
			@pkIdTemplate INT, @fkIdCourse INT = NULL, @name NVARCHAR(100) = NULL, 
			@templateHtml NVARCHAR(MAX) = NULL, @minScorePercent INT = NULL, @isActive BIT = NULL
		AS
		BEGIN
			SET NOCOUNT ON;
			BEGIN TRY
				BEGIN TRANSACTION;
				IF @minScorePercent IS NOT NULL AND @minScorePercent NOT BETWEEN 0 AND 100
				BEGIN
					RAISERROR('Процент должен быть между 0 и 100', 16, 1);
					ROLLBACK TRANSACTION;
					RETURN;
				END
				UPDATE tbCertificateTemplates
				SET fkIdCourse = ISNULL(@fkIdCourse, fkIdCourse),
					name = ISNULL(@name, name),
					templateHtml = ISNULL(@templateHtml, templateHtml),
					minScorePercent = ISNULL(@minScorePercent, minScorePercent),
					isActive = ISNULL(@isActive, isActive)
				WHERE pkIdTemplate = @pkIdTemplate AND isDeleted = 0;
				IF @@ROWCOUNT = 0 
				BEGIN
					RAISERROR('Шаблон сертификата %d не найден или удалён', 16, 1, @pkIdTemplate);
					ROLLBACK TRANSACTION;
					RETURN;
				END
				COMMIT TRANSACTION;
				EXEC prGetCertificateTemplates @pkIdTemplate = @pkIdTemplate;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END
		GO

		CREATE OR ALTER PROCEDURE spCertificateTemplatesDelete
			@pkIdTemplate INT
		AS
		BEGIN
			SET NOCOUNT ON;
			BEGIN TRY
				BEGIN TRANSACTION;
				UPDATE tbCertificate SET isDeleted = 1 WHERE fkIdTemplate = @pkIdTemplate AND isDeleted = 0;
				UPDATE tbCertificateTemplates SET isDeleted = 1 WHERE pkIdTemplate = @pkIdTemplate AND isDeleted = 0;
				IF @@ROWCOUNT = 0 
				BEGIN
					RAISERROR('Шаблон сертификата %d не найден или уже удалён', 16, 1, @pkIdTemplate);
					ROLLBACK TRANSACTION;
					RETURN;
				END
				COMMIT TRANSACTION;
				SELECT @pkIdTemplate AS deletedId, 'Шаблон сертификата помечен как удалённый' AS message;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END
		GO

		CREATE OR ALTER PROCEDURE spCertificateTemplatesRestore
			@pkIdTemplate INT
		AS
		BEGIN
			SET NOCOUNT ON;
			BEGIN TRY
				BEGIN TRANSACTION;
				UPDATE tbCertificateTemplates SET isDeleted = 0 WHERE pkIdTemplate = @pkIdTemplate AND isDeleted = 1;
				IF @@ROWCOUNT = 0 
				BEGIN
					RAISERROR('Шаблон сертификата %d не найден или не был удалён', 16, 1, @pkIdTemplate);
					ROLLBACK TRANSACTION;
					RETURN;
				END
				COMMIT TRANSACTION;
				SELECT @pkIdTemplate AS restoredId, 'Шаблон сертификата восстановлен' AS message;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END
		GO

		CREATE OR ALTER PROCEDURE spCertificateTemplatesHardDelete
			@pkIdTemplate INT
		AS
		BEGIN
			SET NOCOUNT ON;
			BEGIN TRY
				IF NOT EXISTS (SELECT 1 FROM tbCertificateTemplates WHERE pkIdTemplate = @pkIdTemplate)
				BEGIN
					RAISERROR('Шаблон сертификата %d не найден', 16, 1, @pkIdTemplate);
					RETURN;
				END
				IF EXISTS (SELECT 1 FROM tbCertificateTemplates WHERE pkIdTemplate = @pkIdTemplate AND isDeleted = 0)
				BEGIN
					RAISERROR('Шаблон сертификата %d необходимо сначала пометить как удалённый', 16, 1, @pkIdTemplate);
					RETURN;
				END
				BEGIN TRANSACTION;
				DELETE FROM tbCertificate WHERE fkIdTemplate = @pkIdTemplate;
				DELETE FROM tbCertificateTemplates WHERE pkIdTemplate = @pkIdTemplate;
				COMMIT TRANSACTION;
				SELECT @pkIdTemplate AS deletedId, 'Шаблон сертификата физически удалён' AS message;
			END TRY
			BEGIN CATCH
				IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
				DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
				DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
				DECLARE @ErrorState INT = ERROR_STATE();
				RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
			END CATCH
		END
		GO
	--#endregion
--#endregion
go

CREATE OR ALTER FUNCTION dbo.fnGetCurrentUserId()
RETURNS INT
AS
BEGIN
    DECLARE @userId INT;
    DECLARE @context VARBINARY(128) = CONTEXT_INFO();
    
    IF LEN(@context) >= 4
    BEGIN
        SET @userId = CAST(CAST(SUBSTRING(@context, 1, 4) AS VARBINARY(4)) AS INT);
        
        IF NOT EXISTS (SELECT 1 FROM tbUsers WHERE pkIdUser = @userId)
            SET @userId = NULL;
    END
    
    RETURN @userId;
END;

go
--#region =====  Trigger   =====
CREATE OR ALTER TRIGGER trgAuditTbUsers
	ON tbUsers
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @userId INT = dbo.fnGetCurrentUserId();
    DECLARE @action VARCHAR(20);
    DECLARE @oldData NVARCHAR(MAX) = NULL;
    DECLARE @newData NVARCHAR(MAX) = NULL;

    -- Определяем тип действия
    IF EXISTS (SELECT * FROM inserted) AND EXISTS (SELECT * FROM deleted)
        SET @action = 'UPDATE';
    ELSE IF EXISTS (SELECT * FROM inserted)
        SET @action = 'INSERT';
    ELSE IF EXISTS (SELECT * FROM deleted)
        SET @action = 'DELETE';

    -- Сериализация данных
    IF @action IN ('UPDATE', 'DELETE')
        SELECT @oldData = (SELECT * FROM deleted FOR JSON PATH);

    IF @action IN ('INSERT', 'UPDATE')
        SELECT @newData = (SELECT * FROM inserted FOR JSON PATH);

    -- Логирование в tbAdminLog
    INSERT INTO tbAdminLog (fkIdAdminUser, tableName, action, oldData, newData)
    VALUES (@userId, 'tbUsers', @action, @oldData, @newData);
END;
GO

CREATE OR ALTER TRIGGER trgAuditTbCourses
ON tbCourses
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @userId INT = dbo.fnGetCurrentUserId();
    DECLARE @action VARCHAR(20);
    DECLARE @oldData NVARCHAR(MAX) = NULL;
    DECLARE @newData NVARCHAR(MAX) = NULL;

    IF EXISTS (SELECT * FROM inserted) AND EXISTS (SELECT * FROM deleted)
        SET @action = 'UPDATE';
    ELSE IF EXISTS (SELECT * FROM inserted)
        SET @action = 'INSERT';
    ELSE IF EXISTS (SELECT * FROM deleted)
        SET @action = 'DELETE';

    IF @action IN ('UPDATE', 'DELETE')
        SELECT @oldData = (SELECT * FROM deleted FOR JSON PATH);

    IF @action IN ('INSERT', 'UPDATE')
        SELECT @newData = (SELECT * FROM inserted FOR JSON PATH);

    INSERT INTO tbAdminLog (fkIdAdminUser, tableName, action, oldData, newData)
    VALUES (@userId, 'tbCourses', @action, @oldData, @newData);
END;
GO

CREATE OR ALTER TRIGGER trgAuditTbGroup
ON tbGroup
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @userId INT = dbo.fnGetCurrentUserId();
    DECLARE @action VARCHAR(20);
    DECLARE @oldData NVARCHAR(MAX) = NULL;
    DECLARE @newData NVARCHAR(MAX) = NULL;

    IF EXISTS (SELECT * FROM inserted) AND EXISTS (SELECT * FROM deleted)
        SET @action = 'UPDATE';
    ELSE IF EXISTS (SELECT * FROM inserted)
        SET @action = 'INSERT';
    ELSE IF EXISTS (SELECT * FROM deleted)
        SET @action = 'DELETE';

    IF @action IN ('UPDATE', 'DELETE')
        SELECT @oldData = (SELECT * FROM deleted FOR JSON PATH);

    IF @action IN ('INSERT', 'UPDATE')
        SELECT @newData = (SELECT * FROM inserted FOR JSON PATH);

    INSERT INTO tbAdminLog (fkIdAdminUser, tableName, action, oldData, newData)
    VALUES (@userId, 'tbGroup', @action, @oldData, @newData);
END;
GO

CREATE OR ALTER TRIGGER trgAuditTbGroupListener
ON tbGroupListener
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @userId INT = dbo.fnGetCurrentUserId();
    DECLARE @action VARCHAR(20);
    DECLARE @oldData NVARCHAR(MAX) = NULL;
    DECLARE @newData NVARCHAR(MAX) = NULL;

    IF EXISTS (SELECT * FROM inserted) AND EXISTS (SELECT * FROM deleted)
        SET @action = 'UPDATE';
    ELSE IF EXISTS (SELECT * FROM inserted)
        SET @action = 'INSERT';
    ELSE IF EXISTS (SELECT * FROM deleted)
        SET @action = 'DELETE';

    IF @action IN ('UPDATE', 'DELETE')
        SELECT @oldData = (SELECT * FROM deleted FOR JSON PATH);

    IF @action IN ('INSERT', 'UPDATE')
        SELECT @newData = (SELECT * FROM inserted FOR JSON PATH);

    INSERT INTO tbAdminLog (fkIdAdminUser, tableName, action, oldData, newData)
    VALUES (@userId, 'tbGroupListener', @action, @oldData, @newData);
END;
GO

CREATE OR ALTER TRIGGER trgAuditTbTasks
ON tbTasks
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @userId INT = dbo.fnGetCurrentUserId();
    DECLARE @action VARCHAR(20);
    DECLARE @oldData NVARCHAR(MAX) = NULL;
    DECLARE @newData NVARCHAR(MAX) = NULL;

    IF EXISTS (SELECT * FROM inserted) AND EXISTS (SELECT * FROM deleted)
        SET @action = 'UPDATE';
    ELSE IF EXISTS (SELECT * FROM inserted)
        SET @action = 'INSERT';
    ELSE IF EXISTS (SELECT * FROM deleted)
        SET @action = 'DELETE';

    IF @action IN ('UPDATE', 'DELETE')
        SELECT @oldData = (SELECT * FROM deleted FOR JSON PATH);

    IF @action IN ('INSERT', 'UPDATE')
        SELECT @newData = (SELECT * FROM inserted FOR JSON PATH);

    INSERT INTO tbAdminLog (fkIdAdminUser, tableName, action, oldData, newData)
    VALUES (@userId, 'tbTasks', @action, @oldData, @newData);
END;
GO

CREATE OR ALTER TRIGGER trgAuditTbAttempt
ON tbAttempt
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @userId INT = dbo.fnGetCurrentUserId();
    DECLARE @action VARCHAR(20);
    DECLARE @oldData NVARCHAR(MAX) = NULL;
    DECLARE @newData NVARCHAR(MAX) = NULL;

    IF EXISTS (SELECT * FROM inserted) AND EXISTS (SELECT * FROM deleted)
        SET @action = 'UPDATE';
    ELSE IF EXISTS (SELECT * FROM inserted)
        SET @action = 'INSERT';
    ELSE IF EXISTS (SELECT * FROM deleted)
        SET @action = 'DELETE';

    IF @action IN ('UPDATE', 'DELETE')
        SELECT @oldData = (SELECT * FROM deleted FOR JSON PATH);

    IF @action IN ('INSERT', 'UPDATE')
        SELECT @newData = (SELECT * FROM inserted FOR JSON PATH);

    INSERT INTO tbAdminLog (fkIdAdminUser, tableName, action, oldData, newData)
    VALUES (@userId, 'tbAttempt', @action, @oldData, @newData);
END;
GO

CREATE OR ALTER TRIGGER trgAuditTbMaterial
ON tbMaterial
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @userId INT = dbo.fnGetCurrentUserId();
    DECLARE @action VARCHAR(20);
    DECLARE @oldData NVARCHAR(MAX) = NULL;
    DECLARE @newData NVARCHAR(MAX) = NULL;

    IF EXISTS (SELECT * FROM inserted) AND EXISTS (SELECT * FROM deleted)
        SET @action = 'UPDATE';
    ELSE IF EXISTS (SELECT * FROM inserted)
        SET @action = 'INSERT';
    ELSE IF EXISTS (SELECT * FROM deleted)
        SET @action = 'DELETE';

    IF @action IN ('UPDATE', 'DELETE')
        SELECT @oldData = (SELECT * FROM deleted FOR JSON PATH);

    IF @action IN ('INSERT', 'UPDATE')
        SELECT @newData = (SELECT * FROM inserted FOR JSON PATH);

    INSERT INTO tbAdminLog (fkIdAdminUser, tableName, action, oldData, newData)
    VALUES (@userId, 'tbMaterial', @action, @oldData, @newData);
END;
GO

CREATE OR ALTER TRIGGER trgAuditTbNotification
ON tbNotification
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @userId INT = dbo.fnGetCurrentUserId();
    DECLARE @action VARCHAR(20);
    DECLARE @oldData NVARCHAR(MAX) = NULL;
    DECLARE @newData NVARCHAR(MAX) = NULL;

    IF EXISTS (SELECT * FROM inserted) AND EXISTS (SELECT * FROM deleted)
        SET @action = 'UPDATE';
    ELSE IF EXISTS (SELECT * FROM inserted)
        SET @action = 'INSERT';
    ELSE IF EXISTS (SELECT * FROM deleted)
        SET @action = 'DELETE';

    IF @action IN ('UPDATE', 'DELETE')
        SELECT @oldData = (SELECT * FROM deleted FOR JSON PATH);

    IF @action IN ('INSERT', 'UPDATE')
        SELECT @newData = (SELECT * FROM inserted FOR JSON PATH);

    INSERT INTO tbAdminLog (fkIdAdminUser, tableName, action, oldData, newData)
    VALUES (@userId, 'tbNotification', @action, @oldData, @newData);
END;
GO

CREATE OR ALTER TRIGGER tgAfterAttemptGraded
ON tbAttempt
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @listenerId INT, @taskTitle NVARCHAR(255), @score INT, @maxScore INT;
    DECLARE @listenerDeleted BIT;
    
    DECLARE cur CURSOR FOR
        SELECT i.fkIdListener, t.title, i.score, t.maxScore
        FROM inserted i
        JOIN deleted d ON i.pkIdAttempt = d.pkIdAttempt
        JOIN tbTasks t ON i.fkIdTask = t.pkIdTask
        WHERE i.fkIdStatusAttempt = 2 
          AND d.fkIdStatusAttempt <> 2
          AND t.isDeleted = 0;
    
    OPEN cur;
    FETCH NEXT FROM cur INTO @listenerId, @taskTitle, @score, @maxScore;
    
    WHILE @@FETCH_STATUS = 0
    BEGIN
        SELECT @listenerDeleted = isDeleted FROM tbUsers WHERE pkIdUser = @listenerId;
        
        IF @listenerDeleted = 0 AND @taskTitle IS NOT NULL
        BEGIN
            INSERT INTO tbNotification (fkIdUser, message, createdAt)
            VALUES (
                @listenerId,
                CONCAT(
                    'Ваша работа «', @taskTitle, '» принята. Балл: ',
                    ISNULL(CAST(@score AS NVARCHAR(10)), '—'),
                    ' из ',
                    ISNULL(CAST(@maxScore AS NVARCHAR(10)), '—'),
                    '.'
                ),
                GETDATE()
            );
        END
        
        FETCH NEXT FROM cur INTO @listenerId, @taskTitle, @score, @maxScore;
    END
    
    CLOSE cur;
    DEALLOCATE cur;
END;
go

CREATE OR ALTER TRIGGER tgAfterAttemptSubmitted
ON tbAttempt
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @listenerId INT, @taskId INT, @taskTitle NVARCHAR(255), @teacherId INT;
    DECLARE @teacherDeleted BIT, @listenerName NVARCHAR(100), @courseId INT;
    
    DECLARE cur CURSOR FOR
        SELECT i.fkIdListener, i.fkIdTask, t.title, t.fkIdCourse
        FROM inserted i
        JOIN tbTasks t ON i.fkIdTask = t.pkIdTask
        WHERE t.isDeleted = 0;
    
    OPEN cur;
    FETCH NEXT FROM cur INTO @listenerId, @taskId, @taskTitle, @courseId;
    
    WHILE @@FETCH_STATUS = 0
    BEGIN
        SELECT @listenerName = fullName FROM tbUsers WHERE pkIdUser = @listenerId;
        
        SELECT TOP 1 @teacherId = g.fkIdCurator
        FROM tbGroupListener gl
        JOIN tbGroup g ON gl.fkIdGroup = g.pkIdGroup
        WHERE gl.fkIdListener = @listenerId
          AND gl.isDeleted = 0
          AND g.isDeleted = 0
          AND g.fkIdCourse = @courseId;
        
        IF @teacherId IS NOT NULL
        BEGIN
            SELECT @teacherDeleted = isDeleted FROM tbUsers WHERE pkIdUser = @teacherId;
            
            IF @teacherDeleted = 0
            BEGIN
                INSERT INTO tbNotification (fkIdUser, message, createdAt)
                VALUES (
                    @teacherId,
                    CONCAT('', @listenerName, ' сдал работу «', @taskTitle, '» (ожидает проверки).'),
                    GETDATE()
                );
            END
        END
        
        FETCH NEXT FROM cur INTO @listenerId, @taskId, @taskTitle, @courseId;
    END
    
    CLOSE cur;
    DEALLOCATE cur;
END;
go

CREATE OR ALTER TRIGGER tgAfterListenerJoined
ON tbGroupListener
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @listenerId INT, @groupId INT, @groupName NVARCHAR(100), @teacherId INT, @teacherDeleted BIT;

    -- Проверяем, что запись не помечена как удалённая
    IF EXISTS (SELECT 1 FROM inserted WHERE isDeleted = 0)
    BEGIN
        SELECT
            @listenerId = i.fkIdListener,
            @groupId = i.fkIdGroup
        FROM inserted i
        WHERE i.isDeleted = 0;

        -- Получаем название группы и преподавателя
        SELECT
            @groupName = g.name,
            @teacherId = g.fkIdCurator
        FROM tbGroup g
        WHERE g.pkIdGroup = @groupId AND g.isDeleted = 0;

        IF @teacherId IS NOT NULL
        BEGIN
            -- Проверяем, что преподаватель не удалён
            SELECT @teacherDeleted = isDeleted FROM tbUsers WHERE pkIdUser = @teacherId;

            IF @teacherDeleted = 0
            BEGIN
                INSERT INTO tbNotification (fkIdUser, message, createdAt)
                VALUES (
                    @teacherId,
                    CONCAT('В вашу группу «', @groupName, '» записан новый слушатель.'),
                    GETDATE()
                );
            END
        END
    END
END;
GO

CREATE OR ALTER TRIGGER tgAfterMaterialAdded
ON tbMaterial
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @courseId INT, @materialTitle NVARCHAR(255), @listenerId INT, @listenerDeleted BIT;
    
    -- Курсор по всем вставленным материалам
    DECLARE mat_cur CURSOR FOR
        SELECT fkIdCourse, title FROM inserted WHERE isDeleted = 0;
    
    OPEN mat_cur;
    FETCH NEXT FROM mat_cur INTO @courseId, @materialTitle;
    
    WHILE @@FETCH_STATUS = 0
    BEGIN
        -- Для каждого материала рассылаем уведомления
        DECLARE listener_cursor CURSOR FOR
            SELECT DISTINCT gl.fkIdListener
            FROM tbGroupListener gl
            JOIN tbGroup g ON gl.fkIdGroup = g.pkIdGroup
            WHERE g.fkIdCourse = @courseId
              AND gl.isDeleted = 0
              AND g.isDeleted = 0;
        
        OPEN listener_cursor;
        FETCH NEXT FROM listener_cursor INTO @listenerId;
        
        WHILE @@FETCH_STATUS = 0
        BEGIN
            SELECT @listenerDeleted = isDeleted FROM tbUsers WHERE pkIdUser = @listenerId;
            
            IF @listenerDeleted = 0
            BEGIN
                INSERT INTO tbNotification (fkIdUser, message, createdAt)
                VALUES (
                    @listenerId,
                    CONCAT('В курсе появился новый материал: «', @materialTitle, '».'),
                    GETDATE()
                );
            END
            
            FETCH NEXT FROM listener_cursor INTO @listenerId;
        END
        
        CLOSE listener_cursor;
        DEALLOCATE listener_cursor;
        
        FETCH NEXT FROM mat_cur INTO @courseId, @materialTitle;
    END
    
    CLOSE mat_cur;
    DEALLOCATE mat_cur;
END;
go

CREATE OR ALTER TRIGGER tgAfterTaskAdded
ON tbTasks
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @courseId INT, @taskTitle NVARCHAR(255), @listenerId INT, @listenerDeleted BIT;

    SELECT @courseId = i.fkIdCourse, @taskTitle = i.title
    FROM inserted i
    WHERE i.isDeleted = 0;

    -- Находим всех слушателей в группах данного курса
    DECLARE listener_cursor CURSOR FOR
        SELECT DISTINCT gl.fkIdListener
        FROM tbGroupListener gl
        JOIN tbGroup g ON gl.fkIdGroup = g.pkIdGroup
        WHERE g.fkIdCourse = @courseId
          AND gl.isDeleted = 0
          AND g.isDeleted = 0;

    OPEN listener_cursor;
    FETCH NEXT FROM listener_cursor INTO @listenerId;

    WHILE @@FETCH_STATUS = 0
    BEGIN
        -- Проверяем, что слушатель не удалён
        SELECT @listenerDeleted = isDeleted FROM tbUsers WHERE pkIdUser = @listenerId;

        IF @listenerDeleted = 0
        BEGIN
            INSERT INTO tbNotification (fkIdUser, message, createdAt)
            VALUES (
                @listenerId,
                CONCAT('В курсе появилось новое задание: «', @taskTitle, '».'),
                GETDATE()
            );
        END

        FETCH NEXT FROM listener_cursor INTO @listenerId;
    END

    CLOSE listener_cursor;
    DEALLOCATE listener_cursor;
END;
GO

CREATE OR ALTER TRIGGER tgAfterMessageInserted
ON tbMessage
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO tbNotification (fkIdUser, message, createdAt)
    SELECT DISTINCT i.fkIdReceiver,
        CONCAT(
            N'Новое личное сообщение от ',
            ISNULL(us.fullName, N'пользователя'),
            N': ',
            LEFT(i.message, 150),
            CASE WHEN LEN(i.message) > 150 THEN N'…' ELSE N'' END
        ),
        GETDATE()
    FROM inserted i
    INNER JOIN tbUsers ur ON ur.pkIdUser = i.fkIdReceiver AND ur.isDeleted = 0
    LEFT JOIN tbUsers us ON us.pkIdUser = i.fkIdSender AND us.isDeleted = 0
    WHERE i.isDeleted = 0
      AND i.fkIdReceiver IS NOT NULL
      AND (i.fkIdSender IS NULL OR i.fkIdSender <> i.fkIdReceiver);
END;
GO

CREATE OR ALTER TRIGGER tgAfterCommentInserted
ON tbComment
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO tbNotification (fkIdUser, message, createdAt)
    SELECT DISTINCT a.fkIdListener,
        CONCAT(N'Новый комментарий к вашей работе по заданию «', t.title, N'».'),
        GETDATE()
    FROM inserted i
    INNER JOIN tbAttempt a ON i.fkIdAttempt = a.pkIdAttempt AND a.isDeleted = 0
    INNER JOIN tbTasks t ON a.fkIdTask = t.pkIdTask AND t.isDeleted = 0
    INNER JOIN tbUsers ul ON ul.pkIdUser = a.fkIdListener AND ul.isDeleted = 0
    WHERE i.isDeleted = 0
      AND i.fkIdAttempt IS NOT NULL
      AND i.fkIdUser <> a.fkIdListener;

    INSERT INTO tbNotification (fkIdUser, message, createdAt)
    SELECT DISTINCT g.fkIdCurator,
        CONCAT(ul.fullName, N' оставил комментарий к работе по заданию «', t.title, N'».'),
        GETDATE()
    FROM inserted i
    INNER JOIN tbAttempt a ON i.fkIdAttempt = a.pkIdAttempt AND a.isDeleted = 0
    INNER JOIN tbTasks t ON a.fkIdTask = t.pkIdTask AND t.isDeleted = 0
    INNER JOIN tbUsers ul ON ul.pkIdUser = i.fkIdUser AND ul.isDeleted = 0
    INNER JOIN tbGroupListener gl ON gl.fkIdListener = a.fkIdListener AND gl.isDeleted = 0
    INNER JOIN tbGroup g ON g.pkIdGroup = gl.fkIdGroup AND g.isDeleted = 0 AND g.fkIdCourse = t.fkIdCourse
    INNER JOIN tbUsers ut ON ut.pkIdUser = g.fkIdCurator AND ut.isDeleted = 0
    WHERE i.isDeleted = 0
      AND i.fkIdAttempt IS NOT NULL
      AND i.fkIdUser = a.fkIdListener;
END;
GO
--#endregion

DECLARE @userId INT = 1; -- Пример значения
DECLARE @sql NVARCHAR(MAX) = N'SET CONTEXT_INFO ' + CAST(@userId AS NVARCHAR(10)) + ';';


--#region ===== ВЫЗОВ CRUD PROC =====
EXEC prGetUsersWithRolesAndPositions;

-- Создание слушателя "Бета"
EXEC spUsersCreate
    @fullName = 'Бета Беттавочи Бетов',
    @login = 'beta',
    @phone = '+375294444444',
    @email = 'beta@yandex.by',
    @passwordHash = 'beta_password',
    @fkIdRole = 3,
    @fkIdPosition = 1;

-- Создание преподавателя "Гамма"
EXEC spUsersCreate
    @fullName = 'Гамма Гаммович Гамов',
    @login = 'gamma',
    @phone = '+375295555555',
    @email = 'gamma@yandex.by',
    @passwordHash = 'gamma_password',
    @fkIdRole = 2,
    @fkIdPosition = 2;

-- Проверка созданных пользователей
SELECT * FROM tbUsers WHERE login IN ('beta', 'gamma');

-- Объявляем переменные для хранения ID
DECLARE @betaUserId INT, @gammaUserId INT;
SELECT @betaUserId = pkIdUser FROM tbUsers WHERE login = 'beta';
SELECT @gammaUserId = pkIdUser FROM tbUsers WHERE login = 'gamma';

-- Обновление слушателя "Бета"
EXEC spUsersUpdate
    @pkIdUser = @betaUserId,
    @fullName = 'Бета Обновлённый',
    @fkIdRole = 3;

-- Мягкое удаление слушателя "Бета"
EXEC spUsersDelete @pkIdUser = @betaUserId;

-- Просмотр удалённых пользователей
EXEC prGetUsersWithRolesAndPositions @isDeleted = 1;

-- Восстановление слушателя "Бета"
EXEC spUsersRestore @pkIdUser = @betaUserId;

-- Физическое удаление слушателя "Бета" (закомментировано для безопасности)
-- EXEC spUsersDelete @pkIdUser = @betaUserId;
-- EXEC spUsersHardDelete @pkIdUser = @betaUserId;

-- ============================================================
-- 2. COURSES (создаём курсы)
-- ============================================================

-- Просмотр активных курсов
EXEC prGetCoursesWithStatusAndTags;

-- Создание курса "Основы программирования"
EXEC spCoursesCreate
    @fkIdStatus = 2,
    @title = 'Основы программирования',
    @description = 'Курс для начинающих программистов.',
    @startDate = '2026-03-01',
    @endDate = '2026-06-01';

-- Получаем ID созданного курса
DECLARE @courseId INT;
SELECT @courseId = pkIdCourse FROM tbCourses WHERE title = 'Основы программирования';

-- Обновление курса
EXEC spCoursesUpdate
    @pkIdCourse = @courseId,
    @description = 'Курс для начинающих программистов (обновлено).';

-- Мягкое удаление курса
EXEC spCoursesDelete @pkIdCourse = @courseId;

EXEC prGetCoursesWithStatusAndTags @isDeleted = 1;

-- Восстановление курса
EXEC spCoursesRestore @pkIdCourse = @courseId;

-- ============================================================
-- 3. GROUPS (создаём группы)
-- ============================================================

-- Просмотр активных групп
EXEC prGetGroupsWithCuratorsAndCourses;  

-- Создание группы "Группа по программированию"
EXEC spGroupsCreate
    @fkIdCourse = @courseId,
    @fkIdCurator = @gammaUserId,
    @name = 'Группа по программированию';

-- Получаем ID созданной группы
DECLARE @groupId INT;
SELECT @groupId = pkIdGroup FROM tbGroup WHERE name = 'Группа по программированию';

-- Обновление группы
EXEC spGroupsUpdate
    @pkIdGroup = @groupId,
    @name = 'Группа по программированию (обновлено)';

-- Мягкое удаление группы
EXEC spGroupsDelete @pkIdGroup = @groupId;

EXEC prGetGroupsWithCuratorsAndCourses @isDeleted = 1;

-- Восстановление группы
EXEC spGroupsRestore @pkIdGroup = @groupId;

-- ============================================================
-- 4. GROUP LISTENERS (добавляем слушателей в группы)
-- ============================================================

-- Просмотр активных слушателей в группах
EXEC prGetGroupListenersWithUserInfo;

-- Добавление слушателя "Бета" в группу
EXEC spGroupListenersCreate
    @fkIdGroup = @groupId,
    @fkIdListener = @betaUserId;

-- Получаем ID добавленного слушателя в группе
DECLARE @groupListenerId INT;
SELECT @groupListenerId = pkIdGroupListener FROM tbGroupListener
WHERE fkIdGroup = @groupId AND fkIdListener = @betaUserId;

-- Мягкое удаление слушателя из группы
EXEC spGroupListenersDelete @pkIdGroupListener = @groupListenerId;

exec prGetGroupListenersWithUserInfo @isDeleted = 1;

-- Восстановление слушателя в группе
EXEC spGroupListenersRestore @pkIdGroupListener = @groupListenerId;

-- ============================================================
-- 5. LESSONS (создаём уроки)
-- ============================================================

-- Просмотр активных уроков
exec prGetLessonsWithCourse 

-- Создание урока "Введение в программирование"
EXEC spLessonsCreate
    @fkIdCourse = @courseId,
    @title = 'Введение в программирование',
    @description = 'Основные понятия программирования.',
    @content = 'Контент урока...',
    @sortOrder = 1,
    @isPublished = 1;

-- Получаем ID созданного урока
DECLARE @lessonId INT;
SELECT @lessonId = pkIdLesson FROM tbLessons WHERE title = 'Введение в программирование';

-- Обновление урока
EXEC spLessonsUpdate
    @pkIdLesson = @lessonId,
    @description = 'Основные понятия программирования (обновлено).';

-- Мягкое удаление урока
EXEC spLessonsDelete @pkIdLesson = @lessonId;

exec prGetLessonsWithCourse @isDeleted = 1

-- Восстановление урока
EXEC spLessonsRestore @pkIdLesson = @lessonId;

-- ============================================================
-- 6. TASKS (создаём задания)
-- ============================================================

-- Просмотр активных заданий
EXEC prGetTasksWithTypesAndLessons;

-- Создание задания "Тест по основам программирования"
EXEC spTasksCreate
    @fkIdTypeTasks = 1,
    @fkIdCourse = @courseId,
    @fkIdLesson = @lessonId,
	@fkIdTest = null,
    @title = 'Тест по основам программирования',
    @description = 'Тест из 10 вопросов.',
    @content = 'Контент задания...',
    @contentFileUrl = NULL,
    @deadline = '2026-04-01',
    @maxScore = 100,
    @sortOrder = 1;

-- Получаем ID созданного задания
DECLARE @taskId INT;
SELECT @taskId = pkIdTask FROM tbTasks WHERE title = 'Тест по основам программирования';

-- Обновление задания
EXEC spTasksUpdate
    @pkIdTask = @taskId,
    @description = 'Тест из 10 вопросов (обновлено).';

-- Мягкое удаление задания
EXEC spTasksDelete @pkIdTask = @taskId;

exec prGetTasksWithTypesAndLessons @isDeleted = 1

-- Восстановление задания
EXEC spTasksRestore @pkIdTask = @taskId;

-- ============================================================
-- 7. MATERIALS (создаём материалы)
-- ============================================================

-- Просмотр активных материалов
EXEC prGetMaterialsWithTypesAndLessons;

-- Создание материала "Презентация по основам программирования"
EXEC spMaterialsCreate
    @fkIdCourse = @courseId,
    @fkIdLesson = @lessonId,
    @fkIdTypeMaterial = 2,
    @title = 'Презентация по основам программирования',
    @description = 'Презентация с основными понятиями.',
    @fileUrl = 'path/to/presentation.pptx',
    @link = NULL,
    @sortOrder = 1,
    @isAdditional = 0;

-- Получаем ID созданного материала
DECLARE @materialId INT;
SELECT @materialId = pkIdMaterial FROM tbMaterial WHERE title = 'Презентация по основам программирования';

-- Обновление материала
EXEC spMaterialsUpdate
    @pkIdMaterial = @materialId,
    @description = 'Презентация с основными понятиями (обновлено).';

-- Мягкое удаление материала
EXEC spMaterialsDelete @pkIdMaterial = @materialId;

exec prGetMaterialsWithTypesAndLessons @isDeleted = 1

-- Восстановление материала
EXEC spMaterialsRestore @pkIdMaterial = @materialId;

-- ============================================================
-- 8. ATTEMPTS (создаём попытки выполнения заданий)
-- ============================================================

-- Просмотр активных попыток
EXEC prGetAttemptsWithUsersAndStatus;

-- Создание попытки выполнения задания
EXEC spAttemptsCreate
    @fkIdTask = @taskId,
    @fkIdListener = @betaUserId,
    @fkIdStatusAttempt = 1,
    @answerText = 'Ответ на задание...',
    @answerFileUrl = NULL,
    @score = NULL;

-- Получаем ID созданной попытки
DECLARE @attemptId INT;
SELECT @attemptId = pkIdAttempt FROM tbAttempt
WHERE fkIdTask = @taskId AND fkIdListener = @betaUserId;

-- Обновление попытки (оценка)
EXEC spAttemptsUpdate
    @pkIdAttempt = @attemptId,
    @fkIdStatusAttempt = 2,
    @score = 85;

-- Мягкое удаление попытки
EXEC spAttemptsDelete @pkIdAttempt = @attemptId;

exec prGetAttemptsWithUsersAndStatus @isDeleted = 1

-- Восстановление попытки
EXEC spAttemptsRestore @pkIdAttempt = @attemptId;

-- ============================================================
-- 9. COMMENTS (создаём комментарии)
-- ============================================================

-- Просмотр активных комментариев
EXEC prGetCommentsWithAttempts;

-- Создание комментария к попытке
EXEC spCommentsCreate
	@fkIdTask = null,
    @fkIdAttempt = @attemptId,
    @fkIdUser = @gammaUserId,
    @message = 'Отличная работа!';

-- Получаем ID созданного комментария
DECLARE @commentId INT;
SELECT @commentId = pkIdComment FROM tbComment
WHERE fkIdAttempt = @attemptId AND fkIdUser = @gammaUserId;

-- Обновление комментария
EXEC spCommentsUpdate
    @pkIdComment = @commentId,
    @message = 'Отличная работа! (обновлено)';

-- Мягкое удаление комментария
EXEC spCommentsDelete @pkIdComment = @commentId;

exec prGetCommentsWithAttempts @isDeleted = 1

-- Восстановление комментария
EXEC spCommentsRestore @pkIdComment = @commentId;

-- ============================================================
-- 10. MESSAGES (создаём сообщения)
-- ============================================================

-- Просмотр активных сообщений
EXEC prGetMessages;

-- Создание сообщения от преподавателя слушателю
EXEC spMessagesCreate
    @fkIdSender = @gammaUserId,
    @fkIdReceiver = @betaUserId,
    @message = 'Привет! Как успехи?';

-- Получаем ID созданного сообщения
DECLARE @messageId INT;
SELECT @messageId = pkIdMessage FROM tbMessage
WHERE fkIdSender = @gammaUserId AND fkIdReceiver = @betaUserId;

-- Обновление сообщения (пометка как прочитанное)
EXEC spMessagesUpdate
    @pkIdMessage = @messageId,
    @isRead = 1;

-- Мягкое удаление сообщения
EXEC spMessagesDelete @pkIdMessage = @messageId;

exec prGetMessages @isDeleted = 1

-- Восстановление сообщения
EXEC spMessagesRestore @pkIdMessage = @messageId;

-- ============================================================
-- 11. NOTIFICATIONS (проверяем уведомления)
-- ============================================================

-- Просмотр активных уведомлений
EXEC prGetNotifications;

-- Проверка уведомлений для слушателя "Бета"
SELECT * FROM tbNotification
WHERE fkIdUser = @betaUserId;

-- Проверка уведомлений для преподавателя "Гамма"
SELECT * FROM tbNotification
WHERE fkIdUser = @gammaUserId;

-- Проверка уведомлений после оценки работы
EXEC spAttemptsUpdate
    @pkIdAttempt = @attemptId,
    @fkIdStatusAttempt = 2,
    @score = 90;

-- Проверка уведомлений для слушателя "Бета" после оценки
SELECT * FROM tbNotification
WHERE fkIdUser = @betaUserId AND message LIKE '%оценена%';

-- Проверка уведомлений для преподавателя "Гамма" после сдачи работы
SELECT * FROM tbNotification
WHERE fkIdUser = @gammaUserId AND message LIKE '%сдал работу%';

-- Проверка уведомлений для преподавателя "Гамма" после добавления слушателя в группу
SELECT * FROM tbNotification
WHERE fkIdUser = @gammaUserId AND message LIKE '%записан новый слушатель%';
--#endregion
