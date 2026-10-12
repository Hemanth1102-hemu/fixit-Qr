import { Router } from 'express';
import { z } from 'zod';
import { supabase, isSupabaseConfigured, supabaseAdmin } from '../lib/supabase.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// Validation Schemas
const reviewDecisionSchema = z.object({
  decision: z.enum(['approve', 'return_for_rework']),
  notes: z.string().optional(),
  reason: z.string().optional()
}).refine(data => {
  if (data.decision === 'return_for_rework' && (!data.reason || !data.reason.trim())) {
    return false;
  }
  return true;
}, {
  message: 'A detailed reason is mandatory when returning a repair for rework.',
  path: ['reason']
});

const escalationActionSchema = z.object({
  actionType: z.enum(['add_note', 'adjust_deadline', 'request_admin_action', 'request_reassignment']),
  notes: z.string().optional(),
  newDeadline: z.string().datetime().optional(),
  reason: z.string().min(5, 'A clear documented reason is required for escalation actions')
});

const policyUpdateSchema = z.object({
  response_target_hours: z.number().positive(),
  resolution_target_hours_low: z.number().positive(),
  resolution_target_hours_medium: z.number().positive(),
  resolution_target_hours_high: z.number().positive(),
  resolution_target_hours_urgent: z.number().positive(),
  escalation_threshold_hours: z.number().positive(),
  require_completion_review: z.boolean(),
  auto_escalate_overdue: z.boolean(),
  notification_rules: z.record(z.any()).optional()
});

// Helper to log audit events
async function logAuditEvent(client, { actorId, action, entityType, entityId, metadata }) {
  try {
    const db = client || supabaseAdmin;
    if (db) {
      await db.from('audit_logs').insert({
        actor_id: actorId,
        action,
        entity_type: entityType,
        entity_id: String(entityId),
        metadata: metadata || {}
      });
    }
  } catch (err) {
    console.error('[AUDIT_LOG_ERROR]', err);
  }
}

