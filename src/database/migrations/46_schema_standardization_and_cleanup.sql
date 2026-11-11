-- ==============================================================================
-- NEXA MIGRATION 46: SCHEMA STANDARDIZATION, RLS REMEDIATION & CLEANUP
-- Milestone 1 (R1) - Standardizing live Supabase database with source migrations
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 0. Security Definer Helper Function (SEC-01 Fix)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin_or_service()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    claim_role text;
    user_email text;
    user_role text;
    current_uid uuid;
    admin_emails text;
BEGIN
    -- 1. Check service_role jwt claim or session_user
    BEGIN
        claim_role := current_setting('request.jwt.claim.role', true);
    EXCEPTION WHEN OTHERS THEN
        claim_role := NULL;
    END;

    IF claim_role = 'service_role' THEN
        RETURN TRUE;
    END IF;

    IF session_user IN ('service_role') THEN
        RETURN TRUE;
    END IF;

    -- 2. Authenticated user checks
    current_uid := auth.uid();
    IF current_uid IS NULL THEN
        RETURN FALSE;
    END IF;

    -- 3. Check email against SUPERADMIN_EMAILS whitelist
    BEGIN
        user_email := current_setting('request.jwt.claim.email', true);
    EXCEPTION WHEN OTHERS THEN
        user_email := NULL;
    END;

    IF user_email IS NULL THEN
        BEGIN
            user_email := auth.jwt() ->> 'email';
        EXCEPTION WHEN OTHERS THEN
            user_email := NULL;
        END;
    END IF;

    IF user_email IS NULL THEN
        SELECT email INTO user_email FROM auth.users WHERE id = current_uid;
    END IF;

    IF user_email IS NOT NULL THEN
        BEGIN
            admin_emails := current_setting('app.settings.superadmin_emails', true);
        EXCEPTION WHEN OTHERS THEN
            admin_emails := NULL;
        END;

        IF admin_emails IS NOT NULL AND admin_emails <> '' THEN
            IF user_email = ANY(string_to_array(admin_emails, ',')) THEN
                RETURN TRUE;
            END IF;
        END IF;

        IF user_email IN ('admin.nexa@gmail.com', 'superadmin@nexa.ai') THEN
            RETURN TRUE;
        END IF;
    END IF;

    -- 4. Check profiles.role
    SELECT role INTO user_role FROM public.profiles WHERE id = current_uid;
    IF user_role = 'ADMIN' THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin_or_service() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin_or_service() TO authenticated, service_role, anon;

-- ------------------------------------------------------------------------------
-- 1. Create 8 Missing Tables with Indexes & RLS
-- ------------------------------------------------------------------------------

