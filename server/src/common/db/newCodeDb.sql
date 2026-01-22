--#region ===== СПРАВОЧНИКИ =====
	CREATE TABLE tbRoles (
	    pkIdRole SERIAL PRIMARY KEY,
	    name VARCHAR(30) UNIQUE NOT NULL
	);
	
	CREATE TABLE tbStatusCourses (
	    pkIdStatusCourse SERIAL PRIMARY KEY,
	    name VARCHAR(30) UNIQUE NOT NULL
	);
	
	CREATE TABLE tbStatusAttempt (
	    pkIdStatusAttempt SERIAL PRIMARY KEY,
	    name VARCHAR(30) UNIQUE NOT NULL
	);
	
	CREATE TABLE tbTypeTasks (
	    pkIdTypeTask SERIAL PRIMARY KEY,
	    name VARCHAR(30) UNIQUE NOT NULL
	);
--#endregion



--#region ===== ОСНОВНЫЕ ТАБЛИЦЫ =====
	CREATE TABLE tbUsers (
	    pkIdUser SERIAL PRIMARY KEY,
	    fkIdRole INT REFERENCES tbRoles(pkIdRole) ON DELETE RESTRICT,
	    fullName VARCHAR(30),
	    login VARCHAR(30) UNIQUE,
	    email VARCHAR(50) UNIQUE,
	    phone VARCHAR(15),
	    passwordHash VARCHAR(255),
	    regData TIMESTAMP DEFAULT NOW(),
	    telegramChatId VARCHAR(255)
	);
	CREATE INDEX idx_users_role ON tbUsers(fkIdRole);
	
	
	CREATE TABLE tbCourses (
	    pkIdCourse SERIAL PRIMARY KEY,
	    fkIdStatus INT REFERENCES tbStatusCourses(pkIdStatusCourse) ON DELETE RESTRICT,
	    title VARCHAR(255),
	    description VARCHAR(511),
	    startDate TIMESTAMP,
	    endDate TIMESTAMP
	);
	CREATE INDEX idx_courses_status ON tbCourses(fkIdStatus);
	
	
	CREATE TABLE tbGroup (
	    pkIdGroup SERIAL PRIMARY KEY,
	    fkIdCourse INT REFERENCES tbCourses(pkIdCourse) ON DELETE CASCADE,
	    fkIdCurator INT REFERENCES tbUsers(pkIdUser) ON DELETE SET NULL,
		name VARCHAR(100) NOT NULL DEFAULT 'Без названия'
	);
	CREATE INDEX idx_group_course ON tbGroup(fkIdCourse);
	CREATE INDEX idx_group_curator ON tbGroup(fkIdCurator);
	
	
	CREATE TABLE tbGroupListener (
	    pkIdGroupListener SERIAL PRIMARY KEY,
	    fkIdGroup INT REFERENCES tbGroup(pkIdGroup) ON DELETE CASCADE,
	    fkIdListener INT REFERENCES tbUsers(pkIdUser) ON DELETE CASCADE,
	    UNIQUE (fkIdGroup, fkIdListener)
	);
	CREATE INDEX idx_grouplistener_group ON tbGroupListener(fkIdGroup);
	CREATE INDEX idx_grouplistener_listener ON tbGroupListener(fkIdListener);
	
	
	CREATE TABLE tbTasks (
	    pkIdTask SERIAL PRIMARY KEY,
	    fkIdTypeTasks INT REFERENCES tbTypeTasks(pkIdTypeTask) ON DELETE RESTRICT,
	    fkIdCourse INT REFERENCES tbCourses(pkIdCourse) ON DELETE CASCADE,
	    title VARCHAR(255),
	    description VARCHAR(511),
	    deadline TIMESTAMP,
	    maxScore INT
	);
	CREATE INDEX idx_tasks_course ON tbTasks(fkIdCourse);
	CREATE INDEX idx_tasks_type ON tbTasks(fkIdTypeTasks);
	
	
	CREATE TABLE tbAttempt (
	    pkIdAttemp SERIAL PRIMARY KEY,
	    fkIdTask INT REFERENCES tbTasks(pkIdTask) ON DELETE CASCADE,
	    fkIdListener INT REFERENCES tbUsers(pkIdUser) ON DELETE CASCADE,
	    fkIdStatusAttempt INT REFERENCES tbStatusAttempt(pkIdStatusAttempt) ON DELETE RESTRICT,
	    submittedAt TIMESTAMP DEFAULT NOW(),
	    score INT
	);
	CREATE INDEX idx_attempt_task ON tbAttempt(fkIdTask);
	CREATE INDEX idx_attempt_listener ON tbAttempt(fkIdListener);
	CREATE INDEX idx_attempt_status ON tbAttempt(fkIdStatusAttempt);
	
	
	CREATE TABLE tbCertificate (
	    pkIdCertificate SERIAL PRIMARY KEY,
	    fkIdListener INT REFERENCES tbUsers(pkIdUser) ON DELETE CASCADE,
	    fkIdCourse INT REFERENCES tbCourses(pkIdCourse) ON DELETE CASCADE,
	    issuedAt TIMESTAMP DEFAULT NOW(),
	    pdfUrl VARCHAR(100)
	);
	CREATE INDEX idx_cert_listener ON tbCertificate(fkIdListener);
	CREATE INDEX idx_cert_course ON tbCertificate(fkIdCourse);
	
	=
	CREATE TABLE tbMaterial (
	    pkIdMaterial SERIAL PRIMARY KEY,
	    fkIdCourse INT REFERENCES tbCourses(pkIdCourse) ON DELETE CASCADE,
	    title VARCHAR(255),
	    fileUrl VARCHAR(100),
	    link VARCHAR(100)
	);
	CREATE INDEX idx_material_course ON tbMaterial(fkIdCourse);
	
	
	CREATE TABLE tbNotification (
	    pkIdNotification SERIAL PRIMARY KEY,
	    fkIdUser INT REFERENCES tbUsers(pkIdUser) ON DELETE CASCADE,
	    message VARCHAR(527),
	    isRead BOOLEAN DEFAULT FALSE,
	    createdAt TIMESTAMP DEFAULT NOW()
	);
	CREATE INDEX idx_notif_user ON tbNotification(fkIdUser);
	
	
	CREATE TABLE tbAdminLog (
	    pkIdLog SERIAL PRIMARY KEY,
	    fkIdAdminUser INT REFERENCES tbUsers(pkIdUser) ON DELETE SET NULL,
	    actionTime TIMESTAMP DEFAULT NOW(),
	    tableName VARCHAR(50), 
	    action VARCHAR(20),  
	    oldData JSONB,               
	    newData JSONB             
	);
	CREATE INDEX idx_log_time ON tbAdminLog(actionTime);
	CREATE INDEX idx_log_table ON tbAdminLog(tableName);
	CREATE INDEX idx_log_admin ON tbAdminLog(fkIdAdminUser);
--#endregion