// -----------------------------------------------------------------------------
// 1. OVERVIEW & OPERATIONS DASHBOARD
// GET /api/v1/supervisor/overview (and /operations alias)
// -----------------------------------------------------------------------------
const getOverviewHandler = async (req, res, next) => {
  try {
    if (!isSupabaseConfigured) {
      return res.json({
        success: true,
        data: {
          metrics: {
            totalComplaints: 0,
            newComplaints: 0,
            unassignedComplaints: 0,
            assignedComplaints: 0,
            inProgressComplaints: 0,
            completionPending: 0,
            resolvedComplaints: 0,
            reopenedComplaints: 0,
            urgentComplaints: 0,
            overdueComplaints: 0,
            avgResolutionHours: 0,
            resolutionRate: 0,
            reopenedRate: 0
          },
          priorityDistribution: {},
          statusDistribution: {},
          monthlyTrends: [],
          recentCriticalIncidents: [],
          recentSupervisorActions: [],
          technicianWorkloadSummary: []
        }
      });
    }

    // 1. Fetch complaints with room, building, equipment
    const { data: complaints, error: compErr } = await req.userClient
      .from('complaints')
      .select(`
        id, complaint_number, title, description, category, priority, status,
        photo_url, created_at, resolved_at, target_completion_at, escalated_at,
        equipment:equipment_id(
          id, equipment_name, asset_code,
          rooms:room_id(
            id, room_number,
            buildings:building_id(id, building_name)
          )
        ),
        reporter:reported_by(id, full_name, email),
        complaint_assignments(
          id, is_current, assigned_at,
          technician:technician_id(id, full_name, email)
        )
      `)
      .order('created_at', { ascending: false });

    if (compErr) throw compErr;

    const all = complaints || [];
    const now = new Date();

    const totalComplaints = all.length;
    const newComplaints = all.filter(c => ['submitted', 'pending'].includes(c.status)).length;
    
    const unassignedComplaints = all.filter(c => {
      const isUnresolved = !['resolved', 'rejected', 'cancelled'].includes(c.status);
      const hasActiveAssignment = c.complaint_assignments && c.complaint_assignments.some(a => a.is_current);
      return isUnresolved && !hasActiveAssignment;
    }).length;

    const assignedComplaints = all.filter(c => c.status === 'assigned').length;
    const inProgressComplaints = all.filter(c => c.status === 'in_progress').length;
    const completionPending = all.filter(c => c.status === 'completion_submitted').length;
    const resolvedComplaints = all.filter(c => c.status === 'resolved').length;
    const reopenedComplaints = all.filter(c => c.status === 'reopened').length;
    const urgentComplaints = all.filter(c => c.priority === 'urgent' && !['resolved', 'rejected', 'cancelled'].includes(c.status)).length;

    const overdueComplaints = all.filter(c => {
      if (['resolved', 'rejected', 'cancelled'].includes(c.status)) return false;
      if (!c.target_completion_at) return false;
      return new Date(c.target_completion_at) < now;
    }).length;

    // Calculate resolution hours
    const resolvedItems = all.filter(c => c.status === 'resolved' && c.resolved_at);
    let avgResolutionHours = 0;
    if (resolvedItems.length > 0) {
      const totalHours = resolvedItems.reduce((acc, c) => {
        const diff = (new Date(c.resolved_at) - new Date(c.created_at)) / (1000 * 60 * 60);
        return acc + Math.max(0, diff);
      }, 0);
      avgResolutionHours = Number((totalHours / resolvedItems.length).toFixed(1));
    }

    const resolutionRate = totalComplaints > 0 
      ? Number(((resolvedComplaints / totalComplaints) * 100).toFixed(1)) 
      : 0;

    const reopenedRate = totalComplaints > 0 
      ? Number(((reopenedComplaints / totalComplaints) * 100).toFixed(1)) 
      : 0;

    // Distributions
    const priorityDistribution = {
      urgent: all.filter(c => c.priority === 'urgent').length,
      high: all.filter(c => c.priority === 'high').length,
      medium: all.filter(c => c.priority === 'medium').length,
      low: all.filter(c => c.priority === 'low').length
    };

    const statusDistribution = {
      pending: newComplaints,
      assigned: assignedComplaints,
      in_progress: inProgressComplaints,
      completion_submitted: completionPending,
      resolved: resolvedComplaints,
      reopened: reopenedComplaints
    };

    // Monthly trends (last 6 months)
    const monthMap = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleString('default', { month: 'short', year: 'numeric' });
      monthMap[key] = { month: key, total: 0, resolved: 0 };
    }

    all.forEach(c => {
      const cDate = new Date(c.created_at);
      const key = cDate.toLocaleString('default', { month: 'short', year: 'numeric' });
      if (monthMap[key]) {
        monthMap[key].total += 1;
        if (c.status === 'resolved') {
          monthMap[key].resolved += 1;
        }
      }
    });
    const monthlyTrends = Object.values(monthMap);

    // Recent Critical Incidents
    const recentCriticalIncidents = all
      .filter(c => c.priority === 'urgent' || c.status === 'reopened' || (c.target_completion_at && new Date(c.target_completion_at) < now))
      .slice(0, 6);

    // Recent Supervisor Actions (from audit_logs)
    const { data: recentActions } = await req.userClient
      .from('audit_logs')
      .select('id, action, entity_type, entity_id, metadata, created_at, actor:actor_id(full_name, email)')
      .in('action', ['SUPERVISOR_APPROVAL', 'SUPERVISOR_RETURNED_FOR_REWORK', 'ESCALATION_DEADLINE_ADJUSTED', 'POLICY_UPDATED', 'COMPLAINT_ESCALATED'])
      .order('created_at', { ascending: false })
      .limit(8);

    // Technician Workload Summary
    const techMap = {};
    all.forEach(c => {
      const activeAssign = c.complaint_assignments?.find(a => a.is_current);
      if (activeAssign && activeAssign.technician) {
        const tId = activeAssign.technician.id;
        if (!techMap[tId]) {
          techMap[tId] = {
            id: tId,
            name: activeAssign.technician.full_name || activeAssign.technician.email,
            email: activeAssign.technician.email,
            activeJobs: 0,
            completedJobs: 0
          };
        }
        if (['assigned', 'in_progress'].includes(c.status)) {
          techMap[tId].activeJobs += 1;
        } else if (c.status === 'resolved') {
          techMap[tId].completedJobs += 1;
        }
      }
    });

    res.json({
      success: true,
      data: {
        metrics: {
          totalComplaints,
          newComplaints,
          unassignedComplaints,
          assignedComplaints,
          inProgressComplaints,
          completionPending,
          resolvedComplaints,
          reopenedComplaints,
          urgentComplaints,
          overdueComplaints,
          avgResolutionHours,
          resolutionRate,
          reopenedRate
        },
        priorityDistribution,
        statusDistribution,
        monthlyTrends,
        recentCriticalIncidents,
        recentSupervisorActions: recentActions || [],
        technicianWorkloadSummary: Object.values(techMap)
      }
    });
  } catch (err) {
    next(err);
  }
};

router.get('/overview', requireAuth, requireRole('supervisor', 'system_admin'), getOverviewHandler);
router.get('/operations', requireAuth, requireRole('supervisor', 'system_admin', 'maintenance_admin'), getOverviewHandler);

