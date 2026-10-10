import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { getDestinationForRole, getPermissionsForRole } from '../src/constants/roles.js';

describe('FixIt QR Automatic Role Recognition & Extended Lifecycle Tests', () => {

  describe('1. Authoritative Role-to-Dashboard Mapping', () => {
    it('should map Student to /student/dashboard', () => {
      expect(getDestinationForRole('student')).toBe('/student/dashboard');
    });

    it('should map Faculty to /faculty/dashboard', () => {
      expect(getDestinationForRole('faculty')).toBe('/faculty/dashboard');
    });

    it('should map Maintenance Staff (technician) to /maintenance/dashboard', () => {
      expect(getDestinationForRole('technician')).toBe('/maintenance/dashboard');
    });

    it('should map Maintenance Admin to /maintenance-admin/dashboard', () => {
      expect(getDestinationForRole('maintenance_admin')).toBe('/maintenance-admin/dashboard');
      expect(getDestinationForRole('admin')).toBe('/maintenance-admin/dashboard');
    });

    it('should map Supervisor to /supervisor/dashboard', () => {
      expect(getDestinationForRole('supervisor')).toBe('/supervisor/dashboard');
    });
  });

  describe('2. Role-Based Permissions Resolution', () => {
    it('Student should have complaints:create but NOT technicians:manage', () => {
      const perms = getPermissionsForRole('student');
      expect(perms).toContain('complaints:create');
      expect(perms).not.toContain('technicians:manage');
      expect(perms).not.toContain('completion:approve');
    });

    it('Technician should have jobs:submit_completion but NOT completion:approve', () => {
      const perms = getPermissionsForRole('technician');
      expect(perms).toContain('jobs:submit_completion');
      expect(perms).not.toContain('completion:approve');
    });

    it('Supervisor should have completion:approve and operations:monitor', () => {
      const perms = getPermissionsForRole('supervisor');
      expect(perms).toContain('completion:approve');
      expect(perms).toContain('operations:monitor');
    });

    it('Maintenance Admin should have complaints:assign and equipment:manage', () => {
      const perms = getPermissionsForRole('maintenance_admin');
      expect(perms).toContain('complaints:assign');
      expect(perms).toContain('equipment:manage');
    });
  });

  describe('3. Extended Lifecycle API Endpoints (Auth Guarded)', () => {
    it('POST /api/v1/complaints/:id/completion without auth should return 401', async () => {
      const res = await request(app)
        .post('/api/v1/complaints/dummy-id/completion')
        .send({
          completion_notes: 'Replaced electrical capacitor and tested'
        });
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
    });

    it('POST /api/v1/complaints/:id/supervisor-review without auth should return 401', async () => {
      const res = await request(app)
        .post('/api/v1/complaints/dummy-id/supervisor-review')
        .send({
          decision: 'approve',
          decision_notes: 'Approved work quality'
        });
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
    });

    it('GET /api/v1/supervisor/operations without auth should return 401', async () => {
      const res = await request(app).get('/api/v1/supervisor/operations');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
    });

    it('GET /api/v1/supervisor/reviews without auth should return 401', async () => {
      const res = await request(app).get('/api/v1/supervisor/reviews');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
    });
  });

});
