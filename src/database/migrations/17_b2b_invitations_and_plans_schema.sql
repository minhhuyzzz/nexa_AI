-- ==============================================================================
-- NEXA B2B INVITATIONS, SERVICE PLANS & PAYMENT TRANSACTIONS SCHEMA
-- Migration: 17_b2b_invitations_and_plans_schema.sql
-- ==============================================================================

-- 1. SERVICE PLANS TABLE
CREATE TABLE IF NOT EXISTS public.service_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    role_target TEXT NOT NULL DEFAULT 'EVALUATOR' CHECK (role_target IN ('LEARNER', 'EVALUATOR', 'ORGANIZATION')),
    name TEXT NOT NULL,
    description TEXT,
    price_vnd NUMERIC NOT NULL DEFAULT 0,
    billing_cycle TEXT NOT NULL DEFAULT 'MONTHLY' CHECK (billing_cycle IN ('ONE_TIME', 'MONTHLY', 'YEARLY')),
    credits_included INTEGER NOT NULL DEFAULT 0,
    max_members INTEGER NOT NULL DEFAULT 1,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_plans_code ON public.service_plans(code);
CREATE INDEX IF NOT EXISTS idx_service_plans_role_target ON public.service_plans(role_target);

-- 2. ORGANIZATION INVITATIONS TABLE
CREATE TABLE IF NOT EXISTS public.organization_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    org_role TEXT NOT NULL DEFAULT 'EVALUATOR' CHECK (org_role IN ('ORG_ADMIN', 'EVALUATOR', 'MEMBER')),
    token TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED')),
    invited_by UUID NOT NULL REFERENCES public.profiles(id),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    accepted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_org_invitations_token ON public.organization_invitations(token);
CREATE INDEX IF NOT EXISTS idx_org_invitations_org_email ON public.organization_invitations(organization_id, email);

-- 3. PAYMENT TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    plan_id UUID REFERENCES public.service_plans(id) ON DELETE SET NULL,
    plan_code TEXT NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'VND',
    provider TEXT NOT NULL DEFAULT 'VIETQR',
    transaction_reference TEXT NOT NULL UNIQUE,
    idempotency_key TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED')),
    raw_payload JSONB DEFAULT '{}'::jsonb,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_tx_user ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_tx_ref ON public.payment_transactions(transaction_reference);
CREATE INDEX IF NOT EXISTS idx_payment_tx_idempotency ON public.payment_transactions(idempotency_key);

