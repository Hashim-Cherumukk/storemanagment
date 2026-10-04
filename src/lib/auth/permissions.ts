import { UserRole } from '@/types/database';

export type Permission =
  | 'inventory:view'
  | 'inventory:create'
  | 'inventory:edit'
  | 'inventory:deactivate'
  | 'categories:view'
  | 'categories:manage'
  | 'people:view'
  | 'people:create'
  | 'people:edit'
  | 'people:deactivate'
  | 'settings:view'
  | 'settings:edit'
  | 'users:manage';

const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  ADMIN: [
    'inventory:view',
    'inventory:create',
    'inventory:edit',
    'inventory:deactivate',
    'categories:view',
    'categories:manage',
    'people:view',
    'people:create',
    'people:edit',
    'people:deactivate',
    'settings:view',
    'settings:edit',
    'users:manage',
  ],
  STOREKEEPER: [
    'inventory:view',
    'inventory:create',
    'inventory:edit',
    'inventory:deactivate',
    'categories:view',
    'categories:manage',
    'people:view',
    'people:create',
    'people:edit',
    'people:deactivate',
    'settings:view',
  ],
  STAFF: [
    'inventory:view',
    'categories:view',
    'people:view',
  ],
  STUDENT: [
    'inventory:view',
    'categories:view',
  ],
};

/**
 * Checks if a given role matches or is one of the allowed roles
 */
export function hasRole(currentRole: UserRole | undefined | null, allowedRoles: UserRole | UserRole[]): boolean {
  if (!currentRole) return false;
  if (Array.isArray(allowedRoles)) {
    return allowedRoles.includes(currentRole);
  }
  return currentRole === allowedRoles;
}

/**
 * Checks if a given role has a specific permission
 */
export function hasPermission(currentRole: UserRole | undefined | null, permission: Permission): boolean {
  if (!currentRole) return false;
  const permissions = ROLE_PERMISSIONS[currentRole] || [];
  return permissions.includes(permission);
}

/**
 * Convenience helper to determine if role can modify inventory items
 */
export function canManageInventory(role: UserRole | undefined | null): boolean {
  return hasPermission(role, 'inventory:create');
}

/**
 * Convenience helper to determine if role can manage people records
 */
export function canManagePeople(role: UserRole | undefined | null): boolean {
  return hasPermission(role, 'people:create');
}

/**
 * Convenience helper to determine if role can manage categories
 */
export function canManageCategories(role: UserRole | undefined | null): boolean {
  return hasPermission(role, 'categories:manage');
}

/**
 * Convenience helper to determine if role can update institution settings
 */
export function canManageSettings(role: UserRole | undefined | null): boolean {
  return hasPermission(role, 'settings:edit');
}
