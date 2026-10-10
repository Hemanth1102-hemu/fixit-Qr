import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { srmistClassroomAdapter } from '../services/srmistClassroomAdapter.js';

const router = Router();

// GET /api/v1/classroom/my-allocation
// Securely retrieves the current timetable classroom and registered equipment for the authenticated SRMIST user
router.get('/my-allocation', requireAuth, async (req, res, next) => {
  try {
    // Identity is derived STRICTLY from req.user (validated JWT), not from client body or query params
    const userEmail = req.user.email;
    const allocation = await srmistClassroomAdapter.getUserActiveAllocation(userEmail);

    res.json({
      success: true,
      data: allocation
    });
  } catch (err) {
    next(err);
  }
});

export default router;
