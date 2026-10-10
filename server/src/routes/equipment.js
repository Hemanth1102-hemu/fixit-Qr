import { Router } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// Validation schema for creating equipment
const createEquipmentSchema = z.object({
  room_id: z.string().uuid(),
  equipment_name: z.string().min(2).max(100),
  asset_code: z.string().min(2).max(50),
  equipment_type: z.string().min(2).max(50),
  description: z.string().optional(),
  installed_at: z.string().optional()
});

// GET /api/v1/equipment/:qrToken - QR Scan landing endpoint
// Fetches equipment information, location, and open complaint status
router.get('/:qrToken', async (req, res, next) => {
  try {
    const { qrToken } = req.params;

    if (!isSupabaseConfigured) {
      // Mock preview response for initial UI verification before DB credentials configured
      return res.json({
        success: true,
        data: {
          id: 'demo-equip-1',
          equipment_name: 'Ceiling Fan Front-Left',
          asset_code: 'SEC-LH101-FAN-01',
          equipment_type: 'Electrical',
          description: 'Crompton 1200mm high speed ceiling fan',
          qr_token: qrToken,
          is_active: true,
          room: {
            room_number: 'LH-101',
            floor_number: 1,
            building: {
              building_name: 'Science & Engineering Complex',
              building_code: 'SEC'
            }
          },
          openComplaintsCount: 0
        }
      });
    }

    const { data: item, error } = await supabase
      .from('equipment')
      .select(`
        id,
        equipment_name,
        asset_code,
        equipment_type,
        description,
        qr_token,
        is_active,
        installed_at,
        rooms (
          id,
          room_number,
          floor_number,
          buildings (
            id,
            building_name,
            building_code
          )
        )
      `)
      .eq('qr_token', qrToken)
      .single();

    if (error || !item) {
      return res.status(404).json({
        success: false,
        error: 'Equipment Not Found',
        message: 'No registered campus equipment found for this QR identifier.'
      });
    }

    if (!item.is_active) {
      return res.status(400).json({
        success: false,
        error: 'Equipment Inactive',
        message: 'This equipment is marked as decommissioned or inactive. Maintenance complaints cannot be accepted.'
      });
    }

    // Check for existing open complaints on this item to prevent duplicates
    const { count: openComplaintsCount } = await supabase
      .from('complaints')
      .select('*', { count: 'exact', head: true })
      .eq('equipment_id', item.id)
      .in('status', ['pending', 'in_progress', 'reopened']);

    res.json({
      success: true,
      data: {
        ...item,
        room: item.rooms,
        openComplaintsCount: openComplaintsCount || 0
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/equipment - List all equipment (Admin only)
router.get('/', requireAuth, requireRole('admin', 'system_admin'), async (req, res, next) => {
  try {
    const { data, error } = await req.userClient
      .from('equipment')
      .select(`
        *,
        rooms (
          room_number,
          floor_number,
          buildings (
            building_name,
            building_code
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/equipment - Register equipment & generate unguessable QR token (Admin only)
router.post('/', requireAuth, requireRole('admin', 'system_admin'), async (req, res, next) => {
  try {
    const validated = createEquipmentSchema.parse(req.body);

    // Generate cryptographic unguessable QR token
    const randomHex = crypto.randomBytes(16).toString('hex');
    const qr_token = `qr_${validated.asset_code.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${randomHex}`;

    const { data, error } = await req.userClient
      .from('equipment')
      .insert({
        ...validated,
        qr_token,
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Equipment registered successfully',
      data
    });
  } catch (err) {
    next(err);
  }
});

export default router;
