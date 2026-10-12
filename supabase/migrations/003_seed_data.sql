-- ==============================================================================
-- FixIt QR — Smart Campus Maintenance System
-- Migration 003: Academic Development Seed Data (Fictional Sample Data)
-- ==============================================================================

-- 1. SEED BUILDINGS (Including Tech Park, University Building, Bio Tech Block, Tech Park 2)
INSERT INTO public.buildings (id, building_name, building_code, description, is_active)
VALUES 
    ('11111111-1111-4111-8111-111111111111', 'Science & Engineering Complex', 'SEC', 'Academic laboratories and lecture halls', true),
    ('22222222-2222-4222-8222-222222222222', 'Ramanujan Computing Center', 'RCC', 'Computer laboratories and IT department', true),
    ('33333333-3333-4333-8333-333333333333', 'Central University Library', 'CUL', 'Reading halls, digital archives, and study rooms', true),
    ('44444444-4444-4444-8444-444444444444', 'Tech Park', 'TP', 'Main Technology & Computing Complex', true),
    ('55555555-5555-4555-8555-555555555555', 'University Building', 'UB', 'Administrative & Main Lecture Theatre Complex', true),
    ('66666666-6666-4666-8666-666666666666', 'Bio Tech Block', 'BTB', 'Biotechnology & Life Sciences Research Building', true),
    ('77777777-7777-4777-8777-777777777777', 'Tech Park 2', 'TP2', 'Advanced Innovation & AI Computing Facility', true)
ON CONFLICT (id) DO UPDATE SET 
    building_name = EXCLUDED.building_name,
    building_code = EXCLUDED.building_code;

-- 2. SEED ROOMS
INSERT INTO public.rooms (id, building_id, floor_number, room_number, is_active)
VALUES
    ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111', 1, 'LH-101', true),
    ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '11111111-1111-4111-8111-111111111111', 2, 'PHYS-204', true),
    ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', '22222222-2222-4222-8222-222222222222', 1, 'LAB-1', true),
    ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', '22222222-2222-4222-8222-222222222222', 3, 'SERVER-301', true),
    ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', '33333333-3333-4333-8333-333333333333', 2, 'READING-2A', true),
    -- User Requested Test Locations
    ('44444444-0001-4444-8444-000000000001', '44444444-4444-4444-8444-444444444444', 4, 'TP-401', true),
    ('44444444-0002-4444-8444-000000000002', '44444444-4444-4444-8444-444444444444', 5, 'TP-502', true),
    ('55555555-0001-4555-8555-000000000001', '55555555-5555-4555-8555-555555555555', 2, 'UB-201', true),
    ('66666666-0001-4666-8666-000000000001', '66666666-6666-4666-8666-666666666666', 1, 'BTB-104', true),
    ('77777777-0001-4777-8777-000000000001', '77777777-7777-4777-8777-777777777777', 3, 'TP2-305', true)
ON CONFLICT (id) DO UPDATE SET 
    room_number = EXCLUDED.room_number,
    floor_number = EXCLUDED.floor_number;

-- 3. SEED EQUIPMENT (Including 5 Requested Campus QR Testing Units)
INSERT INTO public.equipment (id, room_id, equipment_name, asset_code, equipment_type, description, qr_token, is_active, installed_at)
VALUES
    -- Legacy sample assets
    ('90000001-0000-4000-8000-000000000001', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Ceiling Fan Front-Left', 'SEC-LH101-FAN-01', 'Electrical', 'Crompton 1200mm high speed ceiling fan', 'qr_sec_lh101_fan01_7f8d2a', true, '2023-08-15'),
    ('90000002-0000-4000-8000-000000000002', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Overhead 4K Projector', 'SEC-LH101-PRJ-01', 'Electronics', 'Epson ceiling mounted digital projector', 'qr_sec_lh101_prj01_4c9b1e', true, '2023-09-01'),
    ('90000003-0000-4000-8000-000000000003', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'Air Conditioner Split 2-Ton', 'RCC-LAB1-AC-01', 'HVAC', 'Daikin inverter split AC near server rack', 'qr_rcc_lab1_ac01_8e1f5d', true, '2024-01-10'),
    ('90000004-0000-4000-8000-000000000004', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'Main Power Switchboard 16A', 'RCC-LAB1-SWB-01', 'Electrical', 'Anchor modular switchboard controlling PC row A', 'qr_rcc_lab1_swb01_3a7b9c', true, '2023-07-20'),
    ('90000005-0000-4000-8000-000000000005', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'LED Panel Light Center', 'CUL-RD2A-LGT-01', 'Lighting', 'Philips 36W LED recessed square panel', 'qr_cul_rd2a_lgt01_6d2e8f', true, '2023-11-05'),
    
    -- 5 USER REQUESTED QR TESTING UNITS
    -- QR 1: Tech Park (TP-401)
    ('90000001-0001-4000-8000-000000000001', '44444444-0001-4444-8444-000000000001', 'Ceiling Fan Front-Left (High Speed)', 'SRM-TP-401-FAN-01', 'Electrical', 'Crompton 1200mm high speed ceiling fan in Software Lab', 'qr_tp_401_fan01_9a1b2c', true, '2024-02-10'),

    -- QR 2: Tech Park (TP-502)
    ('90000001-0002-4000-8000-000000000002', '44444444-0002-4444-8444-000000000002', 'Overhead 4K Projector Rear', 'SRM-TP-502-PRJ-01', 'Electronics', 'Epson 4K ceiling mounted digital projector in AI Seminar Hall', 'qr_tp_502_prj01_8b3d4f', true, '2024-03-05'),

    -- QR 3: University Building (UB-201)
    ('90000001-0003-4000-8000-000000000003', '55555555-0001-4555-8555-000000000001', 'Split AC 2-Ton Inverter', 'SRM-UB-201-AC-01', 'HVAC', 'Daikin 2-Ton inverter split AC in Main Lecture Theatre', 'qr_ub_201_ac01_7e2a9b', true, '2024-01-18'),

    -- QR 4: Bio Tech Block (BTB-104)
    ('90000001-0004-4000-8000-000000000004', '66666666-0001-4666-8666-000000000001', 'Digital Interactive Smart Board 75"', 'SRM-BTB-104-DSP-01', 'Electronics', 'Samsung 75-inch touch interactive screen in Molecular Lab', 'qr_btb_104_dsp01_6f4c8a', true, '2024-04-12'),

    -- QR 5: Tech Park 2 (TP2-305)
    ('90000001-0005-4000-8000-000000000005', '77777777-0001-4777-8777-000000000001', 'Main 32A Modular Power Switchboard', 'SRM-TP2-305-SWB-01', 'Electrical', 'Legrand 32A heavy-duty modular power panel in Cloud Computing Center', 'qr_tp2_305_swb01_5d1e7c', true, '2024-05-20')
ON CONFLICT (id) DO UPDATE SET 
    equipment_name = EXCLUDED.equipment_name,
    asset_code = EXCLUDED.asset_code,
    qr_token = EXCLUDED.qr_token;
