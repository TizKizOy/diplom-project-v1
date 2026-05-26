# Платформа дистанционных курсов повышения квалификации

Монорепозиторий: **NestJS** (REST API + Swagger) + **SQL Server** + **Next.js** (клиент с модульными стилями SCSS).

## Требования

- Node.js 20+
- Экземпляр **Microsoft SQL Server**. Схема и данные задаются скриптом **`server/src/common/db/ActualCodeDbSqlServer.sql`** (основной и единственный ориентир для создания/обновления БД в этом проекте).
- Для расширенного демо-наполнения (доп. курсы, слушатели, группы) выполните **`server/src/common/db/SeedExtendedData.sql`** в той же БД после основного скрипта.

### Обновление уже существующей БД

Если база создана ранее, выполните в SSMS фрагменты `CREATE OR ALTER` для процедур **`prGetAttemptsWithUsersAndStatus`**, **`prGetTasksWithTypesAndLessons`** и **`prGetGroupListenersWithUserInfo`** из файла **`server/src/common/db/ActualCodeDbSqlServer.sql`**: в ответах API должны появиться поля **`fkIdTask`**, **`fkIdCourse`**, **`fkIdLesson`**, **`fkIdGroup`**, **`fkIdListener`** — без них клиент не сможет строить цепочку уроков, фильтровать попытки по курсу и проверять запись в группу.

## Переменные окружения

### Сервер (`server/.env`)

Создайте файл `server/.env` по образцу:

```env
PORT=3003

DB_USER=sa
DB_PASSWORD=your_password
DB_SERVER=localhost
DB_DATABASE=YourDbName
DB_PORT=1433
DB_ENCRYPT=false
DB_TRUST_CERT=true

# Один или несколько origin клиента через запятую (должен совпадать с URL в браузере)
CLIENT_ORIGIN=http://localhost:3000,http://127.0.0.1:3000
```

По умолчанию в коде клиента API: `http://localhost:3003/api`. Если сервер слушает другой порт, задайте `PORT` и совпадающий `NEXT_PUBLIC_API_URL` на клиенте.

### Клиент (`client/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3003/api
```

## Запуск в режиме разработки

В **двух** терминалах из корня репозитория:

```bash
cd server
npm install
npm run dev
```

```bash
cd client
npm install
npm run dev
```

- API и Swagger: `http://localhost:<PORT>/api` (например `http://localhost:3003/api`).
- Клиент: обычно `http://localhost:3000` (см. вывод `next dev`).

## Сборка для продакшена

```bash
cd server && npm run build && npm run start:prod
cd client && npm run build && npm start
```

## Роли и вход

Регистрация с публичной страницы создаёт пользователя с ролью **Слушатель**. Учётные записи **Администратор** и **Преподаватель** задаются в базе данных (или через административные процедуры вашего проекта). После входа cookie с JWT (`access` / `refresh`) выставляются сервером; клиент ходит в API с `withCredentials: true`.

## Функционал (кратко)

- Каталог и карточки курсов, запись в группу, прохождение уроков и заданий.
- Администрирование: пользователи, группы, курсы, журнал, аналитика, отчёты с экспортом **PDF**, **Excel (.xlsx)**, **Word (.docx)**.
- Сертификаты: просмотр и выгрузка **PDF**, **Word**, **Excel** (для администратора — выгрузка списка в Excel). При полном прохождении курса (все задания «Принято») вызывается `POST /certificates/issue-if-complete`; при оценке «Принято» преподавателем сервер также пытается создать запись сертификата, если в БД есть **активный шаблон** по курсу (`tbCertificateTemplates`).
- Уведомления: запись в БД (триггеры) + отображение на странице уведомлений и всплывающие toasts при опросе API (`GET /notifications/user/:id` — только свои).

## Примечание по ТЗ

В техническом задании может фигурировать **Bootstrap**; в данной реализации интерфейс собран на **SCSS-модулях** с адаптивной вёрсткой (в том числе выезжающее меню на узких экранах в защищённой зоне приложения).
