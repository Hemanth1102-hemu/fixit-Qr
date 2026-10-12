import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('FixIt QR — Supervisor Access Control & Endpoints Verification', () => {

  describe('1. Unauthenticated Security Boundary (Strict 401 Rejections)', () => {
    it('GET /api/v1/supervisor/overview should reject unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/v1/supervisor/overview');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Unauthorized');
    });

    it('GET /api/v1/supervisor/complaints should reject unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/v1/supervisor/complaints');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/v1/supervisor/escalations should reject unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/v1/supervisor/escalations');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/v1/supervisor/team-performance should reject unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/v1/supervisor/team-performance');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/v1/supervisor/completion-reviews should reject unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/v1/supervisor/completion-reviews');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/v1/supervisor/completion-reviews/dummy-id/decision should reject unauthenticated requests with 401', async () => {
      const res = await request(app)
        .post('/api/v1/supervisor/completion-reviews/dummy-id/decision')
        .send({ decision: 'approve' });
      expect(res.status).toBe(401);
    });

    it('GET /api/v1/supervisor/analytics should reject unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/v1/supervisor/analytics');
      expect(res.status).toBe(401);
    });

    it('GET /api/v1/supervisor/equipment-health should reject unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/v1/supervisor/equipment-health');
      expect(res.status).toBe(401);
    });

    it('GET /api/v1/supervisor/locations should reject unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/v1/supervisor/locations');
      expect(res.status).toBe(401);
    });

    it('GET /api/v1/supervisor/audit-logs should reject unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/v1/supervisor/audit-logs');
      expect(res.status).toBe(401);
    });

    it('GET /api/v1/supervisor/policies should reject unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/v1/supervisor/policies');
      expect(res.status).toBe(401);
    });

    it('PUT /api/v1/supervisor/policies should reject unauthenticated requests with 401', async () => {
      const res = await request(app)
        .put('/api/v1/supervisor/policies')
        .send({ response_target_hours: 4.0 });
      expect(res.status).toBe(401);
    });
  });

  describe('2. Legacy Route Aliases', () => {
    it('GET /api/v1/supervisor/operations alias should reject unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/v1/supervisor/operations');
      expect(res.status).toBe(401);
    });

    it('GET /api/v1/supervisor/reviews alias should reject unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/v1/supervisor/reviews');
      expect(res.status).toBe(401);
    });
  });

});