// -----------------------------------------------------------------------------
// 2. ALL MAINTENANCE COMPLAINTS (CAMPUS-WIDE)
// GET /api/v1/supervisor/complaints
// -----------------------------------------------------------------------------
router.get('/complaints', requireAuth, requireRole('supervisor', 'system_admin'), async (req, res, next) => {
  try {
    if (!isSupabaseConfigured) {
      return res.json({ success: true, data: [], pagination: { total: 0, page: 1, limit: 25, totalPages: 0 } });
    }

    const { 
      search = '', 
      status, 
      priority, 
      technicianId, 
      buildingId, 
      startDate, 
      endDate, 
      sortBy = 'created_at', 
      sortOrder = 'desc',
      page = '1',
      limit = '25'
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));
    const offset = (pageNum - 1) * limitNum;

    let query = req.userClient
      .from('complaints')
      .select(`
        id, complaint_number, title, description, category, priority, status,
        photo_url, completion_photo_url, resolution_notes, created_at, updated_at,
        resolved_at, target_completion_at, escalation_reason, escalation_notes,
        equipment:equipment_id(
          id, equipment_name, asset_code, equipment_type,
          rooms:room_id(
            id, room_number, floor_number,
            buildings:building_id(id, building_name, building_code)
          )
        ),
        reporter:reported_by(id, full_name, email),
        complaint_assignments(
          id, is_current, assigned_at,
          technician:technician_id(id, full_name, email)
        )
      `, { count: 'exact' });

    // Status filter
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Priority filter
    if (priority && priority !== 'all') {
      query = query.eq('priority', priority);
    }

    // Date range filter
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    // Search
    if (search && search.trim()) {
      const term = search.trim();
      query = query.or(`complaint_number.ilike.%${term}%,title.ilike.%${term}%,description.ilike.%${term}%`);
    }

    // Sorting
    const ascending = sortOrder === 'asc';
    query = query.order(sortBy, { ascending });

    // Pagination
    query = query.range(offset, offset + limitNum - 1);

    const { data, count, error } = await query;
    if (error) throw error;

    let filtered = data || [];

    // Filter in-memory for relational fields if needed (e.g. building or technician)
    if (buildingId && buildingId !== 'all') {
      filtered = filtered.filter(c => c.equipment?.rooms?.buildings?.id === buildingId);
    }

    if (technicianId && technicianId !== 'all') {
      filtered = filtered.filter(c => {
        const currentAssign = c.complaint_assignments?.find(a => a.is_current);
        return currentAssign?.technician?.id === technicianId;
      });
    }

    const total = count || filtered.length;

    res.json({
      success: true,
      data: filtered,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1
      }
    });
  } catch (err) {
    next(err);
  }
});

// -----------------------------------------------------------------------------
// 3. URGENT AND ESCALATED COMPLAINTS
// GET /api/v1/supervisor/escalations
// POST /api/v1/supervisor/escalations/:id/action
// -----------------------------------------------------------------------------
router.get('/escalations', requireAuth, requireRole('supervisor', 'system_admin'), async (req, res, next) => {
  try {
    if (!isSupabaseConfigured) {
      return res.json({ success: true, data: [] });
    }

    // Escalations include:
    // 1. Urgent priority tickets that are not resolved
    // 2. Overdue tickets (target_completion_at < now)
    // 3. Repeatedly reopened tickets
    // 4. Explicitly escalated tickets (escalated_at IS NOT NULL)
    const { data: complaints, error } = await req.userClient
      .from('complaints')
      .select(`
        id, complaint_number, title, description, category, priority, status,
        created_at, updated_at, target_completion_at, escalated_at, escalation_reason, escalation_notes,
        equipment:equipment_id(
          id, equipment_name, asset_code,
          rooms:room_id(
            id, room_number,
            buildings:building_id(id, building_name)
          )
        ),
        reporter:reported_by(id, full_name, email),
        complaint_assignments(
          id, is_current, assigned_at,
          technician:technician_id(id, full_name, email)
        )
      `)
      .not('status', 'in', '("resolved","rejected","cancelled")')
      .order('created_at', { ascending: true });

    if (error) throw error;

    const now = new Date();
    const escalations = (complaints || []).filter(c => {
      const isUrgent = c.priority === 'urgent';
      const isReopened = c.status === 'reopened';
      const isOverdue = c.target_completion_at && new Date(c.target_completion_at) < now;
      const isExplicitlyEscalated = Boolean(c.escalated_at);

      // SLA response target breach (unassigned > 6 hours)
      const hasAssignment = c.complaint_assignments && c.complaint_assignments.some(a => a.is_current);
      const hoursSinceCreation = (now - new Date(c.created_at)) / (1000 * 60 * 60);
      const isUnassignedLong = !hasAssignment && hoursSinceCreation > 6;

      return isUrgent || isReopened || isOverdue || isExplicitlyEscalated || isUnassignedLong;
    });

    res.json({
      success: true,
      data: escalations
    });
  } catch (err) {
    next(err);
  }
});

