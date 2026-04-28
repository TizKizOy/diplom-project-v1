export const Role = {
  ADMIN: 'Администратор',
  TEACHER: 'Преподаватель',
  LISTENER: 'Слушатель',
} as const;

export type RoleType = (typeof Role)[keyof typeof Role];
