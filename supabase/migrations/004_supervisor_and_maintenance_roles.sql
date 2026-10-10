-- ==============================================================================
-- FixIt QR — Smart Campus Maintenance System
-- Migration 004: Supervisor Portal, Maintenance Admin, and Extended Lifecycle
-- ==============================================================================

-- 1. UPDATE PROFILES ROLE CONSTRAINT
-- Support Student, Faculty, Maintenance Staff (technician), Maintenance Admin, Supervisor, and System Admin
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('student', 'faculty', 'technician', 'maintenance_admin', 'admin', 'supervisor', 'system_admin'));

-- 2. UPDATE COMPLAINTS LIFECYCLE STATUS CONSTRAINT
-- Submitted -> Under Review -> Assigned -> In Progress -> Completion Submitted -> Resolved
-- Plus: Reopened, Rejected, Cancelled
ALTER TABLE public.complaints 
DROP CONSTRAINT IF EXISTS complaints_status_check;

ALTER TABLE public.complaints 
ADD CONSTRAINT complaints_status_check 
CHECK (status IN (
    'submitted',
    'pending', 
    'under_review', 
    'assigned', 
    'in_progress', 
    'completion_submitted', 
    'resolved', 
    'reopened', 
    'rejected', 
    'cancelled'
));

-- 3. ADD AUDIT AND REVIEW FIELDS TO COMPLAINTS
ALTER TABLE public.complaints
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS completion_notes TEXT,
ADD COLUMN IF NOT EXISTS completion_evidence_url TEXT,
ADD COLUMN IF NOT EXISTS supervisor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS supervisor_decision_note TEXT,
ADD COLUMN IF NOT EXISTS supervisor_reviewed_at TIMESTAMPTZ;

-- Index for supervisor review queues
CREATE INDEX IF NOT EXISTS idx_complaints_supervisor_queue 
ON public.complaints(status) 
WHERE (status IN ('completion_submitted', 'reopened', 'under_review'));

-- 4. UPDATE RLS HELPER TO RECOGNIZE PRIVILEGED ROLES
CREATE OR REPLACE FUNCTION public.is_maintenance_admin_or_supervisor()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
      AND is_active = TRUE 
      AND role IN ('maintenance_admin', 'admin', 'supervisor', 'system_admin')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 5. EXTEND RLS POLICIES FOR SUPERVISORS & MAINTENANCE ADMINS
DO $$
BEGIN
    -- Allow maintenance admins and supervisors full view of complaints
    DROP POLICY IF EXISTS "Admins and Supervisors view all complaints" ON public.complaints;
    CREATE POLICY "Admins and Supervisors view all complaints" 
    ON public.complaints FOR SELECT 
    USING (public.is_maintenance_admin_or_supervisor());

    -- Allow supervisors to approve completion and update decision notes
    DROP POLICY IF EXISTS "Supervisors review and update complaints" ON public.complaints;
    CREATE POLICY "Supervisors review and update complaints" 
    ON public.complaints FOR UPDATE 
    USING (public.is_maintenance_admin_or_supervisor());

    -- Allow supervisors to view audit logs
    DROP POLICY IF EXISTS "Supervisors view audit logs" ON public.audit_logs;
    CREATE POLICY "Supervisors view audit logs" 
    ON public.audit_logs FOR SELECT 
    USING (public.is_maintenance_admin_or_supervisor());
EXCEPTION WHEN others THEN NULL;
END $$;