router.post('/escalations/:id/action', requireAuth, requireRole('supervisor', 'system_admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const validated = escalationActionSchema.parse(req.body);

    if (!isSupabaseConfigured) {
      return res.status(503).json({ success: false, message: 'Database not configured' });
    }

    const { data: complaint, error: compErr } = await req.userClient
      .from('complaints')
      .select('id, complaint_number, status, target_completion_at, escalation_notes')
      .eq('id', id)
      .single();

    if (compErr || !complaint) {
      return res.status(404).json({ success: false, message: 'Complaint ticket not found' });
    }

    const updatePayload = {
      escalated_at: new Date().toISOString(),
      escalated_by: req.user.id,
      updated_at: new Date().toISOString()
    };

    const actionDescription = `Supervisor Action [${validated.actionType.toUpperCase()}]: ${validated.reason}`;
    const timestampHeader = `\n[${new Date().toISOString()} - ${req.profile.full_name || 'Supervisor'}]: `;
    updatePayload.escalation_notes = (complaint.escalation_notes || '') + timestampHeader + actionDescription + (validated.notes ? `\nNotes: ${validated.notes}` : '');

    if (validated.actionType === 'adjust_deadline' && validated.newDeadline) {
      updatePayload.target_completion_at = validated.newDeadline;
    }

    const { data: updated, error: updateErr } = await req.userClient
      .from('complaints')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    // Record immutable audit event
    await logAuditEvent(req.userClient, {
      actorId: req.user.id,
      action: 'ESCALATION_DECISION_RECORDED',
      entityType: 'complaints',
      entityId: id,
      metadata: {
        complaint_number: complaint.complaint_number,
        actionType: validated.actionType,
        reason: validated.reason,
        newDeadline: validated.newDeadline || null
      }
    });

    res.json({
      success: true,
      message: 'Escalation decision and audit note recorded successfully',
      data: updated
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Validation Error', message: err.errors[0]?.message });
    }
    next(err);
  }
});