--#region ===== ЗАПОЛНЕНИЕ ТАБЛИЦ И СПРАВОЧНИКОВ =====
	INSERT INTO tbRoles(name) VALUES ('Администратор'),('Преподаватель'),('Слушатель');
	INSERT INTO tbStatusCourses(name) VALUES ('Черновик'),('Активен'),('Устарел'),('Архив');
	INSERT INTO tbStatusAttempt(name) VALUES ('На проверке'),('Принято'),('Возвращено'),('Апелляция');
	INSERT INTO tbTypeTasks(name) VALUES ('Тест'),('Практическая'),('Аттестация');

	
	-- Администратор (пароль = admin)
	INSERT INTO tbUsers (fullName, login, phone, email, passwordHash, fkidrole)
	VALUES ('Админ Админович Админов', 'admin', '+375291111111', 'admin@yandex.by',
	        '$2a$10$8bMV6qCJaW3g6MuG/EKOTO.7G5uwQ6i2O2nJqPfRcYFDHQX6.wj6S', 1);
	
	-- Преподаватель (пароль = teacher)
	INSERT INTO tbUsers (fullName, login, phone, email, passwordHash, fkidrole)
	VALUES ('Препод Иванович Иванов', 'teacher', '+375292222222', 'teacher@yandex.by',
	        '$2a$10$7hTyQqZ1wQcGKqL4yG5qY.5K5uwQ6i2O2nJqPfRcYFDHQX6.wj6S', 2);
	
	-- Слушатель (пароль = student)
	INSERT INTO tbUsers (fullName, login, phone, email, passwordHash, fkidrole)
	VALUES ('Слушатель Петрович Петров', 'student', '+375293333333', 'student@yandex.by',
	        '$2a$10$4qZzL4yG5qY.5K5uwQ6i2O2nJqPfRcYFDHQX6.wj6S', 3);
--#endregion



--#region ===== ПРЕДСТАВЛЕНИЕ =====
	CREATE OR REPLACE VIEW v_users AS
	SELECT u.pkiduser AS "pkIdUser",
	       u.fullName AS "fullName",
	       u.login,
	       u.phone,
	       u.email,
	       u.passwordhash AS "passwordHash",
	       u.regdata AS "regDate",
	       r.name AS "roleName"
	FROM   tbUsers u
	JOIN   tbRoles r ON r.pkIdRole = u.fkIdRole;
	
	
	CREATE OR REPLACE VIEW v_courses AS
	SELECT c.pkIdCourse AS "pkIdCourse",
	       c.title,
	       c.description,
	       c.startDate AS "startDate",
	       c.endDate,
	       sc.name AS "statusName",
	       CASE WHEN c.endDate < NOW() THEN TRUE ELSE FALSE END AS "isOverdue"
	FROM   tbCourses c
	JOIN   tbStatusCourses sc ON sc.pkIdStatusCourse = c.fkIdStatus;
	
	
	CREATE OR REPLACE VIEW v_groups AS
	SELECT g.pkIdGroup AS "pkIdGroup",
	       g.name      AS "groupName",
	       c.title     AS "courseTitle",
	       u.fullName  AS "curatorName",
	       COUNT(gl.fkIdListener) AS "listenerCount"
	FROM   tbGroup g
	JOIN   tbCourses c ON c.pkIdCourse = g.fkIdCourse
	LEFT   JOIN tbUsers u ON u.pkIdUser = g.fkIdCurator
	LEFT   JOIN tbGroupListener gl ON gl.fkIdGroup = g.pkIdGroup
	GROUP  BY g.pkIdGroup, g.name, c.title, u.fullName;
	
	
	CREATE OR REPLACE VIEW v_group_listeners AS
	SELECT gl.pkIdGroupListener AS "pkIdGroupListener",
	       g.name AS "groupName",
	       c.title AS "courseTitle",
	       u.fullName AS "listenerName",
	       u.email
	FROM   tbGroupListener gl
	JOIN   tbGroup g ON g.pkIdGroup = gl.fkIdGroup
	JOIN   tbCourses c ON c.pkIdCourse = g.fkIdCourse
	JOIN   tbUsers u ON u.pkIdUser = gl.fkIdListener;
	
	
	CREATE OR REPLACE VIEW v_tasks AS
	SELECT t.pkIdTask AS "pkIdTask",
	       c.title AS "courseTitle",
	       tt.name AS "taskType",
	       t.title,
	       t.description,
	       t.deadline,
	       t.maxScore,
	       (t.deadline < NOW()) AS "isOverdue"
	FROM   tbTasks t
	JOIN   tbCourses c ON c.pkIdCourse = t.fkIdCourse
	JOIN   tbTypeTasks tt ON tt.pkIdTypeTask = t.fkIdTypeTasks;
	
	
	CREATE OR REPLACE VIEW v_attempts AS
	SELECT a.pkIdAttemp AS "pkIdAttemp",
	       t.title AS "taskTitle",
	       u.fullName AS "listenerName",
	       sa.name AS "statusName",
	       a.submittedAt AS "submittedAt",
	       a.score,
	       t.maxScore,
	       ROUND(100.0 * a.score / NULLIF(t.maxScore,0), 1) AS "percent"
	FROM   tbAttempt a
	JOIN   tbTasks t ON t.pkIdTask = a.fkIdTask
	JOIN   tbCourses c ON c.pkIdCourse = t.fkIdCourse
	JOIN   tbUsers u ON u.pkIdUser = a.fkIdListener
	JOIN   tbStatusAttempt sa ON sa.pkIdStatusAttempt = a.fkIdStatusAttempt;
	
	
	CREATE OR REPLACE VIEW v_certificates AS
	SELECT cert.pkIdCertificate AS "pkIdCertificate",
	       u.fullName AS "listenerName",
	       c.title AS "courseTitle",
	       cert.issuedAt AS "issuedAt",
	       cert.pdfUrl AS "pdfUrl"
	FROM   tbCertificate cert
	JOIN   tbUsers u ON u.pkIdUser = cert.fkIdListener
	JOIN   tbCourses c ON c.pkIdCourse = cert.fkIdCourse;
	
	
	CREATE OR REPLACE VIEW v_materials AS
	SELECT m.pkIdMaterial AS "pkIdMaterial",
	       c.title AS "courseTitle",
	       m.title,
	       m.fileUrl AS "fileUrl",
	       m.link
	FROM   tbMaterial m
	JOIN   tbCourses c ON c.pkIdCourse = m.fkIdCourse;
	
	
	CREATE OR REPLACE VIEW v_notifications AS
	SELECT n.pkIdNotification AS "pkIdNotification",
	       u.fullName AS "userName",
	       n.message,
	       n.isRead AS "isRead",
	       n.createdAt AS "createdAt"
	FROM   tbNotification n
	JOIN   tbUsers u ON u.pkIdUser = n.fkIdUser;
	
	
	CREATE OR REPLACE VIEW v_admin_log AS
	SELECT l.pkIdLog AS "pkIdLog",
	       a.fullName  AS "adminName",
	       l.actionTime AS "actionTime",
	       l.tableName AS "tableName",
	       l.action,
	       l.oldData AS "oldData",
	       l.newData AS "newData"
	FROM   tbAdminLog l
	LEFT   JOIN tbUsers a ON a.pkIdUser = l.fkIdAdminUser;
--#endregion



