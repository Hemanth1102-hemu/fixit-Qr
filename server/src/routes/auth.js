import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

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
