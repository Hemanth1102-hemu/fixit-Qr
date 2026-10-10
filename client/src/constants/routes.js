/**
 * FixIt QR — Centralized Client Route Mappings and Role Destinations
 */

export const ROLE_DESTINATIONS = {
  student: '/student/dashboard',
  faculty: '/faculty/dashboard',
  technician: '/maintenance/dashboard',
  maintenance_admin: '/maintenance-admin/dashboard',
  admin: '/maintenance-admin/dashboard',
  supervisor: '/supervisor/dashboard',
  system_admin: '/supervisor/dashboard'
};

export const ROLE_LABELS = {
  student: 'Student',
  faculty: 'Faculty',
  technician: 'Maintenance Staff',
  maintenance_admin: 'Maintenance Admin',
  admin: 'Maintenance Admin',
  supervisor: 'Supervisor',
  system_admin: 'System Admin'
};

/**
 * Returns default dashboard route for a given trusted role
 */
export function getDashboardForRole(role) {
  return ROLE_DESTINATIONS[role] || '/student/dashboard';
}
