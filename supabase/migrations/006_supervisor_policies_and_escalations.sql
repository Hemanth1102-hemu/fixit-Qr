-- ==============================================================================
-- FixIt QR — Smart Campus Maintenance System
-- Migration 006: Supervisor Policies, SLA Targets, and Escalations Schema
-- ==============================================================================

-- 1. EXTEND COMPLAINTS FOR ESCALATION AND SLA DEADLINES
ALTER TABLE public.complaints
ADD COLUMN IF NOT EXISTS target_completion_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS escalation_reason TEXT,
ADD COLUMN IF NOT EXISTS escalation_notes TEXT,
ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS escalated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_complaints_target_completion ON public.complaints(target_completion_at);
CREATE INDEX IF NOT EXISTS idx_complaints_escalated_at ON public.complaints(escalated_at) WHERE escalated_at IS NOT NULL;

-- 2. MAINTENANCE POLICIES & SLA TARGETS TABLE
CREATE TABLE IF NOT EXISTS public.maintenance_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_key TEXT NOT NULL UNIQUE DEFAULT 'srmist_estate_office',
    policy_name TEXT NOT NULL DEFAULT 'SRMIST Campus Maintenance Policy',
    response_target_hours NUMERIC(5,2) NOT NULL DEFAULT 4.00 CHECK (response_target_hours > 0),
    resolution_target_hours_low NUMERIC(5,2) NOT NULL DEFAULT 72.00 CHECK (resolution_target_hours_low > 0),
    resolution_target_hours_medium NUMERIC(5,2) NOT NULL DEFAULT 48.00 CHECK (resolution_target_hours_medium > 0),
    resolution_target_hours_high NUMERIC(5,2) NOT NULL DEFAULT 24.00 CHECK (resolution_target_hours_high > 0),
    resolution_target_hours_urgent NUMERIC(5,2) NOT NULL DEFAULT 6.00 CHECK (resolution_target_hours_urgent > 0),
    escalation_threshold_hours NUMERIC(5,2) NOT NULL DEFAULT 12.00 CHECK (escalation_threshold_hours > 0),
    require_completion_review BOOLEAN NOT NULL DEFAULT TRUE,
    auto_escalate_overdue BOOLEAN NOT NULL DEFAULT TRUE,
    notification_rules JSONB NOT NULL DEFAULT '{"notify_reporter_on_approval": true, "notify_admin_on_escalation": true, "email_alerts": true}'::jsonb,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on maintenance_policies
ALTER TABLE public.maintenance_policies ENABLE ROW LEVEL SECURITY;

-- 3. RLS POLICIES FOR MAINTENANCE POLICIES
-- All authenticated users can read the active campus maintenance policy
DROP POLICY IF EXISTS "Authenticated users view active maintenance policies" ON public.maintenance_policies;
CREATE POLICY "Authenticated users view active maintenance policies"
ON public.maintenance_policies FOR SELECT
TO authenticated
USING (true);

-- Only Supervisors and System Admins can update maintenance policies
DROP POLICY IF EXISTS "Supervisors update maintenance policies" ON public.maintenance_policies;
CREATE POLICY "Supervisors update maintenance policies"
ON public.maintenance_policies FOR ALL
TO authenticated
USING (public.current_user_role() IN ('supervisor', 'system_admin'))
WITH CHECK (public.current_user_role() IN ('supervisor', 'system_admin'));

-- 4. SEED DEFAULT INSTITUTIONAL MAINTENANCE POLICY
INSERT INTO public.maintenance_policies (
    policy_key,
    policy_name,
    response_target_hours,
    resolution_target_hours_low,
    resolution_target_hours_medium,
    resolution_target_hours_high,
    resolution_target_hours_urgent,
    escalation_threshold_hours,
    require_completion_review,
    auto_escalate_overdue
)
VALUES (
    'srmist_estate_office',
    'SRMIST Campus Operations & Estate Maintenance Standard',
    4.00,
    72.00,
    48.00,
    24.00,
    6.00,
    12.00,
    true,
    true
)
ON CONFLICT (policy_key) DO NOTHING;

-- 5. UPDATED_AT TRIGGER FOR MAINTENANCE POLICIES
DO $$
BEGIN
    DROP TRIGGER IF EXISTS trg_maintenance_policies_updated_at ON public.maintenance_policies;
    CREATE TRIGGER trg_maintenance_policies_updated_at
    BEFORE UPDATE ON public.maintenance_policies
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION WHEN others THEN NULL;
END $$;
