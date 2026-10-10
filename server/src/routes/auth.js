import { Router } from 'express';
import { z } from 'zod';
import { supabase, supabaseAdmin, isSupabaseConfigured } from '../lib/supabase.js';
import { requireAuth, isSrmistEmail, SRMIST_DOMAIN } from '../middleware/auth.js';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().min(2).max(100),
  requested_role: z.enum(['student', 'faculty']).default('student')
});

// POST /api/v1/me/register - Secure student/faculty institutional registration
router.post('/register', async (req, res, next) => {
  try {
    const validated = registerSchema.parse(req.body);

    // 1. Enforce verified @srmist.edu.in institutional email domain
    const allowNonSrmist = process.env.ALLOW_NON_SRMIST_EMAILS === 'true';
    if (!allowNonSrmist && !isSrmistEmail(validated.email)) {
      return res.status(400).json({
        success: false,
        error: 'Unauthorized Domain',
        message: `Registration requires an official SRMIST institutional email address (${SRMIST_DOMAIN}). Public email addresses are not permitted.`
      });
    }

    if (!isSupabaseConfigured) {
      return res.status(201).json({
        success: true,
        message: 'Account registered in preview mode. Configure Supabase in .env for persistent authentication.',
        data: {
          id: 'demo-user-srm',
          email: validated.email,
          full_name: validated.full_name,
          role: validated.requested_role,
          is_active: true
        }
      });
    }

    // 2. Prevent role self-elevation:
    // Only student or faculty allowed for self-signup. Privileged roles (technician, admin, system_admin)
    // require trusted administrator provisioning through system admin console.
    const assignedRole = (validated.requested_role === 'faculty') ? 'faculty' : 'student';

    // 3. Register user with Supabase Auth
    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email: validated.email,
      password: validated.password,
      options: {
        data: {
          full_name: validated.full_name,
          role: assignedRole
        }
      }
    });

    if (authErr) throw authErr;

    const user = authData.user;
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Unable to initiate user registration with identity service.'
      });
    }

    // 4. Provision profile in database
    const dbClient = supabaseAdmin || supabase;
    const { data: profile, error: profErr } = await dbClient
      .from('profiles')
      .upsert({
        id: user.id,
        full_name: validated.full_name,
        email: validated.email,
        role: assignedRole,
        is_active: true,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (profErr) {
      console.warn('[AUTH] Profile record creation error:', profErr.message);
    }

    // 5. Record audit log
    await dbClient.from('audit_logs').insert({
      actor_id: user.id,
      action: 'USER_REGISTERED_SRMIST',
      entity_type: 'profiles',
      entity_id: user.id,
      metadata: { email: validated.email, role: assignedRole }
    }).catch(() => null);

    res.status(201).json({
      success: true,
      message: `Registration successful for SRMIST ${assignedRole} account. Please verify your email if required.`,
      data: profile || { id: user.id, email: validated.email, role: assignedRole }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/me - Get authenticated user's profile and verified role
router.get('/', requireAuth, (req, res) => {
  res.json({
    success: true,
    data: req.profile
  });
});

// GET /api/v1/me/notifications - Get current user notifications
router.get('/notifications', requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await req.userClient
      .from('notifications')
      .select('*')
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

// PATCH /api/v1/me/notifications/:id - Mark notification as read
router.patch('/notifications/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error } = await req.userClient
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('recipient_id', req.user.id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (err) {
    next(err);
  }
});

export default router;