-- 1.1 Curated Course Catalog
CREATE TABLE IF NOT EXISTS public.course_catalog (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    provider VARCHAR(100) NOT NULL,
    official_url TEXT NOT NULL,
    domain_codes TEXT[] NOT NULL,
    level VARCHAR(50) DEFAULT 'INTERMEDIATE',
    language VARCHAR(20) DEFAULT 'vi',
    format VARCHAR(50) DEFAULT 'Online',
    duration VARCHAR(50) DEFAULT '2-4 tuần',
    price_type VARCHAR(20) DEFAULT 'FREE' CHECK (price_type IN ('FREE', 'PAID', 'FREE_TRIAL')),
    review_status VARCHAR(20) DEFAULT 'APPROVED' CHECK (review_status IN ('APPROVED', 'DRAFT', 'ARCHIVED')),
    last_verified_at TIMESTAMPTZ DEFAULT NOW(),
    short_description TEXT,
    learning_outcomes TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_course_catalog_review_status ON public.course_catalog(review_status);
CREATE INDEX IF NOT EXISTS idx_course_catalog_domain_codes ON public.course_catalog USING GIN(domain_codes);

ALTER TABLE public.course_catalog ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.course_catalog TO authenticated, anon;

DROP POLICY IF EXISTS "Anyone can view approved courses" ON public.course_catalog;
CREATE POLICY "Anyone can view approved courses"
    ON public.course_catalog
    FOR SELECT
    TO authenticated, anon
    USING (review_status = 'APPROVED');

-- 1.2 User Course Progress
CREATE TABLE IF NOT EXISTS public.user_course_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id VARCHAR(64) NOT NULL REFERENCES public.course_catalog(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'SAVED' CHECK (status IN ('SAVED', 'IN_PROGRESS', 'COMPLETED')),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    is_self_reported BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_user_course UNIQUE (user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_user_course_progress_user ON public.user_course_progress(user_id);

ALTER TABLE public.user_course_progress ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_course_progress TO authenticated;

DROP POLICY IF EXISTS "Users can manage own course progress" ON public.user_course_progress;
CREATE POLICY "Users can manage own course progress"
    ON public.user_course_progress
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 1.3 Platform Admin Audit Logs
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

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON public.admin_audit_logs TO authenticated;

DROP POLICY IF EXISTS "Admin can view and insert audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admin can view and insert audit logs" ON public.admin_audit_logs
    FOR ALL
    TO authenticated
    USING (public.is_admin_or_service())
    WITH CHECK (public.is_admin_or_service());

-- 1.4 Platform Settings
CREATE TABLE IF NOT EXISTS public.platform_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_settings_key ON public.platform_settings(key);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.platform_settings TO authenticated;

DROP POLICY IF EXISTS "Platform admins can manage platform settings" ON public.platform_settings;
CREATE POLICY "Platform admins can manage platform settings" ON public.platform_settings
    FOR ALL TO authenticated
    USING (public.is_admin_or_service())
    WITH CHECK (public.is_admin_or_service());

-- 1.5 Organization Policies
CREATE TABLE IF NOT EXISTS public.organization_policies (
    organization_id UUID PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
    allowed_domains TEXT[] DEFAULT '{}',
    anti_cheat_enabled BOOLEAN DEFAULT TRUE,
    fullscreen_enforced BOOLEAN DEFAULT FALSE,
    tab_switch_limit INT DEFAULT 3,
    time_limit_minutes INT DEFAULT 60,
    passing_score DECIMAL(5,2) DEFAULT 70.00,
    auto_publish_results BOOLEAN DEFAULT TRUE,
    show_detailed_breakdown BOOLEAN DEFAULT TRUE,
    require_approval_for_join BOOLEAN DEFAULT FALSE,
    allow_code_join BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES public.profiles(id)
);

ALTER TABLE public.organization_policies ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.organization_policies TO authenticated;

DROP POLICY IF EXISTS "Members can view their org policies" ON public.organization_policies;
CREATE POLICY "Members can view their org policies"
ON public.organization_policies FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.user_organizations uo
        WHERE uo.organization_id = organization_policies.organization_id
          AND uo.user_id = auth.uid()
          AND uo.status = 'ACTIVE'
    )
    OR public.is_admin_or_service()
);

DROP POLICY IF EXISTS "Org admins can manage their org policies" ON public.organization_policies;
CREATE POLICY "Org admins can manage their org policies"
ON public.organization_policies FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_organizations uo
        WHERE uo.organization_id = organization_policies.organization_id
          AND uo.user_id = auth.uid()
          AND uo.org_role IN ('ORG_OWNER', 'ORG_ADMIN')
          AND uo.status = 'ACTIVE'
    )
    OR public.is_admin_or_service()
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_organizations uo
        WHERE uo.organization_id = organization_policies.organization_id
          AND uo.user_id = auth.uid()
          AND uo.org_role IN ('ORG_OWNER', 'ORG_ADMIN')
          AND uo.status = 'ACTIVE'
    )
    OR public.is_admin_or_service()
);

-- 1.6 Feedback Tickets
CREATE TABLE IF NOT EXISTS public.feedback_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    user_email VARCHAR(255),
    user_name VARCHAR(255),
    category VARCHAR(50) DEFAULT 'GENERAL' CHECK (category IN ('GENERAL', 'BUG', 'FEATURE_REQUEST', 'CONTENT', 'BILLING')),
    subject VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_REVIEW', 'RESOLVED', 'CLOSED')),
    admin_notes TEXT,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_tickets_status ON public.feedback_tickets(status);
