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
		telegramChatId VARCHAR(255),
		isDeleted BOOLEAN DEFAULT FALSE
	);
	CREATE INDEX idx_users_role ON tbUsers(fkIdRole);
	CREATE INDEX idx_users_deleted ON tbUsers(isDeleted);
	
	
	CREATE TABLE tbCourses (
		pkIdCourse SERIAL PRIMARY KEY,
		fkIdStatus INT REFERENCES tbStatusCourses(pkIdStatusCourse) ON DELETE RESTRICT,
		title VARCHAR(255),
		description VARCHAR(511),
		startDate TIMESTAMP,
		endDate TIMESTAMP,
		isDeleted BOOLEAN DEFAULT FALSE
	);
	CREATE INDEX idx_courses_status ON tbCourses(fkIdStatus);
	CREATE INDEX idx_courses_deleted ON tbCourses(isDeleted);
	
	
	CREATE TABLE tbGroup (
		pkIdGroup SERIAL PRIMARY KEY,
		fkIdCourse INT REFERENCES tbCourses(pkIdCourse) ON DELETE CASCADE,
		fkIdCurator INT REFERENCES tbUsers(pkIdUser) ON DELETE SET NULL,
		name VARCHAR(100) UNIQUE NOT NULL DEFAULT 'Без названия',
		isDeleted BOOLEAN DEFAULT FALSE
	);
	CREATE INDEX idx_group_course ON tbGroup(fkIdCourse);
	CREATE INDEX idx_group_curator ON tbGroup(fkIdCurator);
	CREATE INDEX idx_group_deleted ON tbGroup(isDeleted);
	
	
	CREATE TABLE tbGroupListener (
		pkIdGroupListener SERIAL PRIMARY KEY,
		fkIdGroup INT REFERENCES tbGroup(pkIdGroup) ON DELETE CASCADE,
		fkIdListener INT REFERENCES tbUsers(pkIdUser) ON DELETE CASCADE,
		UNIQUE (fkIdGroup, fkIdListener),
		isDeleted BOOLEAN DEFAULT FALSE
	);
	CREATE INDEX idx_grouplistener_group ON tbGroupListener(fkIdGroup);
	CREATE INDEX idx_grouplistener_listener ON tbGroupListener(fkIdListener);
	CREATE INDEX idx_grouplistener_deleted ON tbGroupListener(isDeleted);
	
	
	CREATE TABLE tbTasks (
	    pkIdTask SERIAL PRIMARY KEY,
	    fkIdTypeTasks INT REFERENCES tbTypeTasks(pkIdTypeTask) ON DELETE RESTRICT,
	    fkIdCourse INT REFERENCES tbCourses(pkIdCourse) ON DELETE CASCADE,
	    title VARCHAR(255),
	    description VARCHAR(511),
	    deadline TIMESTAMP,
	    maxScore INT,
		isDeleted BOOLEAN DEFAULT FALSE
	);
	CREATE INDEX idx_tasks_course ON tbTasks(fkIdCourse);
	CREATE INDEX idx_tasks_type ON tbTasks(fkIdTypeTasks);
	CREATE INDEX idx_tasks_deleted ON tbTasks(isDeleted);
	
	
	CREATE TABLE tbAttempt (
	    pkIdAttemp SERIAL PRIMARY KEY,
	    fkIdTask INT REFERENCES tbTasks(pkIdTask) ON DELETE CASCADE,
	    fkIdListener INT REFERENCES tbUsers(pkIdUser) ON DELETE CASCADE,
	    fkIdStatusAttempt INT REFERENCES tbStatusAttempt(pkIdStatusAttempt) ON DELETE RESTRICT,
	    submittedAt TIMESTAMP DEFAULT NOW(),
	    score INT,
		isDeleted BOOLEAN DEFAULT FALSE
	);
	CREATE INDEX idx_attempt_task ON tbAttempt(fkIdTask);
	CREATE INDEX idx_attempt_listener ON tbAttempt(fkIdListener);
	CREATE INDEX idx_attempt_status ON tbAttempt(fkIdStatusAttempt);
	CREATE INDEX idx_attempt_deleted ON tbAttempt(isDeleted);
	
	
	CREATE TABLE tbCertificate (
	    pkIdCertificate SERIAL PRIMARY KEY,
	    fkIdListener INT REFERENCES tbUsers(pkIdUser) ON DELETE CASCADE,
	    fkIdCourse INT REFERENCES tbCourses(pkIdCourse) ON DELETE CASCADE,
	    issuedAt TIMESTAMP DEFAULT NOW(),
	    pdfUrl VARCHAR(100),
		isDeleted BOOLEAN DEFAULT FALSE
	);
	CREATE INDEX idx_cert_listener ON tbCertificate(fkIdListener);
	CREATE INDEX idx_cert_course ON tbCertificate(fkIdCourse);
	CREATE INDEX idx_cert_deleted ON tbCertificate(isDeleted);
	
	
	CREATE TABLE tbMaterial (
	    pkIdMaterial SERIAL PRIMARY KEY,
	    fkIdCourse INT REFERENCES tbCourses(pkIdCourse) ON DELETE CASCADE,
	    title VARCHAR(255),
	    fileUrl VARCHAR(100),
	    link VARCHAR(100),
		isDeleted BOOLEAN DEFAULT FALSE
	);
	CREATE INDEX idx_material_course ON tbMaterial(fkIdCourse);
	CREATE INDEX idx_material_deleted ON tbMaterial(isDeleted);
	
	
	CREATE TABLE tbNotification (
	    pkIdNotification SERIAL PRIMARY KEY,
	    fkIdUser INT REFERENCES tbUsers(pkIdUser) ON DELETE CASCADE,
	    message VARCHAR(527),
	    isRead BOOLEAN DEFAULT FALSE,
	    createdAt TIMESTAMP DEFAULT NOW(),
		isDeleted BOOLEAN DEFAULT FALSE
	);
	CREATE INDEX idx_notif_user ON tbNotification(fkIdUser);
	CREATE INDEX idx_notif_deleted ON tbNotification(isDeleted);
	
	
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
	JOIN   tbRoles r ON r.pkIdRole = u.fkIdRole
	WHERE  u.isDeleted = FALSE;
	
	
	CREATE OR REPLACE VIEW v_courses AS
	SELECT c.pkIdCourse AS "pkIdCourse",
	       c.title,
	       c.description,
	       c.startDate AS "startDate",
	       c.endDate,
	       sc.name AS "statusName",
	       CASE WHEN c.endDate < NOW() THEN TRUE ELSE FALSE END AS "isOverdue"
	FROM   tbCourses c
	JOIN   tbStatusCourses sc ON sc.pkIdStatusCourse = c.fkIdStatus
	WHERE  c.isDeleted = FALSE;
	
	
	CREATE OR REPLACE VIEW v_groups AS
	SELECT g.pkIdGroup AS "pkIdGroup",
	       g.name      AS "groupName",
	       c.title     AS "courseTitle",
	       u.fullName  AS "curatorName",
	       COUNT(gl.fkIdListener) AS "listenerCount"
	FROM   tbGroup g
	JOIN   tbCourses c ON c.pkIdCourse = g.fkIdCourse
	LEFT   JOIN tbUsers u ON u.pkIdUser = g.fkIdCurator AND u.isDeleted = FALSE
	LEFT   JOIN tbGroupListener gl ON gl.fkIdGroup = g.pkIdGroup AND gl.isDeleted = FALSE
	WHERE  g.isDeleted = FALSE 
	  AND  c.isDeleted = FALSE
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
	JOIN   tbUsers u ON u.pkIdUser = gl.fkIdListener
	WHERE  gl.isDeleted = FALSE
	  AND  g.isDeleted = FALSE
	  AND  c.isDeleted = FALSE
	  AND  u.isDeleted = FALSE;
	
	
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
	JOIN   tbTypeTasks tt ON tt.pkIdTypeTask = t.fkIdTypeTasks
	WHERE  t.isDeleted = FALSE
	  AND  c.isDeleted = FALSE;
	
	
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
	JOIN   tbStatusAttempt sa ON sa.pkIdStatusAttempt = a.fkIdStatusAttempt
	WHERE  a.isDeleted = FALSE
	  AND  t.isDeleted = FALSE
	  AND  c.isDeleted = FALSE
	  AND  u.isDeleted = FALSE;
	
	
	CREATE OR REPLACE VIEW v_certificates AS
	SELECT cert.pkIdCertificate AS "pkIdCertificate",
	       u.fullName AS "listenerName",
	       c.title AS "courseTitle",
	       cert.issuedAt AS "issuedAt",
	       cert.pdfUrl AS "pdfUrl"
	FROM   tbCertificate cert
	JOIN   tbUsers u ON u.pkIdUser = cert.fkIdListener
	JOIN   tbCourses c ON c.pkIdCourse = cert.fkIdCourse
	WHERE  cert.isDeleted = FALSE
	  AND  u.isDeleted = FALSE
	  AND  c.isDeleted = FALSE;
	
	
	CREATE OR REPLACE VIEW v_materials AS
	SELECT m.pkIdMaterial AS "pkIdMaterial",
	       c.title AS "courseTitle",
	       m.title,
	       m.fileUrl AS "fileUrl",
	       m.link
	FROM   tbMaterial m
	JOIN   tbCourses c ON c.pkIdCourse = m.fkIdCourse
	WHERE  m.isDeleted = FALSE
	  AND  c.isDeleted = FALSE;
	
	
	CREATE OR REPLACE VIEW v_notifications AS
	SELECT n.pkIdNotification AS "pkIdNotification",
	       u.fullName AS "userName",
	       n.message,
	       n.isRead AS "isRead",
	       n.createdAt AS "createdAt"
	FROM   tbNotification n
	JOIN   tbUsers u ON u.pkIdUser = n.fkIdUser
	WHERE  n.isDeleted = FALSE
	  AND  u.isDeleted = FALSE;
	
	
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

	--#region ===== Удалённых полей =====
		CREATE OR REPLACE VIEW v_users_deleted AS
	    SELECT u.pkiduser AS "pkIdUser",
	           u.fullName AS "fullName",
	           u.login,
	           u.phone,
	           u.email,
	           u.passwordhash AS "passwordHash",
	           u.regdata AS "regDate",
	           r.name AS "roleName"
	    FROM   tbUsers u
	    JOIN   tbRoles r ON r.pkIdRole = u.fkIdRole
	    WHERE  u.isDeleted = TRUE;

		CREATE OR REPLACE VIEW v_courses_deleted AS
	    SELECT c.pkIdCourse AS "pkIdCourse",
	           c.title,
	           c.description,
	           c.startDate AS "startDate",
	           c.endDate,
	           sc.name AS "statusName",
	           CASE WHEN c.endDate < NOW() THEN TRUE ELSE FALSE END AS "isOverdue"
	    FROM   tbCourses c
	    JOIN   tbStatusCourses sc ON sc.pkIdStatusCourse = c.fkIdStatus
	    WHERE  c.isDeleted = TRUE;

		CREATE OR REPLACE VIEW v_groups_deleted AS
	    SELECT g.pkIdGroup AS "pkIdGroup",
	           g.name      AS "groupName",
	           c.title     AS "courseTitle",
	           u.fullName  AS "curatorName",
	           COUNT(gl.fkIdListener) FILTER (WHERE gl.isDeleted = FALSE) AS "listenerCount"
	    FROM   tbGroup g
	    JOIN   tbCourses c ON c.pkIdCourse = g.fkIdCourse
	    LEFT   JOIN tbUsers u ON u.pkIdUser = g.fkIdCurator AND u.isDeleted = FALSE
	    LEFT   JOIN tbGroupListener gl ON gl.fkIdGroup = g.pkIdGroup AND gl.isDeleted = FALSE
	    WHERE  g.isDeleted = TRUE 
	      AND  c.isDeleted = FALSE
	    GROUP  BY g.pkIdGroup, g.name, c.title, u.fullName;

	    CREATE OR REPLACE VIEW v_tasks_deleted AS
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
	    JOIN   tbTypeTasks tt ON tt.pkIdTypeTask = t.fkIdTypeTasks
	    WHERE  t.isDeleted = TRUE
	      AND  c.isDeleted = FALSE;

	    CREATE OR REPLACE VIEW v_attempts_deleted AS
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
	    JOIN   tbStatusAttempt sa ON sa.pkIdStatusAttempt = a.fkIdStatusAttempt
	    WHERE  a.isDeleted = TRUE
	      AND  t.isDeleted = FALSE
	      AND  c.isDeleted = FALSE
	      AND  u.isDeleted = FALSE;

		CREATE OR REPLACE VIEW v_certificates_deleted AS
	    SELECT cert.pkIdCertificate AS "pkIdCertificate",
	           u.fullName AS "listenerName",
	           c.title AS "courseTitle",
	           cert.issuedAt AS "issuedAt",
	           cert.pdfUrl AS "pdfUrl"
	    FROM   tbCertificate cert
	    JOIN   tbUsers u ON u.pkIdUser = cert.fkIdListener
	    JOIN   tbCourses c ON c.pkIdCourse = cert.fkIdCourse
	    WHERE  cert.isDeleted = TRUE
	      AND  u.isDeleted = FALSE;

	    CREATE OR REPLACE VIEW v_materials_deleted AS
	    SELECT m.pkIdMaterial AS "pkIdMaterial",
	           c.title AS "courseTitle",
	           m.title,
	           m.fileUrl AS "fileUrl",
	           m.link
	    FROM   tbMaterial m
	    JOIN   tbCourses c ON c.pkIdCourse = m.fkIdCourse
	    WHERE  m.isDeleted = TRUE
	      AND  c.isDeleted = FALSE;

	    CREATE OR REPLACE VIEW v_notifications_deleted AS
	    SELECT n.pkIdNotification AS "pkIdNotification",
	           u.fullName AS "userName",
	           n.message,
	           n.isRead AS "isRead",
	           n.createdAt AS "createdAt"
	    FROM   tbNotification n
	    JOIN   tbUsers u ON u.pkIdUser = n.fkIdUser
	    WHERE  n.isDeleted = TRUE
	      AND  u.isDeleted = FALSE;

		CREATE OR REPLACE VIEW v_grouplisteners_deleted AS
		SELECT gl.pkIdGroupListener AS "pkIdGroupListener",
			   g.name AS "groupName",
			   c.title AS "courseTitle",
			   u.fullName AS "listenerName",
			   u.email
		FROM   tbGroupListener gl
		JOIN   tbGroup g ON g.pkIdGroup = gl.fkIdGroup
		JOIN   tbCourses c ON c.pkIdCourse = g.fkIdCourse
		JOIN   tbUsers u ON u.pkIdUser = gl.fkIdListener
		WHERE  gl.isDeleted = TRUE
		  AND  g.isDeleted = FALSE
		  AND  c.isDeleted = FALSE
		  AND  u.isDeleted = FALSE;
	--#endregion
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
	          AND (p_role  IS NULL OR "pkIdUser" IN (
	              SELECT pkIdUser FROM tbUsers 
	              WHERE fkIdRole = p_role AND isDeleted = FALSE
	          ))
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

	        IF EXISTS (SELECT 1 FROM tbUsers WHERE login = p_login AND isDeleted = FALSE) THEN
	            RAISE EXCEPTION 'Логин % уже занят', p_login;
	        END IF;
	        
	        IF EXISTS (SELECT 1 FROM tbUsers WHERE email = p_email AND isDeleted = FALSE) THEN
	            RAISE EXCEPTION 'Email % уже занят', p_email;
	        END IF;
	
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
	        IF p_login IS NOT NULL AND EXISTS (
	            SELECT 1 FROM tbUsers 
	            WHERE login = p_login AND pkIdUser != p_id AND isDeleted = FALSE
	        ) THEN
	            RAISE EXCEPTION 'Логин % уже занят', p_login;
	        END IF;
	        
	        IF p_email IS NOT NULL AND EXISTS (
	            SELECT 1 FROM tbUsers 
	            WHERE email = p_email AND pkIdUser != p_id AND isDeleted = FALSE
	        ) THEN
	            RAISE EXCEPTION 'Email % уже занят', p_email;
	        END IF;
	
	        UPDATE tbUsers u
	        SET fullName   = COALESCE(p_fullName,     u.fullName),
	            login      = COALESCE(p_login,        u.login),
	            phone      = COALESCE(p_phone,        u.phone),
	            email      = COALESCE(p_email,        u.email),
	            passwordHash = COALESCE(p_passwordHash, u.passwordHash),
	            fkIdRole   = COALESCE(p_roleId,       u.fkIdRole)
	        WHERE u.pkIdUser = p_id
	          AND u.isDeleted = FALSE
	        RETURNING pkIdUser INTO v_user_id;
	    
	        IF v_user_id IS NULL THEN
	            RAISE EXCEPTION 'Пользователь % не найден или удалён', p_id;
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
	        UPDATE tbUsers 
	        SET isDeleted = TRUE 
	        WHERE pkIdUser = p_id AND isDeleted = FALSE
	        RETURNING pkIdUser INTO deleted_id;
	    
	        IF NOT FOUND THEN
	            RAISE EXCEPTION 'Пользователь % не найден или уже удалён', p_id;
	        END IF;
	    
	        message := 'Пользователь помечен как удалён';
	        RETURN NEXT;
	    END;
	    $$;

	
	    CREATE OR REPLACE FUNCTION f_users_restore(p_id INT)
	    RETURNS TABLE(restored_id INT, message TEXT)
	    LANGUAGE plpgsql
	    AS $$
	    BEGIN
	        UPDATE tbUsers 
	        SET isDeleted = FALSE 
	        WHERE pkIdUser = p_id AND isDeleted = TRUE
	        RETURNING pkIdUser INTO restored_id;
	    
	        IF NOT FOUND THEN
	            RAISE EXCEPTION 'Пользователь % не найден или не был удалён', p_id;
	        END IF;
	    
	        message := 'Пользователь восстановлен';
	        RETURN NEXT;
	    END;
	    $$;


		CREATE OR REPLACE FUNCTION f_users_get_deleted(
	        p_id INT DEFAULT NULL
	    )
	    RETURNS SETOF v_users_deleted
	    LANGUAGE sql STABLE
	    AS $$
	        SELECT * FROM v_users_deleted
	        WHERE (p_id IS NULL OR "pkIdUser" = p_id)
	        ORDER BY "pkIdUser";
	    $$;
		

		CREATE OR REPLACE FUNCTION f_users_hard_delete(p_id INT)
	    RETURNS TABLE(deleted_id INT, message TEXT)
	    LANGUAGE plpgsql
	    AS $$
	    BEGIN
	        IF EXISTS (SELECT 1 FROM tbUsers WHERE pkIdUser = p_id AND isDeleted = FALSE) THEN
	            RAISE EXCEPTION 'Пользователь % необходимо сначала пометить как удалённого', p_id;
	        END IF;
		
	        DELETE FROM tbUsers WHERE pkIdUser = p_id
	        RETURNING pkIdUser INTO deleted_id;
	    
	        IF NOT FOUND THEN
	            RAISE EXCEPTION 'Пользователь % не найден', p_id;
	        END IF;
	    
	        message := 'Пользователь физически удалён из базы данных';
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
	          AND (p_status IS NULL OR "pkIdCourse" IN (
	              SELECT pkIdCourse FROM tbCourses 
	              WHERE fkIdStatus = p_status AND isDeleted = FALSE
	          ))
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
	          AND c.isDeleted = FALSE
	        RETURNING pkIdCourse INTO v_id;
	    
	        IF v_id IS NULL THEN
	            RAISE EXCEPTION 'Курс % не найден или удалён', p_id;
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
	        IF NOT EXISTS (SELECT 1 FROM tbCourses WHERE pkIdCourse = p_id AND isDeleted = FALSE) THEN
	            RAISE EXCEPTION 'Курс % не найден или уже удалён', p_id;
	        END IF;
	
	        -- Каскадный soft delete (без сертификатов)
	        UPDATE tbMaterial SET isDeleted = TRUE WHERE fkIdCourse = p_id AND isDeleted = FALSE;
	        UPDATE tbTasks SET isDeleted = TRUE WHERE fkIdCourse = p_id AND isDeleted = FALSE;
	        UPDATE tbGroup SET isDeleted = TRUE WHERE fkIdCourse = p_id AND isDeleted = FALSE;
	        -- Сертификаты оставляем нетронутыми!
	
	        UPDATE tbCourses 
	        SET isDeleted = TRUE 
	        WHERE pkIdCourse = p_id AND isDeleted = FALSE
	        RETURNING pkIdCourse INTO deleted_id;
	
	        message := 'Курс и связанные данные помечены как удалённые (сертификаты сохранены)';
	        RETURN NEXT;
	    END;
	    $$;


		CREATE OR REPLACE FUNCTION f_courses_get_deleted(
	        p_id INT DEFAULT NULL
	    )
	    RETURNS SETOF v_courses_deleted
	    LANGUAGE sql STABLE
	    AS $$
	        SELECT * FROM v_courses_deleted
	        WHERE (p_id IS NULL OR "pkIdCourse" = p_id)
	        ORDER BY "pkIdCourse";
	    $$;
	
	
	    CREATE OR REPLACE FUNCTION f_courses_restore(p_id INT)
	    RETURNS TABLE(restored_id INT, message TEXT)
	    LANGUAGE plpgsql
	    AS $$
	    BEGIN
	        IF NOT EXISTS (SELECT 1 FROM tbCourses WHERE pkIdCourse = p_id AND isDeleted = TRUE) THEN
	            RAISE EXCEPTION 'Курс % не найден или не был удалён', p_id;
	        END IF;
	
	        -- Каскадное восстановление (сертификаты не трогаем)
	        UPDATE tbMaterial SET isDeleted = FALSE WHERE fkIdCourse = p_id AND isDeleted = TRUE;
	        UPDATE tbTasks SET isDeleted = FALSE WHERE fkIdCourse = p_id AND isDeleted = TRUE;
	        UPDATE tbGroup SET isDeleted = FALSE WHERE fkIdCourse = p_id AND isDeleted = TRUE;
	
	        UPDATE tbCourses 
	        SET isDeleted = FALSE 
	        WHERE pkIdCourse = p_id AND isDeleted = TRUE
	        RETURNING pkIdCourse INTO restored_id;
	
	        message := 'Курс и связанные данные восстановлены';
	        RETURN NEXT;
	    END;
	    $$;
	

	    CREATE OR REPLACE FUNCTION f_courses_hard_delete(p_id INT)
	    RETURNS TABLE(deleted_id INT, message TEXT)
	    LANGUAGE plpgsql
	    AS $$
	    DECLARE
	        v_cert_count INT;
	    BEGIN
	        -- Проверяем soft delete
	        IF EXISTS (SELECT 1 FROM tbCourses WHERE pkIdCourse = p_id AND isDeleted = FALSE) THEN
	            RAISE EXCEPTION 'Курс % необходимо сначала пометить как удалённый', p_id;
	        END IF;
	
	        -- Проверяем наличие сертификатов (предупреждаем, что они останутся без курса)
	        SELECT COUNT(*) INTO v_cert_count 
	        FROM tbCertificate 
	        WHERE fkIdCourse = p_id;
	
	        IF v_cert_count > 0 THEN
	            RAISE WARNING 'У курса % есть % сертификат(ов), они останутся в базе без связи с курсом', p_id, v_cert_count;
	        END IF;
	
	        DELETE FROM tbCourses WHERE pkIdCourse = p_id
	        RETURNING pkIdCourse INTO deleted_id;
	    
	        IF NOT FOUND THEN
	            RAISE EXCEPTION 'Курс % не найден', p_id;
	        END IF;
	    
	        message := 'Курс физически удалён (сертификаты сохранены)';
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
	          AND (p_course IS NULL OR "pkIdGroup" IN (
	              SELECT pkIdGroup FROM tbGroup 
	              WHERE fkIdCourse = p_course AND isDeleted = FALSE
	          ))
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
		    IF EXISTS (SELECT 1 FROM tbGroup WHERE name = p_name AND isDeleted = FALSE) THEN
		        RAISE EXCEPTION 'Группа с названием "%" уже существует', p_name;
		    END IF;
		
		    IF NOT EXISTS (SELECT 1 FROM tbCourses WHERE pkIdCourse = p_courseId AND isDeleted = FALSE) THEN
		        RAISE EXCEPTION 'Курс % не найден или удалён', p_courseId;
		    END IF;
		
		    IF p_curatorId IS NOT NULL AND NOT EXISTS (
		        SELECT 1 FROM tbUsers WHERE pkIdUser = p_curatorId AND isDeleted = FALSE AND fkIdRole = 2
		    ) THEN
		        RAISE EXCEPTION 'Куратор % не найден, удалён или не является преподавателем', p_curatorId;
		    END IF;
		
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
		    v_old_name TEXT;
		BEGIN
		    IF p_name IS NOT NULL THEN
		        SELECT name INTO v_old_name FROM tbGroup WHERE pkIdGroup = p_id;
		        
		        IF v_old_name IS DISTINCT FROM p_name AND EXISTS (
		            SELECT 1 FROM tbGroup WHERE name = p_name AND isDeleted = FALSE AND pkIdGroup != p_id
		        ) THEN
		            RAISE EXCEPTION 'Группа с названием "%" уже существует', p_name;
		        END IF;
		    END IF;
		
		    IF p_courseId IS NOT NULL AND NOT EXISTS (
		        SELECT 1 FROM tbCourses WHERE pkIdCourse = p_courseId AND isDeleted = FALSE
		    ) THEN
		        RAISE EXCEPTION 'Курс % не найден или удалён', p_courseId;
		    END IF;
		
		    IF p_curatorId IS NOT NULL AND NOT EXISTS (
		        SELECT 1 FROM tbUsers WHERE pkIdUser = p_curatorId AND isDeleted = FALSE AND fkIdRole = 2
		    ) THEN
		        RAISE EXCEPTION 'Куратор % не найден, удалён или не является преподавателем', p_curatorId;
		    END IF;
		
		    UPDATE tbGroup g
		    SET name       = COALESCE(p_name,      g.name),
		        fkIdCourse = COALESCE(p_courseId,  g.fkIdCourse),
		        fkIdCurator= COALESCE(p_curatorId, g.fkIdCurator)
		    WHERE g.pkIdGroup = p_id
		      AND g.isDeleted = FALSE
		    RETURNING pkIdGroup INTO v_group_id;
		
		    IF v_group_id IS NULL THEN
		        RAISE EXCEPTION 'Группа % не найдена или удалена', p_id;
		    END IF;
		
		    SELECT * INTO v_result FROM v_groups WHERE "pkIdGroup" = v_group_id;
		    RETURN v_result;
		END;
		$$;
	
	    
	    -- SOFT DELETE (каскадно помечаем записи слушателей в группе)
	    CREATE OR REPLACE FUNCTION f_groups_delete(p_id INT)
	    RETURNS TABLE(deleted_id INT, message TEXT)
	    LANGUAGE plpgsql
	    AS $$
	    BEGIN
	        IF NOT EXISTS (SELECT 1 FROM tbGroup WHERE pkIdGroup = p_id AND isDeleted = FALSE) THEN
	            RAISE EXCEPTION 'Группа % не найдена или уже удалена', p_id;
	        END IF;
	
	        UPDATE tbGroupListener 
	        SET isDeleted = TRUE 
	        WHERE fkIdGroup = p_id AND isDeleted = FALSE;
	
	        UPDATE tbGroup 
	        SET isDeleted = TRUE 
	        WHERE pkIdGroup = p_id AND isDeleted = FALSE
	        RETURNING pkIdGroup INTO deleted_id;
	
	        message := 'Группа и записи слушателей помечены как удалённые';
	        RETURN NEXT;
	    END;
	    $$;

		CREATE OR REPLACE FUNCTION f_groups_get_deleted(
	        p_id INT DEFAULT NULL
	    )
	    RETURNS SETOF v_groups_deleted
	    LANGUAGE sql STABLE
	    AS $$
	        SELECT * FROM v_groups_deleted
	        WHERE (p_id IS NULL OR "pkIdGroup" = p_id)
	        ORDER BY "pkIdGroup";
	    $$;
	
	
	    -- ВОССТАНОВЛЕНИЕ группы (каскадно восстанавливаем записи слушателей)
	    CREATE OR REPLACE FUNCTION f_groups_restore(p_id INT)
	    RETURNS TABLE(restored_id INT, message TEXT)
	    LANGUAGE plpgsql
	    AS $$
	    DECLARE
	        v_course_deleted BOOLEAN;
	    BEGIN
	        SELECT c.isDeleted INTO v_course_deleted
	        FROM tbGroup g
	        JOIN tbCourses c ON c.pkIdCourse = g.fkIdCourse
	        WHERE g.pkIdGroup = p_id AND g.isDeleted = TRUE;
	
	        IF v_course_deleted IS NULL THEN
	            RAISE EXCEPTION 'Группа % не найдена или не была удалена', p_id;
	        END IF;
	
	        IF v_course_deleted THEN
	            RAISE EXCEPTION 'Невозможно восстановить группу: курс удалён. Сначала восстановите курс.';
	        END IF;
	
	        UPDATE tbGroupListener 
	        SET isDeleted = FALSE 
	        WHERE fkIdGroup = p_id AND isDeleted = TRUE;
	
	        UPDATE tbGroup 
	        SET isDeleted = FALSE 
	        WHERE pkIdGroup = p_id AND isDeleted = TRUE
	        RETURNING pkIdGroup INTO restored_id;
	
	        message := 'Группа и записи слушателей восстановлены';
	        RETURN NEXT;
	    END;
	    $$;
	
	
	    CREATE OR REPLACE FUNCTION f_groups_hard_delete(p_id INT)
	    RETURNS TABLE(deleted_id INT, message TEXT)
	    LANGUAGE plpgsql
	    AS $$
	    DECLARE
	        v_listener_count INT;
	    BEGIN
	        IF EXISTS (SELECT 1 FROM tbGroup WHERE pkIdGroup = p_id AND isDeleted = FALSE) THEN
	            RAISE EXCEPTION 'Группу % необходимо сначала пометить как удалённую', p_id;
	        END IF;
	
	        SELECT COUNT(*) INTO v_listener_count 
	        FROM tbGroupListener 
	        WHERE fkIdGroup = p_id;
	
	        IF v_listener_count > 0 THEN
	            RAISE WARNING 'В группе % было % записей слушателей — они будут удалены каскадно', p_id, v_listener_count;
	        END IF;
	
	        DELETE FROM tbGroup WHERE pkIdGroup = p_id
	        RETURNING pkIdGroup INTO deleted_id;
	    
	        IF NOT FOUND THEN
	            RAISE EXCEPTION 'Группа % не найдена', p_id;
	        END IF;
	    
	        message := 'Группа физически удалена';
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
	          AND (p_course IS NULL OR "pkIdTask" IN (
	              SELECT pkIdTask FROM tbTasks 
	              WHERE fkIdCourse = p_course AND isDeleted = FALSE
	          ))
	          AND (p_type   IS NULL OR "pkIdTask" IN (
	              SELECT pkIdTask FROM tbTasks 
	              WHERE fkIdTypeTasks = p_type AND isDeleted = FALSE
	          ))
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
			IF EXISTS (
	            SELECT 1 FROM tbTasks 
	            WHERE title = p_title AND fkIdCourse = p_courseId AND isDeleted = FALSE
	        ) THEN
	            RAISE EXCEPTION 'Задание "%" уже существует в этом курсе', p_title;
	        END IF;
			
	        IF NOT EXISTS (SELECT 1 FROM tbCourses WHERE pkIdCourse = p_courseId AND isDeleted = FALSE) THEN
	            RAISE EXCEPTION 'Курс % не найден или удалён', p_courseId;
	        END IF;
	
	        IF NOT EXISTS (SELECT 1 FROM tbTypeTasks WHERE pkIdTypeTask = p_typeId) THEN
	            RAISE EXCEPTION 'Тип задания % не найден', p_typeId;
	        END IF;
	
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
	        v_old_title TEXT;
	        v_old_course INT;
	        v_new_course INT;
	    BEGIN
	        -- Получаем старые значения для проверки уникальности
	        SELECT title, fkIdCourse INTO v_old_title, v_old_course
	        FROM tbTasks WHERE pkIdTask = p_id;
	
	        v_new_course := COALESCE(p_courseId, v_old_course);
	
	        -- Проверка уникальности если меняется title или курс
	        IF (p_title IS NOT NULL OR p_courseId IS NOT NULL) THEN
	            IF EXISTS (
	                SELECT 1 FROM tbTasks 
	                WHERE title = COALESCE(p_title, v_old_title) 
	                  AND fkIdCourse = v_new_course 
	                  AND isDeleted = FALSE 
	                  AND pkIdTask != p_id
	            ) THEN
	                RAISE EXCEPTION 'Задание "%" уже существует в этом курсе', COALESCE(p_title, v_old_title);
	            END IF;
	        END IF;
	
	        -- Проверки...
	        IF p_courseId IS NOT NULL AND NOT EXISTS (
	            SELECT 1 FROM tbCourses WHERE pkIdCourse = p_courseId AND isDeleted = FALSE
	        ) THEN
	            RAISE EXCEPTION 'Курс % не найден или удалён', p_courseId;
	        END IF;
	
	        IF p_typeId IS NOT NULL AND NOT EXISTS (
	            SELECT 1 FROM tbTypeTasks WHERE pkIdTypeTask = p_typeId
	        ) THEN
	            RAISE EXCEPTION 'Тип задания % не найден', p_typeId;
	        END IF;
	
	        UPDATE tbTasks t
	        SET fkIdCourse   = COALESCE(p_courseId, t.fkIdCourse),
	            fkIdTypeTasks= COALESCE(p_typeId,   t.fkIdTypeTasks),
	            title        = COALESCE(p_title,    t.title),
	            description  = COALESCE(p_desc,     t.description),
	            deadline     = COALESCE(p_deadline, t.deadline),
	            maxScore     = COALESCE(p_maxScore, t.maxScore)
	        WHERE t.pkIdTask = p_id
	          AND t.isDeleted = FALSE
	        RETURNING pkIdTask INTO v_task_id;
	    
	        IF v_task_id IS NULL THEN
	            RAISE EXCEPTION 'Задание % не найдено или удалено', p_id;
	        END IF;
	    
	        SELECT * INTO v_result FROM v_tasks WHERE "pkIdTask" = v_task_id;
	        RETURN v_result;
	    END;
	    $$;
	
	
	    -- SOFT DELETE (каскадно помечаем попытки)
	    CREATE OR REPLACE FUNCTION f_tasks_delete(p_id INT)
	    RETURNS TABLE(deleted_id INT, message TEXT)
	    LANGUAGE plpgsql
	    AS $$
	    BEGIN
	        IF NOT EXISTS (SELECT 1 FROM tbTasks WHERE pkIdTask = p_id AND isDeleted = FALSE) THEN
	            RAISE EXCEPTION 'Задание % не найдено или уже удалено', p_id;
	        END IF;
	
	        UPDATE tbAttempt 
	        SET isDeleted = TRUE 
	        WHERE fkIdTask = p_id AND isDeleted = FALSE;
	
	        UPDATE tbTasks 
	        SET isDeleted = TRUE 
	        WHERE pkIdTask = p_id AND isDeleted = FALSE
	        RETURNING pkIdTask INTO deleted_id;
	
	        message := 'Задание и попытки помечены как удалённые';
	        RETURN NEXT;
	    END;
	    $$;
	
	    CREATE OR REPLACE FUNCTION f_tasks_get_deleted(
	        p_id INT DEFAULT NULL
	    )
	    RETURNS SETOF v_tasks_deleted
	    LANGUAGE sql STABLE
	    AS $$
	        SELECT * FROM v_tasks_deleted
	        WHERE (p_id IS NULL OR "pkIdTask" = p_id)
	        ORDER BY "pkIdTask";
	    $$;
	
	
	    -- ВОССТАНОВЛЕНИЕ задания (каскадно восстанавливаем попытки)
	    CREATE OR REPLACE FUNCTION f_tasks_restore(p_id INT)
	    RETURNS TABLE(restored_id INT, message TEXT)
	    LANGUAGE plpgsql
	    AS $$
	    DECLARE
	        v_course_deleted BOOLEAN;
	    BEGIN
	        SELECT c.isDeleted INTO v_course_deleted
	        FROM tbTasks t
	        JOIN tbCourses c ON c.pkIdCourse = t.fkIdCourse
	        WHERE t.pkIdTask = p_id AND t.isDeleted = TRUE;
	
	        IF v_course_deleted IS NULL THEN
	            RAISE EXCEPTION 'Задание % не найдено или не было удалено', p_id;
	        END IF;
	
	        IF v_course_deleted THEN
	            RAISE EXCEPTION 'Невозможно восстановить задание: курс удалён. Сначала восстановите курс.';
	        END IF;
	
	        UPDATE tbAttempt 
	        SET isDeleted = FALSE 
	        WHERE fkIdTask = p_id AND isDeleted = TRUE;
	
	        UPDATE tbTasks 
	        SET isDeleted = FALSE 
	        WHERE pkIdTask = p_id AND isDeleted = TRUE
	        RETURNING pkIdTask INTO restored_id;
	
	        message := 'Задание и попытки восстановлены';
	        RETURN NEXT;
	    END;
	    $$;
	
	
	    -- ФИЗИЧЕСКОЕ УДАЛЕНИЕ
	    CREATE OR REPLACE FUNCTION f_tasks_hard_delete(p_id INT)
	    RETURNS TABLE(deleted_id INT, message TEXT)
	    LANGUAGE plpgsql
	    AS $$
	    DECLARE
	        v_attempt_count INT;
	    BEGIN
	        IF EXISTS (SELECT 1 FROM tbTasks WHERE pkIdTask = p_id AND isDeleted = FALSE) THEN
	            RAISE EXCEPTION 'Задание % необходимо сначала пометить как удалённое', p_id;
	        END IF;
	
	        SELECT COUNT(*) INTO v_attempt_count 
	        FROM tbAttempt 
	        WHERE fkIdTask = p_id;
	
	        IF v_attempt_count > 0 THEN
	            RAISE WARNING 'У задания % есть % попыток(и) — они будут удалены каскадно', p_id, v_attempt_count;
	        END IF;
	
	        DELETE FROM tbTasks WHERE pkIdTask = p_id
	        RETURNING pkIdTask INTO deleted_id;
	    
	        IF NOT FOUND THEN
	            RAISE EXCEPTION 'Задание % не найдено', p_id;
	        END IF;
	    
	        message := 'Задание физически удалено';
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
	          AND (p_task     IS NULL OR "pkIdAttemp" IN (
	              SELECT pkIdAttemp FROM tbAttempt 
	              WHERE fkIdTask = p_task AND isDeleted = FALSE
	          ))
	          AND (p_listener IS NULL OR "pkIdAttemp" IN (
	              SELECT pkIdAttemp FROM tbAttempt 
	              WHERE fkIdListener = p_listener AND isDeleted = FALSE
	          ))
	          AND (p_status   IS NULL OR "pkIdAttemp" IN (
	              SELECT pkIdAttemp FROM tbAttempt 
	              WHERE fkIdStatusAttempt = p_status AND isDeleted = FALSE
	          ))
	        ORDER BY "submittedAt" ASC;
	    $$;

		CREATE OR REPLACE FUNCTION f_attempts_update(
				p_id          INT,
				p_taskId      INT DEFAULT NULL,
				p_listenerId  INT DEFAULT NULL,
				p_statusId    INT DEFAULT NULL,
				p_score       INT DEFAULT NULL
		)
		RETURNS v_attempts
		LANGUAGE plpgsql
		AS $$
		DECLARE
				v_id INT;
				v_result v_attempts;
		BEGIN
				-- Проверяем существование попытки
				IF NOT EXISTS (
						SELECT 1 FROM tbAttempt 
						WHERE pkIdAttemp = p_id AND isDeleted = FALSE
				) THEN
						RAISE EXCEPTION 'Попытка % не найдена или удалена', p_id;
				END IF;

				-- Проверяем новое задание (если меняется)
				IF p_taskId IS NOT NULL THEN
						IF NOT EXISTS (SELECT 1 FROM tbTasks WHERE pkIdTask = p_taskId AND isDeleted = FALSE) THEN
								RAISE EXCEPTION 'Задание % не найдено или удалено', p_taskId;
						END IF;
				END IF;

				-- Проверяем нового слушателя (если меняется)
				IF p_listenerId IS NOT NULL THEN
						IF NOT EXISTS (
								SELECT 1 FROM tbUsers 
								WHERE pkIdUser = p_listenerId AND isDeleted = FALSE AND fkIdRole = 3
						) THEN
								RAISE EXCEPTION 'Слушатель % не найден, удалён или не является слушателем', p_listenerId;
						END IF;
				END IF;

				-- Проверяем новый статус (если меняется)
				IF p_statusId IS NOT NULL THEN
						IF NOT EXISTS (SELECT 1 FROM tbStatusAttempt WHERE pkIdStatusAttempt = p_statusId) THEN
								RAISE EXCEPTION 'Статус % не найден', p_statusId;
						END IF;
				END IF;

				UPDATE tbAttempt
				SET fkIdTask = COALESCE(p_taskId, fkIdTask),
						fkIdListener = COALESCE(p_listenerId, fkIdListener),
						fkIdStatusAttempt = COALESCE(p_statusId, fkIdStatusAttempt),
						score = COALESCE(p_score, score)
				WHERE pkIdAttemp = p_id AND isDeleted = FALSE
				RETURNING pkIdAttemp INTO v_id;

				SELECT * INTO v_result FROM v_attempts WHERE "pkIdAttemp" = v_id;
				RETURN v_result;
		END;
		$$;
	    
	    CREATE OR REPLACE FUNCTION f_attempts_create(
		    p_taskId     INT,
		    p_listenerId INT,
		    p_score      INT DEFAULT NULL,
		    p_statusId   INT DEFAULT 1
		)
		RETURNS v_attempts
		LANGUAGE plpgsql
		AS $$
		DECLARE
		    v_attempt_id INT;
		    v_result     v_attempts;
		    v_last_status INT;
		    v_has_active_attempt BOOLEAN;
		BEGIN
		    -- Проверяем существование задания
		    IF NOT EXISTS (SELECT 1 FROM tbTasks WHERE pkIdTask = p_taskId AND isDeleted = FALSE) THEN
		        RAISE EXCEPTION 'Задание % не найдено или удалено', p_taskId;
		    END IF;
		
		    -- Проверяем существование слушателя
		    IF NOT EXISTS (SELECT 1 FROM tbUsers WHERE pkIdUser = p_listenerId AND isDeleted = FALSE AND fkIdRole = 3) THEN
		        RAISE EXCEPTION 'Слушатель % не найден, удалён или не является слушателем', p_listenerId;
		    END IF;
		
		    -- Проверяем существование статуса
		    IF NOT EXISTS (SELECT 1 FROM tbStatusAttempt WHERE pkIdStatusAttempt = p_statusId) THEN
		        RAISE EXCEPTION 'Статус попытки % не найден', p_statusId;
		    END IF;
		
		    -- Проверяем, есть ли активная попытка (не апелляция и не удалена)
		    SELECT fkIdStatusAttempt INTO v_last_status
		    FROM tbAttempt
		    WHERE fkIdTask = p_taskId 
		      AND fkIdListener = p_listenerId 
		      AND isDeleted = FALSE
		    ORDER BY submittedAt DESC
		    LIMIT 1;
		
		    v_has_active_attempt := v_last_status IN (1, 2, 3); -- На проверке, Принято, Возвращено
		
		    IF v_has_active_attempt THEN
		        RAISE EXCEPTION 'Нельзя создать новую попытку: у вас есть активная попытка в статусе "%". Дождитесь проверки или подайте апелляцию.', 
		            (SELECT name FROM tbStatusAttempt WHERE pkIdStatusAttempt = v_last_status);
		    END IF;
		
		    -- Если дошли сюда — можно создавать (либо нет попыток, либо последняя в Аппеляции)
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
	          AND a.isDeleted = FALSE
	        RETURNING pkIdAttemp INTO v_attempt_id;
	    
	        IF v_attempt_id IS NULL THEN
	            RAISE EXCEPTION 'Попытка % не найдена или удалена', p_id;
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
	        UPDATE tbAttempt 
	        SET isDeleted = TRUE 
	        WHERE pkIdAttemp = p_id AND isDeleted = FALSE
	        RETURNING pkIdAttemp INTO deleted_id;
	    
	        IF NOT FOUND THEN
	            RAISE EXCEPTION 'Попытка % не найдена или уже удалена', p_id;
	        END IF;
	    
	        message := 'Попытка помечена как удалённая';
	        RETURN NEXT;
	    END;
	    $$;

	
	    CREATE OR REPLACE FUNCTION f_attempts_get_deleted(
	        p_id INT DEFAULT NULL
	    )
	    RETURNS SETOF v_attempts_deleted
	    LANGUAGE sql STABLE
	    AS $$
	        SELECT * FROM v_attempts_deleted
	        WHERE (p_id IS NULL OR "pkIdAttemp" = p_id)
	        ORDER BY "submittedAt" DESC;
	    $$;
	
	
	    CREATE OR REPLACE FUNCTION f_attempts_restore(p_id INT)
	    RETURNS TABLE(restored_id INT, message TEXT)
	    LANGUAGE plpgsql
	    AS $$
	    DECLARE
	        v_task_deleted BOOLEAN;
	        v_listener_deleted BOOLEAN;
	    BEGIN
	        SELECT t.isDeleted, u.isDeleted INTO v_task_deleted, v_listener_deleted
	        FROM tbAttempt a
	        JOIN tbTasks t ON t.pkIdTask = a.fkIdTask
	        JOIN tbUsers u ON u.pkIdUser = a.fkIdListener
	        WHERE a.pkIdAttemp = p_id AND a.isDeleted = TRUE;
	
	        IF v_task_deleted IS NULL THEN
	            RAISE EXCEPTION 'Попытка % не найдена или не была удалена', p_id;
	        END IF;
	
	        IF v_task_deleted THEN
	            RAISE EXCEPTION 'Невозможно восстановить: задание удалено. Сначала восстановите задание.';
	        END IF;
	
	        IF v_listener_deleted THEN
	            RAISE EXCEPTION 'Невозможно восстановить: слушатель удалён. Сначала восстановите слушателя.';
	        END IF;
	
	        UPDATE tbAttempt 
	        SET isDeleted = FALSE 
	        WHERE pkIdAttemp = p_id AND isDeleted = TRUE
	        RETURNING pkIdAttemp INTO restored_id;
	
	        message := 'Попытка восстановлена';
	        RETURN NEXT;
	    END;
	    $$;
	
	
	    CREATE OR REPLACE FUNCTION f_attempts_hard_delete(p_id INT)
	    RETURNS TABLE(deleted_id INT, message TEXT)
	    LANGUAGE plpgsql
	    AS $$
	    BEGIN
	        IF EXISTS (SELECT 1 FROM tbAttempt WHERE pkIdAttemp = p_id AND isDeleted = FALSE) THEN
	            RAISE EXCEPTION 'Попытку % необходимо сначала пометить как удалённую', p_id;
	        END IF;
	
	        DELETE FROM tbAttempt WHERE pkIdAttemp = p_id
	        RETURNING pkIdAttemp INTO deleted_id;
	    
	        IF NOT FOUND THEN
	            RAISE EXCEPTION 'Попытка % не найдена', p_id;
	        END IF;
	    
	        message := 'Попытка физически удалена';
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
	          AND (p_listener IS NULL OR "pkIdCertificate" IN (
	              SELECT pkIdCertificate FROM tbCertificate 
	              WHERE fkIdListener = p_listener AND isDeleted = FALSE
	          ))
	          AND (p_course   IS NULL OR "pkIdCertificate" IN (
	              SELECT pkIdCertificate FROM tbCertificate 
	              WHERE fkIdCourse = p_course AND isDeleted = FALSE
	          ))
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
	        IF NOT EXISTS (SELECT 1 FROM tbUsers WHERE pkIdUser = p_listenerId AND isDeleted = FALSE AND fkIdRole = 3) THEN
	            RAISE EXCEPTION 'Слушатель % не найден, удалён или не является слушателем', p_listenerId;
	        END IF;
	
	        -- Курс может быть удалён, но сертификат выдать можно (история)
	
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
	          AND cert.isDeleted = FALSE
	        RETURNING pkIdCertificate INTO v_cert_id;
	    
	        IF v_cert_id IS NULL THEN
	            RAISE EXCEPTION 'Сертификат % не найден или удалён', p_id;
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
	        UPDATE tbCertificate 
	        SET isDeleted = TRUE 
	        WHERE pkIdCertificate = p_id AND isDeleted = FALSE
	        RETURNING pkIdCertificate INTO deleted_id;
	    
	        IF NOT FOUND THEN
	            RAISE EXCEPTION 'Сертификат % не найден или уже удалён', p_id;
	        END IF;
	    
	        message := 'Сертификат аннулирован (помечен как удалённый)';
	        RETURN NEXT;
	    END;
	    $$;
	   
	
	    CREATE OR REPLACE FUNCTION f_certificates_get_deleted(
	        p_id INT DEFAULT NULL
	    )
	    RETURNS SETOF v_certificates_deleted
	    LANGUAGE sql STABLE
	    AS $$
	        SELECT * FROM v_certificates_deleted
	        WHERE (p_id IS NULL OR "pkIdCertificate" = p_id)
	        ORDER BY "issuedAt" DESC;
	    $$;
	
	
	    CREATE OR REPLACE FUNCTION f_certificates_restore(p_id INT)
	    RETURNS TABLE(restored_id INT, message TEXT)
	    LANGUAGE plpgsql
	    AS $$
	    DECLARE
	        v_listener_deleted BOOLEAN;
	    BEGIN
	        SELECT u.isDeleted INTO v_listener_deleted
	        FROM tbCertificate cert
	        JOIN tbUsers u ON u.pkIdUser = cert.fkIdListener
	        WHERE cert.pkIdCertificate = p_id AND cert.isDeleted = TRUE;
	
	        IF v_listener_deleted IS NULL THEN
	            RAISE EXCEPTION 'Сертификат % не найден или не был удалён', p_id;
	        END IF;
	
	        IF v_listener_deleted THEN
	            RAISE EXCEPTION 'Невозможно восстановить: слушатель удалён. Сначала восстановите слушателя.';
	        END IF;
	
	        UPDATE tbCertificate 
	        SET isDeleted = FALSE 
	        WHERE pkIdCertificate = p_id AND isDeleted = TRUE
	        RETURNING pkIdCertificate INTO restored_id;
	
	        message := 'Сертификат восстановлен';
	        RETURN NEXT;
	    END;
	    $$;
	
	
	    CREATE OR REPLACE FUNCTION f_certificates_hard_delete(p_id INT)
	    RETURNS TABLE(deleted_id INT, message TEXT)
	    LANGUAGE plpgsql
	    AS $$
	    BEGIN
	        IF EXISTS (SELECT 1 FROM tbCertificate WHERE pkIdCertificate = p_id AND isDeleted = FALSE) THEN
	            RAISE EXCEPTION 'Сертификат % необходимо сначала пометить как удалённый', p_id;
	        END IF;
	
	        DELETE FROM tbCertificate WHERE pkIdCertificate = p_id
	        RETURNING pkIdCertificate INTO deleted_id;
	    
	        IF NOT FOUND THEN
	            RAISE EXCEPTION 'Сертификат % не найден', p_id;
	        END IF;
	    
	        message := 'Сертификат физически удалён';
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
	          AND (p_course IS NULL OR "pkIdMaterial" IN (
	              SELECT pkIdMaterial FROM tbMaterial 
	              WHERE fkIdCourse = p_course AND isDeleted = FALSE
	          ))
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
	        IF NOT EXISTS (SELECT 1 FROM tbCourses WHERE pkIdCourse = p_courseId AND isDeleted = FALSE) THEN
	            RAISE EXCEPTION 'Курс % не найден или удалён', p_courseId;
	        END IF;
	
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
	          AND m.isDeleted = FALSE
	        RETURNING pkIdMaterial INTO v_mat_id;
	    
	        IF v_mat_id IS NULL THEN
	            RAISE EXCEPTION 'Материал % не найден или удалён', p_id;
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
	        UPDATE tbMaterial 
	        SET isDeleted = TRUE 
	        WHERE pkIdMaterial = p_id AND isDeleted = FALSE
	        RETURNING pkIdMaterial INTO deleted_id;
	    
	        IF NOT FOUND THEN
	            RAISE EXCEPTION 'Материал % не найден или уже удалён', p_id;
	        END IF;
	    
	        message := 'Материал помечен как удалённый';
	        RETURN NEXT;
	    END;
	    $$;
	
	
	    CREATE OR REPLACE FUNCTION f_materials_get_deleted(
	        p_id INT DEFAULT NULL
	    )
	    RETURNS SETOF v_materials_deleted
	    LANGUAGE sql STABLE
	    AS $$
	        SELECT * FROM v_materials_deleted
	        WHERE (p_id IS NULL OR "pkIdMaterial" = p_id)
	        ORDER BY "pkIdMaterial";
	    $$;
	
	
	    CREATE OR REPLACE FUNCTION f_materials_restore(p_id INT)
	    RETURNS TABLE(restored_id INT, message TEXT)
	    LANGUAGE plpgsql
	    AS $$
	    DECLARE
	        v_course_deleted BOOLEAN;
	    BEGIN
	        SELECT c.isDeleted INTO v_course_deleted
	        FROM tbMaterial m
	        JOIN tbCourses c ON c.pkIdCourse = m.fkIdCourse
	        WHERE m.pkIdMaterial = p_id AND m.isDeleted = TRUE;
	
	        IF v_course_deleted IS NULL THEN
	            RAISE EXCEPTION 'Материал % не найден или не был удалён', p_id;
	        END IF;
	
	        IF v_course_deleted THEN
	            RAISE EXCEPTION 'Невозможно восстановить: курс удалён. Сначала восстановите курс.';
	        END IF;
	
	        UPDATE tbMaterial 
	        SET isDeleted = FALSE 
	        WHERE pkIdMaterial = p_id AND isDeleted = TRUE
	        RETURNING pkIdMaterial INTO restored_id;
	
	        message := 'Материал восстановлен';
	        RETURN NEXT;
	    END;
	    $$;
	
	
	    CREATE OR REPLACE FUNCTION f_materials_hard_delete(p_id INT)
	    RETURNS TABLE(deleted_id INT, message TEXT)
	    LANGUAGE plpgsql
	    AS $$
	    BEGIN
	        IF EXISTS (SELECT 1 FROM tbMaterial WHERE pkIdMaterial = p_id AND isDeleted = FALSE) THEN
	            RAISE EXCEPTION 'Материал % необходимо сначала пометить как удалённый', p_id;
	        END IF;
	
	        DELETE FROM tbMaterial WHERE pkIdMaterial = p_id
	        RETURNING pkIdMaterial INTO deleted_id;
	    
	        IF NOT FOUND THEN
	            RAISE EXCEPTION 'Материал % не найден', p_id;
	        END IF;
	    
	        message := 'Материал физически удалён';
	        RETURN NEXT;
	    END;
	    $$;
		--#endregion
	
	--#region ===== NOTIFICATIONS =====
		CREATE OR REPLACE FUNCTION f_notifications_get(
					p_id     INT DEFAULT NULL,
					p_user   INT DEFAULT NULL,
					p_unread BOOLEAN DEFAULT NULL
			)
			RETURNS SETOF v_notifications
			LANGUAGE sql STABLE
			AS $$
					SELECT * FROM v_notifications
					WHERE (p_id     IS NULL OR "pkIdNotification" = p_id)
						AND (p_user   IS NULL OR "pkIdNotification" IN (
								SELECT pkIdNotification FROM tbNotification 
								WHERE fkIdUser = p_user AND isDeleted = FALSE
						))
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
					IF NOT EXISTS (SELECT 1 FROM tbUsers WHERE pkIdUser = p_userId AND isDeleted = FALSE) THEN
							RAISE EXCEPTION 'Пользователь % не найден или удалён', p_userId;
					END IF;

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
						AND n.isDeleted = FALSE
					RETURNING pkIdNotification INTO v_notif_id;
			
					IF v_notif_id IS NULL THEN
							RAISE EXCEPTION 'Уведомление % не найдено или удалено', p_id;
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
					UPDATE tbNotification 
					SET isDeleted = TRUE 
					WHERE pkIdNotification = p_id AND isDeleted = FALSE
					RETURNING pkIdNotification INTO deleted_id;
			
					IF NOT FOUND THEN
							RAISE EXCEPTION 'Уведомление % не найдено или уже удалено', p_id;
					END IF;
			
					message := 'Уведомление помечено как удалённое';
					RETURN NEXT;
			END;
			$$;

			CREATE OR REPLACE FUNCTION f_notifications_get_deleted(
					p_id INT DEFAULT NULL
			)
			RETURNS SETOF v_notifications_deleted
			LANGUAGE sql STABLE
			AS $$
					SELECT * FROM v_notifications_deleted
					WHERE (p_id IS NULL OR "pkIdNotification" = p_id)
					ORDER BY "createdAt" DESC;
			$$;


			CREATE OR REPLACE FUNCTION f_notifications_restore(p_id INT)
			RETURNS TABLE(restored_id INT, message TEXT)
			LANGUAGE plpgsql
			AS $$
			DECLARE
					v_user_deleted BOOLEAN;
			BEGIN
					SELECT u.isDeleted INTO v_user_deleted
					FROM tbNotification n
					JOIN tbUsers u ON u.pkIdUser = n.fkIdUser
					WHERE n.pkIdNotification = p_id AND n.isDeleted = TRUE;

					IF v_user_deleted IS NULL THEN
							RAISE EXCEPTION 'Уведомление % не найдено или не было удалено', p_id;
					END IF;

					IF v_user_deleted THEN
							RAISE EXCEPTION 'Невозможно восстановить: пользователь удалён.';
					END IF;

					UPDATE tbNotification 
					SET isDeleted = FALSE 
					WHERE pkIdNotification = p_id AND isDeleted = TRUE
					RETURNING pkIdNotification INTO restored_id;

					message := 'Уведомление восстановлено';
					RETURN NEXT;
			END;
			$$;


			CREATE OR REPLACE FUNCTION f_notifications_hard_delete(p_id INT)
			RETURNS TABLE(deleted_id INT, message TEXT)
			LANGUAGE plpgsql
			AS $$
			BEGIN
					IF EXISTS (SELECT 1 FROM tbNotification WHERE pkIdNotification = p_id AND isDeleted = FALSE) THEN
							RAISE EXCEPTION 'Уведомление % необходимо сначала пометить как удалённое', p_id;
					END IF;

					DELETE FROM tbNotification WHERE pkIdNotification = p_id
					RETURNING pkIdNotification INTO deleted_id;
			
					IF NOT FOUND THEN
							RAISE EXCEPTION 'Уведомление % не найдено', p_id;
					END IF;
			
					message := 'Уведомление физически удалено';
					RETURN NEXT;
			END;
			$$;


			CREATE OR REPLACE FUNCTION f_create_deadline_notifications()
				RETURNS VOID
				LANGUAGE plpgsql
				AS $$
				BEGIN
						INSERT INTO tbNotification(fkIdUser, message)
						SELECT DISTINCT gl.fkIdListener,
									format('⏰ Завтра дедлайн по задаче «%s»!', t.title)
						FROM tbTasks t
						JOIN tbGroupListener gl ON gl.fkIdGroup IN (
								SELECT fkIdGroup FROM tbGroup 
								WHERE fkIdCourse = t.fkIdCourse AND isDeleted = FALSE
						)
						JOIN tbUsers u ON u.pkIdUser = gl.fkIdListener AND u.isDeleted = FALSE
						WHERE t.deadline BETWEEN NOW() AND NOW() + INTERVAL '1 day'
							AND t.isDeleted = FALSE
							AND gl.isDeleted = FALSE
							AND NOT EXISTS (
									SELECT 1 FROM tbAttempt a
									WHERE a.fkIdTask = t.pkIdTask
										AND a.fkIdListener = gl.fkIdListener
										AND a.fkIdStatusAttempt = 2
										AND a.isDeleted = FALSE
							)
							AND NOT EXISTS (
									SELECT 1 FROM tbNotification n
									WHERE n.fkIdUser = gl.fkIdListener
										AND n.message LIKE format('%%⏰ Завтра дедлайн по задаче «%s»!%%', t.title)
										AND n.createdAt > NOW() - INTERVAL '1 day'
										AND n.isDeleted = FALSE
							);
				END;
				$$;
		--#endregion

	--#region ===== GROUP LISTENERS =====
		CREATE OR REPLACE FUNCTION f_grouplisteners_get(
				p_id       INT DEFAULT NULL,  -- ← НОВЫЙ ПАРАМЕТР (поиск по ID записи)
				p_group    INT DEFAULT NULL,
				p_listener INT DEFAULT NULL
		)
		RETURNS SETOF v_group_listeners
		LANGUAGE sql STABLE
		AS $$
				SELECT * FROM v_group_listeners
				WHERE (p_id       IS NULL OR "pkIdGroupListener" = p_id)  -- ← НОВОЕ УСЛОВИЕ
					AND (p_group    IS NULL OR "pkIdGroupListener" IN (
							SELECT pkIdGroupListener FROM tbGroupListener 
							WHERE fkIdGroup = p_group AND isDeleted = FALSE
					))
					AND (p_listener IS NULL OR "pkIdGroupListener" IN (
							SELECT pkIdGroupListener FROM tbGroupListener 
							WHERE fkIdListener = p_listener AND isDeleted = FALSE
					))
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
			IF NOT EXISTS (SELECT 1 FROM tbGroup WHERE pkIdGroup = p_groupId AND isDeleted = FALSE) THEN
				RAISE EXCEPTION 'Группа % не найдена или удалена', p_groupId;
			END IF;
	
			IF NOT EXISTS (SELECT 1 FROM tbUsers WHERE pkIdUser = p_listenerId AND isDeleted = FALSE AND fkIdRole = 3) THEN
				RAISE EXCEPTION 'Слушатель % не найден, удалён или не является слушателем', p_listenerId;
			END IF;
	
			-- Проверяем, не добавлен ли уже (включая удалённых — тогда восстановим)
			IF EXISTS (
				SELECT 1 FROM tbGroupListener 
				WHERE fkIdGroup = p_groupId AND fkIdListener = p_listenerId AND isDeleted = FALSE
			) THEN
				RAISE EXCEPTION 'Слушатель уже состоит в этой группе';
			END IF;
	
			-- Если был удалён — восстанавливаем, иначе создаём новую запись
			UPDATE tbGroupListener 
			SET isDeleted = FALSE 
			WHERE fkIdGroup = p_groupId AND fkIdListener = p_listenerId AND isDeleted = TRUE
			RETURNING pkIdGroupListener INTO v_id;
	
			IF NOT FOUND THEN
				INSERT INTO tbGroupListener(fkIdGroup, fkIdListener)
				VALUES (p_groupId, p_listenerId)
				RETURNING pkIdGroupListener INTO v_id;
			END IF;
		
			SELECT * INTO v_result FROM v_group_listeners WHERE "pkIdGroupListener" = v_id;
			RETURN v_result;
		END;
		$$;
		
		CREATE OR REPLACE FUNCTION f_grouplisteners_update(
			p_id          INT,
			p_groupId     INT DEFAULT NULL,
			p_listenerId  INT DEFAULT NULL
		)
		RETURNS v_group_listeners
		LANGUAGE plpgsql
		AS $$
		DECLARE
			v_id        INT;
			v_result    v_group_listeners;
			v_old_group INT;
			v_old_listener INT;
		BEGIN
			-- Получаем текущие значения
			SELECT fkIdGroup, fkIdListener 
			INTO v_old_group, v_old_listener
			FROM tbGroupListener 
			WHERE pkIdGroupListener = p_id;

			-- Проверка что запись существует
			IF v_old_group IS NULL THEN
					RAISE EXCEPTION 'Запись % не найдена', p_id;
			END IF;

			IF v_old_group IS NOT NULL AND NOT EXISTS (
					SELECT 1 FROM tbGroup WHERE pkIdGroup = v_old_group AND isDeleted = FALSE
			) THEN
					RAISE EXCEPTION 'Группа записи удалена';
			END IF;

			-- Проверяем новую группу если меняется
			IF p_groupId IS NOT NULL AND p_groupId != v_old_group THEN
					IF NOT EXISTS (SELECT 1 FROM tbGroup WHERE pkIdGroup = p_groupId AND isDeleted = FALSE) THEN
							RAISE EXCEPTION 'Группа % не найдена или удалена', p_groupId;
					END IF;
			END IF;

			-- Проверяем нового слушателя если меняется
			IF p_listenerId IS NOT NULL AND p_listenerId != v_old_listener THEN
					IF NOT EXISTS (
							SELECT 1 FROM tbUsers 
							WHERE pkIdUser = p_listenerId 
							AND isDeleted = FALSE 
							AND fkIdRole = 3
					) THEN
							RAISE EXCEPTION 'Слушатель % не найден, удалён или не является слушателем', p_listenerId;
					END IF;

					-- Проверяем что слушатель еще не в этой группе (если меняем группу или слушателя)
					IF EXISTS (
							SELECT 1 FROM tbGroupListener 
							WHERE fkIdGroup = COALESCE(p_groupId, v_old_group)
							AND fkIdListener = p_listenerId
							AND pkIdGroupListener != p_id
							AND isDeleted = FALSE
					) THEN
							RAISE EXCEPTION 'Слушатель уже состоит в этой группе';
					END IF;
			END IF;

			-- Проверяем уникальность если меняется только группа (на того же слушателя)
			IF p_groupId IS NOT NULL AND p_groupId != v_old_group AND (p_listenerId IS NULL OR p_listenerId = v_old_listener) THEN
					IF EXISTS (
							SELECT 1 FROM tbGroupListener 
							WHERE fkIdGroup = p_groupId
							AND fkIdListener = v_old_listener
							AND pkIdGroupListener != p_id
							AND isDeleted = FALSE
					) THEN
							RAISE EXCEPTION 'Слушатель уже состоит в группе %', p_groupId;
					END IF;
			END IF;

			-- Обновляем
			UPDATE tbGroupListener
			SET fkIdGroup = COALESCE(p_groupId, fkIdGroup),
					fkIdListener = COALESCE(p_listenerId, fkIdListener)
			WHERE pkIdGroupListener = p_id
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
			UPDATE tbGroupListener 
			SET isDeleted = TRUE 
			WHERE pkIdGroupListener = p_id AND isDeleted = FALSE
			RETURNING pkIdGroupListener INTO deleted_id;
		
			IF NOT FOUND THEN
				RAISE EXCEPTION 'Запись % не найдена или уже удалена', p_id;
			END IF;
		
			message := 'Слушатель исключён из группы (помечен как удалённый)';
			RETURN NEXT;
		END;
		$$;
		
	
		CREATE OR REPLACE FUNCTION f_grouplisteners_get_deleted(
			p_group    INT DEFAULT NULL,
			p_listener INT DEFAULT NULL
		)
		RETURNS SETOF v_grouplisteners_deleted
		LANGUAGE sql STABLE
		AS $$
			SELECT * FROM v_grouplisteners_deleted
			WHERE (p_group    IS NULL OR "pkIdGroupListener" IN (
				SELECT pkIdGroupListener FROM tbGroupListener WHERE fkIdGroup = p_group
			))
			  AND (p_listener IS NULL OR "pkIdGroupListener" IN (
				SELECT pkIdGroupListener FROM tbGroupListener WHERE fkIdListener = p_listener
			))
			ORDER BY "groupName", "listenerName";
		$$;
	
	
		CREATE OR REPLACE FUNCTION f_grouplisteners_restore(p_id INT)
		RETURNS TABLE(restored_id INT, message TEXT)
		LANGUAGE plpgsql
		AS $$
		DECLARE
			v_group_deleted BOOLEAN;
			v_listener_deleted BOOLEAN;
		BEGIN
			SELECT g.isDeleted, u.isDeleted INTO v_group_deleted, v_listener_deleted
			FROM tbGroupListener gl
			JOIN tbGroup g ON g.pkIdGroup = gl.fkIdGroup
			JOIN tbUsers u ON u.pkIdUser = gl.fkIdListener
			WHERE gl.pkIdGroupListener = p_id AND gl.isDeleted = TRUE;
	
			IF v_group_deleted IS NULL THEN
				RAISE EXCEPTION 'Запись % не найдена или не была удалена', p_id;
			END IF;
	
			IF v_group_deleted THEN
				RAISE EXCEPTION 'Невозможно восстановить: группа удалена. Сначала восстановите группу.';
			END IF;
	
			IF v_listener_deleted THEN
				RAISE EXCEPTION 'Невозможно восстановить: слушатель удалён. Сначала восстановите слушателя.';
			END IF;
	
			UPDATE tbGroupListener 
			SET isDeleted = FALSE 
			WHERE pkIdGroupListener = p_id AND isDeleted = TRUE
			RETURNING pkIdGroupListener INTO restored_id;
	
			message := 'Слушатель восстановлен в группе';
			RETURN NEXT;
		END;
		$$;
	
	
		CREATE OR REPLACE FUNCTION f_grouplisteners_hard_delete(p_id INT)
		RETURNS TABLE(deleted_id INT, message TEXT)
		LANGUAGE plpgsql
		AS $$
		BEGIN
			IF EXISTS (SELECT 1 FROM tbGroupListener WHERE pkIdGroupListener = p_id AND isDeleted = FALSE) THEN
				RAISE EXCEPTION 'Запись % необходимо сначала пометить как удалённую', p_id;
			END IF;
	
			DELETE FROM tbGroupListener WHERE pkIdGroupListener = p_id
			RETURNING pkIdGroupListener INTO deleted_id;
		
			IF NOT FOUND THEN
				RAISE EXCEPTION 'Запись % не найдена', p_id;
			END IF;
		
			message := 'Запись физически удалена';
			RETURN NEXT;
		END;
		$$;
	--#endregion
	
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

		-- Логируем только если запись не помечена как удалённая (для UPDATE/DELETE)
        -- или если это восстановление (isDeleted меняется с TRUE на FALSE)
		 IF TG_OP = 'UPDATE' THEN
            -- Логируем изменение isDeleted отдельно для ясности
            IF OLD.isDeleted IS DISTINCT FROM NEW.isDeleted THEN
                IF NEW.isDeleted THEN
                    v_action := 'SOFT_DELETE';
                ELSE
                    v_action := 'RESTORE';
                END IF;
            END IF;
        END IF;
	
		INSERT INTO tbAdminLog(fkIdAdminUser, tableName, action, oldData, newData)
		VALUES (current_user_id(), v_table, v_action, v_old_json, v_new_json);
	
		RETURN NULL;          -- AFTER
	END;
	$$;

	CREATE TRIGGER trg_audit_tbUsers
	AFTER INSERT OR UPDATE OR DELETE ON tbUsers
	FOR EACH ROW
	EXECUTE FUNCTION trg_audit_to_admin_log();
	
	CREATE TRIGGER trg_audit_tbCourses
	AFTER INSERT OR UPDATE OR DELETE ON tbCourses
	FOR EACH ROW
	EXECUTE FUNCTION trg_audit_to_admin_log();
	
	CREATE TRIGGER trg_audit_tbGroup
	AFTER INSERT OR UPDATE OR DELETE ON tbGroup
	FOR EACH ROW
	EXECUTE FUNCTION trg_audit_to_admin_log();

	CREATE TRIGGER a_trg_audit_tbGroupListener
	AFTER INSERT OR UPDATE OR DELETE ON tbGroupListener
	FOR EACH ROW
	EXECUTE FUNCTION trg_audit_to_admin_log();
	
	CREATE TRIGGER trg_audit_tbTasks
	AFTER INSERT OR UPDATE OR DELETE ON tbTasks
	FOR EACH ROW
	EXECUTE FUNCTION trg_audit_to_admin_log();

	CREATE TRIGGER a_trg_audit_tbAttempt
	AFTER INSERT OR UPDATE OR DELETE ON tbAttempt
	FOR EACH ROW
	EXECUTE FUNCTION trg_audit_to_admin_log();
	
	CREATE TRIGGER trg_audit_tbCertificate
	AFTER INSERT OR UPDATE OR DELETE ON tbCertificate
	FOR EACH ROW
	EXECUTE FUNCTION trg_audit_to_admin_log();
	
	CREATE TRIGGER trg_audit_tbMaterial
	AFTER INSERT OR UPDATE OR DELETE ON tbMaterial
	FOR EACH ROW
	EXECUTE FUNCTION trg_audit_to_admin_log();
	
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
        v_listener_deleted BOOLEAN;
    BEGIN
	-- Проверяем, что слушатель не удалён
        SELECT isDeleted INTO v_listener_deleted
        FROM tbUsers WHERE pkIdUser = NEW.fkIdListener;

        IF v_listener_deleted THEN
            RETURN NULL;
        END IF;

        -- Только переход в статус «Принято» (pkIdStatusAttempt = 2)
        IF NEW.fkIdStatusAttempt = 2 AND OLD.fkIdStatusAttempt IS DISTINCT FROM 2 THEN
            SELECT t.title, t.maxScore
            INTO v_title, v_max
            FROM tbTasks t
            WHERE t.pkIdTask = NEW.fkIdTask AND t.isDeleted = FALSE;

            IF v_title IS NOT NULL THEN
                INSERT INTO tbNotification(fkIdUser, message)
                VALUES (
                    NEW.fkIdListener,
                    format('✅ Ваша работа «%s» оценена: %s/%s баллов.', v_title, NEW.score, v_max)
                );
            END IF;
        END IF;
        RETURN NULL;
    END;
    $$;
    
    CREATE TRIGGER tg_after_attempt_graded
    AFTER UPDATE ON tbAttempt
    FOR EACH ROW
    EXECUTE FUNCTION trg_notify_listener_graded();


	-- Преподаватель получает уведомление о новой попытке с именем слушателя
	CREATE OR REPLACE FUNCTION trg_notify_teacher_submitted()
	RETURNS TRIGGER
	LANGUAGE plpgsql
	AS $$
	DECLARE
	    v_title   TEXT;
	    v_teacher INT;
	    v_teacher_deleted BOOLEAN;
	    v_course_id INT;
	    v_listener_name TEXT; 
	BEGIN
	    IF TG_OP = 'INSERT' THEN
	        SELECT t.title, t.fkIdCourse, u.fullName
	        INTO v_title, v_course_id, v_listener_name
	        FROM tbTasks t
	        CROSS JOIN tbUsers u  
	        WHERE t.pkIdTask = NEW.fkIdTask 
	          AND t.isDeleted = FALSE
	          AND u.pkIdUser = NEW.fkIdListener;  
	
	        IF v_course_id IS NULL THEN
	            RETURN NULL;
	        END IF;
	
	        SELECT g.fkIdCurator INTO v_teacher
	        FROM tbGroupListener gl
	        JOIN tbGroup g ON g.pkIdGroup = gl.fkIdGroup AND g.isDeleted = FALSE
	        WHERE gl.fkIdListener = NEW.fkIdListener 
	          AND gl.isDeleted = FALSE
	          AND g.fkIdCourse = v_course_id
	        LIMIT 1;
	
	        IF v_teacher IS NOT NULL THEN
	            SELECT isDeleted INTO v_teacher_deleted
	            FROM tbUsers WHERE pkIdUser = v_teacher;
	
	            IF NOT v_teacher_deleted THEN
	                INSERT INTO tbNotification(fkIdUser, message)
	                VALUES (
	                    v_teacher,
	                    format('📎 %s сдал работу «%s» (ожидает проверки).', v_listener_name, v_title)
	                );
	            END IF;
	        END IF;
	    END IF;
	    RETURN NULL;
	END;
	$$;
    
    CREATE TRIGGER tg_after_attempt_submitted
    AFTER INSERT ON tbAttempt
    FOR EACH ROW
    EXECUTE FUNCTION trg_notify_teacher_submitted();
	
	-- Преподаватель получает, когда слушатель вступил в группу
	CREATE OR REPLACE FUNCTION trg_notify_teacher_joined()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    AS $$
    DECLARE
        v_group   TEXT;
        v_teacher INT;
        v_teacher_deleted BOOLEAN;
        v_listener_deleted BOOLEAN;
    BEGIN
        -- Проверяем, что и слушатель, и группа не удалены
        SELECT isDeleted INTO v_listener_deleted
        FROM tbUsers WHERE pkIdUser = NEW.fkIdListener;

        IF v_listener_deleted OR NEW.isDeleted THEN
            RETURN NULL;
        END IF;

        SELECT g.name, g.fkIdCurator
        INTO v_group, v_teacher
        FROM tbGroup g
        WHERE g.pkIdGroup = NEW.fkIdGroup AND g.isDeleted = FALSE;

        IF v_teacher IS NOT NULL THEN
            SELECT isDeleted INTO v_teacher_deleted
            FROM tbUsers WHERE pkIdUser = v_teacher;

            IF NOT v_teacher_deleted THEN
                INSERT INTO tbNotification(fkIdUser, message)
                VALUES (
                    v_teacher,
                    format('👥 В вашу группу «%s» записан новый слушатель.', v_group)
                );
            END IF;
        END IF;
        RETURN NULL;
    END;
    $$;
    
    CREATE TRIGGER tg_after_listener_joined
    AFTER INSERT OR UPDATE ON tbGroupListener
    FOR EACH ROW
    WHEN (NEW.isDeleted = FALSE)  -- только для активных записей
    EXECUTE FUNCTION trg_notify_teacher_joined();
