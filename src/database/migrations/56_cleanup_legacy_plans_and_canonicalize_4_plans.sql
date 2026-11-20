-- ==============================================================================
-- NEXA AI: CLEANUP LEGACY SERVICE PLANS & ENFORCE 4 CANONICAL PLANS
-- Migration: 56_cleanup_legacy_plans_and_canonicalize_4_plans.sql
-- ==============================================================================

-- 1. DEACTIVATE ALL LEGACY PLANS (Evaluator & Learner fragmented plans)
UPDATE public.service_plans 
SET is_active = FALSE 
WHERE code IN (
    'EVALUATOR_FREE', 
    'EVALUATOR_PLUS', 
    'EVALUATOR_PRO', 
    'LEARNER_FREE', 
    'LEARNER_PLUS', 
    'LEARNER_PRO', 
    'ORG_CAMPUS'
);

-- 2. ENSURE THE 4 CANONICAL PLANS ARE STRICTLY ACTIVE AND CONFIGURED
UPDATE public.service_plans 
SET is_active = TRUE 
WHERE code IN ('BASIC', 'STANDARD', 'ADVANCED', 'ENTERPRISE');

-- If canonical plans do not exist for any reason, upsert them with exact canonical properties
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
    is_active = TRUE,
    sort_order = EXCLUDED.sort_order;

-- 3. MIGRATE ALL EXISTING PROFILES PLAN_TIER TO THE 4 CANONICAL CODES
UPDATE public.profiles
SET plan_tier = 'BASIC'
WHERE plan_tier IN ('FREE', 'LEARNER_FREE', 'EVALUATOR_FREE') OR plan_tier IS NULL;

UPDATE public.profiles
SET plan_tier = 'STANDARD'
WHERE plan_tier IN ('PLUS', 'LEARNER_PLUS', 'EVALUATOR_PLUS');

UPDATE public.profiles
SET plan_tier = 'ADVANCED'
WHERE plan_tier IN ('PRO', 'LEARNER_PRO', 'EVALUATOR_PRO');

UPDATE public.profiles
SET plan_tier = 'ENTERPRISE'
WHERE plan_tier IN ('ORG_CAMPUS', 'BUSINESS');
