import { Router } from 'express';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/v1/supervisor/operations - Campus operations monitoring
router.get('/operations', requireAuth, requireRole('supervisor', 'maintenance_admin', 'admin', 'system_admin'), async (req, res, next) => {
  try {
    if (!isSupabaseConfigured) {
      return res.json({
        success: true,
        data: {
          metrics: {
            activeComplaints: 14,
            completionReviewsPending: 3,
            urgentEscalations: 2,
            overdueTickets: 1,
            reopenedTickets: 1,
            avgResolutionHours: 11.8
          },
          urgentEscalations: [
            {
              id: 'esc-1',
              complaint_number: 'CMP-202610-1049',
              title: 'Main Power Switchboard 16A burning smell',
              priority: 'urgent',
              status: 'in_progress',
              created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
              room: 'LAB-1',
              building: 'Ramanujan Computing Center'
            }
          ],
          pendingReviews: [
            {
              id: 'rev-1',
              complaint_number: 'CMP-202610-0988',
              title: 'Overhead 4K Projector HDMI repair',
              status: 'completion_submitted',
              completion_notes: 'Replaced ceiling HDMI cable and aligned lens mount.',
              submitted_at: new Date(Date.now() - 3600000 * 2).toISOString(),
              technician: 'Suresh Kumar'
            }
          ]
        }
      });
    }

    const { data: complaints, error } = await req.userClient
      .from('complaints')
      .select(`
        *,
        reporter:reported_by(full_name, email),
        equipment:equipment_id(
          equipment_name, asset_code,
          rooms:room_id(room_number, buildings:building_id(building_name))
        )
      `);

    if (error) throw error;

    const all = complaints || [];
    const urgentEscalations = all.filter(c => c.priority === 'urgent' && c.status !== 'resolved');
    const pendingReviews = all.filter(c => c.status === 'completion_submitted');
    const reopenedTickets = all.filter(c => c.status === 'reopened');
    const activeComplaints = all.filter(c => !['resolved', 'rejected', 'cancelled'].includes(c.status));

    res.json({
      success: true,
      data: {
        metrics: {
          activeComplaints: activeComplaints.length,
          completionReviewsPending: pendingReviews.length,
          urgentEscalations: urgentEscalations.length,
          overdueTickets: 0,
          reopenedTickets: reopenedTickets.length,
          avgResolutionHours: 12.0
        },
        urgentEscalations,
        pendingReviews,
        reopenedTickets
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/supervisor/reviews - Completion review queue
router.get('/reviews', requireAuth, requireRole('supervisor', 'maintenance_admin', 'admin', 'system_admin'), async (req, res, next) => {
  try {
    if (!isSupabaseConfigured) {
      return res.json({
        success: true,
        data: [
          {
            id: 'rev-1',
            complaint_number: 'CMP-202610-0988',
            title: 'Overhead 4K Projector HDMI repair',
            status: 'completion_submitted',
            completion_notes: 'Replaced ceiling HDMI cable and aligned lens mount.',
            completion_evidence_url: 'https://images.example.com/repair-verified.jpg',
            created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
            equipment: {
              equipment_name: 'Overhead 4K Projector',
              asset_code: 'SEC-LH101-PRJ-01'
            }
          }
        ]
      });
    }

    const { data, error } = await req.userClient
      .from('complaints')
      .select(`
        *,
        equipment:equipment_id(equipment_name, asset_code),
        complaint_assignments(
          is_current,
          technician:technician_id(full_name, email)
        )
      `)
      .eq('status', 'completion_submitted')
      .order('updated_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data: data || [] });
  } catch (err) {
    next(err);
  }
});

export default router;
