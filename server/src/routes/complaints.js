import { Router } from 'express';
import { z } from 'zod';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// Validation schemas
const submitComplaintSchema = z.object({
  equipment_id: z.string().uuid(),
  category: z.string().min(2).max(50),
  title: z.string().min(4).max(150),
  description: z.string().min(10).max(1000),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  photo_url: z.string().url().optional().or(z.literal(''))
});

const updateStatusSchema = z.object({
  status: z.enum([
    'submitted',
    'pending',
    'under_review',
    'assigned',
    'in_progress',
    'completion_submitted',
    'resolved',
    'reopened',
    'rejected',
    'cancelled'
  ]),
  note: z.string().min(3).max(500),
  resolution_notes: z.string().max(1000).optional(),
  completion_photo_url: z.string().url().optional().or(z.literal('')),
  reason: z.string().max(500).optional()
});

const completionSubmissionSchema = z.object({
  completion_notes: z.string().min(5).max(1000),
  completion_evidence_url: z.string().url().optional().or(z.literal('')),
  note: z.string().max(250).optional()
});

const supervisorReviewSchema = z.object({
  decision: z.enum(['approve', 'return_for_rework']),
  decision_notes: z.string().min(3).max(500)
});

const reasonSchema = z.object({
  reason: z.string().min(5).max(500)
});

const assignTechnicianSchema = z.object({
  technician_id: z.string().uuid(),
  note: z.string().max(250).optional()
});

const feedbackSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comments: z.string().max(500).optional()
});

// Allowed status transitions state machine
const ALLOWED_TRANSITIONS = {
  submitted: ['under_review', 'assigned', 'rejected', 'cancelled'],
  pending: ['under_review', 'assigned', 'in_progress', 'rejected', 'cancelled'],
  under_review: ['assigned', 'rejected', 'cancelled'],
  assigned: ['in_progress', 'cancelled'],
  in_progress: ['completion_submitted', 'resolved', 'cancelled'],
  completion_submitted: ['resolved', 'in_progress'], // Approved by supervisor/admin or returned for rework
  resolved: ['reopened'],
  reopened: ['assigned', 'in_progress', 'under_review'],
  rejected: [],
  cancelled: []
};

/**
 * Generate human-readable ticket number CMP-YYYYMM-XXXX
 */
function generateTicketNumber() {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `CMP-${yearMonth}-${randomSuffix}`;
}