CREATE INDEX IF NOT EXISTS idx_feedback_tickets_created_at ON public.feedback_tickets(created_at DESC);

ALTER TABLE public.feedback_tickets ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON public.feedback_tickets TO authenticated;
GRANT INSERT ON public.feedback_tickets TO anon;

DROP POLICY IF EXISTS "Users can view their own feedback tickets" ON public.feedback_tickets;
CREATE POLICY "Users can view their own feedback tickets"
ON public.feedback_tickets FOR SELECT
USING (auth.uid() = user_id OR public.is_admin_or_service());

DROP POLICY IF EXISTS "Users can create feedback tickets" ON public.feedback_tickets;
CREATE POLICY "Users can create feedback tickets"
ON public.feedback_tickets FOR INSERT
WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL OR public.is_admin_or_service());

DROP POLICY IF EXISTS "Admins can manage feedback tickets" ON public.feedback_tickets;
CREATE POLICY "Admins can manage feedback tickets"
ON public.feedback_tickets FOR ALL
TO authenticated
USING (public.is_admin_or_service())
WITH CHECK (public.is_admin_or_service());

-- 1.7 AI Credit Reservations Ledger
CREATE TABLE IF NOT EXISTS public.ai_credit_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id TEXT UNIQUE NOT NULL,
    payer_type TEXT NOT NULL CHECK (payer_type IN ('PERSONAL', 'ORG')),
    payer_id UUID NOT NULL,
    amount INTEGER NOT NULL CHECK (amount > 0),
    status TEXT NOT NULL DEFAULT 'RESERVED' CHECK (status IN ('RESERVED', 'SETTLED', 'RELEASED')),
    remaining_credits INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_reservations_request ON public.ai_credit_reservations(request_id);
CREATE INDEX IF NOT EXISTS idx_ai_reservations_payer ON public.ai_credit_reservations(payer_type, payer_id);

ALTER TABLE public.ai_credit_reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role and admins can access reservations" ON public.ai_credit_reservations;
CREATE POLICY "Service role and admins can access reservations"
ON public.ai_credit_reservations FOR ALL
USING (public.is_admin_or_service())
WITH CHECK (public.is_admin_or_service());

REVOKE ALL ON public.ai_credit_reservations FROM PUBLIC;
REVOKE ALL ON public.ai_credit_reservations FROM anon;
REVOKE ALL ON public.ai_credit_reservations FROM authenticated;
GRANT ALL ON public.ai_credit_reservations TO service_role;

-- 1.8 Organization Audit Logs
CREATE TABLE IF NOT EXISTS public.org_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_email TEXT,
    actor_role TEXT,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_org_audit_logs_org ON public.org_audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_audit_logs_action ON public.org_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_org_audit_logs_created ON public.org_audit_logs(created_at DESC);

ALTER TABLE public.org_audit_logs ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON public.org_audit_logs TO authenticated;

DROP POLICY IF EXISTS "Org admins can view their org audit logs" ON public.org_audit_logs;
CREATE POLICY "Org admins can view their org audit logs" ON public.org_audit_logs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_organizations uo
            WHERE uo.organization_id = org_audit_logs.organization_id
              AND uo.user_id = auth.uid()
              AND uo.org_role IN ('ORG_OWNER', 'ORG_ADMIN')
              AND uo.status = 'ACTIVE'
        )
        OR public.is_admin_or_service()
    );

DROP POLICY IF EXISTS "Org admins can insert org audit logs" ON public.org_audit_logs;
CREATE POLICY "Org admins can insert org audit logs" ON public.org_audit_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_organizations uo
            WHERE uo.organization_id = org_audit_logs.organization_id
              AND uo.user_id = auth.uid()
              AND uo.org_role IN ('ORG_OWNER', 'ORG_ADMIN')
              AND uo.status = 'ACTIVE'
        )
        OR public.is_admin_or_service()
    );

-- ------------------------------------------------------------------------------
-- 2. Add 7 Missing Columns with Indexes & Constraints
-- ------------------------------------------------------------------------------