// -----------------------------------------------------------------------------
// 4. TECHNICIAN PERFORMANCE AND WORKLOAD
// GET /api/v1/supervisor/team-performance
// -----------------------------------------------------------------------------
router.get('/team-performance', requireAuth, requireRole('supervisor', 'system_admin'), async (req, res, next) => {
  try {
    if (!isSupabaseConfigured) {
      return res.json({ success: true, data: [] });
    }

    // 1. Get all technician profiles
    const { data: technicians, error: techErr } = await req.userClient
      .from('profiles')
      .select('id, full_name, email, is_active, created_at')
      .eq('role', 'technician');

    if (techErr) throw techErr;

    if (!technicians || technicians.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // 2. Fetch complaint assignments with complaint details
    const { data: assignments, error: assignErr } = await req.userClient
      .from('complaint_assignments')
      .select(`
        id, technician_id, is_current, assigned_at,
        complaint:complaint_id(
          id, status, priority, created_at, resolved_at, target_completion_at
        )
      `);

    if (assignErr) throw assignErr;

    const now = new Date();
    const performance = technicians.map(tech => {
      const techAssignments = (assignments || []).filter(a => a.technician_id === tech.id);
      
      let activeJobs = 0;
      let pendingAssignments = 0;
      let inProgressJobs = 0;
      let completedJobs = 0;
      let overdueJobs = 0;
      let reopenedJobs = 0;
      const resolutionDurations = [];

      techAssignments.forEach(a => {
        const c = a.complaint;
        if (!c) return;

        if (a.is_current && ['assigned'].includes(c.status)) {
          pendingAssignments += 1;
          activeJobs += 1;
        } else if (a.is_current && ['in_progress', 'completion_submitted'].includes(c.status)) {
          inProgressJobs += 1;
          activeJobs += 1;
        }

        if (c.status === 'resolved') {
          completedJobs += 1;
          if (c.resolved_at && c.created_at) {
            const diffHours = (new Date(c.resolved_at) - new Date(c.created_at)) / (1000 * 60 * 60);
            if (diffHours >= 0) resolutionDurations.push(diffHours);
          }
        }

        if (c.status === 'reopened') {
          reopenedJobs += 1;
        }

        if (a.is_current && !['resolved', 'rejected', 'cancelled'].includes(c.status) && c.target_completion_at && new Date(c.target_completion_at) < now) {
          overdueJobs += 1;
        }
      });

      const avgResolutionHours = resolutionDurations.length > 0
        ? Number((resolutionDurations.reduce((a, b) => a + b, 0) / resolutionDurations.length).toFixed(1))
        : 0;

      return {
        id: tech.id,
        fullName: tech.full_name || tech.email,
        email: tech.email,
        isActive: tech.is_active,
        activeJobs,
        pendingAssignments,
        inProgressJobs,
        completedJobs,
        overdueJobs,
        reopenedJobs,
        avgResolutionHours,
        totalAssigned: techAssignments.length
      };
    });

    res.json({
      success: true,
      data: performance
    });
  } catch (err) {
    next(err);
  }
});

// -----------------------------------------------------------------------------
// 5. COMPLETION REVIEW AND APPROVALS
// GET /api/v1/supervisor/completion-reviews (and /reviews alias)
// POST /api/v1/supervisor/completion-reviews/:id/decision
// -----------------------------------------------------------------------------
const getCompletionReviewsHandler = async (req, res, next) => {
  try {
    if (!isSupabaseConfigured) {
      return res.json({ success: true, data: [] });
    }

    const { data, error } = await req.userClient
      .from('complaints')
      .select(`
        id, complaint_number, title, description, category, priority, status,
        photo_url, completion_photo_url, completion_notes, completion_evidence_url,
        resolution_notes, created_at, updated_at,
        equipment:equipment_id(
          id, equipment_name, asset_code, equipment_type,
          rooms:room_id(
            id, room_number, floor_number,
            buildings:building_id(id, building_name)
          )
        ),
        reporter:reported_by(id, full_name, email),
        complaint_assignments(
          id, is_current, assigned_at,
          technician:technician_id(id, full_name, email)
        ),
        repair_records(
          id, repair_summary, parts_replaced, labor_hours, repair_cost,
          repair_photo_url, verified_by_supervisor, completed_at
        )
      `)
      .eq('status', 'completion_submitted')
      .order('updated_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });
  } catch (err) {
    next(err);
  }
};

router.get('/completion-reviews', requireAuth, requireRole('supervisor', 'system_admin'), getCompletionReviewsHandler);
router.get('/reviews', requireAuth, requireRole('supervisor', 'system_admin', 'maintenance_admin'), getCompletionReviewsHandler);

router.post('/completion-reviews/:id/decision', requireAuth, requireRole('supervisor', 'system_admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const validated = reviewDecisionSchema.parse(req.body);

    if (!isSupabaseConfigured) {
      return res.status(503).json({ success: false, message: 'Database not configured' });
    }

    // 1. Fetch and validate current complaint status on the server
    const { data: complaint, error: fetchErr } = await req.userClient
      .from('complaints')
      .select('id, complaint_number, status, reported_by')
      .eq('id', id)
      .single();

    if (fetchErr || !complaint) {
      return res.status(404).json({ success: false, message: 'Complaint ticket not found' });
    }

    if (complaint.status !== 'completion_submitted') {
      return res.status(400).json({
        success: false,
        error: 'InvalidStatusTransition',
        message: `Cannot execute review decision. Complaint status is currently '${complaint.status}', expected 'completion_submitted'.`
      });
    }

    const now = new Date().toISOString();

    if (validated.decision === 'approve') {
      // Transition to resolved
      const { data: updated, error: updateErr } = await req.userClient
        .from('complaints')
        .update({
          status: 'resolved',
          resolved_at: now,
          supervisor_id: req.user.id,
          supervisor_decision_note: validated.notes || 'Approved completion verification',
          supervisor_reviewed_at: now,
          updated_at: now
        })
        .eq('id', id)
        .select()
        .single();

      if (updateErr) throw updateErr;

      // Update repair_records verification status if exists
      await req.userClient
        .from('repair_records')
        .update({
          verified_by_supervisor: true,
          supervisor_id: req.user.id,
          supervisor_verification_notes: validated.notes || 'Approved by supervisor'
        })
        .eq('complaint_id', id);

      // Audit Log
      await logAuditEvent(req.userClient, {
        actorId: req.user.id,
        action: 'SUPERVISOR_APPROVAL',
        entityType: 'complaints',
        entityId: id,
        metadata: {
          complaint_number: complaint.complaint_number,
          decision: 'approved',
          notes: validated.notes
        }
      });

      // Notify reporter
      await req.userClient.from('notifications').insert({
        recipient_id: complaint.reported_by,
        complaint_id: id,
        title: 'Repair Completed & Verified',
        message: `Your complaint #${complaint.complaint_number} has been verified and resolved by campus supervision.`
      });

      return res.json({
        success: true,
        message: `Complaint #${complaint.complaint_number} completion successfully approved and marked as resolved.`,
        data: updated
      });
    } else {
      // Return for rework -> back to in_progress
      const { data: updated, error: updateErr } = await req.userClient
        .from('complaints')
        .update({
          status: 'in_progress',
          rejection_reason: validated.reason,
          supervisor_id: req.user.id,
          supervisor_decision_note: `Returned for rework: ${validated.reason}`,
          supervisor_reviewed_at: now,
          updated_at: now
        })
        .eq('id', id)
        .select()
        .single();

      if (updateErr) throw updateErr;

      // Audit Log
      await logAuditEvent(req.userClient, {
        actorId: req.user.id,
        action: 'SUPERVISOR_RETURNED_FOR_REWORK',
        entityType: 'complaints',
        entityId: id,
        metadata: {
          complaint_number: complaint.complaint_number,
          decision: 'returned_for_rework',
          reason: validated.reason
        }
      });

      return res.json({
        success: true,
        message: `Complaint #${complaint.complaint_number} returned to technician for further rework.`,
        data: updated
      });
    }
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Validation Error', message: err.errors[0]?.message });
    }
    next(err);
  }
});

