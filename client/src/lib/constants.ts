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
  1: '🎬',
  2: '📊',
  3: '📄',
  4: '🔗',
};

// Роли
export const ROLES = {
  ADMIN: 'Администратор',
  TEACHER: 'Преподаватель',
  LISTENER: 'Слушатель',
} as const;
