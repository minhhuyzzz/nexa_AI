-- ==============================================================================
-- NEXA AI SUBSCRIPTIONS, USER TRIAL HISTORY & STANDARDIZED SERVICE PLANS SCHEMA
-- Migration: 55_subscriptions_and_standardized_service_plans.sql
-- ==============================================================================

-- 1. EXTEND SERVICE_PLANS TABLE WITH GRANULAR QUOTAS & TRIAL ATTRIBUTES
ALTER TABLE public.service_plans 
ADD COLUMN IF NOT EXISTS badge TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS trial_days INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS annual_price_vnd NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS yearly_monthly_equivalent NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_classes INTEGER NOT NULL DEFAULT 2,
ADD COLUMN IF NOT EXISTS max_class_members INTEGER NOT NULL DEFAULT 30,
ADD COLUMN IF NOT EXISTS max_live_participants INTEGER NOT NULL DEFAULT 30,
ADD COLUMN IF NOT EXISTS unlock_advanced_exams BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sha256_certificate BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS export_csv_excel BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. CREATE SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES public.service_plans(id) ON DELETE SET NULL,
    plan_code TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED')),
    starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
    trial_ended_at TIMESTAMPTZ,
    auto_renew BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON public.subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires_at ON public.subscriptions(expires_at);

-- 3. CREATE USER_TRIAL_HISTORY TABLE (Prevents duplicate trial abuse)
CREATE TABLE IF NOT EXISTS public.user_trial_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_code TEXT NOT NULL,
    trial_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    trial_expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_trial_plan UNIQUE (user_id, plan_code)
);

CREATE INDEX IF NOT EXISTS idx_user_trial_lookup ON public.user_trial_history(user_id, plan_code);

-- 4. UPSERT 4 STANDARDIZED SERVICE PLANS
INSERT INTO public.service_plans (
    code, role_target, name, badge, description, price_vnd, annual_price_vnd, 
    yearly_monthly_equivalent, trial_days, credits_included, max_classes, 
    max_class_members, max_live_participants, unlock_advanced_exams, 
    sha256_certificate, export_csv_excel, features, is_active, sort_order
)
VALUES 
    (
        'BASIC', 'LEARNER', 'Gói Cơ Bản', 'TRẢI NGHIỆM', 
        'Khảo sát năng lực số cơ bản và lưu trữ hồ sơ cá nhân.', 
        0, 0, 0, 0, 10, 2, 30, 30, FALSE, TRUE, FALSE,
        '["Khảo sát các miền năng lực số chuẩn hóa", "Lưu trữ hồ sơ năng lực số cá nhân", "Cấp chứng chỉ số khi hoàn thành bài thi", "Tối đa 2 nhóm lớp (30 học viên/nhóm)", "Mở phòng thi trực tiếp mã PIN (30 thí sinh)", "10 AI credits / tháng"]'::jsonb, 
        TRUE, 1
    ),
    (
        'STANDARD', 'LEARNER', 'Gói Tiêu Chuẩn', 'PHỔ BIẾN NHẤT', 
        'Mở khóa trọn vẹn các miền bồi dưỡng và cấp chứng chỉ số.', 
        49000, 468000, 39000, 30, 100, 10, 100, 100, TRUE, TRUE, FALSE,
        '["Toàn bộ quyền lợi gói Cơ Bản", "Tặng 30 ngày dùng thử 0đ tháng đầu tiên", "Mở trọn vẹn các miền năng lực số và học liệu bồi dưỡng", "Lộ trình học tập cá nhân hóa", "Tối đa 10 nhóm lớp (100 học viên/nhóm)", "Mở phòng thi trực tiếp mã PIN (100 thí sinh)", "100 AI credits / tháng"]'::jsonb, 
        TRUE, 2
    ),
    (
        'ADVANCED', 'LEARNER', 'Gói Nâng Cao', 'TOÀN DIỆN', 
        'Dành cho cá nhân bồi dưỡng chuyên sâu và tổ chức thi trực tiếp.', 
        149000, 1428000, 119000, 0, 500, 9999, 500, 500, TRUE, TRUE, TRUE,
        '["Toàn bộ quyền lợi gói Tiêu Chuẩn", "Không giới hạn nhóm lớp (500 học viên/nhóm)", "Mở phòng thi trực tiếp mã PIN (500 thí sinh)", "500 AI credits / tháng", "Xuất bảng điểm Excel, CSV và dữ liệu nghiên cứu"]'::jsonb, 
        TRUE, 3
    ),
    (
        'ENTERPRISE', 'ORGANIZATION', 'Gói Tổ Chức', 'TRƯỜNG HỌC VÀ DOANH NGHIỆP', 
        'Khảo thí diện rộng toàn trường, hội đồng chấm tập trung và chứng nhận đơn vị.', 
        0, 0, 0, 0, 10000, 99999, 50000, 50000, TRUE, TRUE, TRUE,
        '["Khảo thí diện rộng theo đợt cho đơn vị (Campaigns)", "Báo cáo và thống kê năng lực số cấp tổ chức", "Cấp chứng chỉ số gắn tên và logo đơn vị", "Hợp đồng dịch vụ, hóa đơn VAT và cam kết hỗ trợ"]'::jsonb, 
        TRUE, 4
    ),
    -- Backward compatibility aliases
    (
        'LEARNER_FREE', 'LEARNER', 'Gói Cơ Bản (Alias)', 'TRẢI NGHIỆM', 
        'Khảo sát năng lực số cơ bản và lưu trữ hồ sơ cá nhân.', 
        0, 0, 0, 0, 10, 2, 30, 30, FALSE, FALSE, FALSE,
        '["Tối đa 2 nhóm lớp (30 học viên/nhóm)", "10 AI credits / tháng", "Khảo thí chuẩn hóa & mở 1 miền bồi dưỡng", "Lưu trữ hồ sơ năng lực số cá nhân"]'::jsonb, 
        FALSE, 10
    ),
    (
        'LEARNER_PLUS', 'LEARNER', 'Gói Tiêu Chuẩn (Alias)', 'PHỔ BIẾN NHẤT', 
        'Mở khóa trọn vẹn các miền bồi dưỡng và cấp chứng chỉ số.', 
        49000, 468000, 39000, 30, 100, 10, 100, 100, TRUE, TRUE, FALSE,
        '["Mở trọn vẹn các miền năng lực số & trạm bồi dưỡng", "Tối đa 10 nhóm lớp (100 học viên/nhóm)", "100 AI credits / tháng", "Chứng chỉ số", "Lộ trình học tập cá nhân hóa"]'::jsonb, 
        FALSE, 11
    ),
    (
        'LEARNER_PRO', 'LEARNER', 'Gói Nâng Cao (Alias)', 'TOÀN DIỆN', 
        'Dành cho cá nhân bồi dưỡng chuyên sâu và tổ chức thi trực tiếp.', 
        149000, 1428000, 119000, 0, 500, 9999, 500, 500, TRUE, TRUE, TRUE,
        '["Toàn bộ quyền lợi gói Tiêu Chuẩn", "Không giới hạn nhóm lớp (500 học viên/nhóm)", "500 AI credits / tháng", "Mở phòng thi trực tiếp mã PIN thời gian thực", "Xuất bảng điểm Excel, CSV & dữ liệu nghiên cứu"]'::jsonb, 
        FALSE, 12
    ),
    (
        'ORG_CAMPUS', 'ORGANIZATION', 'Gói Tổ Chức (Alias)', 'TRƯỜNG HỌC & DOANH NGHIỆP', 
        'Hệ thống đánh giá năng lực số toàn diện cho trường học hoặc tổ chức.', 
        0, 0, 0, 0, 10000, 99999, 50000, 50000, TRUE, TRUE, TRUE,
        '["Khảo thí diện rộng theo đợt (Campaigns)", "Báo cáo độ trưởng thành số cấp đơn vị", "Bàn chấm hội đồng tập trung & chấm chéo", "Chứng chỉ số gắn Logo thương hiệu riêng", "Tích hợp SSO & LMS", "Hợp đồng pháp lý, hóa đơn VAT"]'::jsonb, 
        FALSE, 13
    )
