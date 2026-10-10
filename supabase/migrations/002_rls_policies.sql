-- ==============================================================================
-- FixIt QR — Smart Campus Maintenance System
-- Migration 002: Row Level Security (RLS) Policies
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper security function: get current user role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() AND is_active = TRUE;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 1. PROFILES POLICIES
-- ------------------------------------------------------------------------------
-- Users can view their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

-- Staff, Admins, and System Admins can view other profiles (needed for assignments and contact)
CREATE POLICY "Staff and Admins can view all profiles" 
ON public.profiles FOR SELECT 
USING (public.current_user_role() IN ('technician', 'admin', 'system_admin'));

-- Users can update only their own non-role profile fields
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- System Admins can manage all profiles
CREATE POLICY "System Admins full access to profiles" 
ON public.profiles FOR ALL 
USING (public.current_user_role() = 'system_admin');

-- ------------------------------------------------------------------------------
-- 2. BUILDINGS POLICIES
-- ------------------------------------------------------------------------------
-- Anyone authenticated or scanning can view active buildings
CREATE POLICY "Public read active buildings" 
ON public.buildings FOR SELECT 
USING (is_active = TRUE);

-- Admins and System Admins can insert/update/delete buildings
CREATE POLICY "Admins manage buildings" 
ON public.buildings FOR ALL 
USING (public.current_user_role() IN ('admin', 'system_admin'));

-- ------------------------------------------------------------------------------
-- 3. ROOMS POLICIES
-- ------------------------------------------------------------------------------
-- Anyone can view active rooms
CREATE POLICY "Public read active rooms" 
ON public.rooms FOR SELECT 
USING (is_active = TRUE);

-- Admins and System Admins can manage rooms
CREATE POLICY "Admins manage rooms" 
ON public.rooms FOR ALL 
USING (public.current_user_role() IN ('admin', 'system_admin'));

-- ------------------------------------------------------------------------------
-- 4. EQUIPMENT POLICIES
-- ------------------------------------------------------------------------------
-- Anyone authenticated or scanning QR can view active equipment
CREATE POLICY "Public read active equipment" 
ON public.equipment FOR SELECT 
USING (is_active = TRUE OR public.current_user_role() IN ('admin', 'system_admin'));

-- Admins can manage equipment
CREATE POLICY "Admins manage equipment" 
ON public.equipment FOR ALL 
USING (public.current_user_role() IN ('admin', 'system_admin'));

-- ------------------------------------------------------------------------------
-- 5. COMPLAINTS POLICIES
-- ------------------------------------------------------------------------------
-- Reporters can view their own submitted complaints
CREATE POLICY "Reporters can view own complaints" 
ON public.complaints FOR SELECT 
USING (reported_by = auth.uid());

-- Technicians can view complaints assigned to them
CREATE POLICY "Technicians view assigned complaints" 
ON public.complaints FOR SELECT 
USING (
    public.current_user_role() = 'technician' AND 
    EXISTS (
        SELECT 1 FROM public.complaint_assignments 
        WHERE complaint_id = complaints.id 
          AND technician_id = auth.uid() 
          AND is_current = TRUE
    )
);

-- Admins and System Admins can view all complaints
CREATE POLICY "Admins view all complaints" 
ON public.complaints FOR SELECT 
USING (public.current_user_role() IN ('admin', 'system_admin'));

-- Authenticated users can insert their own complaint
CREATE POLICY "Authenticated users submit complaint" 
ON public.complaints FOR INSERT 
WITH CHECK (reported_by = auth.uid());

-- Reporters can reopen only their own resolved complaint
CREATE POLICY "Reporters can update own complaint to reopen" 
ON public.complaints FOR UPDATE 
USING (reported_by = auth.uid())
WITH CHECK (reported_by = auth.uid());

-- Technicians can update complaints assigned to them (status & notes)
CREATE POLICY "Technicians update assigned complaints" 
ON public.complaints FOR UPDATE 
USING (
    public.current_user_role() = 'technician' AND 
    EXISTS (
        SELECT 1 FROM public.complaint_assignments 
        WHERE complaint_id = complaints.id 
          AND technician_id = auth.uid() 
          AND is_current = TRUE
    )
);

-- Admins can update any complaint
CREATE POLICY "Admins update all complaints" 
ON public.complaints FOR UPDATE 
USING (public.current_user_role() IN ('admin', 'system_admin'));

-- ------------------------------------------------------------------------------
-- 6. COMPLAINT ASSIGNMENTS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Technicians view own assignments" 
ON public.complaint_assignments FOR SELECT 
USING (technician_id = auth.uid());

CREATE POLICY "Admins view and manage assignments" 
ON public.complaint_assignments FOR ALL 
USING (public.current_user_role() IN ('admin', 'system_admin'));

-- ------------------------------------------------------------------------------
-- 7. COMPLAINT STATUS HISTORY POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "View status history for accessible complaints" 
ON public.complaint_status_history FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.complaints c 
        WHERE c.id = complaint_status_history.complaint_id 
          AND (c.reported_by = auth.uid() OR public.current_user_role() IN ('technician', 'admin', 'system_admin'))
    )
);

CREATE POLICY "Insert status history on change" 
ON public.complaint_status_history FOR INSERT 
WITH CHECK (changed_by = auth.uid());

-- ------------------------------------------------------------------------------
-- 8. COMPLAINT FEEDBACK POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Reporters view and submit own feedback" 
ON public.complaint_feedback FOR SELECT 
USING (submitted_by = auth.uid());

CREATE POLICY "Reporters insert own feedback" 
ON public.complaint_feedback FOR INSERT 
WITH CHECK (submitted_by = auth.uid());

CREATE POLICY "Admins view all feedback" 
ON public.complaint_feedback FOR SELECT 
USING (public.current_user_role() IN ('admin', 'system_admin'));

-- ------------------------------------------------------------------------------
-- 9. NOTIFICATIONS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Recipients view own notifications" 
ON public.notifications FOR SELECT 
USING (recipient_id = auth.uid());

CREATE POLICY "Recipients update own notifications (mark read)" 
ON public.notifications FOR UPDATE 
USING (recipient_id = auth.uid());

-- ------------------------------------------------------------------------------
-- 10. AUDIT LOGS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Admins and System Admins view audit logs" 
ON public.audit_logs FOR SELECT 
USING (public.current_user_role() IN ('admin', 'system_admin'));

-- Insert audit logs through server or authenticated actor
CREATE POLICY "Authenticated actors insert audit logs" 
ON public.audit_logs FOR INSERT 
WITH CHECK (actor_id = auth.uid() OR actor_id IS NULL);
