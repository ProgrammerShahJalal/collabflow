import type { UserDto } from '@collabflow/shared';

export function canManageProjects(user?: UserDto | null): boolean {
  return user?.role === 'admin' || user?.role === 'project_manager';
}

export function canDeleteProjects(user?: UserDto | null): boolean {
  return user?.role === 'admin';
}

export function canManageTasks(user?: UserDto | null): boolean {
  return user?.role === 'admin' || user?.role === 'project_manager';
}