--#endregion

--#region ===== ВЫЗОВ CRUD FUNC (логический порядок + hard_delete) =====

    -- ============================================================
    -- 1. USERS (создаём слушателя и преподавателя для тестов)
    -- ============================================================
    
    -- Просмотр активных
    SELECT * FROM f_users_get();
    
    -- Создание слушателя "Бета"
    SELECT * FROM f_users_create(
        'Бета Беттавочи Бетов',               
        'beta',               
        '+375294444444',     
        'beta@yandex.by',     
        'beta_password',      
        3  -- Слушатель
    );
    
    -- Создание преподавателя "Гамма"
    SELECT * FROM f_users_create(
        'Гамма Гаммович Гамов',
        'gamma',
        '+375295555555',
        'gamma@yandex.by',
        'gamma_password',
        2  -- Преподаватель
    );
    
    -- Проверка созданных
    SELECT * FROM f_users_get();
    SELECT * FROM tbUsers WHERE login IN ('beta', 'gamma');
    
    -- Обновление слушателя
    SELECT * FROM f_users_update(
        7,
        p_roleId => 1            
    );
    
    -- Soft delete слушателя
    SELECT * FROM f_users_delete((SELECT pkIdUser FROM tbUsers WHERE login = 'beta'));
    
    -- Восстановление слушателя
    SELECT * FROM f_users_restore((SELECT pkIdUser FROM tbUsers WHERE login = 'beta' AND isDeleted = TRUE));
    
    -- Hard delete слушателя (последовательно)
    -- SELECT * FROM f_users_delete((SELECT pkIdUser FROM tbUsers WHERE login = 'beta'));
    -- SELECT * FROM f_users_hard_delete((SELECT pkIdUser FROM tbUsers WHERE login = 'beta'));
    
    -- Просмотр удалённых
    SELECT * FROM f_users_get_deleted();


    -- ============================================================
    -- 2. COURSES (создаём курс для преподавателя gamma)
    -- ============================================================
    
    SELECT * FROM f_courses_get();
    
    -- Создание курса "React" (статус 2 = Активен)
    SELECT * FROM f_courses_create('React', 'Курс по React', '2025-09-01', '2025-12-01', 2);
    
    -- Проверка
    SELECT * FROM f_courses_get();
    SELECT * FROM tbCourses WHERE title = 'React';
    
    -- Обновление курса
    SELECT * FROM f_courses_update(
        (SELECT pkIdCourse FROM tbCourses WHERE title = 'React' AND isDeleted = FALSE),
        'React Advanced'
    );
    
    -- Soft delete курса
    SELECT * FROM f_courses_delete(
        (SELECT pkIdCourse FROM tbCourses WHERE title = 'React Advanced' AND isDeleted = FALSE)
    );
    
    -- Проверка что каскадно удалились связанные (группы, задания, материалы)
    SELECT * FROM f_groups_get();  -- должно быть пусто или без React-групп
    SELECT * FROM f_tasks_get();   -- должно быть пусто или без React-заданий
    
    -- Восстановление курса (каскадно восстановит группы, задания, материалы)
    SELECT * FROM f_courses_restore(
        (SELECT pkIdCourse FROM tbCourses WHERE title = 'React Advanced' AND isDeleted = TRUE)
    );
    
    -- Проверка восстановления
    SELECT * FROM f_courses_get();
    
    -- Просмотр удалённых курсов
    SELECT * FROM f_courses_get_deleted();
    
    -- Hard delete курса (последовательно)
    -- SELECT * FROM f_courses_delete(
    --     (SELECT pkIdCourse FROM tbCourses WHERE title = 'React Advanced' AND isDeleted = FALSE)
    -- );
    -- SELECT * FROM f_courses_hard_delete(
    --     (SELECT pkIdCourse FROM tbCourses WHERE title = 'React Advanced' AND isDeleted = TRUE)
    -- );


    -- ============================================================
    -- 3. GROUPS (создаём группу на курсе)
    -- ============================================================
    
    -- Создание группы (курс 2 = React, куратор = gamma)
    SELECT * FROM f_groups_create('React-2025', 2, 6);
    
    -- Проверка
    SELECT * FROM f_groups_get();
    SELECT * FROM v_groups WHERE "groupName" = 'React-2025';
    
    -- Обновление группы
    SELECT * FROM f_groups_update(
        (SELECT "pkIdGroup" FROM v_groups WHERE "groupName" = 'React-2025'),
        'React-2025-Premium'
    );
    
    -- Soft delete группы
    SELECT * FROM f_groups_delete(
        (SELECT "pkIdGroup" FROM v_groups WHERE "groupName" = 'React-2025-Premium')
    );
    
    -- Проверка что слушатели исключены (tbGroupListener isDeleted = TRUE)
    SELECT * FROM tbGroupListener WHERE fkIdGroup = (
        SELECT pkIdGroup FROM tbGroup WHERE name = 'React-2025-Premium'
    );
    
    -- Восстановление группы (каскадно восстановит записи слушателей)
    SELECT * FROM f_groups_restore(
        (SELECT "pkIdGroup" FROM v_groups_deleted WHERE "groupName" = 'React-2025-Premium')
    );
    
    -- Просмотр удалённых групп
    SELECT * FROM f_groups_get_deleted();

    -- Hard delete группы (последовательно)
    -- SELECT * FROM f_groups_delete(
    --     (SELECT "pkIdGroup" FROM v_groups WHERE "groupName" = 'React-2025-Premium')
    -- );
    -- SELECT * FROM f_groups_hard_delete(
    --     (SELECT "pkIdGroup" FROM tbGroup WHERE name = 'React-2025-Premium' AND isDeleted = TRUE)
    -- );


    -- ============================================================
    -- 4. GROUP LISTENERS (добавляем слушателя в группу)
    -- ============================================================

    -- Добавление слушателя "Бета" (pkIdUser=5) в группу "React-2025-Premium" (pkIdGroup=3)
    -- Сначала узнаем ID группы
    SELECT pkIdGroup FROM tbGroup WHERE name = 'React-2025-Premium' AND isDeleted = FALSE;
    
    -- Добавление (восстановит если была удалённая запись)
    SELECT * FROM f_grouplisteners_add(3, 3);  -- groupId=3, listenerId=4 (beta)
    
    -- Проверка что слушатель в группе
    SELECT * FROM f_grouplisteners_get();
    SELECT * FROM v_group_listeners WHERE "groupName" = 'React-2025-Premium';
    
    -- Soft delete (исключение из группы)
    SELECT * FROM f_grouplisteners_remove(2);
    
    -- Проверка что исключён
    SELECT * FROM f_grouplisteners_get(p_group => 3);
    
    -- Восстановление в группу
    SELECT * FROM f_grouplisteners_restore(1);
    
    -- Проверка что восстановлен
    SELECT * FROM f_grouplisteners_get(p_group => 3);
    
    -- Просмотр удалённых записей
    SELECT * FROM f_grouplisteners_get_deleted();
    
    -- Hard delete записи (последовательно)
    -- SELECT * FROM f_grouplisteners_remove(
    --     (SELECT "pkIdGroupListener" FROM v_group_listeners WHERE "groupName" = 'React-2025-Premium')
    -- );
    -- SELECT * FROM f_grouplisteners_hard_delete(
    --     (SELECT pkIdGroupListener FROM tbGroupListener 
    --      WHERE fkIdGroup = 3 AND fkIdListener = 4 AND isDeleted = TRUE)
    -- );


    -- ============================================================
    -- 5. TASKS (создаём задание в курсе)
    -- ============================================================
    
    -- Создание задания (курс 2 = React, тип 2 = Практическая)
    SELECT * FROM f_tasks_create(
        2,                      
        2,                      
        'Домашняя работа #1',
        'Сделать CRUD на NestJS',
        '2025-09-15 23:59:59',
        100
    );
    
    -- Проверка
    SELECT * FROM f_tasks_get();
    SELECT * FROM v_tasks WHERE title = 'Домашняя работа #1';
    
    -- Обновление задания
    SELECT * FROM f_tasks_update(
        3,
        p_maxScore => 120
    );
    
    -- Soft delete задания
    SELECT * FROM f_tasks_delete(
        (SELECT "pkIdTask" FROM v_tasks WHERE title = 'Домашняя работа #1')
    );
    
    -- Проверка что попытки тоже удалены (если были)
    SELECT * FROM tbAttempt WHERE fkIdTask = (
        SELECT pkIdTask FROM tbTasks WHERE title = 'Домашняя работа #1'
    );
    
    -- Восстановление задания (каскадно восстановит попытки)
    SELECT * FROM f_tasks_restore(
        (SELECT "pkIdTask" FROM v_tasks_deleted WHERE title = 'Домашняя работа #1')
    );
    
    -- Просмотр удалённых заданий
    SELECT * FROM f_tasks_get_deleted();
	
    -- Hard delete задания (последовательно)
    -- SELECT * FROM f_tasks_delete(
    --     (SELECT "pkIdTask" FROM v_tasks WHERE title = 'Домашняя работа #1')
    -- );
    -- SELECT * FROM f_tasks_hard_delete(
    --     (SELECT pkIdTask FROM tbTasks WHERE title = 'Домашняя работа #1' AND isDeleted = TRUE)
    -- );


    -- ============================================================
    -- 6. ATTEMPTS (сдача задания - ТРИГГЕР ДОЛЖЕН СРАБОТАТЬ!)
    -- ============================================================
    
    -- Проверка уведомлений преподавателя ДО (должно быть пусто или старые)
    SELECT * FROM f_notifications_get();  -- gamma
	SELECT * FROM f_attempts_get();
    
    -- Создание попытки (задание 2, слушатель 4 = beta)
    -- ТРИГГЕР: преподаватель должен получить уведомление!
    SELECT * FROM f_attempts_create(3, 3);
    
    -- Проверка уведомлений преподавателя ПОСЛЕ (должно быть новое!)
    SELECT * FROM f_notifications_get(p_user => 2);
    SELECT * FROM v_notifications WHERE "userName" = 'Гамма Гаммович Гамов';
    
    -- Оценка преподавателем (статус 2 = Принято)
    -- ТРИГГЕР: слушатель должен получить уведомление об оценке!
    SELECT * FROM f_attempts_grade(
        3,
        100,
        2  -- Принято
    );
    
    -- Проверка уведомлений слушателя
    SELECT * FROM f_notifications_get(p_user => 4);  -- beta
    
    -- Soft delete попытки
    SELECT * FROM f_attempts_delete(
        3
    );
    
    -- Восстановление попытки
    SELECT * FROM f_attempts_restore(
        3
    );
    
    -- Просмотр удалённых попыток
    SELECT * FROM f_attempts_get_deleted();
    
    -- Hard delete попытки (последовательно)
    -- SELECT * FROM f_attempts_delete(
    --     (SELECT "pkIdAttemp" FROM v_attempts WHERE "listenerName" = 'Бета Бетанович Бетов' LIMIT 1)
    -- );
    -- SELECT * FROM f_attempts_hard_delete(
    --     (SELECT pkIdAttemp FROM tbAttempt 
    --      WHERE fkIdListener = 4 AND isDeleted = TRUE LIMIT 1)
    -- );


    -- ============================================================
    -- 7. CERTIFICATES (выдача сертификата)
    -- ============================================================
    
    -- Выдача сертификата слушателю (слушатель 5, курс 2)
    SELECT * FROM f_certificates_issue(5, 2, 'certs/beta-react.pdf');
    
    -- Проверка
    SELECT * FROM f_certificates_get(p_listener => 5);
    
    -- Обновление PDF
    SELECT * FROM f_certificates_update(
        (SELECT "pkIdCertificate" FROM v_certificates WHERE "listenerName" = 'Бета Беттавочи Бетов' LIMIT 1),
        'certs/beta-react-v2.pdf'
    );
    
    -- Soft delete (аннулирование)
    SELECT * FROM f_certificates_delete(
        (SELECT "pkIdCertificate" FROM v_certificates WHERE "listenerName" = 'Бета Беттавочи Бетов' LIMIT 1)
    );
    
    -- Восстановление сертификата
    SELECT * FROM f_certificates_restore(
        (SELECT "pkIdCertificate" FROM v_certificates_deleted 
         WHERE "listenerName" = 'Бета Беттавочи Бетов' LIMIT 1)
    );
    
    -- Просмотр аннулированных
    SELECT * FROM f_certificates_get_deleted();
    
    -- Hard delete сертификата (последовательно)
    -- SELECT * FROM f_certificates_delete(
    --     (SELECT "pkIdCertificate" FROM v_certificates WHERE "listenerName" = 'Бета Бетанович Бетов' LIMIT 1)
    -- );
    -- SELECT * FROM f_certificates_hard_delete(
    --     (SELECT pkIdCertificate FROM tbCertificate 
    --      WHERE fkIdListener = 4 AND isDeleted = TRUE LIMIT 1)
    -- );


    -- ============================================================
    -- 8. MATERIALS (материалы курса)
    -- ============================================================
    
    -- Создание материала (курс 2)
    SELECT * FROM f_materials_create(
        2,
        'Лекция 1. Введение в React',
        'https://mgir.by/materials/react-intro.pdf',
        'https://mgir.by/materials/react-intro'
    );
    
    -- Проверка
    SELECT * FROM f_materials_get(p_course => 2);
    
    -- Обновление
    SELECT * FROM f_materials_update(
        (SELECT "pkIdMaterial" FROM v_materials WHERE title = 'Лекция 1. Введение в React'),
        p_title := 'Лекция 1. Введение в React (обновлённая)'
    );
    
    -- Soft delete
    SELECT * FROM f_materials_delete(
        (SELECT "pkIdMaterial" FROM v_materials WHERE title = 'Лекция 1. Введение в React (обновлённая)')
    );
    
    -- Восстановление
    SELECT * FROM f_materials_restore(
        (SELECT "pkIdMaterial" FROM v_materials_deleted 
         WHERE title = 'Лекция 1. Введение в React (обновлённая)')
    );
    
    -- Просмотр удалённых
    SELECT * FROM f_materials_get_deleted();
    
    -- Hard delete (последовательно)
    -- SELECT * FROM f_materials_delete(
    --     (SELECT "pkIdMaterial" FROM v_materials WHERE title = 'Лекция 1. Введение в React (обновлённая)')
    -- );
    -- SELECT * FROM f_materials_hard_delete(
    --     (SELECT pkIdMaterial FROM tbMaterial 
    --      WHERE title = 'Лекция 1. Введение в React (обновлённая)' AND isDeleted = TRUE)
    -- );


    -- ============================================================
    -- 9. NOTIFICATIONS (ручное создание и управление)
    -- ============================================================
    
    -- Создание уведомления слушателю
    SELECT * FROM f_notifications_create(4, 'Дедлайн через 2 дня!');
    
    -- Просмотр всех
    SELECT * FROM f_notifications_get();
    
    -- Только непрочитанные
    SELECT * FROM f_notifications_get(p_unread => true);
    
    -- Пометить прочитанным
    SELECT * FROM f_notifications_mark_read(
        (SELECT "pkIdNotification" 
         FROM v_notifications 
         WHERE "userName" = 'Бета Бетанович Бетов' 
         ORDER BY "createdAt" DESC LIMIT 1)
    );
    
    -- Soft delete
    SELECT * FROM f_notifications_delete(
        (SELECT "pkIdNotification" 
         FROM v_notifications 
         WHERE "userName" = 'Бета Бетанович Бетов' 
         ORDER BY "createdAt" DESC LIMIT 1)
    );
    
    -- Восстановление
    SELECT * FROM f_notifications_restore(
        (SELECT "pkIdNotification" 
         FROM v_notifications_deleted 
         WHERE "userName" = 'Бета Бетанович Бетов' 
         ORDER BY "createdAt" DESC LIMIT 1)
    );
    
    -- Просмотр удалённых
    SELECT * FROM f_notifications_get_deleted();
    
    -- Hard delete (последовательно)
    -- SELECT * FROM f_notifications_delete(
    --     (SELECT "pkIdNotification" FROM v_notifications WHERE "userName" = 'Бета Бетанович Бетов' LIMIT 1)
    -- );
    -- SELECT * FROM f_notifications_hard_delete(
    --     (SELECT pkIdNotification FROM tbNotification 
    --      WHERE fkIdUser = 4 AND isDeleted = TRUE LIMIT 1)
    -- );

--#endregion



CREATE OR REPLACE FUNCTION current_user_id()
RETURNS INT
LANGUAGE sql
AS $$
    SELECT NULLIF(current_setting('app.user_id', TRUE), '')::INT;
$$;


SELECT current_user_id();   
SET app.user_id = '1'; --// не забыть на сереве передать id для триггера, пока что это заглушка
SELECT current_user_id();   