-- 2.1 assessments.version
ALTER TABLE public.assessments 
ADD COLUMN IF NOT EXISTS version TEXT DEFAULT '1.0';

-- 2.2 profiles.tokens_revoked_at
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS tokens_revoked_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_tokens_revoked_at ON public.profiles(tokens_revoked_at);

-- 2.3 question_bank_items.owner_user_id, scope, rubric_definition
ALTER TABLE public.question_bank_items
ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS scope VARCHAR(20) DEFAULT 'PERSONAL' CHECK (scope IN ('PERSONAL', 'ORGANIZATION', 'PLATFORM')),
ADD COLUMN IF NOT EXISTS rubric_definition JSONB;

CREATE INDEX IF NOT EXISTS idx_question_bank_items_owner ON public.question_bank_items(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_question_bank_items_scope ON public.question_bank_items(scope);

-- Backfill owner_user_id from created_by if null
UPDATE public.question_bank_items
SET owner_user_id = created_by
WHERE owner_user_id IS NULL AND created_by IS NOT NULL;

-- 2.4 organizations.description & banner_url
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- ------------------------------------------------------------------------------
-- 3. Enable RLS on 5 Unprotected Tables and Add Secure Policies
-- ------------------------------------------------------------------------------

-- 3.1 learning_modules
ALTER TABLE public.learning_modules ENABLE ROW LEVEL SECURITY;

-- 3.2 learning_paths
ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;

-- 3.3 assessment_campaigns
ALTER TABLE public.assessment_campaigns ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.assessment_campaigns TO authenticated;

DROP POLICY IF EXISTS "Org members can view campaigns" ON public.assessment_campaigns;
CREATE POLICY "Org members can view campaigns" ON public.assessment_campaigns
    FOR SELECT TO authenticated
    USING (
        organization_id IN (
            SELECT uo.organization_id 
            FROM public.user_organizations uo 
            WHERE uo.user_id = auth.uid() 
              AND uo.status = 'ACTIVE'
        )
        OR public.is_admin_or_service()
    );

DROP POLICY IF EXISTS "Org managers can manage campaigns" ON public.assessment_campaigns;
CREATE POLICY "Org managers can manage campaigns" ON public.assessment_campaigns
    FOR ALL TO authenticated
    USING (
        organization_id IN (SELECT public.get_user_managed_org_ids(auth.uid()))
        OR public.is_admin_or_service()
    )
    WITH CHECK (
        organization_id IN (SELECT public.get_user_managed_org_ids(auth.uid()))
        OR public.is_admin_or_service()
    );

-- 3.4 organization_join_codes (Secured against unauthorized exposure)
ALTER TABLE public.organization_join_codes ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.organization_join_codes TO authenticated;

DROP POLICY IF EXISTS "Members can view org join codes" ON public.organization_join_codes;
DROP POLICY IF EXISTS "Org members can view org join codes" ON public.organization_join_codes;
CREATE POLICY "Org members can view org join codes" ON public.organization_join_codes
    FOR SELECT TO authenticated
    USING (
        organization_id IN (
            SELECT uo.organization_id 
            FROM public.user_organizations uo 
            WHERE uo.user_id = auth.uid() 
              AND uo.status = 'ACTIVE'
        )
        OR public.is_admin_or_service()
    );

DROP POLICY IF EXISTS "Managers can manage org join codes" ON public.organization_join_codes;
CREATE POLICY "Managers can manage org join codes" ON public.organization_join_codes
    FOR ALL TO authenticated
    USING (
        organization_id IN (SELECT public.get_user_managed_org_ids(auth.uid()))
        OR public.is_admin_or_service()
    )
    WITH CHECK (
        organization_id IN (SELECT public.get_user_managed_org_ids(auth.uid()))
        OR public.is_admin_or_service()
    );

-- 3.5 organization_membership_requests
ALTER TABLE public.organization_membership_requests ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.organization_membership_requests TO authenticated;

DROP POLICY IF EXISTS "Users can create and view own join requests" ON public.organization_membership_requests;
CREATE POLICY "Users can create and view own join requests" ON public.organization_membership_requests
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Managers can view and review org join requests" ON public.organization_membership_requests;
CREATE POLICY "Managers can view and review org join requests" ON public.organization_membership_requests
    FOR ALL TO authenticated
    USING (
        organization_id IN (SELECT public.get_user_managed_org_ids(auth.uid()))
        OR public.is_admin_or_service()
    )
    WITH CHECK (
        organization_id IN (SELECT public.get_user_managed_org_ids(auth.uid()))
        OR public.is_admin_or_service()
    );

-- ------------------------------------------------------------------------------
-- 4. Recreate 3 Missing AI Credits Stored Procedures
-- ------------------------------------------------------------------------------

-- 4.1 deduct_organization_ai_credits
CREATE OR REPLACE FUNCTION public.deduct_organization_ai_credits(
    p_org_id UUID,
    p_amount INTEGER DEFAULT 1
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_entitlement_id UUID;
    v_granted INTEGER;
    v_used INTEGER;
    v_remaining INTEGER;
BEGIN
    IF p_amount IS NULL OR p_amount <= 0 THEN
        RAISE EXCEPTION 'Số lượng credits trừ phải lớn hơn 0 (nhận: %).', p_amount USING ERRCODE = 'P0003';
    END IF;

    SELECT id, ai_credits_granted, ai_credits_used
    INTO v_entitlement_id, v_granted, v_used
    FROM public.organization_entitlements
    WHERE organization_id = p_org_id
      AND is_active = true
      AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1
    FOR UPDATE;

    IF v_entitlement_id IS NULL THEN
        RAISE EXCEPTION 'Gói dịch vụ tổ chức chưa được kích hoạt hoặc đã hết hạn.' USING ERRCODE = 'P0001';
    END IF;

    v_remaining := v_granted - v_used;
    IF v_remaining < p_amount THEN
        RAISE EXCEPTION 'Hạn mức AI Credits của tổ chức không đủ (còn: %, cần: %).', v_remaining, p_amount USING ERRCODE = 'P0002';
    END IF;

    UPDATE public.organization_entitlements
    SET ai_credits_used = ai_credits_used + p_amount
    WHERE id = v_entitlement_id;

    RETURN v_remaining - p_amount;
END;
$$;

REVOKE ALL ON FUNCTION public.deduct_organization_ai_credits(UUID, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.deduct_organization_ai_credits(UUID, INTEGER) FROM anon;
REVOKE ALL ON FUNCTION public.deduct_organization_ai_credits(UUID, INTEGER) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.deduct_organization_ai_credits(UUID, INTEGER) TO service_role;

-- 4.2 refund_organization_ai_credits
CREATE OR REPLACE FUNCTION public.refund_organization_ai_credits(
    p_org_id UUID,
    p_amount INTEGER DEFAULT 1
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_entitlement_id UUID;
    v_granted INTEGER;
    v_used INTEGER;
    v_remaining INTEGER;
BEGIN
    IF p_amount IS NULL OR p_amount <= 0 THEN
        RAISE EXCEPTION 'Số lượng credits hoàn phải lớn hơn 0 (nhận: %).', p_amount USING ERRCODE = 'P0003';
    END IF;

    SELECT id, ai_credits_granted, ai_credits_used
    INTO v_entitlement_id, v_granted, v_used
    FROM public.organization_entitlements
    WHERE organization_id = p_org_id
      AND is_active = true
    ORDER BY created_at DESC
    LIMIT 1
    FOR UPDATE;

    IF v_entitlement_id IS NULL THEN
        RAISE EXCEPTION 'Không tìm thấy gói dịch vụ tổ chức để hoàn credits.' USING ERRCODE = 'P0001';
    END IF;

    UPDATE public.organization_entitlements
    SET ai_credits_used = GREATEST(0, ai_credits_used - p_amount)
    WHERE id = v_entitlement_id;

    RETURN v_granted - GREATEST(0, v_used - p_amount);
END;
$$;

REVOKE ALL ON FUNCTION public.refund_organization_ai_credits(UUID, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.refund_organization_ai_credits(UUID, INTEGER) FROM anon;
REVOKE ALL ON FUNCTION public.refund_organization_ai_credits(UUID, INTEGER) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.refund_organization_ai_credits(UUID, INTEGER) TO service_role;

-- 4.3 refund_ai_credits (Personal)
CREATE OR REPLACE FUNCTION public.refund_ai_credits(
    p_user_id UUID,
    p_amount INTEGER DEFAULT 1
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_current_credits INTEGER;
    v_new_credits INTEGER;
BEGIN
    IF p_amount IS NULL OR p_amount <= 0 THEN
        RAISE EXCEPTION 'Số lượng credits hoàn phải lớn hơn 0 (nhận: %).', p_amount USING ERRCODE = 'P0003';
    END IF;

    IF NOT public.is_admin_or_service() THEN
        RAISE EXCEPTION 'Chỉ backend service hoặc admin mới có quyền hoàn credits.' USING ERRCODE = '42501';
    END IF;

    SELECT credits INTO v_current_credits FROM public.profiles WHERE id = p_user_id FOR UPDATE;
    
    v_new_credits := COALESCE(v_current_credits, 0) + p_amount;

    UPDATE public.profiles
    SET credits = v_new_credits,
        updated_at = NOW()
    WHERE id = p_user_id;

    RETURN v_new_credits;
END;
$$;

REVOKE ALL ON FUNCTION public.refund_ai_credits(UUID, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.refund_ai_credits(UUID, INTEGER) FROM anon;
REVOKE ALL ON FUNCTION public.refund_ai_credits(UUID, INTEGER) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.refund_ai_credits(UUID, INTEGER) TO service_role;

-- ------------------------------------------------------------------------------
-- 5. Drop Orphan Table test_ping & 7 Temp Functions
-- ------------------------------------------------------------------------------

DROP TABLE IF EXISTS public.test_ping CASCADE;

DROP FUNCTION IF EXISTS public.clean_mock_assessments();
DROP FUNCTION IF EXISTS public.reset_assessment_items(uuid);
DROP FUNCTION IF EXISTS public.seed_120_benchmark();
DROP FUNCTION IF EXISTS public.seed_baseline_assessment();
DROP FUNCTION IF EXISTS public.seed_bench_part1();
DROP FUNCTION IF EXISTS public.seed_bench_part2();
DROP FUNCTION IF EXISTS public.seed_learning_paths();

-- ------------------------------------------------------------------------------
-- 6. Drop Duplicate Foreign Keys on 5 Collaboration Tables
-- (Preserve fk_*_profiles pointing to profiles(id), drop *_user_id_fkey to auth.users)
-- ------------------------------------------------------------------------------

ALTER TABLE public.class_members DROP CONSTRAINT IF EXISTS class_members_user_id_fkey;
ALTER TABLE public.class_posts DROP CONSTRAINT IF EXISTS class_posts_author_id_fkey;
ALTER TABLE public.class_post_replies DROP CONSTRAINT IF EXISTS class_post_replies_author_id_fkey;
ALTER TABLE public.class_messages DROP CONSTRAINT IF EXISTS class_messages_sender_id_fkey;
ALTER TABLE public.class_files DROP CONSTRAINT IF EXISTS class_files_uploader_id_fkey;

-- ------------------------------------------------------------------------------
-- 7. Seed Curated Course Catalog (from 06_course_catalog_seed.sql)
-- ------------------------------------------------------------------------------

INSERT INTO public.course_catalog (
    id, title, provider, official_url, domain_codes, level, language, format, duration, price_type, review_status, short_description, learning_outcomes
) VALUES
-- D1: Thông tin & Dữ liệu
(
    'course_d1_01',
    'Kiểm chứng Thông tin số & Nhận diện Tin giả',
    'Google Digital Garage & Poynter',
    'https://grow.google/certificates/',
    ARRAY['D1'],
    'Cơ bản (Level 1-2)',
    'vi',
    'Trực tuyến (Online)',
    '1-2 tuần (6 giờ)',
    'FREE',
    'APPROVED',
    'Phương pháp thẩm định nguồn tin trực tuyến, xác minh độ tin cậy của bài báo, video và hình ảnh trên mạng xã hội.',
    ARRAY['Đánh giá độ tin cậy của nguồn thông tin', 'Phát hiện hình ảnh và video bị cắt ghép', 'Tra cứu chéo dữ liệu đa nguồn']
),
(
    'course_d1_02',
    'Nhập môn Quản trị & Phân tích Dữ liệu số',
    'Google & Coursera',
    'https://www.coursera.org/professional-certificates/google-data-analytics',
    ARRAY['D1'],
    'Trung cấp (Level 2-3)',
    'vi',
    'Trực tuyến (Online)',
    '3-4 tuần (15 giờ)',
    'FREE',
    'APPROVED',
    'Cơ sở dữ liệu bảng tính, tổ chức lưu trữ đám mây an toàn và trực quan hóa dữ liệu phục vụ báo cáo số.',
    ARRAY['Tổ chức và phân loại tập dữ liệu số', 'Truy vấn và lọc dữ liệu nâng cao', 'Trực quan hóa biểu đồ phân tích']
),

-- D2: Giao tiếp & Hợp tác
(
    'course_d2_01',
    'Kỹ năng Cộng tác & Làm việc Nhóm trên Môi trường Số',
    'Microsoft & LinkedIn Learning',
    'https://opportunity.linkedin.com/',
    ARRAY['D2'],
    'Cơ bản (Level 1-2)',
    'vi',
    'Trực tuyến (Online)',
    '2 tuần (8 giờ)',
    'FREE',
    'APPROVED',
    'Sử dụng các công cụ cộng tác trực tuyến (Teams, Slack, Trello, Google Workspace) để phối hợp hiệu quả trong dự án.',
    ARRAY['Quản lý kênh giao tiếp đa phương tiện', 'Phối hợp xử lý văn bản đồng bộ theo thời gian thực', 'Quy tắc ứng xử chuyên nghiệp trong email']
),
(
    'course_d2_02',
    'Quản trị Danh tính số & Văn hóa Ứng xử Mạng',
    'Cục An toàn Thông tin - Bộ TT&TT',
    'https://ais.gov.vn/',
    ARRAY['D2'],
    'Trung cấp (Level 2-3)',
    'vi',
    'Trực tuyến (Online)',
    '1-2 tuần (5 giờ)',
    'FREE',
    'APPROVED',
    'Xây dựng và bảo vệ uy tín cá nhân trên Internet, kỹ năng phản hồi văn minh và phòng ngừa bắt nạt mạng.',
    ARRAY['Kiểm soát dấu chân kỹ thuật số (Digital Footprint)', 'Ứng xử chuẩn mực trên các diễn đàn công cộng', 'Bảo vệ quyền riêng tư trong hội thoại nhóm']
),

-- D3: Sáng tạo Nội dung số
(
    'course_d3_01',
    'Sáng tạo Nội dung Đa phương tiện & Ứng dụng AI Hỗ trợ',
    'UNESCO & OpenClassrooms',
    'https://openclassrooms.com/',
    ARRAY['D3'],
    'Trung cấp (Level 2-3)',
    'vi',
    'Trực tuyến (Online)',
    '2-3 tuần (10 giờ)',
    'FREE',
    'APPROVED',
    'Thiết kế ấn phẩm truyền thông số, biên tập hình ảnh/âm thanh và sử dụng AI sinh tổng hợp đúng chuẩn đạo đức.',
    ARRAY['Biên tập đồ họa số với công cụ mã nguồn mở', 'Tạo prompt chuẩn cho AI hỗ trợ soạn thảo', 'Chuyển đổi định dạng tệp tin tối ưu web']
),
(
    'course_d3_02',
    'Bản quyền Số, Sở hữu Trí tuệ & Giấy phép Creative Commons',
    'Creative Commons Global',
    'https://certificates.creativecommons.org/',
    ARRAY['D3'],
    'Nâng cao (Level 3-4)',
    'vi',
    'Trực tuyến (Online)',
    '1 tuần (4 giờ)',
    'FREE',
    'APPROVED',
    'Hiểu rõ luật sở hữu trí tuệ số, cách trích dẫn bản quyền tác giả và cấp phép tài nguyên giáo dục mở (OER).',
    ARRAY['Phân biệt các loại giấy phép CC BY, CC NC, CC SA', 'Trích dẫn nguồn tư liệu số chuẩn học thuật', 'Đăng ký bảo hộ sản phẩm số cá nhân']
),

-- D4: An toàn & Bảo mật
(
    'course_d4_01',
    'Bảo mật Thông tin Cá nhân & Phòng chống Lừa đảo Trực tuyến',
    'Hiệp hội An toàn Thông tin Việt Nam (VNISA)',
    'https://vnisa.org.vn/',
    ARRAY['D4'],
    'Cơ bản (Level 1-2)',
    'vi',
    'Trực tuyến (Online)',
    '1-2 tuần (6 giờ)',
    'FREE',
    'APPROVED',
    'Nhận biết các hình thức tấn công lừa đảo (Phishing), thiết lập xác thực đa yếu tố (MFA) và bảo vệ tài khoản số.',
    ARRAY['Phát hiện liên kết và email mạo danh lừa đảo', 'Cấu hình bảo mật 2 lớp cho email và ngân hàng', 'Quản lý mật khẩu mạnh với Password Manager']
),
(
    'course_d4_02',
    'Bảo vệ Sức khỏe Số & An toàn Thiết bị Đầu cuối',
    'Bộ Y Tế & Tổ chức Y Tế Thế Giới (WHO)',
    'https://www.who.int/',
    ARRAY['D4'],
    'Cơ bản (Level 1-2)',
    'vi',
    'Trực tuyến (Online)',
    '1 tuần (4 giờ)',
    'FREE',
    'APPROVED',
    'Công thái học khi làm việc với màn hình, điều tiết thời gian sử dụng thiết bị (Digital Detox) và xử lý rác thải điện tử.',
    ARRAY['Thực hành tư thế ngồi đúng chuẩn công thái học', 'Cài đặt giới hạn thời gian màn hình', 'Bảo quản và tái chế thiết bị điện tử an toàn']
),

-- D5: Giải quyết Vấn đề
(
    'course_d5_01',
    'Tư duy Tính toán & Xử lý Sự cố Kỹ thuật Thường gặp',
    'IBM SkillsBuild & EdX',
    'https://skillsbuild.org/',
    ARRAY['D5'],
    'Trung cấp (Level 2-3)',
    'vi',
    'Trực tuyến (Online)',
    '2-3 tuần (8 giờ)',
    'FREE',
    'APPROVED',
    'Quy trình chẩn đoán lỗi phần mềm, giải quyết sự cố mạng Internet cơ bản và tự khắc phục lỗi hệ điều hành.',
    ARRAY['Chẩn đoán lỗi mất kết nối mạng và DNS', 'Quản lý tiến trình và gỡ cài đặt phần mềm xung đột', 'Tìm kiếm giải pháp kỹ thuật trên diễn đàn uy tín']
),
(
    'course_d5_02',
    'Tự động hóa Quy trình Công việc bằng Trí tuệ Nhân tạo',
    'DeepLearning.AI & Coursera',
    'https://www.deeplearning.ai/',
    ARRAY['D5'],
    'Nâng cao (Level 3-4)',
    'vi',
    'Trực tuyến (Online)',
    '3-4 tuần (12 giờ)',
    'FREE',
    'APPROVED',
    'Ứng dụng AI agents và công cụ tự động hóa không mã (No-Code) để tối ưu hóa quy trình làm việc và học tập số.',
    ARRAY['Thiết lập luồng tự động hóa công việc lặp lại', 'Kết nối các ứng dụng số qua Webhook và API', 'Đánh giá tính khả thi khi áp dụng công nghệ mới']
)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    provider = EXCLUDED.provider,
    official_url = EXCLUDED.official_url,
    domain_codes = EXCLUDED.domain_codes,
    short_description = EXCLUDED.short_description,
    learning_outcomes = EXCLUDED.learning_outcomes;
