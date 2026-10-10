import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('FixIt QR Backend API Smoke & Integration Tests', () => {
  it('GET /api/v1/health should respond with 200 and health payload', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.system).toBe('FixIt QR API');
  });

  it('GET /api/v1/equipment/:qrToken should return equipment data for landing page', async () => {
    const res = await request(app).get('/api/v1/equipment/qr_sec_lh101_fan01_7f8d2a');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('equipment_name');
  });

  it('GET /api/v1/nonexistent should return 404', async () => {
    const res = await request(app).get('/api/v1/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/complaints without auth token should return 401', async () => {
    const res = await request(app)
      .post('/api/v1/complaints')
      .send({
        equipment_id: '90000001-0000-4000-8000-000000000001',
        title: 'Fan making clicking sound'
      });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });
});