// Also keep legacy route alias
router.post('/:id/decision', requireAuth, requireRole('supervisor', 'system_admin'), async (req, res, next) => {
  req.url = `/completion-reviews/${req.params.id}/decision`;
  return router.handle(req, res, next);
});

// -----------------------------------------------------------------------------
// 6. MAINTENANCE ANALYTICS AND REPORTS
// GET /api/v1/supervisor/analytics
// -----------------------------------------------------------------------------
router.get('/analytics', requireAuth, requireRole('supervisor', 'system_admin'), async (req, res, next) => {
  try {
    if (!isSupabaseConfigured) {
      return res.json({
        success: true,
        data: {
          monthlyTrends: [],
          buildingBreakdown: [],
          categoryBreakdown: [],
          reliabilityHighlights: [],
          kpiSummary: {
            totalComplaints: 0,
            resolutionRate: 0,
            avgRepairHours: 0,
            overdueRate: 0,
            reopenedRate: 0
          }
        }
      });
    }

    const { data: complaints, error } = await req.userClient
      .from('complaints')
      .select(`
        id, complaint_number, title, category, priority, status, created_at, resolved_at, target_completion_at,
        equipment:equipment_id(
          id, equipment_name, asset_code,
          rooms:room_id(
            id, room_number,
            buildings:building_id(id, building_name)
          )
        )
      `);

    if (error) throw error;

    const all = complaints || [];
    const now = new Date();

    const total = all.length;
    const resolved = all.filter(c => c.status === 'resolved');
    const reopened = all.filter(c => c.status === 'reopened');
    const overdue = all.filter(c => c.target_completion_at && new Date(c.target_completion_at) < now && !['resolved', 'rejected'].includes(c.status));

    // Category breakdown
    const categoryMap = {};
    all.forEach(c => {
      const cat = c.category || 'General';
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });

    const categoryBreakdown = Object.entries(categoryMap).map(([category, count]) => ({
      category,
      count,
      percentage: total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0
    }));

    // Building breakdown
    const buildingMap = {};
    all.forEach(c => {
      const bName = c.equipment?.rooms?.buildings?.building_name || 'Unassigned Building';
      if (!buildingMap[bName]) {
        buildingMap[bName] = { building: bName, total: 0, open: 0, resolved: 0 };
      }
      buildingMap[bName].total += 1;
      if (c.status === 'resolved') {
        buildingMap[bName].resolved += 1;
      } else {
        buildingMap[bName].open += 1;
      }
    });

    const buildingBreakdown = Object.values(buildingMap);

    // Average resolution time
    let avgRepairHours = 0;
    if (resolved.length > 0) {
      const sumHours = resolved.reduce((acc, c) => {
        if (!c.resolved_at || !c.created_at) return acc;
        return acc + Math.max(0, (new Date(c.resolved_at) - new Date(c.created_at)) / (1000 * 60 * 60));
      }, 0);
      avgRepairHours = Number((sumHours / resolved.length).toFixed(1));
    }

    res.json({
      success: true,
      data: {
        categoryBreakdown,
        buildingBreakdown,
        kpiSummary: {
          totalComplaints: total,
          resolutionRate: total > 0 ? Number(((resolved.length / total) * 100).toFixed(1)) : 0,
          avgRepairHours,
          overdueRate: total > 0 ? Number(((overdue.length / total) * 100).toFixed(1)) : 0,
          reopenedRate: total > 0 ? Number(((reopened.length / total) * 100).toFixed(1)) : 0
        }
      }
    });
  } catch (err) {
    next(err);
  }
});

