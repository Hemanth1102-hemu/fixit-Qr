-- ==============================================================================
-- FixIt QR — Smart Campus Maintenance System
-- Migration 003: Academic Development Seed Data (Fictional Sample Data)
-- ==============================================================================

-- 1. SEED BUILDINGS (Sample Campus Buildings)
INSERT INTO public.buildings (id, building_name, building_code, description, is_active)
VALUES 
    ('11111111-1111-4111-8111-111111111111', 'Science & Engineering Complex', 'SEC', 'Academic laboratories and lecture halls', true),
    ('22222222-2222-4222-8222-222222222222', 'Ramanujan Computing Center', 'RCC', 'Computer laboratories and IT department', true),
    ('33333333-3333-4333-8333-333333333333', 'Central University Library', 'CUL', 'Reading halls, digital archives, and study rooms', true)
ON CONFLICT (id) DO NOTHING;

-- 2. SEED ROOMS
INSERT INTO public.rooms (id, building_id, floor_number, room_number, is_active)
VALUES
    ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111', 1, 'LH-101', true),
    ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '11111111-1111-4111-8111-111111111111', 2, 'PHYS-204', true),
    ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', '22222222-2222-4222-8222-222222222222', 1, 'LAB-1', true),
    ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', '22222222-2222-4222-8222-222222222222', 3, 'SERVER-301', true),
    ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', '33333333-3333-4333-8333-333333333333', 2, 'READING-2A', true)
ON CONFLICT (id) DO NOTHING;

-- 3. SEED EQUIPMENT (With unique unguessable qr_token)
INSERT INTO public.equipment (id, room_id, equipment_name, asset_code, equipment_type, description, qr_token, is_active, installed_at)
VALUES
    ('90000001-0000-4000-8000-000000000001', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Ceiling Fan Front-Left', 'SEC-LH101-FAN-01', 'Electrical', 'Crompton 1200mm high speed ceiling fan', 'qr_sec_lh101_fan01_7f8d2a', true, '2023-08-15'),
    ('90000002-0000-4000-8000-000000000002', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Overhead 4K Projector', 'SEC-LH101-PRJ-01', 'Electronics', 'Epson ceiling mounted digital projector', 'qr_sec_lh101_prj01_4c9b1e', true, '2023-09-01'),
    ('90000003-0000-4000-8000-000000000003', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'Air Conditioner Split 2-Ton', 'RCC-LAB1-AC-01', 'HVAC', 'Daikin inverter split AC near server rack', 'qr_rcc_lab1_ac01_8e1f5d', true, '2024-01-10'),
    ('90000004-0000-4000-8000-000000000004', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'Main Power Switchboard 16A', 'RCC-LAB1-SWB-01', 'Electrical', 'Anchor modular switchboard controlling PC row A', 'qr_rcc_lab1_swb01_3a7b9c', true, '2023-07-20'),
    ('90000005-0000-4000-8000-000000000005', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'LED Panel Light Center', 'CUL-RD2A-LGT-01', 'Lighting', 'Philips 36W LED recessed square panel', 'qr_cul_rd2a_lgt01_6d2e8f', true, '2023-11-05')
ON CONFLICT (id) DO NOTHING;
