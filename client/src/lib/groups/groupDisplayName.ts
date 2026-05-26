import type { IGroup } from '@/lib/types';

export function getGroupDisplayName(g: Pick<IGroup, 'name' | 'groupName'>): string {
  const n = g.name?.trim() || g.groupName?.trim();
  return n || '';
}
