/**
 * Role-Based Access Control (RBAC) system
 * Defines roles and permissions for Todo Trinity
 */

export type UserRole = 'admin' | 'manager' | 'user' | 'viewer'

export interface Permission {
  key: string
  name: string
  description: string
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    { key: 'users:manage', name: 'Manage Users', description: 'Create, update, delete users' },
    { key: 'tasks:all', name: 'All Tasks', description: 'View and manage all tasks' },
    { key: 'workflows:manage', name: 'Manage Workflows', description: 'Create, edit, delete automation workflows' },
    { key: 'integrations:manage', name: 'Manage Integrations', description: 'Configure third-party integrations' },
    { key: 'settings:all', name: 'All Settings', description: 'Access all application settings' },
    { key: 'reports:view', name: 'View Reports', description: 'Access analytics and reports' },
    { key: 'security:manage', name: 'Manage Security', description: 'Configure security settings' },
  ],
  manager: [
    { key: 'tasks:team', name: 'Team Tasks', description: 'View and manage team tasks' },
    { key: 'workflows:manage', name: 'Manage Workflows', description: 'Create, edit workflows' },
    { key: 'integrations:manage', name: 'Manage Integrations', description: 'Configure integrations' },
    { key: 'reports:view', name: 'View Reports', description: 'Access analytics and reports' },
    { key: 'users:view', name: 'View Users', description: 'View team members' },
  ],
  user: [
    { key: 'tasks:own', name: 'Own Tasks', description: 'Create, view, edit own tasks' },
    { key: 'workflows:own', name: 'Own Workflows', description: 'Create, edit personal workflows' },
    { key: 'reports:own', name: 'Own Reports', description: 'Access own analytics' },
    { key: 'settings:own', name: 'Own Settings', description: 'Personal settings only' },
  ],
  viewer: [
    { key: 'tasks:view', name: 'View Tasks', description: 'View tasks only' },
    { key: 'reports:view', name: 'View Reports', description: 'Access analytics only' },
  ],
}

/**
 * Check if a user has a specific permission
 * @param userRole - The user's role
 * @param permissionKey - The permission key to check
 * @returns boolean indicating if the permission is granted
 */
export function hasPermission(userRole: UserRole, permissionKey: string): boolean {
  const permissions = ROLE_PERMISSIONS[userRole] || []
  return permissions.some((perm) => perm.key === permissionKey)
}

/**
 * Get all permissions for a user role
 * @param userRole - The user's role
 * @returns Array of permission objects
 */
export function getPermissions(userRole: UserRole): Permission[] {
  return ROLE_PERMISSIONS[userRole] || []
}

/**
 * Check if a user can perform an action on a resource
 * @param userRole - The user's role
 * @param action - The action being performed
 * @param resource - The resource being accessed
 * @returns boolean indicating if the action is allowed
 */
export function can(
  userRole: UserRole,
  action: 'create' | 'read' | 'update' | 'delete',
  resource: 'task' | 'workflow' | 'integration' | 'setting' | 'user' | 'report'
): boolean {
  const permissionKey = `${action}:${resource}`
  return hasPermission(userRole, permissionKey)
}

export type { UserRole, Permission }