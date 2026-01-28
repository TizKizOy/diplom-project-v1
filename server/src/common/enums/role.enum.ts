export const Role = {
  ADMIN: 'Администратор',
  TEACHER: 'Преподаватель',
  STUDENT: 'Слушатель',
} as const;

export type RoleType = (typeof Role)[keyof typeof Role];
