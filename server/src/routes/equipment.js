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
      const TEST_CATALOG = {
        'qr_tp_401_fan01_9a1b2c': {
          id: '90000001-0001-4000-8000-000000000001',
          equipment_name: 'Ceiling Fan Front-Left (High Speed)',
          asset_code: 'SRM-TP-401-FAN-01',
          equipment_type: 'Electrical',
          description: 'Crompton 1200mm high speed ceiling fan in Software Lab',
          qr_token: 'qr_tp_401_fan01_9a1b2c',
          is_active: true,
          room: {
            room_number: 'TP-401',
            floor_number: 4,
            building: { building_name: 'Tech Park', building_code: 'TP' }
          },
          openComplaintsCount: 0
        },
        'qr_tp_502_prj01_8b3d4f': {
          id: '90000001-0002-4000-8000-000000000002',
          equipment_name: 'Overhead 4K Projector Rear',
          asset_code: 'SRM-TP-502-PRJ-01',
          equipment_type: 'Electronics',
          description: 'Epson 4K ceiling mounted digital projector in AI Seminar Hall',
          qr_token: 'qr_tp_502_prj01_8b3d4f',
          is_active: true,
          room: {
            room_number: 'TP-502',
            floor_number: 5,
            building: { building_name: 'Tech Park', building_code: 'TP' }
          },
          openComplaintsCount: 0
        },
        'qr_ub_201_ac01_7e2a9b': {
          id: '90000001-0003-4000-8000-000000000003',
          equipment_name: 'Split AC 2-Ton Inverter',
          asset_code: 'SRM-UB-201-AC-01',
          equipment_type: 'HVAC',
          description: 'Daikin 2-Ton inverter split AC in Main Lecture Theatre',
          qr_token: 'qr_ub_201_ac01_7e2a9b',
          is_active: true,
          room: {
            room_number: 'UB-201',
            floor_number: 2,
            building: { building_name: 'University Building', building_code: 'UB' }
          },
          openComplaintsCount: 0
        },
        'qr_btb_104_dsp01_6f4c8a': {
          id: '90000001-0004-4000-8000-000000000004',
          equipment_name: 'Digital Interactive Smart Board 75"',
          asset_code: 'SRM-BTB-104-DSP-01',
          equipment_type: 'Electronics',
          description: 'Samsung 75-inch touch interactive screen in Molecular Lab',
          qr_token: 'qr_btb_104_dsp01_6f4c8a',
          is_active: true,
          room: {
            room_number: 'BTB-104',
            floor_number: 1,
            building: { building_name: 'Bio Tech Block', building_code: 'BTB' }
          },
          openComplaintsCount: 0
        },
        'qr_tp2_305_swb01_5d1e7c': {
          id: '90000001-0005-4000-8000-000000000005',
          equipment_name: 'Main 32A Modular Power Switchboard',
          asset_code: 'SRM-TP2-305-SWB-01',
          equipment_type: 'Electrical',
          description: 'Legrand 32A heavy-duty modular power panel in Cloud Computing Center',
          qr_token: 'qr_tp2_305_swb01_5d1e7c',
          is_active: true,
          room: {
            room_number: 'TP2-305',
            floor_number: 3,
            building: { building_name: 'Tech Park 2', building_code: 'TP2' }
          },
          openComplaintsCount: 0
        }
      };

      const matched = TEST_CATALOG[qrToken] || {
        id: 'test-equip-custom',
        equipment_name: 'Campus Equipment Asset',
        asset_code: 'SRM-ASSET-01',
        equipment_type: 'General',
        description: 'SRMIST verified campus equipment',
        qr_token: qrToken,
        is_active: true,
        room: {
          room_number: '101',
          floor_number: 1,
          building: { building_name: 'Main Campus', building_code: 'MAIN' }
        },
        openComplaintsCount: 0
      };

      return res.json({
        success: true,
        data: matched
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
