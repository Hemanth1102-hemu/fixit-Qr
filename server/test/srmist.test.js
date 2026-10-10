import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { isSrmistEmail, SRMIST_DOMAIN } from '../src/middleware/auth.js';
import { srmistClassroomAdapter } from '../src/services/srmistClassroomAdapter.js';

describe('SRMIST Identity, QR Validation, and Classroom Integration Tests', () => {

  describe('1. Institutional Email Domain Restrictions', () => {
    it('isSrmistEmail should accept valid SRMIST institutional addresses', () => {
      expect(isSrmistEmail('ra2111003010482@srmist.edu.in')).toBe(true);
      expect(isSrmistEmail('faculty.cse@srmist.edu.in')).toBe(true);
      expect(isSrmistEmail('estate.officer@srmist.edu.in')).toBe(true);
    });

    it('isSrmistEmail should reject non-institutional domains', () => {
      expect(isSrmistEmail('student@gmail.com')).toBe(false);
      expect(isSrmistEmail('attacker@yahoo.com')).toBe(false);
      expect(isSrmistEmail('user@srm.ac.in')).toBe(false);
      expect(isSrmistEmail('user@other-university.edu')).toBe(false);
      expect(isSrmistEmail('')).toBe(false);
      expect(isSrmistEmail(null)).toBe(false);
    });

    it('POST /api/v1/me/register should reject unauthorized email domain with 400', async () => {
      const res = await request(app)
        .post('/api/v1/me/register')
        .send({
          email: 'intruder@gmail.com',
          password: 'Password123!',
          full_name: 'Intruder User',
          requested_role: 'student'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Unauthorized Domain');
      expect(res.body.message).toContain('@srmist.edu.in');
    });

    it('POST /api/v1/me/register should accept valid @srmist.edu.in email', async () => {
      const res = await request(app)
        .post('/api/v1/me/register')
        .send({
          email: 'newstudent@srmist.edu.in',
          password: 'SecurePass123!',
          full_name: 'Kavitha R',
          requested_role: 'student'
        });

      // 201 Created in preview mode
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('newstudent@srmist.edu.in');
      expect(res.body.data.role).toBe('student');
    });

    it('POST /api/v1/me/register should prevent role self-elevation (rejects or clamps privileged roles)', async () => {
      const res = await request(app)
        .post('/api/v1/me/register')
        .send({
          email: 'aspiringadmin@srmist.edu.in',
          password: 'SecurePass123!',
          full_name: 'Privilege Escalation Tester',
          requested_role: 'admin' // Attempting to self-assign admin role
        });

      // Zod validation rejects 'admin' as requested_role
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('2. Browser QR Identifier Validation', () => {
    it('GET /api/v1/equipment/:qrToken should retrieve registered equipment info', async () => {
      const res = await request(app).get('/api/v1/equipment/qr_sec_lh101_fan01_7f8d2a');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('equipment_name');
      expect(res.body.data.qr_token).toBe('qr_sec_lh101_fan01_7f8d2a');
    });
  });

  describe('3. Institutional SRMIST Classroom Integration', () => {
    it('GET /api/v1/classroom/my-allocation without token should return 401 Unauthorized', async () => {
      const res = await request(app).get('/api/v1/classroom/my-allocation');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
    });

    it('srmistClassroomAdapter should return active timetable allocation for verified student', async () => {
      const result = await srmistClassroomAdapter.getUserActiveAllocation('student@srmist.edu.in');
      expect(result.has_active_allocation).toBe(true);
      expect(result.current_room.room_number).toBe('TP-401');
      expect(result.institutional_record.department).toBe('Computer Science & Engineering');
    });

    it('srmistClassroomAdapter should handle users with no active allocation gracefully', async () => {
      const result = await srmistClassroomAdapter.getUserActiveAllocation('unknown_alumni@srmist.edu.in');
      expect(result.has_active_allocation).toBe(false);
      expect(result.allocation).toBeNull();
    });

    it('srmistClassroomAdapter should throw if called without email identity', async () => {
      await expect(srmistClassroomAdapter.getUserActiveAllocation(null)).rejects.toThrow();
    });
  });

});