// -----------------------------------------------------------------------------
// 7. EQUIPMENT RELIABILITY AND REPEAT FAILURES
// GET /api/v1/supervisor/equipment-health
// -----------------------------------------------------------------------------
router.get('/equipment-health', requireAuth, requireRole('supervisor', 'system_admin'), async (req, res, next) => {
  try {
    if (!isSupabaseConfigured) {
      return res.json({ success: true, data: [] });
    }

    // Fetch equipment inventory with location and complaints
    const { data: equipmentList, error: eqErr } = await req.userClient
      .from('equipment')
      .select(`
        id, equipment_name, asset_code, equipment_type, is_active, installed_at,
        rooms:room_id(
          id, room_number, floor_number,
          buildings:building_id(id, building_name)
        ),
        complaints(
          id, complaint_number, priority, status, created_at, resolved_at
        )
      `);

    if (eqErr) throw eqErr;

    const healthReport = (equipmentList || []).map(eq => {
      const allComplaints = eq.complaints || [];
      const totalComplaints = allComplaints.length;
      const openComplaints = allComplaints.filter(c => !['resolved', 'rejected', 'cancelled'].includes(c.status)).length;
      
      // Calculate repeat complaints in last 60 days
      const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
      const recentComplaints = allComplaints.filter(c => new Date(c.created_at) >= sixtyDaysAgo);

      // Latest repair/resolution date
      const sortedResolved = allComplaints
        .filter(c => c.resolved_at)
        .sort((a, b) => new Date(b.resolved_at) - new Date(a.resolved_at));
      const lastRepairDate = sortedResolved[0]?.resolved_at || null;

      // MTTF (Mean Time To Failure) indicator: days between consecutive complaints
      let mttfDays = null;
      if (allComplaints.length > 1) {
        const sortedCreated = [...allComplaints].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        let totalSpanDays = 0;
        for (let i = 1; i < sortedCreated.length; i++) {
          const diffDays = (new Date(sortedCreated[i].created_at) - new Date(sortedCreated[i - 1].created_at)) / (1000 * 60 * 60 * 24);
          totalSpanDays += diffDays;
        }
        mttfDays = Number((totalSpanDays / (sortedCreated.length - 1)).toFixed(1));
      }

      return {
        id: eq.id,
        equipmentName: eq.equipment_name,
        assetCode: eq.asset_code,
        equipmentType: eq.equipment_type,
        isActive: eq.is_active,
        roomNumber: eq.rooms?.room_number || 'N/A',
        buildingName: eq.rooms?.buildings?.building_name || 'N/A',
        totalComplaints,
        openComplaints,
        recentFailures60d: recentComplaints.length,
        lastRepairDate,
        mttfDays,
        reliabilityStatus: openComplaints > 0 ? 'maintenance_required' : (recentComplaints.length >= 2 ? 'at_risk' : 'healthy')
      };
    });

    // Sort by highest complaint count
    healthReport.sort((a, b) => b.totalComplaints - a.totalComplaints);

    res.json({
      success: true,
      data: healthReport
    });
  } catch (err) {
    next(err);
  }
});

// -----------------------------------------------------------------------------
// 8. BUILDINGS AND CLASSROOM MONITORING
// GET /api/v1/supervisor/locations
// -----------------------------------------------------------------------------
router.get('/locations', requireAuth, requireRole('supervisor', 'system_admin'), async (req, res, next) => {
  try {
    if (!isSupabaseConfigured) {
      return res.json({ success: true, data: [] });
    }

    const { data: buildings, error } = await req.userClient
      .from('buildings')
      .select(`
        id, building_name, building_code, description, is_active,
        rooms(
          id, room_number, floor_number, is_active,
          equipment(
            id, equipment_name, asset_code, is_active,
            complaints(id, priority, status, created_at)
          )
        )
      `)
      .order('building_name');

    if (error) throw error;

    const campusLocations = (buildings || []).map(b => {
      let totalRooms = 0;
      let totalEquipment = 0;
      let openComplaints = 0;
      let urgentComplaints = 0;

      const roomSummaries = (b.rooms || []).map(r => {
        totalRooms += 1;
        const eqList = r.equipment || [];
        totalEquipment += eqList.length;

        let roomOpen = 0;
        let roomUrgent = 0;

        eqList.forEach(eq => {
          (eq.complaints || []).forEach(c => {
            if (!['resolved', 'rejected', 'cancelled'].includes(c.status)) {
              openComplaints += 1;
              roomOpen += 1;
              if (c.priority === 'urgent') {
                urgentComplaints += 1;
                roomUrgent += 1;
              }
            }
          });
        });

        return {
          id: r.id,
          roomNumber: r.room_number,
          floorNumber: r.floor_number,
          equipmentCount: eqList.length,
          openComplaints: roomOpen,
          urgentComplaints: roomUrgent
        };
      });

      return {
        id: b.id,
        buildingName: b.building_name,
        buildingCode: b.building_code,
        isActive: b.is_active,
        totalRooms,
        totalEquipment,
        openComplaints,
        urgentComplaints,
        rooms: roomSummaries
      };
    });

    res.json({
      success: true,
      data: campusLocations
    });
  } catch (err) {
    next(err);
  }
});