--#region ===== CRUD FUNC =====
	--#region ===== USERS =====
		CREATE OR REPLACE FUNCTION f_users_get(
		    p_id INT DEFAULT NULL,
		    p_role INT DEFAULT NULL,
		    p_email TEXT DEFAULT NULL,
		    p_login TEXT DEFAULT NULL
		)
		RETURNS SETOF v_users
		LANGUAGE sql STABLE
		AS $$
		    SELECT * FROM v_users
		    WHERE (p_id    IS NULL OR "pkIdUser" = p_id)
		      AND (p_role  IS NULL OR "pkIdUser" IN (SELECT pkIdUser FROM tbUsers WHERE fkIdRole = p_role))
		      AND (p_email IS NULL OR email = p_email)
		      AND (p_login IS NULL OR login = p_login)
		    ORDER BY "pkIdUser";
		$$;
		
		
		CREATE OR REPLACE FUNCTION f_users_create(
		    p_fullName     TEXT,
		    p_login        TEXT,
		    p_phone        TEXT,
		    p_email        TEXT,
		    p_passwordHash TEXT,
		    p_roleId       INT
		)
		RETURNS v_users
		LANGUAGE plpgsql
		AS $$
		DECLARE
		    v_user_id INT;
		    v_result  v_users;
		BEGIN
		    INSERT INTO tbUsers(fullName, login, phone, email, passwordHash, fkIdRole)
		    VALUES (p_fullName, p_login, p_phone, p_email, p_passwordHash, p_roleId)
		    RETURNING pkIdUser INTO v_user_id;
		
		    SELECT * INTO v_result
		    FROM v_users
		    WHERE "pkIdUser" = v_user_id;
		
		    RETURN v_result;
		END;
		$$;

		
		CREATE OR REPLACE FUNCTION f_users_update(
		    p_id           INT,
		    p_fullName     TEXT DEFAULT NULL,
		    p_login        TEXT DEFAULT NULL,
		    p_phone        TEXT DEFAULT NULL,
		    p_email        TEXT DEFAULT NULL,
		    p_passwordHash TEXT DEFAULT NULL,
		    p_roleId       INT DEFAULT NULL
		)
		RETURNS v_users
		LANGUAGE plpgsql
		AS $$
		DECLARE
		    v_user_id INT;
		    v_result  v_users;
		BEGIN
		    UPDATE tbUsers u
		    SET fullName   = COALESCE(p_fullName,     u.fullName),
		        login      = COALESCE(p_login,        u.login),
		        phone      = COALESCE(p_phone,        u.phone),
		        email      = COALESCE(p_email,        u.email),
		        passwordHash = COALESCE(p_passwordHash, u.passwordHash),
		        fkIdRole   = COALESCE(p_roleId,       u.fkIdRole)
		    WHERE u.pkIdUser = p_id
		    RETURNING pkIdUser INTO v_user_id;
		
		    IF v_user_id IS NULL THEN
		        RAISE EXCEPTION 'Пользователь % не найден', p_id;
		    END IF;
		
		    SELECT * INTO v_result FROM v_users WHERE "pkIdUser" = v_user_id;
		    RETURN v_result;
		END;
		$$;
		
		
		CREATE OR REPLACE FUNCTION f_users_delete(p_id INT)
		RETURNS TABLE(deleted_id INT, message TEXT)
		LANGUAGE plpgsql
		AS $$
		BEGIN
		    DELETE FROM tbUsers WHERE pkIdUser = p_id
		    RETURNING pkIdUser INTO deleted_id;
		
		    IF NOT FOUND THEN
		        RAISE EXCEPTION 'Пользователь % не найден', p_id;
		    END IF;
		
		    message := 'Пользователь удалён';
		    RETURN NEXT;
		END;
		$$;
	--#endregion
	
	--#region ===== COURSES =====
		CREATE OR REPLACE FUNCTION f_courses_get(
		    p_id     INT DEFAULT NULL,
		    p_status INT DEFAULT NULL
		)
		RETURNS SETOF v_courses
		LANGUAGE sql STABLE
		AS $$
		    SELECT * FROM v_courses
		    WHERE (p_id     IS NULL OR "pkIdCourse" = p_id)
		      AND (p_status IS NULL OR "pkIdCourse" IN (SELECT pkIdCourse FROM tbCourses WHERE fkIdStatus = p_status))
		    ORDER BY "pkIdCourse";
		$$;

		
		CREATE OR REPLACE FUNCTION f_courses_create(
		    p_title       TEXT,
		    p_description TEXT DEFAULT NULL,
		    p_startDate   TIMESTAMP DEFAULT NULL,
		    p_endDate     TIMESTAMP DEFAULT NULL,
		    p_statusId    INT DEFAULT 1
		)
		RETURNS v_courses
		LANGUAGE plpgsql
		AS $$
		DECLARE
		    v_id INT;
		    v_rec v_courses;
		BEGIN
		    INSERT INTO tbCourses(title, description, startDate, endDate, fkIdStatus)
		    VALUES (p_title, p_description, p_startDate, p_endDate, p_statusId)
		    RETURNING pkIdCourse INTO v_id;
		
		    SELECT * INTO v_rec FROM v_courses WHERE "pkIdCourse" = v_id;
		    RETURN v_rec;
		END;
		$$;

		
		CREATE OR REPLACE FUNCTION f_courses_update(
		    p_id          INT,
		    p_title       TEXT DEFAULT NULL,
		    p_description TEXT DEFAULT NULL,
		    p_startDate   TIMESTAMP DEFAULT NULL,
		    p_endDate     TIMESTAMP DEFAULT NULL,
		    p_statusId    INT DEFAULT NULL
		)
		RETURNS v_courses
		LANGUAGE plpgsql
		AS $$
		DECLARE
		    v_id INT;
		    v_rec v_courses;
		BEGIN
		    UPDATE tbCourses c
		    SET title       = COALESCE(p_title,       c.title),
		        description = COALESCE(p_description, c.description),
		        startDate   = COALESCE(p_startDate,   c.startDate),
		        endDate     = COALESCE(p_endDate,     c.endDate),
		        fkIdStatus  = COALESCE(p_statusId,    c.fkIdStatus)
		    WHERE c.pkIdCourse = p_id
		    RETURNING pkIdCourse INTO v_id;
		
		    IF v_id IS NULL THEN
		        RAISE EXCEPTION 'Курс % не найден', p_id;
		    END IF;
		
		    SELECT * INTO v_rec FROM v_courses WHERE "pkIdCourse" = v_id;
		    RETURN v_rec;
		END;
		$$;

		
		CREATE OR REPLACE FUNCTION f_courses_delete(p_id INT)
		RETURNS TABLE(deleted_id INT, message TEXT)
		LANGUAGE plpgsql
		AS $$
		BEGIN
		    DELETE FROM tbCourses WHERE pkIdCourse = p_id
		    RETURNING pkIdCourse INTO deleted_id;
		
		    IF NOT FOUND THEN
		        RAISE EXCEPTION 'Курс % не найден', p_id;
		    END IF;
		
		    message := 'Курс удалён (вместе с группами, заданиями, материалами)';
		    RETURN NEXT;
		END;
		$$;
	--#endregion

	--#region ===== GROUPS =====
		CREATE OR REPLACE FUNCTION f_groups_get(
		    p_id     INT DEFAULT NULL,
		    p_course INT DEFAULT NULL
		)
		RETURNS SETOF v_groups
		LANGUAGE sql STABLE
		AS $$
		    SELECT * FROM v_groups
		    WHERE (p_id     IS NULL OR "pkIdGroup" = p_id)
		      AND (p_course IS NULL OR "pkIdGroup" IN (SELECT pkIdGroup FROM tbGroup WHERE fkIdCourse = p_course))
		    ORDER BY "pkIdGroup";
		$$;



		CREATE OR REPLACE FUNCTION f_groups_create(
		    p_name      TEXT,
		    p_courseId  INT,
		    p_curatorId INT DEFAULT NULL
		)
		RETURNS v_groups
		LANGUAGE plpgsql
		AS $$
		DECLARE
		    v_group_id INT;
		    v_result   v_groups;
		BEGIN
		    INSERT INTO tbGroup(name, fkIdCourse, fkIdCurator)
		    VALUES (p_name, p_courseId, p_curatorId)
		    RETURNING pkIdGroup INTO v_group_id;
		
		    SELECT * INTO v_result FROM v_groups WHERE "pkIdGroup" = v_group_id;
		    RETURN v_result;
		END;
		$$;

		
		CREATE OR REPLACE FUNCTION f_groups_update(
		    p_id        INT,
		    p_name      TEXT DEFAULT NULL,
		    p_courseId  INT DEFAULT NULL,
		    p_curatorId INT DEFAULT NULL
		)
		RETURNS v_groups
		LANGUAGE plpgsql
		AS $$
		DECLARE
		    v_group_id INT;
		    v_result   v_groups;
		BEGIN
		    UPDATE tbGroup g
		    SET name       = COALESCE(p_name,      g.name),
		        fkIdCourse = COALESCE(p_courseId,  g.fkIdCourse),
		        fkIdCurator= COALESCE(p_curatorId, g.fkIdCurator)
		    WHERE g.pkIdGroup = p_id
		    RETURNING pkIdGroup INTO v_group_id;
		
		    IF v_group_id IS NULL THEN
		        RAISE EXCEPTION 'Группа % не найдена', p_id;
		    END IF;
		
		    SELECT * INTO v_result FROM v_groups WHERE "pkIdGroup" = v_group_id;
		    RETURN v_result;
		END;
		$$;

		
		CREATE OR REPLACE FUNCTION f_groups_delete(p_id INT)
		RETURNS TABLE(deleted_id INT, message TEXT)
		LANGUAGE plpgsql
		AS $$
		BEGIN
		    DELETE FROM tbGroup WHERE pkIdGroup = p_id
		    RETURNING pkIdGroup INTO deleted_id;
		
		    IF deleted_id IS NULL THEN
		        RAISE EXCEPTION 'Группа % не найдена', p_id;
		    END IF;
		
		    message := 'Группа удалена (вместе с записями слушателей)';
		    RETURN NEXT;
		END;
		$$;
	--#endregion
	
	--#region ===== TASKS =====
		CREATE OR REPLACE FUNCTION f_tasks_get(
		    p_id     INT DEFAULT NULL,
		    p_course INT DEFAULT NULL,
		    p_type   INT DEFAULT NULL
		)
		RETURNS SETOF v_tasks
		LANGUAGE sql STABLE
		AS $$
		    SELECT * FROM v_tasks
		    WHERE (p_id     IS NULL OR "pkIdTask" = p_id)
		      AND (p_course IS NULL OR "pkIdTask" IN (SELECT pkIdTask FROM tbTasks WHERE fkIdCourse = p_course))
		      AND (p_type   IS NULL OR "pkIdTask" IN (SELECT pkIdTask FROM tbTasks WHERE fkIdTypeTasks = p_type))
		    ORDER BY "pkIdTask";
		$$;


		CREATE OR REPLACE FUNCTION f_tasks_create(
		    p_courseId  INT,
		    p_typeId    INT,
		    p_title     TEXT,
		    p_desc      TEXT DEFAULT NULL,
		    p_deadline  TIMESTAMP DEFAULT NULL,
		    p_maxScore  INT DEFAULT 100
		)
		RETURNS v_tasks
		LANGUAGE plpgsql
		AS $$
		DECLARE
		    v_task_id INT;
		    v_result  v_tasks;
		BEGIN
		    INSERT INTO tbTasks(fkIdCourse, fkIdTypeTasks, title, description, deadline, maxScore)
		    VALUES (p_courseId, p_typeId, p_title, p_desc, p_deadline, p_maxScore)
		    RETURNING pkIdTask INTO v_task_id;
		
		    SELECT * INTO v_result FROM v_tasks WHERE "pkIdTask" = v_task_id;
		    RETURN v_result;
		END;
		$$;


		CREATE OR REPLACE FUNCTION f_tasks_update(
		    p_id       INT,
		    p_courseId INT DEFAULT NULL,
		    p_typeId   INT DEFAULT NULL,
		    p_title    TEXT DEFAULT NULL,
		    p_desc     TEXT DEFAULT NULL,
		    p_deadline TIMESTAMP DEFAULT NULL,
		    p_maxScore INT DEFAULT NULL
		)
		RETURNS v_tasks
		LANGUAGE plpgsql
		AS $$
		DECLARE
		    v_task_id INT;
		    v_result  v_tasks;
		BEGIN
		    UPDATE tbTasks t
		    SET fkIdCourse   = COALESCE(p_courseId, t.fkIdCourse),
		        fkIdTypeTasks= COALESCE(p_typeId,   t.fkIdTypeTasks),
		        title        = COALESCE(p_title,    t.title),
		        description  = COALESCE(p_desc,     t.description),
		        deadline     = COALESCE(p_deadline, t.deadline),
		        maxScore     = COALESCE(p_maxScore, t.maxScore)
		    WHERE t.pkIdTask = p_id
		    RETURNING pkIdTask INTO v_task_id;
		
		    IF v_task_id IS NULL THEN
		        RAISE EXCEPTION 'Задание % не найдено', p_id;
		    END IF;
		
		    SELECT * INTO v_result FROM v_tasks WHERE "pkIdTask" = v_task_id;
		    RETURN v_result;
		END;
		$$;


		CREATE OR REPLACE FUNCTION f_tasks_delete(p_id INT)
		RETURNS TABLE(deleted_id INT, message TEXT)
		LANGUAGE plpgsql
		AS $$
		BEGIN
		    DELETE FROM tbTasks WHERE pkIdTask = p_id
		    RETURNING pkIdTask INTO deleted_id;
		
		    IF NOT FOUND THEN
		        RAISE EXCEPTION 'Задание % не найдено', p_id;
		    END IF;
		
		    message := 'Задание удалено (вместе с попытками)';
		    RETURN NEXT;
		END;
		$$;
	--#endregion

	--#region ===== ATTEMPTS =====
		CREATE OR REPLACE FUNCTION f_attempts_get(
		    p_id       INT DEFAULT NULL,
		    p_task     INT DEFAULT NULL,
		    p_listener INT DEFAULT NULL,
		    p_status   INT DEFAULT NULL
		)
		RETURNS SETOF v_attempts
		LANGUAGE sql STABLE
		AS $$
		    SELECT * FROM v_attempts
		    WHERE (p_id       IS NULL OR "pkIdAttemp" = p_id)
		      AND (p_task     IS NULL OR "pkIdAttemp" IN (SELECT pkIdAttemp FROM tbAttempt WHERE fkIdTask = p_task))
		      AND (p_listener IS NULL OR "pkIdAttemp" IN (SELECT pkIdAttemp FROM tbAttempt WHERE fkIdListener = p_listener))
		      AND (p_status   IS NULL OR "pkIdAttemp" IN (SELECT pkIdAttemp FROM tbAttempt WHERE fkIdStatusAttempt = p_status))
		    ORDER BY "submittedAt" DESC;
		$$;

		
		CREATE OR REPLACE FUNCTION f_attempts_create(
		    p_taskId     INT,
		    p_listenerId INT,
		    p_score      INT DEFAULT NULL,
		    p_statusId   INT DEFAULT 1   -- «На проверке»
		)
		RETURNS v_attempts
		LANGUAGE plpgsql
		AS $$
		DECLARE
		    v_attempt_id INT;
		    v_result     v_attempts;
		BEGIN
		    INSERT INTO tbAttempt(fkIdTask, fkIdListener, score, fkIdStatusAttempt)
		    VALUES (p_taskId, p_listenerId, p_score, p_statusId)
		    RETURNING pkIdAttemp INTO v_attempt_id;
		
		    SELECT * INTO v_result FROM v_attempts WHERE "pkIdAttemp" = v_attempt_id;
		    RETURN v_result;
		END;
		$$;

		
		CREATE OR REPLACE FUNCTION f_attempts_grade(
		    p_id       INT,
		    p_score    INT,
		    p_statusId INT DEFAULT 2 
		)
		RETURNS v_attempts
		LANGUAGE plpgsql
		AS $$
		DECLARE
		    v_attempt_id INT;
		    v_result     v_attempts;
		BEGIN
		    UPDATE tbAttempt a
		    SET score             = p_score,
		        fkIdStatusAttempt = p_statusId
		    WHERE a.pkIdAttemp = p_id
		    RETURNING pkIdAttemp INTO v_attempt_id;
		
		    IF v_attempt_id IS NULL THEN
		        RAISE EXCEPTION 'Попытка % не найдена', p_id;
		    END IF;
		
		    SELECT * INTO v_result FROM v_attempts WHERE "pkIdAttemp" = v_attempt_id;
		    RETURN v_result;
		END;
		$$;

		
		CREATE OR REPLACE FUNCTION f_attempts_delete(p_id INT)
		RETURNS TABLE(deleted_id INT, message TEXT)
		LANGUAGE plpgsql
		AS $$
		BEGIN
		    DELETE FROM tbAttempt WHERE pkIdAttemp = p_id
		    RETURNING pkIdAttemp INTO deleted_id;
		
		    IF NOT FOUND THEN
		        RAISE EXCEPTION 'Попытка % не найдена', p_id;
		    END IF;
		
		    message := 'Попытка удалена';
		    RETURN NEXT;
		END;
		$$;
	--#endregion

	--#region ===== CERTIFICATES =====
		CREATE OR REPLACE FUNCTION f_certificates_get(
		    p_id       INT DEFAULT NULL,
		    p_listener INT DEFAULT NULL,
		    p_course   INT DEFAULT NULL
		)
		RETURNS SETOF v_certificates
		LANGUAGE sql STABLE
		AS $$
		    SELECT * FROM v_certificates
		    WHERE (p_id       IS NULL OR "pkIdCertificate" = p_id)
		      AND (p_listener IS NULL OR "pkIdCertificate" IN (SELECT pkIdCertificate FROM tbCertificate WHERE fkIdListener = p_listener))
		      AND (p_course   IS NULL OR "pkIdCertificate" IN (SELECT pkIdCertificate FROM tbCertificate WHERE fkIdCourse = p_course))
		    ORDER BY "issuedAt" DESC;
		$$;

		
		CREATE OR REPLACE FUNCTION f_certificates_issue(
		    p_listenerId INT,
		    p_courseId   INT,
		    p_pdfUrl     TEXT DEFAULT NULL
		)
		RETURNS v_certificates
		LANGUAGE plpgsql
		AS $$
		DECLARE
		    v_cert_id INT;
		    v_result  v_certificates;
		BEGIN
		    INSERT INTO tbCertificate(fkIdListener, fkIdCourse, pdfUrl)
		    VALUES (p_listenerId, p_courseId, p_pdfUrl)
		    RETURNING pkIdCertificate INTO v_cert_id;
		
		    SELECT * INTO v_result FROM v_certificates WHERE "pkIdCertificate" = v_cert_id;
		    RETURN v_result;
		END;
		$$;

		
		CREATE OR REPLACE FUNCTION f_certificates_update(
		    p_id     INT,
		    p_pdfUrl TEXT
		)
		RETURNS v_certificates
		LANGUAGE plpgsql
		AS $$
		DECLARE
		    v_cert_id INT;
		    v_result  v_certificates;
		BEGIN
		    UPDATE tbCertificate cert
		    SET pdfUrl = p_pdfUrl
		    WHERE cert.pkIdCertificate = p_id
		    RETURNING pkIdCertificate INTO v_cert_id;
		
		    IF v_cert_id IS NULL THEN
		        RAISE EXCEPTION 'Сертификат % не найден', p_id;
		    END IF;
		
		    SELECT * INTO v_result FROM v_certificates WHERE "pkIdCertificate" = v_cert_id;
		    RETURN v_result;
		END;
		$$;

		
		CREATE OR REPLACE FUNCTION f_certificates_delete(p_id INT)
		RETURNS TABLE(deleted_id INT, message TEXT)
		LANGUAGE plpgsql
		AS $$
		BEGIN
		    DELETE FROM tbCertificate WHERE pkIdCertificate = p_id
		    RETURNING pkIdCertificate INTO deleted_id;
		
		    IF NOT FOUND THEN
		        RAISE EXCEPTION 'Сертификат % не найден', p_id;
		    END IF;
		
		    message := 'Сертификат аннулирован';
		    RETURN NEXT;
		END;
		$$;
	--#endregion
		
	--#region ===== MATERIALS =====
		CREATE OR REPLACE FUNCTION f_materials_get(
		    p_id     INT DEFAULT NULL,
		    p_course INT DEFAULT NULL
		)
		RETURNS SETOF v_materials
		LANGUAGE sql STABLE
		AS $$
		    SELECT * FROM v_materials
		    WHERE (p_id     IS NULL OR "pkIdMaterial" = p_id)
		      AND (p_course IS NULL OR "pkIdMaterial" IN (SELECT pkIdMaterial FROM tbMaterial WHERE fkIdCourse = p_course))
		    ORDER BY "pkIdMaterial";
		$$;


		CREATE OR REPLACE FUNCTION f_materials_create(
		    p_courseId INT,
		    p_title    TEXT,
		    p_fileUrl  TEXT DEFAULT NULL,
		    p_link     TEXT DEFAULT NULL
		)
		RETURNS v_materials
		LANGUAGE plpgsql
		AS $$
		DECLARE
		    v_mat_id INT;
		    v_result v_materials;
		BEGIN
		    INSERT INTO tbMaterial(fkIdCourse, title, fileUrl, link)
		    VALUES (p_courseId, p_title, p_fileUrl, p_link)
		    RETURNING pkIdMaterial INTO v_mat_id;
		
		    SELECT * INTO v_result FROM v_materials WHERE "pkIdMaterial" = v_mat_id;
		    RETURN v_result;
		END;
		$$;


		CREATE OR REPLACE FUNCTION f_materials_update(
		    p_id      INT,
		    p_title   TEXT DEFAULT NULL,
		    p_fileUrl TEXT DEFAULT NULL,
		    p_link    TEXT DEFAULT NULL
		)
		RETURNS v_materials
		LANGUAGE plpgsql
		AS $$
		DECLARE
		    v_mat_id INT;
		    v_result v_materials;
		BEGIN
		    UPDATE tbMaterial m
		    SET title   = COALESCE(p_title,   m.title),
		        fileUrl = COALESCE(p_fileUrl, m.fileUrl),
		        link    = COALESCE(p_link,    m.link)
		    WHERE m.pkIdMaterial = p_id
		    RETURNING pkIdMaterial INTO v_mat_id;
		
		    IF v_mat_id IS NULL THEN
		        RAISE EXCEPTION 'Материал % не найден', p_id;
		    END IF;
		
		    SELECT * INTO v_result FROM v_materials WHERE "pkIdMaterial" = v_mat_id;
		    RETURN v_result;
		END;
		$$;


		CREATE OR REPLACE FUNCTION f_materials_delete(p_id INT)
		RETURNS TABLE(deleted_id INT, message TEXT)
		LANGUAGE plpgsql
		AS $$
		BEGIN
			DELETE FROM tbMaterial WHERE pkIdMaterial = p_id
			RETURNING pkIdMaterial INTO deleted_id;
		
			IF NOT FOUND THEN
				RAISE EXCEPTION 'Материал % не найден', p_id;
			END IF;
		
			message := 'Материал удалён';
			RETURN NEXT;
		END;
		$$;
	--#endregion

	--#region ===== NOTIFICATIONS =====
		CREATE OR REPLACE FUNCTION f_notifications_get(
		    p_id     INT DEFAULT NULL,
		    p_user   INT DEFAULT NULL,
		    p_unread BOOLEAN DEFAULT NULL   -- TRUE = только непрочитанные
		)
		RETURNS SETOF v_notifications
		LANGUAGE sql STABLE
		AS $$
		    SELECT * FROM v_notifications
		    WHERE (p_id     IS NULL OR "pkIdNotification" = p_id)
		      AND (p_user   IS NULL OR "pkIdNotification" IN (SELECT pkIdNotification FROM tbNotification WHERE fkIdUser = p_user))
		      AND (p_unread IS NULL OR "isRead" = NOT p_unread)
		    ORDER BY "createdAt" DESC;
		$$;
		
		CREATE OR REPLACE FUNCTION f_notifications_create(
		    p_userId  INT,
		    p_message TEXT
		)
		RETURNS v_notifications
		LANGUAGE plpgsql
		AS $$
		DECLARE
		    v_notif_id INT;
		    v_result   v_notifications;
		BEGIN
		    INSERT INTO tbNotification(fkIdUser, message)
		    VALUES (p_userId, p_message)
		    RETURNING pkIdNotification INTO v_notif_id;
		
		    SELECT * INTO v_result FROM v_notifications WHERE "pkIdNotification" = v_notif_id;
		    RETURN v_result;
		END;
		$$;
		
		
		CREATE OR REPLACE FUNCTION f_notifications_mark_read(p_id INT)
		RETURNS v_notifications
		LANGUAGE plpgsql
		AS $$
		DECLARE
		    v_notif_id INT;
		    v_result   v_notifications;
		BEGIN
		    UPDATE tbNotification n
		    SET isRead = TRUE
		    WHERE n.pkIdNotification = p_id
		    RETURNING pkIdNotification INTO v_notif_id;
		
		    IF v_notif_id IS NULL THEN
		        RAISE EXCEPTION 'Уведомление % не найдено', p_id;
		    END IF;
		
		    SELECT * INTO v_result FROM v_notifications WHERE "pkIdNotification" = v_notif_id;
		    RETURN v_result;
		END;
		$$;
		
		
		CREATE OR REPLACE FUNCTION f_notifications_delete(p_id INT)
		RETURNS TABLE(deleted_id INT, message TEXT)
		LANGUAGE plpgsql
		AS $$
		BEGIN
		    DELETE FROM tbNotification WHERE pkIdNotification = p_id
		    RETURNING pkIdNotification INTO deleted_id;
		
		    IF NOT FOUND THEN
		        RAISE EXCEPTION 'Уведомление % не найдено', p_id;
		    END IF;
		
		    message := 'Уведомление удалено';
		    RETURN NEXT;
		END;
		$$;
	--#endregion

	--#region ===== GROUP LISTENERS =====
		CREATE OR REPLACE FUNCTION f_grouplisteners_get(
		    p_group    INT DEFAULT NULL,
		    p_listener INT DEFAULT NULL
		)
		RETURNS SETOF v_group_listeners
		LANGUAGE sql STABLE
		AS $$
		    SELECT * FROM v_group_listeners
		    WHERE (p_group    IS NULL OR "pkIdGroupListener" IN (SELECT pkIdGroupListener FROM tbGroupListener WHERE fkIdGroup = p_group))
		      AND (p_listener IS NULL OR "pkIdGroupListener" IN (SELECT pkIdGroupListener FROM tbGroupListener WHERE fkIdListener = p_listener))
		    ORDER BY "groupName", "listenerName";
		$$;
		
		
		CREATE OR REPLACE FUNCTION f_grouplisteners_add(
		    p_groupId    INT,
		    p_listenerId INT
		)
		RETURNS v_group_listeners
		LANGUAGE plpgsql
		AS $$
		DECLARE
		    v_id     INT;
		    v_result v_group_listeners;
		BEGIN
		    INSERT INTO tbGroupListener(fkIdGroup, fkIdListener)
		    VALUES (p_groupId, p_listenerId)
		    RETURNING pkIdGroupListener INTO v_id;
		
		    SELECT * INTO v_result FROM v_group_listeners WHERE "pkIdGroupListener" = v_id;
		    RETURN v_result;
		END;
		$$;
		
		
		CREATE OR REPLACE FUNCTION f_grouplisteners_remove(p_id INT)
		RETURNS TABLE(deleted_id INT, message TEXT)
		LANGUAGE plpgsql
		AS $$
		BEGIN
		    DELETE FROM tbGroupListener WHERE pkIdGroupListener = p_id
		    RETURNING pkIdGroupListener INTO deleted_id;
		
		    IF NOT FOUND THEN
		        RAISE EXCEPTION 'Запись % не найдена', p_id;
		    END IF;
		
		    message := 'Слушатель исключён из группы';
		    RETURN NEXT;
		END;
		$$;
	--#endregion
	
