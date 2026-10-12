/**
 * FixIt QR — Canonical Role Definitions and Route Mappings
 */

export const ROLES = {
  STUDENT: 'student',
  FACULTY: 'faculty',
  TECHNICIAN: 'technician',
  MAINTENANCE_STAFF: 'technician',
  MAINTENANCE_ADMIN: 'maintenance_admin',
  ADMIN: 'admin',
  SUPERVISOR: 'supervisor',
  SYSTEM_ADMIN: 'system_admin'
};

export function isAuthorizedRole(role) {
  return Object.values(ROLES).includes(role);
}

export const ROLE_DESTINATIONS = {
  student: '/student/dashboard',
  faculty: '/faculty/dashboard',
  technician: '/maintenance/dashboard',
  maintenance_admin: '/maintenance-admin/dashboard',
  admin: '/maintenance-admin/dashboard',
  supervisor: '/supervisor/dashboard',
  system_admin: '/supervisor/dashboard'
};

export const ROLE_PERMISSIONS = {
  student: [
    'complaints:create',
    'complaints:view_own',
    'complaints:feedback',
    'complaints:reopen',
    'equipment:view_public'
  ],
  faculty: [
    'complaints:create',
    'complaints:view_own',
    'complaints:feedback',
    'complaints:reopen',
    'equipment:view_public',
    'classroom:view_allocation'
  ],
  technician: [
    'jobs:view_assigned',
    'jobs:start',
    'jobs:submit_completion',
    'jobs:view_history',
    'equipment:view_public'
  ],
  maintenance_admin: [
    'complaints:view_all',
    'complaints:assign',
    'complaints:reject',
    'complaints:cancel',
    'equipment:manage',
    'buildings:manage',
    'reports:view',
    'technicians:manage'
  ],
  admin: [
    'complaints:view_all',
    'complaints:assign',
    'complaints:reject',
    'complaints:cancel',
    'equipment:manage',
    'buildings:manage',
    'reports:view',
    'technicians:manage'
  ],
  supervisor: [
    'operations:monitor',
    'escalations:view',
    'completion:review',
    'completion:approve',
    'completion:reject_to_rework',
    'analytics:view_all',
    'audit_logs:view'
  ],
  system_admin: [
    'operations:monitor',
    'escalations:view',
    'completion:review',
    'completion:approve',
    'analytics:view_all',
    'users:manage_roles',
    'audit_logs:view'
  ]
};

/**
 * Resolves default destination URL for a given role
 */
export function getDestinationForRole(role) {
  return ROLE_DESTINATIONS[role] || null;
}

/**
 * Resolves list of granted permissions for a given role
 */
export function getPermissionsForRole(role) {
  return ROLE_PERMISSIONS[role] || [];
}