// POST /api/v1/complaints - Submit maintenance complaint
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const validated = submitComplaintSchema.parse(req.body);

    if (!isSupabaseConfigured) {
      return res.status(201).json({
        success: true,
        message: 'Complaint submitted in preview mode (database pending configuration)',
        data: {
          id: 'demo-cmp-1',
          complaint_number: generateTicketNumber(),
          ...validated,
          status: 'pending',
          created_at: new Date().toISOString()
        }
      });
    }

    // Verify equipment is active
    const { data: equip, error: equipError } = await supabase
      .from('equipment')
      .select('id, equipment_name, is_active')
      .eq('id', validated.equipment_id)
      .single();

    if (equipError || !equip) {
      return res.status(404).json({
        success: false,
        error: 'Equipment Not Found',
        message: 'The selected equipment record does not exist.'
      });
    }

    if (!equip.is_active) {
      return res.status(400).json({
        success: false,
        error: 'Equipment Inactive',
        message: 'This equipment is decommissioned. Complaints cannot be accepted.'
      });
    }

    const complaintNumber = generateTicketNumber();

    // Insert complaint
    const { data: complaint, error: insertError } = await req.userClient
      .from('complaints')
      .insert({
        complaint_number: complaintNumber,
        equipment_id: validated.equipment_id,
        reported_by: req.user.id,
        category: validated.category,
        title: validated.title,
        description: validated.description,
        priority: validated.priority,
        status: 'pending',
        photo_url: validated.photo_url || null
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Record initial status history
    await req.userClient
      .from('complaint_status_history')
      .insert({
        complaint_id: complaint.id,
        old_status: null,
        new_status: 'pending',
        changed_by: req.user.id,
        note: 'Complaint submitted by reporter'
      });

    res.status(201).json({
      success: true,
      message: 'Complaint lodged successfully',
      data: complaint
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/complaints/mine - Get current reporter's complaints
router.get('/mine', requireAuth, async (req, res, next) => {
  try {
    if (!isSupabaseConfigured) {
      return res.json({ success: true, data: [] });
    }

    const { data, error } = await req.userClient
      .from('complaints')
      .select(`
        *,
        equipment:equipment_id (
          id, equipment_name, asset_code, equipment_type,
          rooms:room_id (
            room_number, floor_number,
            buildings:building_id (building_name, building_code)
          )
        )
      `)
      .eq('reported_by', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data: data || [] });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/complaints/:id - Get complaint detail with history and assignments
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isSupabaseConfigured) {
      return res.json({
        success: true,
        data: {
          id,
          complaint_number: 'CMP-202610-1001',
          title: 'Projector bulb not turning on',
          description: 'The projector blinks orange and shuts off after 10 seconds.',
          status: 'pending',
          priority: 'high',
          category: 'Electronics',
          created_at: new Date().toISOString(),
          history: [],
          assignments: []
        }
      });
    }

    const { data: complaint, error } = await req.userClient
      .from('complaints')
      .select(`
        *,
        reporter:reported_by (id, full_name, email),
        equipment:equipment_id (
          id, equipment_name, asset_code, equipment_type,
          rooms:room_id (
            room_number, floor_number,
            buildings:building_id (building_name, building_code)
          )
        ),
        complaint_status_history (
          id, old_status, new_status, note, created_at,
          changer:changed_by (full_name, role)
        ),
        complaint_assignments (
          id, assigned_at, unassigned_at, is_current,
          technician:technician_id (id, full_name, email),
          assigner:assigned_by (full_name)
        ),
        complaint_feedback (
          id, rating, comments, created_at
        )
      `)
      .eq('id', id)
      .single();

    if (error || !complaint) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Complaint not found or access unauthorized'
      });
    }

    res.json({ success: true, data: complaint });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/complaints/:id/status - Status transition state machine
router.patch('/:id/status', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status: targetStatus, note, resolution_notes, completion_photo_url } = updateStatusSchema.parse(req.body);

    if (!isSupabaseConfigured) {
      return res.json({ success: true, message: 'Status updated (preview mode)' });
    }

    // Fetch existing complaint
    const { data: complaint, error: fetchErr } = await supabase
      .from('complaints')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    const currentStatus = complaint.status;

    // Verify valid state transition
    const validNextStates = ALLOWED_TRANSITIONS[currentStatus] || [];
    if (!validNextStates.includes(targetStatus)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Transition',
        message: `Cannot transition from '${currentStatus}' to '${targetStatus}'. Allowed transitions: [${validNextStates.join(', ')}]`
      });
    }

    // Role verification for transitions:
    // Technicians can move in_progress -> resolved
    // Reporters can move resolved -> reopened
    // Admins can execute transitions
    const role = req.profile.role;
    if (targetStatus === 'reopened' && role !== 'admin' && complaint.reported_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Only the original reporter or a campus administrator may reopen a complaint.'
      });
    }

    const updatePayload = {
      status: targetStatus,
      updated_at: new Date().toISOString()
    };

    if (targetStatus === 'resolved') {
      updatePayload.resolved_at = new Date().toISOString();
      if (resolution_notes) updatePayload.resolution_notes = resolution_notes;
      if (completion_photo_url) updatePayload.completion_photo_url = completion_photo_url;
    }

    const { error: updateErr } = await req.userClient
      .from('complaints')
      .update(updatePayload)
      .eq('id', id);

    if (updateErr) throw updateErr;

    // Record into status history
    await req.userClient
      .from('complaint_status_history')
      .insert({
        complaint_id: id,
        old_status: currentStatus,
        new_status: targetStatus,
        changed_by: req.user.id,
        note: note || `Status changed to ${targetStatus}`
      });

    // Notify reporter if status changed by technician or admin
    if (complaint.reported_by !== req.user.id) {
      await supabase.from('notifications').insert({
        recipient_id: complaint.reported_by,
        complaint_id: id,
        title: `Ticket ${complaint.complaint_number} updated`,
        message: `Status transitioned to ${targetStatus.replace('_', ' ').toUpperCase()}: ${note}`
      });
    }

    res.json({
      success: true,
      message: `Complaint status updated to ${targetStatus}`
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/complaints/:id/assign - Assign or reassign technician (Admin only)
router.patch('/:id/assign', requireAuth, requireRole('admin', 'system_admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { technician_id, note } = assignTechnicianSchema.parse(req.body);

    if (!isSupabaseConfigured) {
      return res.json({ success: true, message: 'Technician assigned (preview mode)' });
    }

    // Verify technician role
    const { data: tech, error: techErr } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('id', technician_id)
      .single();

    if (techErr || !tech || tech.role !== 'technician') {
      return res.status(400).json({
        success: false,
        error: 'Invalid Technician',
        message: 'The selected user is not a valid campus maintenance technician.'
      });
    }

    // Retire existing active assignment
    await req.userClient
      .from('complaint_assignments')
      .update({ is_current: false, unassigned_at: new Date().toISOString() })
      .eq('complaint_id', id)
      .eq('is_current', true);

    // Create new assignment
    const { data: assignment, error: assignErr } = await req.userClient
      .from('complaint_assignments')
      .insert({
        complaint_id: id,
        technician_id,
        assigned_by: req.user.id,
        is_current: true
      })
      .select()
      .single();

    if (assignErr) throw assignErr;

    // If complaint was pending, automatically move to in_progress
    await req.userClient
      .from('complaints')
      .update({ status: 'in_progress' })
      .eq('id', id)
      .eq('status', 'pending');

    // Notify technician
    await supabase.from('notifications').insert({
      recipient_id: technician_id,
      complaint_id: id,
      title: 'New Maintenance Work Order Assigned',
      message: note || `You have been assigned to maintenance ticket #${id.slice(0, 8)}.`
    });

    res.json({
      success: true,
      message: `Assigned technician ${tech.full_name} successfully`,
      data: assignment
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/complaints/:id/feedback - Reporter submits feedback
router.post('/:id/feedback', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, comments } = feedbackSchema.parse(req.body);

    if (!isSupabaseConfigured) {
      return res.status(201).json({ success: true, message: 'Feedback recorded (preview mode)' });
    }

    // Verify complaint is resolved and reported by current user
    const { data: complaint, error: compErr } = await supabase
      .from('complaints')
      .select('id, status, reported_by')
      .eq('id', id)
      .single();

    if (compErr || !complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    if (complaint.reported_by !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only the reporter can submit feedback.' });
    }

    if (complaint.status !== 'resolved') {
      return res.status(400).json({ success: false, message: 'Feedback can only be submitted for resolved complaints.' });
    }

    const { data, error } = await req.userClient
      .from('complaint_feedback')
      .insert({
        complaint_id: id,
        submitted_by: req.user.id,
        rating,
        comments
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Thank you for submitting resolution feedback',
      data
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/complaints/:id/completion - Technician submits work order completion
router.post('/:id/completion', requireAuth, requireRole('technician', 'admin', 'maintenance_admin', 'supervisor'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { completion_notes, completion_evidence_url, note } = completionSubmissionSchema.parse(req.body);

    if (!isSupabaseConfigured) {
      return res.json({ success: true, message: 'Completion submitted for review (preview mode)' });
    }

    const { error } = await req.userClient
      .from('complaints')
      .update({
        status: 'completion_submitted',
        completion_notes,
        completion_evidence_url: completion_evidence_url || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;

    await req.userClient
      .from('complaint_status_history')
      .insert({
        complaint_id: id,
        old_status: 'in_progress',
        new_status: 'completion_submitted',
        changed_by: req.user.id,
        note: note || `Completion submitted: ${completion_notes.slice(0, 100)}`
      });

    res.json({
      success: true,
      message: 'Repair completion submitted for supervisor review'
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/complaints/:id/supervisor-review - Supervisor approves or requests rework
router.post('/:id/supervisor-review', requireAuth, requireRole('supervisor', 'maintenance_admin', 'admin', 'system_admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { decision, decision_notes } = supervisorReviewSchema.parse(req.body);

    if (!isSupabaseConfigured) {
      return res.json({ success: true, message: `Review completed: ${decision}` });
    }

    const newStatus = decision === 'approve' ? 'resolved' : 'in_progress';

    const updatePayload = {
      status: newStatus,
      supervisor_id: req.user.id,
      supervisor_decision_note: decision_notes,
      supervisor_reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (decision === 'approve') {
      updatePayload.resolved_at = new Date().toISOString();
    }

    const { error } = await req.userClient
      .from('complaints')
      .update(updatePayload)
      .eq('id', id);

    if (error) throw error;

    await req.userClient
      .from('complaint_status_history')
      .insert({
        complaint_id: id,
        old_status: 'completion_submitted',
        new_status: newStatus,
        changed_by: req.user.id,
        note: `Supervisor ${decision === 'approve' ? 'Approved' : 'Returned for Rework'}: ${decision_notes}`
      });

    res.json({
      success: true,
      message: decision === 'approve' ? 'Complaint approved and marked resolved' : 'Returned to technician for rework',
      status: newStatus
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/complaints/:id/reject - Reject invalid ticket with reason
router.post('/:id/reject', requireAuth, requireRole('maintenance_admin', 'admin', 'supervisor', 'system_admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = reasonSchema.parse(req.body);

    if (!isSupabaseConfigured) {
      return res.json({ success: true, message: 'Ticket rejected with reason' });
    }

    const { error } = await req.userClient
      .from('complaints')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;

    await req.userClient
      .from('complaint_status_history')
      .insert({
        complaint_id: id,
        new_status: 'rejected',
        changed_by: req.user.id,
        note: `Rejected by administrator: ${reason}`
      });

    res.json({
      success: true,
      message: 'Complaint rejected with documented reason'
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/complaints/:id/cancel - Cancel ticket with reason
router.post('/:id/cancel', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = reasonSchema.parse(req.body);

    if (!isSupabaseConfigured) {
      return res.json({ success: true, message: 'Ticket cancelled' });
    }

    const { error } = await req.userClient
      .from('complaints')
      .update({
        status: 'cancelled',
        cancellation_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;

    await req.userClient
      .from('complaint_status_history')
      .insert({
        complaint_id: id,
        new_status: 'cancelled',
        changed_by: req.user.id,
        note: `Cancelled: ${reason}`
      });

    res.json({
      success: true,
      message: 'Complaint cancelled successfully'
    });
  } catch (err) {
    next(err);
  }
});

export default router;