-- 4. ATOMIC PAYMENT FULFILLMENT RPC
CREATE OR REPLACE FUNCTION public.fulfill_payment_transaction(
    p_transaction_id UUID,
    p_provider_ref TEXT DEFAULT NULL,
    p_raw_payload JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tx RECORD;
    v_plan RECORD;
    v_credits INTEGER := 0;
BEGIN
    SELECT * INTO v_tx
    FROM public.payment_transactions
    WHERE id = p_transaction_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Transaction not found');
    END IF;

    IF v_tx.status = 'SUCCESS' THEN
        RETURN jsonb_build_object('success', true, 'message', 'Already fulfilled', 'status', 'SUCCESS');
    END IF;

    -- Lookup plan for credits and tier
    SELECT * INTO v_plan
    FROM public.service_plans
    WHERE code = v_tx.plan_code;

    IF FOUND THEN
        v_credits := COALESCE(v_plan.credits_included, 0);
    END IF;

    -- Update transaction record
    UPDATE public.payment_transactions
    SET status = 'SUCCESS',
        verified_at = NOW(),
        updated_at = NOW(),
        raw_payload = COALESCE(p_raw_payload, raw_payload)
    WHERE id = p_transaction_id;

    -- Upgrade user profile credits and tier
    UPDATE public.profiles
    SET plan_tier = v_tx.plan_code,
        credits = credits + v_credits,
        updated_at = NOW()
    WHERE id = v_tx.user_id;

    RETURN jsonb_build_object(
        'success', true,
        'transaction_id', p_transaction_id,
        'plan_code', v_tx.plan_code,
        'credits_added', v_credits
    );
END;
$$;

-- 5. SEED INITIAL SERVICE PLANS
INSERT INTO public.service_plans (code, role_target, name, description, price_vnd, billing_cycle, credits_included, max_members, features, sort_order)
VALUES 
    -- Learner plans
    ('LEARNER_FREE', 'LEARNER', 'Gói Khởi Động', 'Khảo sát năng lực số cơ bản và lưu trữ hồ sơ cá nhân', 0, 'MONTHLY', 10, 1, '["Làm bài thi trắc nghiệm & tình huống", "Lưu trữ hồ sơ năng lực 5 Miền", "10 AI credits chấm thử nghiệm"]'::jsonb, 1),
    ('LEARNER_PLUS', 'LEARNER', 'Gói Tiêu Chuẩn', 'Đánh giá chuyên sâu có chứng chỉ số và trích dẫn bằng chứng', 49000, 'MONTHLY', 100, 1, '["Không giới hạn bài khảo thí", "Chứng chỉ số có mã QR tra cứu Kiosk", "100 AI credits chấm Rubric", "Lộ trình học tập cá nhân hóa 4 bước"]'::jsonb, 2),
    ('LEARNER_PRO', 'LEARNER', 'Gói Chuyên Nghiệp', 'Dành cho sinh viên & nhân sự chuẩn bị hồ sơ tuyển dụng cao cấp', 149000, 'MONTHLY', 500, 1, '["Toàn bộ quyền lợi gói Plus", "500 AI credits / tháng", "Phân tích khoảng trống năng lực chi tiết", "Ưu tiên cấp chứng chỉ thẩm định"]'::jsonb, 3),

    -- Evaluator plans
    ('EVALUATOR_FREE', 'EVALUATOR', 'Gói Giảng Viên Tự Do', 'Tổ chức lớp học nhỏ và khảo nghiệm năng lực người học', 0, 'MONTHLY', 20, 30, '["Tối đa 1 nhóm lớp (30 học viên)", "Ngân hàng câu hỏi cơ bản", "20 AI credits chấm Rubric", "Phòng thi trực tiếp PIN/QR"]'::jsonb, 10),
    ('EVALUATOR_PLUS', 'EVALUATOR', 'Gói Giảng Dạy Tiêu Chuẩn', 'Giảng dạy quy mô bộ môn với ngân hàng đề phong phú', 69000, 'MONTHLY', 250, 150, '["Tối đa 5 nhóm lớp (150 học viên)", "250 AI credits chấm Rubric / tháng", "Xuất báo cáo PDF & Excel", "Timeline giám sát chuyển tab thí sinh"]'::jsonb, 11),
    ('EVALUATOR_PRO', 'EVALUATOR', 'Gói Chuyên Gia Khảo Thí', 'Không giới hạn nhóm lớp, ngân hàng đề riêng và kiểm định tự động', 199000, 'MONTHLY', 1000, 9999, '["Không giới hạn nhóm lớp & học viên", "1.000 AI credits chấm Rubric / tháng", "Pre-publish Gate kiểm định đề thi", "Không gian làm việc tổ chức B2B", "Hỗ trợ kỹ thuật ưu tiên"]'::jsonb, 12),

    -- Organization plan
    ('ORG_CAMPUS', 'ORGANIZATION', 'Gói Học Viện / Doanh Nghiệp', 'Hệ thống đánh giá năng lực số toàn diện cho trường học hoặc tổ chức', 0, 'YEARLY', 10000, 10000, '["Quản lý nhiều giảng viên & phòng ban", "Bảng điều khiển hạn mức AI tập trung", "Tùy biến khung năng lực nội bộ", "Cam kết SLA & Hỗ trợ kỹ thuật 24/7"]'::jsonb, 20)
ON CONFLICT (code) DO UPDATE 
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    price_vnd = EXCLUDED.price_vnd,
    credits_included = EXCLUDED.credits_included,
    max_members = EXCLUDED.max_members,
    features = EXCLUDED.features;

-- 6. ENABLE RLS
ALTER TABLE public.service_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Service plans are readable by everyone
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'service_plans' AND policyname = 'service_plans_read_policy'
    ) THEN
        CREATE POLICY service_plans_read_policy ON public.service_plans
            FOR SELECT USING (true);
    END IF;
END $$;

-- Payment transactions viewable by owner or service
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'payment_transactions' AND policyname = 'payment_transactions_user_policy'
    ) THEN
        CREATE POLICY payment_transactions_user_policy ON public.payment_transactions
            FOR SELECT USING (user_id = auth.uid() OR public.is_admin_or_service());
    END IF;
END $$;

-- Invitations viewable by invitee or org admin
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'organization_invitations' AND policyname = 'organization_invitations_policy'
    ) THEN
        CREATE POLICY organization_invitations_policy ON public.organization_invitations
            FOR ALL USING (
                email = (SELECT email FROM public.profiles WHERE id = auth.uid())
                OR invited_by = auth.uid()
                OR public.is_admin_or_service()
            );
    END IF;
END $$;

-- Grant access
GRANT SELECT ON public.service_plans TO anon, authenticated;
GRANT ALL ON public.organization_invitations TO authenticated;
GRANT ALL ON public.payment_transactions TO authenticated;
GRANT EXECUTE ON FUNCTION public.fulfill_payment_transaction(UUID, TEXT, JSONB) TO authenticated;
