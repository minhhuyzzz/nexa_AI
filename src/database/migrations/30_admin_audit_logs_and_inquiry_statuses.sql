-- ==============================================================================
-- NEXA MIGRATION 30: ADMIN AUDIT LOGS & EXPANDED INQUIRY PIPELINE (ADM-13, ADM-02)
-- ==============================================================================

-- 1. Expand business_inquiries status check to include 'PROPOSAL_SENT'
ALTER TABLE public.business_inquiries DROP CONSTRAINT IF EXISTS business_inquiries_status_check;
ALTER TABLE public.business_inquiries ADD CONSTRAINT business_inquiries_status_check 
    CHECK (status IN ('NEW', 'CONTACTED', 'PROPOSAL_SENT', 'APPROVED', 'REJECTED'));

-- 2. Create Platform Admin Audit Logs Table
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    admin_email TEXT,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON public.admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target ON public.admin_audit_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created ON public.admin_audit_logs(created_at DESC);

-- 3. RLS for admin_audit_logs
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can view and insert audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admin can view and insert audit logs" ON public.admin_audit_logs
    FOR ALL
    TO authenticated
    USING (public.is_admin_or_service())
    WITH CHECK (public.is_admin_or_service());
