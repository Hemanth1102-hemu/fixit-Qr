import { Router } from 'express';
import { z } from 'zod';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

const createBuildingSchema = z.object({
  building_name: z.string().min(2).max(100),
  building_code: z.string().min(2).max(10).toUpperCase(),
  description: z.string().optional()
});

const createRoomSchema = z.object({
  building_id: z.string().uuid(),
  floor_number: z.number().int().min(0).max(50),
  room_number: z.string().min(1).max(20)
});

// GET /api/v1/buildings - Get active campus buildings with rooms
router.get('/', async (req, res, next) => {
  try {
    if (!isSupabaseConfigured) {
      return res.json({
        success: true,
        data: [
          {
            id: 'demo-bldg-1',
            building_name: 'Science & Engineering Complex',
            building_code: 'SEC',
            is_active: true,
            rooms: [
              { id: 'demo-rm-1', floor_number: 1, room_number: 'LH-101', is_active: true },
              { id: 'demo-rm-2', floor_number: 2, room_number: 'PHYS-204', is_active: true }
            ]
          },
          {
            id: 'demo-bldg-2',
            building_name: 'Ramanujan Computing Center',
            building_code: 'RCC',
            is_active: true,
            rooms: [
              { id: 'demo-rm-3', floor_number: 1, room_number: 'LAB-1', is_active: true }
            ]
          }
        ]
      });
    }

    const { data, error } = await supabase
      .from('buildings')
      .select(`
        id,
        building_name,
        building_code,
        description,
        is_active,
        rooms (
          id,
          floor_number,
          room_number,
          is_active
        )
      `)
      .eq('is_active', true)
      .order('building_name');

    if (error) throw error;

    res.json({ success: true, data: data || [] });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/buildings - Create building (Admin only)
router.post('/', requireAuth, requireRole('admin', 'system_admin'), async (req, res, next) => {
  try {
    const validated = createBuildingSchema.parse(req.body);

    const { data, error } = await req.userClient
      .from('buildings')
      .insert(validated)
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/buildings/rooms - Add room (Admin only)
router.post('/rooms', requireAuth, requireRole('admin', 'system_admin'), async (req, res, next) => {
  try {
    const validated = createRoomSchema.parse(req.body);

    const { data, error } = await req.userClient
      .from('rooms')
      .insert(validated)
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

export default router;