// -----------------------------------------------------------------------------
// 9. AUDIT AND ACTIVITY HISTORY
// GET /api/v1/supervisor/audit-logs
// -----------------------------------------------------------------------------
router.get('/audit-logs', requireAuth, requireRole('supervisor', 'system_admin'), async (req, res, next) => {
  try {
    if (!isSupabaseConfigured) {
      return res.json({ success: true, data: [], pagination: { total: 0, page: 1, limit: 50 } });
    }

    const { page = '1', limit = '50', action = 'all' } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const offset = (pageNum - 1) * limitNum;

    let query = req.userClient
      .from('audit_logs')
      .select(`
        id, action, entity_type, entity_id, metadata, created_at,
        actor:actor_id(id, full_name, email, role)
      `, { count: 'exact' });

    if (action && action !== 'all') {
      query = query.eq('action', action);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    const { data, count, error } = await query;
    if (error) throw error;

    res.json({
      success: true,
      data: data || [],
      pagination: {
        total: count || 0,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil((count || 0) / limitNum) || 1
      }
    });
  } catch (err) {
    next(err);
  }
});

// -----------------------------------------------------------------------------
// 10. SUPERVISOR NOTIFICATIONS
// GET /api/v1/supervisor/notifications
// PATCH /api/v1/supervisor/notifications/:id/read
// POST /api/v1/supervisor/notifications/mark-all-read
// -----------------------------------------------------------------------------
router.get('/notifications', requireAuth, requireRole('supervisor', 'system_admin'), async (req, res, next) => {
  try {
    if (!isSupabaseConfigured) {
      return res.json({ success: true, data: [] });
    }

    const { data, error } = await req.userClient
      .from('notifications')
      .select(`
        id, title, message, is_read, created_at, complaint_id,
        complaint:complaint_id(id, complaint_number, status, priority)
      `)
      .eq('recipient_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/notifications/:id/read', requireAuth, requireRole('supervisor', 'system_admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isSupabaseConfigured) {
      return res.json({ success: true });
    }

    const { error } = await req.userClient
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('recipient_id', req.user.id);

    if (error) throw error;

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (err) {
    next(err);
  }
});

router.post('/notifications/mark-all-read', requireAuth, requireRole('supervisor', 'system_admin'), async (req, res, next) => {
  try {
    if (!isSupabaseConfigured) {
      return res.json({ success: true });
    }

    const { error } = await req.userClient
      .from('notifications')
      .update({ is_read: true })
      .eq('recipient_id', req.user.id)
      .eq('is_read', false);

    if (error) throw error;

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
});

// -----------------------------------------------------------------------------
// 11. MAINTENANCE POLICY SETTINGS
// GET /api/v1/supervisor/policies
// PUT /api/v1/supervisor/policies
// -----------------------------------------------------------------------------
router.get('/policies', requireAuth, requireRole('supervisor', 'system_admin'), async (req, res, next) => {
  try {
    if (!isSupabaseConfigured) {
      return res.json({
        success: true,
        data: {
          policy_key: 'srmist_estate_office',
          policy_name: 'SRMIST Campus Operations Standard',
          response_target_hours: 4.0,
          resolution_target_hours_low: 72.0,
          resolution_target_hours_medium: 48.0,
          resolution_target_hours_high: 24.0,
          resolution_target_hours_urgent: 6.0,
          escalation_threshold_hours: 12.0,
          require_completion_review: true,
          auto_escalate_overdue: true,
          notification_rules: { email_alerts: true, notify_admin_on_escalation: true }
        }
      });
    }

    const { data, error } = await req.userClient
      .from('maintenance_policies')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    res.json({
      success: true,
      data: data || {
        policy_key: 'srmist_estate_office',
        response_target_hours: 4.0,
        resolution_target_hours_low: 72.0,
        resolution_target_hours_medium: 48.0,
        resolution_target_hours_high: 24.0,
        resolution_target_hours_urgent: 6.0,
        escalation_threshold_hours: 12.0,
        require_completion_review: true,
        auto_escalate_overdue: true
      }
    });
  } catch (err) {
    next(err);
  }
});

router.put('/policies', requireAuth, requireRole('supervisor', 'system_admin'), async (req, res, next) => {
  try {
    const validated = policyUpdateSchema.parse(req.body);

    if (!isSupabaseConfigured) {
      return res.status(503).json({ success: false, message: 'Database not configured' });
    }

    const now = new Date().toISOString();
    const updatePayload = {
      ...validated,
      updated_by: req.user.id,
      updated_at: now
    };

    const { data, error } = await req.userClient
      .from('maintenance_policies')
      .upsert({
        policy_key: 'srmist_estate_office',
        ...updatePayload
      }, { onConflict: 'policy_key' })
      .select()
      .single();

    if (error) throw error;

    // Audit Log
    await logAuditEvent(req.userClient, {
      actorId: req.user.id,
      action: 'POLICY_UPDATED',
      entityType: 'maintenance_policies',
      entityId: data.id,
      metadata: validated
    });

    res.json({
      success: true,
      message: 'Campus maintenance operational policies successfully updated',
      data
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Validation Error', message: err.errors[0]?.message });
    }
    next(err);
  }
});

export default router;
