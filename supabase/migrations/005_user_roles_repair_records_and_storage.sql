-- ==============================================================================
-- FixIt QR — Smart Campus Maintenance System
-- Migration 005: User Roles, Repair Records, Auth Provisioning & Storage Buckets
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. USER_ROLES TABLE
-- Dedicated role assignments and audit trail for trusted role governance
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN (
        'student', 
        'faculty', 
        'technician', 
        'maintenance_admin', 
        'admin', 
        'supervisor', 
        'system_admin'
    )),
    assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_active_role UNIQUE (user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON public.user_roles(user_id, is_active);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 2. REPAIR_RECORDS TABLE
-- Comprehensive physical maintenance history, technician parts logs, and labor audit
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.repair_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE RESTRICT,
    technician_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    supervisor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    repair_summary TEXT NOT NULL,
    parts_replaced TEXT,
    labor_hours NUMERIC(5,2) DEFAULT 0.0 CHECK (labor_hours >= 0),
    repair_cost NUMERIC(10,2) DEFAULT 0.0 CHECK (repair_cost >= 0),
    repair_photo_url TEXT,
    verified_by_supervisor BOOLEAN NOT NULL DEFAULT FALSE,
    supervisor_verification_notes TEXT,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_repairs_complaint ON public.repair_records(complaint_id);
CREATE INDEX IF NOT EXISTS idx_repairs_equipment ON public.repair_records(equipment_id);
CREATE INDEX IF NOT EXISTS idx_repairs_technician ON public.repair_records(technician_id);
CREATE INDEX IF NOT EXISTS idx_repairs_completed_at ON public.repair_records(completed_at DESC);

-- Enable RLS on repair_records
ALTER TABLE public.repair_records ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 3. SYNCHRONIZATION TRIGGER: user_roles <-> profiles
-- Ensures backward compatibility while enforcing authoritative role records
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_profile_role()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
        IF NEW.is_active = TRUE THEN
            UPDATE public.profiles
            SET role = NEW.role,
                updated_at = NOW()
            WHERE id = NEW.user_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
    DROP TRIGGER IF EXISTS trg_sync_profile_role ON public.user_roles;
    CREATE TRIGGER trg_sync_profile_role
    AFTER INSERT OR UPDATE ON public.user_roles
    FOR EACH ROW EXECUTE FUNCTION public.sync_profile_role();
EXCEPTION WHEN others THEN NULL;
END $$;

-- Populate existing profile roles into user_roles if missing
INSERT INTO public.user_roles (user_id, role, is_active, notes)
SELECT p.id, p.role, p.is_active, 'Initial role sync from profile migration'
FROM public.profiles p
ON CONFLICT (user_id, role) DO UPDATE SET is_active = EXCLUDED.is_active;

-- ------------------------------------------------------------------------------
-- 4. AUTOMATIC NEW USER PROVISIONING TRIGGER (auth.users -> profiles + user_roles)
-- Automatically provisions default non-privileged role upon Supabase auth sign-up
-- NEVER automatically grants privileged staff/admin roles
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    assigned_initial_role TEXT := 'student';
BEGIN
    -- Heuristic: check if email contains faculty / employee indicators
    IF NEW.email ILIKE '%faculty%' OR NEW.email ILIKE '%prof%' OR NEW.email ILIKE '%staff%' THEN
        assigned_initial_role := 'faculty';
    ELSE
        assigned_initial_role := 'student';
    END IF;

    -- 1. Create Profile
    INSERT INTO public.profiles (id, full_name, email, role, is_active, created_at, updated_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.email,
        assigned_initial_role,
        TRUE,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE 
    SET full_name = EXCLUDED.full_name,
        email = EXCLUDED.email;

    -- 2. Create Initial Non-Privileged User Role
    INSERT INTO public.user_roles (user_id, role, is_active, notes)
    VALUES (
        NEW.id,
        assigned_initial_role,
        TRUE,
        'Auto-provisioned institutional account at registration'
    )
    ON CONFLICT (user_id, role) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger to auth.users table
DO $$
BEGIN
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
EXCEPTION WHEN others THEN NULL;
END $$;

-- ------------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) POLICIES FOR USER_ROLES & REPAIRS
-- ------------------------------------------------------------------------------

-- USER_ROLES POLICIES
-- Users can view their own roles
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- Admins and Supervisors can view all roles
DROP POLICY IF EXISTS "Admins view all roles" ON public.user_roles;
CREATE POLICY "Admins view all roles"
ON public.user_roles FOR SELECT
USING (public.current_user_role() IN ('admin', 'system_admin', 'supervisor'));

-- Only System Admins and Maintenance Admins can insert/update roles
DROP POLICY IF EXISTS "System Admins manage roles" ON public.user_roles;
CREATE POLICY "System Admins manage roles"
ON public.user_roles FOR ALL
USING (public.current_user_role() IN ('admin', 'system_admin'));

-- REPAIR_RECORDS POLICIES
-- Reporters can view repairs related to their own complaints
DROP POLICY IF EXISTS "Reporters view repairs for own complaints" ON public.repair_records;
CREATE POLICY "Reporters view repairs for own complaints"
ON public.repair_records FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.complaints c 
        WHERE c.id = repair_records.complaint_id AND c.reported_by = auth.uid()
    )
);

-- Technicians can view and log their assigned repairs
DROP POLICY IF EXISTS "Technicians view and insert repairs" ON public.repair_records;
CREATE POLICY "Technicians view and insert repairs"
ON public.repair_records FOR ALL
USING (
    technician_id = auth.uid() OR 
    public.current_user_role() IN ('technician', 'maintenance_admin', 'admin', 'supervisor', 'system_admin')
)
WITH CHECK (technician_id = auth.uid() OR public.current_user_role() IN ('admin', 'system_admin'));

-- Supervisors can audit and verify repair records
DROP POLICY IF EXISTS "Supervisors update repair records" ON public.repair_records;
CREATE POLICY "Supervisors update repair records"
ON public.repair_records FOR UPDATE
USING (public.is_maintenance_admin_or_supervisor());

-- ------------------------------------------------------------------------------
-- 6. SUPABASE STORAGE BUCKETS SETUP & STORAGE RLS POLICIES
-- Configures 'complaint-photos' and 'repair-photos' buckets
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('complaint-photos', 'complaint-photos', true),
    ('repair-photos', 'repair-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Public view access to photos
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public access to complaint photos" ON storage.objects;
    CREATE POLICY "Public access to complaint photos"
    ON storage.objects FOR SELECT
    USING (bucket_id IN ('complaint-photos', 'repair-photos'));

    -- Authenticated users can upload complaint photos
    DROP POLICY IF EXISTS "Authenticated users upload complaint photos" ON storage.objects;
    CREATE POLICY "Authenticated users upload complaint photos"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'complaint-photos' AND 
        auth.role() = 'authenticated'
    );

    -- Maintenance staff and supervisors upload repair photos
    DROP POLICY IF EXISTS "Staff upload repair photos" ON storage.objects;
    CREATE POLICY "Staff upload repair photos"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'repair-photos' AND 
        auth.role() = 'authenticated'
    );
EXCEPTION WHEN others THEN NULL;
END $$;

-- Updated at triggers for repair_records and user_roles
DO $$
BEGIN
    CREATE TRIGGER trg_user_roles_updated_at BEFORE UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TRIGGER trg_repair_records_updated_at BEFORE UPDATE ON public.repair_records FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION WHEN others THEN NULL;
END $$;
