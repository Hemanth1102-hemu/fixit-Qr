import { Router } from 'express';
import { z } from 'zod';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

const roleUpdateSchema = z.object({
  role: z.enum(['student', 'faculty', 'technician', 'admin', 'system_admin']),
  is_active: z.boolean().optional()
});

// GET /api/v1/admin/analytics - Real calculated campus maintenance metrics
router.get('/analytics', requireAuth, requireRole('admin', 'system_admin'), async (req, res, next) => {
  try {
    if (!isSupabaseConfigured) {
      return res.json({
        success: true,
        data: {
          metrics: {
            totalComplaints: 12,
            openComplaints: 5,
            pendingAssignments: 3,
            urgentIssues: 1,
            resolvedComplaints: 7,
            avgResolutionTimeHours: 14.5
          },
          statusCounts: {
            pending: 3,
            in_progress: 2,
            resolved: 7,
            reopened: 0
          },
          buildingCounts: [
            { building_name: 'Science & Engineering Complex', count: 6 },
            { building_name: 'Ramanujan Computing Center', count: 4 },
            { building_name: 'Central University Library', count: 2 }
          ],
          repeatFailures: [
            {
              equipment_id: '90000001-0000-4000-8000-000000000001',
              equipment_name: 'Ceiling Fan Front-Left',
              asset_code: 'SEC-LH101-FAN-01',
              complaint_count: 3
            }
          ]
        }
      });
    }

    // 1. Fetch complaints summary
    const { data: complaints, error: compErr } = await req.userClient
      .from('complaints')
      .select('id, status, priority, created_at, resolved_at, equipment_id');

    if (compErr) throw compErr;

    const totalComplaints = complaints.length;
    const pendingCount = complaints.filter(c => c.status === 'pending').length;
    const inProgressCount = complaints.filter(c => c.status === 'in_progress').length;
    const resolvedCount = complaints.filter(c => c.status === 'resolved').length;
    const reopenedCount = complaints.filter(c => c.status === 'reopened').length;
    const urgentCount = complaints.filter(c => c.priority === 'urgent' && c.status !== 'resolved').length;
    const openCount = pendingCount + inProgressCount + reopenedCount;

    // Calculate resolution time (hours) for resolved complaints
    const resolvedWithTimes = complaints.filter(c => c.status === 'resolved' && c.resolved_at);
    let avgResolutionHours = 0;
    if (resolvedWithTimes.length > 0) {
      const totalHours = resolvedWithTimes.reduce((acc, c) => {
        const diffMs = new Date(c.resolved_at).getTime() - new Date(c.created_at).getTime();
        return acc + (diffMs / (1000 * 60 * 60));
      }, 0);
      avgResolutionHours = Number((totalHours / resolvedWithTimes.length).toFixed(1));
    }

    // 2. Repeat failure detection (equipment with > 1 complaint)
    const equipmentMap = {};
    complaints.forEach(c => {
      equipmentMap[c.equipment_id] = (equipmentMap[c.equipment_id] || 0) + 1;
    });

    const repeatEquipmentIds = Object.keys(equipmentMap).filter(id => equipmentMap[id] > 1);
    let repeatFailures = [];
    if (repeatEquipmentIds.length > 0) {
      const { data: repeatEquips } = await req.userClient
        .from('equipment')
        .select('id, equipment_name, asset_code')
        .in('id', repeatEquipmentIds);

      repeatFailures = (repeatEquips || []).map(eq => ({
        ...eq,
        complaint_count: equipmentMap[eq.id]
      }));
    }

    res.json({
      success: true,
      data: {
        metrics: {
          totalComplaints,
          openComplaints: openCount,
          pendingAssignments: pendingCount,
          urgentIssues: urgentCount,
          resolvedComplaints: resolvedCount,
          avgResolutionTimeHours: avgResolutionHours
        },
        statusCounts: {
          pending: pendingCount,
          in_progress: inProgressCount,
          resolved: resolvedCount,
          reopened: reopenedCount
        },
        repeatFailures
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/admin/users - User directory (Admins / System Admins)
router.get('/users', requireAuth, requireRole('admin', 'system_admin'), async (req, res, next) => {
  try {
    if (!isSupabaseConfigured) {
      return res.json({ success: true, data: [] });
    }

    const { role } = req.query;
    let query = req.userClient.from('profiles').select('id, full_name, email, role, is_active, created_at');
    if (role) {
      query = query.eq('role', role);
    }
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/admin/users/:id/role - Update user role & status (System Admin ONLY)
router.patch('/users/:id/role', requireAuth, requireRole('system_admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const validated = roleUpdateSchema.parse(req.body);

    if (!isSupabaseConfigured) {
      return res.json({ success: true, message: 'Role updated (preview mode)' });
    }

    const { data, error } = await req.userClient
      .from('profiles')
      .update(validated)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Record audit log
    await req.userClient.from('audit_logs').insert({
      actor_id: req.user.id,
      action: 'USER_ROLE_UPDATED',
      entity_type: 'profiles',
      entity_id: id,
      metadata: { new_role: validated.role, is_active: validated.is_active }
    });

    res.json({
      success: true,
      message: 'User credentials and role updated successfully',
      data
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/admin/audit-logs - System audit logs (Admins / System Admins)
router.get('/audit-logs', requireAuth, requireRole('admin', 'system_admin'), async (req, res, next) => {
  try {
    if (!isSupabaseConfigured) {
      return res.json({ success: true, data: [] });
    }

    const { data, error } = await req.userClient
      .from('audit_logs')
      .select(`
        id, action, entity_type, entity_id, metadata, created_at,
        actor:actor_id (full_name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (err) {
    next(err);
  }
});

export default router;