--#endregion

--#region ===== ВЫЗОВ CRUD FUNC =====
	SELECT * FROM f_users_get()
	SELECT * FROM f_users_create(
	    'Бета',               
	    'beta',               
	    '+375294444444',     
	    'beta@yandex.by',     
	    'beta_password',      
	    3                
	);
	SELECT * FROM f_users_update(
		(select pkiduser from tbUsers where login = 'beta'),
	    'Бета Бетанович Бетов'            
	);
	SELECT * FROM f_users_delete((select pkiduser from tbUsers where login = 'beta'))
	
	
	SELECT * FROM f_courses_get();
	SELECT * FROM f_courses_create('React', 'Курс по React', '2025-09-01', '2025-12-01', 2);
	SELECT * FROM f_courses_update(
	    (SELECT pkIdCourse FROM tbCourses WHERE title = 'React'),
	    'React Advanced'
	);
	SELECT * FROM f_courses_delete(
	    (SELECT pkIdCourse FROM tbCourses WHERE title = 'React Advanced')
	);
	
	
	SELECT * FROM f_groups_create('React-2025', 2, 2);
	SELECT * FROM f_groups_get();
	SELECT * FROM f_groups_update(
	    (SELECT "pkIdGroup" FROM v_groups WHERE "groupName" = 'React-2025'),
	    'React-2025-Premium'
	);
	SELECT * FROM f_groups_delete(
	    (SELECT "pkIdGroup" FROM v_groups WHERE "groupName" = 'React-2025-Premium')
	);
	
	
	SELECT * FROM f_tasks_get();
	SELECT * FROM f_tasks_create(
	    2,                      
	    2,                      
	    'Домашняя работа #1',
	    'Сделать CRUD на NestJS',
	    '2025-09-15 23:59:59',
	    100
	);
	SELECT * FROM f_tasks_update(
	    (SELECT "pkIdTask" FROM v_tasks WHERE title = 'Домашняя работа #1'),
	    p_maxScore => 120
	);
	SELECT * FROM f_tasks_delete(
	    (SELECT "pkIdTask" FROM v_tasks WHERE title = 'Домашняя работа #1')
	);
	
	
	SELECT * FROM f_attempts_get();
	-- сдать задачу 3 слушателем 3 (без оценки, статус «На проверке»)
	SELECT * FROM f_attempts_create(3, 3);
	-- препод поставил 100 и принял
	SELECT * FROM f_attempts_grade(
	    (SELECT "pkIdAttemp" FROM v_attempts WHERE "listenerName" = 'Слушатель Петрович Петров' LIMIT 1),
	    100
	);
	SELECT * FROM f_attempts_delete(
	    (SELECT "pkIdAttemp" FROM v_attempts WHERE "listenerName" = 'Слушатель Петрович Петров' LIMIT 1)
	);

	
	SELECT * FROM f_certificates_get(p_listener => 3);
	-- выдать сертификат
	SELECT * FROM f_certificates_issue(3, 2, 'certs/st-react.pdf');
	SELECT * FROM f_certificates_update(
	    (SELECT "pkIdCertificate" FROM v_certificates WHERE "listenerName" = 'Слушатель Петрович Петров' LIMIT 1),
	    'certs/st-react-v2.pdf'
	);
	SELECT * FROM f_certificates_delete(
	    (SELECT "pkIdCertificate" FROM v_certificates WHERE "listenerName" = 'Слушатель Петрович Петров' LIMIT 1)
	);


	SELECT * FROM f_materials_get(p_course => 2);
	-- добавить PDF-лекцию
	SELECT * FROM f_materials_create(
		2,
		'Лекция 1. Введение в React',
		'https://mgir.by/materials/react-intro.pdf',
		'https://mgir.by/materials/react-intro'
	);
	SELECT * FROM f_materials_update(
		(SELECT "pkIdMaterial" FROM v_materials WHERE title = 'Лекция 1. Введение в React'),
		p_title := 'Лекция 1. Введение в React (обновлённая)'
	);
	SELECT * FROM f_materials_delete(
		(SELECT "pkIdMaterial" FROM v_materials WHERE title = 'Лекция 1. Введение в React (обновлённая)')
	);


	SELECT * FROM f_notifications_get();
	-- только непрочитанные
	SELECT * FROM f_notifications_get( p_unread => true);
	SELECT * FROM f_notifications_create(3, 'Дедлайн через 2 дня!');
	-- пометить прочитанным (последнее)
	SELECT * FROM f_notifications_mark_read(
	    (SELECT "pkIdNotification" FROM v_notifications WHERE "userName" = 'Слушатель Петрович Петров' ORDER BY "createdAt" DESC LIMIT 1)
	);
	SELECT * FROM f_notifications_delete(
	    (SELECT "pkIdNotification" FROM v_notifications WHERE "userName" = 'Слушатель Петрович Петров' ORDER BY "createdAt" DESC LIMIT 1)
	);


	SELECT * FROM f_grouplisteners_get(p_group => 3);
	SELECT * FROM f_grouplisteners_add(3, 3);
	-- удалить его (по id записи)
	SELECT * FROM f_grouplisteners_remove(
	    (SELECT "pkIdGroupListener"
	     FROM v_group_listeners
	     WHERE "groupName" = 'React-2025'
	       AND "listenerName" = 'Слушатель Петрович Петров')
	);
