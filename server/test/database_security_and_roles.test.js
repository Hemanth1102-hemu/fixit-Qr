import { describe, it, expect } from 'vitest';
import { 
  ROLES, 
  ROLE_PERMISSIONS, 
  getPermissionsForRole, 
  getDestinationForRole, 
  isAuthorizedRole 
} from '../src/constants/roles.js';
import { isSrmistEmail, SRMIST_DOMAIN } from '../src/middleware/auth.js';

describe('FixIt QR Database Security, Domain Policy & Role-Based Access Tests', () => {

  describe('1. Institutional Identity & Domain Verification', () => {
    it('should strictly accept valid SRMIST student email addresses', () => {
      expect(isSrmistEmail('student123@srmist.edu.in')).toBe(true);
      expect(isSrmistEmail('alex.k@srmist.edu.in')).toBe(true);
    });

    it('should reject non-SRMIST personal email domains', () => {
      expect(isSrmistEmail('attacker@gmail.com')).toBe(false);
      expect(isSrmistEmail('hacker@outlook.com')).toBe(false);
      expect(isSrmistEmail('admin@fake-srmist.edu')).toBe(false);
      expect(isSrmistEmail('user@srmist.edu.in.evil.com')).toBe(false);
    });

    it('should require the institutional SRMIST domain constant', () => {
      expect(SRMIST_DOMAIN).toBe('@srmist.edu.in');
    });
  });

  describe('2. Trusted Role Provisioning & Governance', () => {
    it('should recognize all 7 defined platform roles', () => {
      expect(isAuthorizedRole(ROLES.STUDENT)).toBe(true);
      expect(isAuthorizedRole(ROLES.FACULTY)).toBe(true);
      expect(isAuthorizedRole(ROLES.TECHNICIAN)).toBe(true);
      expect(isAuthorizedRole(ROLES.MAINTENANCE_ADMIN)).toBe(true);
      expect(isAuthorizedRole(ROLES.ADMIN)).toBe(true);
      expect(isAuthorizedRole(ROLES.SUPERVISOR)).toBe(true);
      expect(isAuthorizedRole(ROLES.SYSTEM_ADMIN)).toBe(true);
    });

    it('should reject unknown or forged arbitrary roles', () => {
      expect(isAuthorizedRole('superadmin')).toBe(false);
      expect(isAuthorizedRole('guest')).toBe(false);
      expect(isAuthorizedRole('root')).toBe(false);
    });

    it('should never grant privileged staff capabilities to regular students', () => {
      const studentPerms = getPermissionsForRole(ROLES.STUDENT);
      expect(studentPerms).not.toContain('complaints:assign');
      expect(studentPerms).not.toContain('technicians:manage');
      expect(studentPerms).not.toContain('completion:approve');
      expect(studentPerms).not.toContain('system:audit_logs');
    });

    it('should enforce technician permissions boundary (cannot approve own completion)', () => {
      const techPerms = getPermissionsForRole(ROLES.TECHNICIAN);
      expect(techPerms).toContain('jobs:submit_completion');
      expect(techPerms).not.toContain('completion:approve');
      expect(techPerms).not.toContain('users:manage');
    });

    it('should enforce supervisor review authority', () => {
      const supervisorPerms = getPermissionsForRole(ROLES.SUPERVISOR);
      expect(supervisorPerms).toContain('completion:approve');
      expect(supervisorPerms).toContain('operations:monitor');
      expect(supervisorPerms).toContain('audit_logs:view');
    });

    it('should enforce maintenance admin dispatch & asset management authority', () => {
      const adminPerms = getPermissionsForRole(ROLES.MAINTENANCE_ADMIN);
      expect(adminPerms).toContain('complaints:assign');
      expect(adminPerms).toContain('equipment:manage');
      expect(adminPerms).toContain('buildings:manage');
    });
  });

  describe('3. Automated Role-to-Dashboard Routing Determinism', () => {
    it('should route student automatically to student portal without manual selection', () => {
      expect(getDestinationForRole(ROLES.STUDENT)).toBe('/student/dashboard');
    });

    it('should route faculty automatically to faculty portal', () => {
      expect(getDestinationForRole(ROLES.FACULTY)).toBe('/faculty/dashboard');
    });

    it('should route technician automatically to maintenance queue', () => {
      expect(getDestinationForRole(ROLES.TECHNICIAN)).toBe('/maintenance/dashboard');
    });

    it('should route supervisor automatically to quality audit dashboard', () => {
      expect(getDestinationForRole(ROLES.SUPERVISOR)).toBe('/supervisor/dashboard');
    });

    it('should route maintenance admin automatically to dispatch portal', () => {
      expect(getDestinationForRole(ROLES.MAINTENANCE_ADMIN)).toBe('/maintenance-admin/dashboard');
    });

    it('should route system admin to operations dashboard', () => {
      expect(getDestinationForRole(ROLES.SYSTEM_ADMIN)).toBe('/supervisor/dashboard');
    });
  });

});