ON CONFLICT (code) DO UPDATE 
SET name = EXCLUDED.name,
    badge = EXCLUDED.badge,
    description = EXCLUDED.description,
    price_vnd = EXCLUDED.price_vnd,
    annual_price_vnd = EXCLUDED.annual_price_vnd,
    yearly_monthly_equivalent = EXCLUDED.yearly_monthly_equivalent,
    trial_days = EXCLUDED.trial_days,
    credits_included = EXCLUDED.credits_included,
    max_classes = EXCLUDED.max_classes,
    max_class_members = EXCLUDED.max_class_members,
    max_live_participants = EXCLUDED.max_live_participants,
    unlock_advanced_exams = EXCLUDED.unlock_advanced_exams,
    sha256_certificate = EXCLUDED.sha256_certificate,
    export_csv_excel = EXCLUDED.export_csv_excel,
    features = EXCLUDED.features,
    is_active = EXCLUDED.is_active,
    sort_order = EXCLUDED.sort_order;

-- 5. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_trial_history ENABLE ROW LEVEL SECURITY;

-- Subscriptions viewable by owner or service/admin
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'subscriptions' AND policyname = 'subscriptions_user_policy'
    ) THEN
        CREATE POLICY subscriptions_user_policy ON public.subscriptions
            FOR SELECT USING (user_id = auth.uid() OR public.is_admin_or_service());
    END IF;
END $$;

-- Subscriptions modifiable only by admin or service
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'subscriptions' AND policyname = 'subscriptions_admin_service_policy'
    ) THEN
        CREATE POLICY subscriptions_admin_service_policy ON public.subscriptions
            FOR ALL USING (public.is_admin_or_service());
    END IF;
END $$;

-- User trial history readable by user, modifiable by admin/service
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_trial_history' AND policyname = 'user_trial_history_read_policy'
    ) THEN
        CREATE POLICY user_trial_history_read_policy ON public.user_trial_history
            FOR SELECT USING (user_id = auth.uid() OR public.is_admin_or_service());
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_trial_history' AND policyname = 'user_trial_history_admin_service_policy'
    ) THEN
        CREATE POLICY user_trial_history_admin_service_policy ON public.user_trial_history
            FOR ALL USING (public.is_admin_or_service());
    END IF;
END $$;

-- 6. GRANT PERMISSIONS
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT SELECT ON public.user_trial_history TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
GRANT ALL ON public.user_trial_history TO service_role;