--#endregion

--#region =====  Trigger FOR ADMIN LOG  =====
	CREATE OR REPLACE FUNCTION trg_audit_to_admin_log()
	RETURNS TRIGGER
	LANGUAGE plpgsql
	AS $$
	DECLARE
		v_old_json jsonb;
		v_new_json jsonb;
		v_table text := TG_TABLE_NAME;
		v_action text := TG_OP;
	BEGIN
		IF TG_OP IN ('UPDATE','DELETE') THEN
			v_old_json := to_jsonb(OLD);
		END IF;
		IF TG_OP IN ('INSERT','UPDATE') THEN
			v_new_json := to_jsonb(NEW);
		END IF;
	
		INSERT INTO tbAdminLog(fkIdAdminUser, tableName, action, oldData, newData)
		VALUES (current_user_id(), v_table, v_action, v_old_json, v_new_json);
	
		RETURN NULL;          -- AFTER
	END;
	$$;

	-- tbUsers
	CREATE TRIGGER trg_audit_tbUsers
	AFTER INSERT OR UPDATE OR DELETE ON tbUsers
	FOR EACH ROW
	EXECUTE FUNCTION trg_audit_to_admin_log();
	
	-- tbCourses
	CREATE TRIGGER trg_audit_tbCourses
	AFTER INSERT OR UPDATE OR DELETE ON tbCourses
	FOR EACH ROW
	EXECUTE FUNCTION trg_audit_to_admin_log();
	
	-- tbGroup
	CREATE TRIGGER trg_audit_tbGroup
	AFTER INSERT OR UPDATE OR DELETE ON tbGroup
	FOR EACH ROW
	EXECUTE FUNCTION trg_audit_to_admin_log();
	
	-- tbGroupListener
	CREATE TRIGGER trg_audit_tbGroupListener
	AFTER INSERT OR UPDATE OR DELETE ON tbGroupListener
	FOR EACH ROW
	EXECUTE FUNCTION trg_audit_to_admin_log();
	
	-- tbTasks
	CREATE TRIGGER trg_audit_tbTasks
	AFTER INSERT OR UPDATE OR DELETE ON tbTasks
	FOR EACH ROW
	EXECUTE FUNCTION trg_audit_to_admin_log();
	
	-- tbAttempt
	CREATE TRIGGER trg_audit_tbAttempt
	AFTER INSERT OR UPDATE OR DELETE ON tbAttempt
	FOR EACH ROW
	EXECUTE FUNCTION trg_audit_to_admin_log();
	
	-- tbCertificate
	CREATE TRIGGER trg_audit_tbCertificate
	AFTER INSERT OR UPDATE OR DELETE ON tbCertificate
	FOR EACH ROW
	EXECUTE FUNCTION trg_audit_to_admin_log();
	
	-- tbMaterial
	CREATE TRIGGER trg_audit_tbMaterial
	AFTER INSERT OR UPDATE OR DELETE ON tbMaterial
	FOR EACH ROW
	EXECUTE FUNCTION trg_audit_to_admin_log();
	
	-- tbNotification
	CREATE TRIGGER trg_audit_tbNotification
	AFTER INSERT OR UPDATE OR DELETE ON tbNotification
	FOR EACH ROW
	EXECUTE FUNCTION trg_audit_to_admin_log();
