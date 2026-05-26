// Статусы курсов
export const COURSE_STATUS = {
  DRAFT: 1,
  PUBLISHED: 2,
  ARCHIVED: 3,
} as const;

export const COURSE_STATUS_NAMES: Record<number, string> = {
  1: 'Черновик',
  2: 'Опубликован',
  3: 'Архивирован',
};

/** Курс доступен для записи слушателем (учитывает ответ API без fkIdStatus до обновления БД). */
export function isPublishedCourse(
  course: { fkIdStatus?: number; statusName?: string } | null | undefined,
): boolean {
  if (!course) return false;
  if (Number(course.fkIdStatus) === COURSE_STATUS.PUBLISHED) return true;
  return course.statusName === COURSE_STATUS_NAMES[COURSE_STATUS.PUBLISHED];
}

// Статусы попыток
export const ATTEMPT_STATUS = {
  PENDING: 1,    // На проверке
  ACCEPTED: 2,   // Принято
  REJECTED: 3,   // Отклонено
  REVISION: 4,   // На доработке
} as const;

export const ATTEMPT_STATUS_NAMES: Record<number, string> = {
  1: 'На проверке',
  2: 'Принято',
  3: 'Отклонено',
  4: 'На доработке',
};

/** Сопоставление названия статуса (как в API) с числовым id для PATCH оценки. */
export function attemptStatusNameToId(
  statusName: string | undefined | null,
): number | undefined {
  if (!statusName) return undefined;
  const entry = Object.entries(ATTEMPT_STATUS_NAMES).find(([, n]) => n === statusName);
  return entry ? Number(entry[0]) : undefined;
}

// Типы заданий
export const TASK_TYPE = {
  TEST: 1,
  PRACTICAL: 2,
  THEORETICAL: 3,
} as const;

export const TASK_TYPE_NAMES: Record<number, string> = {
  1: 'Тест',
  2: 'Практическое задание',
  3: 'Теоретическое задание',
};

// Типы материалов
export const MATERIAL_TYPE = {
  VIDEO: 1,
  PRESENTATION: 2,
  PDF: 3,
  LINK: 4,
} as const;

export const MATERIAL_TYPE_ICONS: Record<number, string> = {
  1: 'Видео',
  2: 'Презентация',
  3: 'PDF',
  4: 'Ссылка',
};

// Роли
export const ROLES = {
  ADMIN: 'Администратор',
  TEACHER: 'Преподаватель',
  LISTENER: 'Слушатель',
} as const;
