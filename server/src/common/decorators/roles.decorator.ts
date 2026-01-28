import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
// Теперь принимаем имена ролей как строки
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