--#endregion


--#region ===== TRIGGER FOR NOTIFICATION =====
	--Слушатель получает, когда препод поставил оценку
	CREATE OR REPLACE FUNCTION trg_notify_listener_graded()
	RETURNS TRIGGER
	LANGUAGE plpgsql
	AS $$
	DECLARE
	    v_title TEXT;
	    v_max   INT;
	BEGIN
	    -- интересует только переход в статус «Принято» (pkIdStatusAttempt = 2)
	    IF NEW.fkIdStatusAttempt = 2 AND OLD.fkIdStatusAttempt IS DISTINCT FROM 2 THEN
	        SELECT t.title, t.maxScore
	        INTO v_title, v_max
	        FROM tbTasks t
	        WHERE t.pkIdTask = NEW.fkIdTask;
	
	        INSERT INTO tbNotification(fkIdUser, message)
	        VALUES (
	            NEW.fkIdListener,
	            format('✅ Ваша работа «%s» оценена: %s/%s баллов.', v_title, NEW.score, v_max)
	        );
	    END IF;
	    RETURN NULL;
	END;
	$$;
	
	CREATE TRIGGER tg_after_attempt_graded
	AFTER UPDATE ON tbAttempt
	FOR EACH ROW
	EXECUTE FUNCTION trg_notify_listener_graded();


	--Преподаватель получает, когда слушатель сдал задание
	CREATE OR REPLACE FUNCTION trg_notify_teacher_submitted()
	RETURNS TRIGGER
	LANGUAGE plpgsql
	AS $$
	DECLARE
	    v_title   TEXT;
	    v_teacher INT;
	BEGIN
	    -- реагируем на появление новой попытки (INSERT)
	    IF TG_OP = 'INSERT' THEN
	        SELECT t.title, g.fkIdCurator
	        INTO v_title, v_teacher
	        FROM tbTasks t
	        JOIN tbGroup       g ON g.pkIdGroup = (SELECT fkIdGroup
	                                               FROM tbGroupListener
	                                               WHERE fkIdListener = NEW.fkIdListener
	                                               LIMIT 1)
	        WHERE t.pkIdTask = NEW.fkIdTask;
	
	        IF v_teacher IS NOT NULL THEN
	            INSERT INTO tbNotification(fkIdUser, message)
	            VALUES (
	                v_teacher,
	                format('📎 Слушатель сдал работу «%s» (ожидает проверки).', v_title)
	            );
	        END IF;
	    END IF;
	    RETURN NULL;
	END;
	$$;
	
	CREATE TRIGGER tg_after_attempt_submitted
	AFTER INSERT ON tbAttempt
	FOR EACH ROW
	EXECUTE FUNCTION trg_notify_teacher_submitted();
	

	-- однократное напоминание за 1 день до дедлайна
	INSERT INTO tbNotification(fkIdUser, message)
	SELECT DISTINCT gl.fkIdListener,
	       format('⏰ Завтра дедлайн по задаче «%s»!', t.title)
	FROM tbTasks t
	JOIN tbGroupListener gl ON gl.fkIdGroup IN (SELECT fkIdGroup FROM tbGroup WHERE fkIdCourse = t.fkIdCourse)
	WHERE t.deadline BETWEEN NOW() AND NOW() + INTERVAL '1 day'
	  AND NOT EXISTS (SELECT 1 FROM tbAttempt a
	                  WHERE a.fkIdTask = t.pkIdTask
	                    AND a.fkIdListener = gl.fkIdListener
	                    AND a.fkIdStatusAttempt = 2);
	
	
	-- Преподаватель получает, когда слушатель вступил в группу
	CREATE OR REPLACE FUNCTION trg_notify_teacher_joined()
	RETURNS TRIGGER
	LANGUAGE plpgsql
	AS $$
	DECLARE
	    v_group   TEXT;
	    v_teacher INT;
	BEGIN
	    SELECT g.name, g.fkIdCurator
	    INTO v_group, v_teacher
	    FROM tbGroup g
	    WHERE g.pkIdGroup = NEW.fkIdGroup;
	
	    IF v_teacher IS NOT NULL THEN
	        INSERT INTO tbNotification(fkIdUser, message)
	        VALUES (
	            v_teacher,
	            format('👥 В вашу группу «%s» записан новый слушатель.', v_group)
	        );
	    END IF;
	    RETURN NULL;
	END;
	$$;
	
	CREATE TRIGGER tg_after_listener_joined
	AFTER INSERT ON tbGroupListener
	FOR EACH ROW
	EXECUTE FUNCTION trg_notify_teacher_joined();
--#endregion

-- препод ставит оценку → слушатель получает уведомление
SELECT * FROM f_attempts_grade(
    (SELECT "pkIdAttemp" FROM v_attempts WHERE "listenerName" = 'Слушатель Петрович Петров' LIMIT 1),
    95
);
-- слушатель сдал → препод получает уведомление
SELECT * FROM f_attempts_create(3, 3);   -- task 3, listener 3
-- смотрим все уведомления
SELECT * FROM v_notifications WHERE "userName" IN ('Слушатель Петрович Петров','Препод Иванович Иванов')
ORDER BY "createdAt" DESC;


CREATE OR REPLACE FUNCTION current_user_id()
RETURNS INT
LANGUAGE sql
AS $$
    SELECT NULLIF(current_setting('app.user_id', TRUE), '')::INT;
$$;


SELECT current_user_id();   
SET app.user_id = '1'; --// не забыть на сереве передать id для триггера, пока что это заглушка
SELECT current_user_id();   