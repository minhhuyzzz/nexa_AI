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
        0, 0, 0, 0, 10, 2, 30, 30, FALSE, FALSE, FALSE,
        '["Khảo thí chuẩn hóa năng lực số đầu vào", "Mở 1 miền bồi dưỡng & lưu trữ hồ sơ cá nhân", "10 AI credits / tháng", "Tối đa 2 nhóm lớp (30 học viên/nhóm)", "Phòng thi trực tiếp tối đa 30 thí sinh"]'::jsonb, 
        TRUE, 1
    ),
    (
        'STANDARD', 'LEARNER', 'Gói Tiêu Chuẩn', 'PHỔ BIẾN NHẤT', 
        'Mở khóa trọn vẹn các miền bồi dưỡng và cấp chứng chỉ số.', 
        49000, 468000, 39000, 30, 100, 10, 100, 100, TRUE, TRUE, FALSE,
        '["Mở trọn vẹn các miền năng lực số & trạm bồi dưỡng", "Lộ trình học tập cá nhân hóa được hỗ trợ bởi AI", "Cấp chứng chỉ số chính thức có mã QR", "100 AI credits / tháng", "Tối đa 10 nhóm lớp (100 học viên/nhóm)", "Phòng thi trực tiếp tối đa 100 thí sinh", "Phân tích kết quả học tập tự động"]'::jsonb, 
        TRUE, 2
    ),
    (
        'ADVANCED', 'LEARNER', 'Gói Nâng Cao', 'TOÀN DIỆN', 
        'Dành cho cá nhân bồi dưỡng chuyên sâu và tổ chức thi trực tiếp.', 
        149000, 1428000, 119000, 0, 500, 9999, 500, 500, TRUE, TRUE, TRUE,
        '["Toàn bộ quyền lợi Gói Tiêu Chuẩn", "Không giới hạn nhóm lớp (500 học viên/nhóm)", "Mở phòng thi trực tiếp mã PIN thời gian thực (500 thí sinh)", "500 AI credits chuyên sâu / tháng", "Xuất bảng điểm Excel, CSV & dữ liệu nghiên cứu", "Bàn chấm Split-view & AI hỗ trợ gợi ý", "Ưu tiên xếp hạng và vinh danh hồ sơ năng lực"]'::jsonb, 
        TRUE, 3
    ),
    (
        'ENTERPRISE', 'ORGANIZATION', 'Gói Tổ Chức', 'TRƯỜNG HỌC & DOANH NGHIỆP', 
        'Khảo thí diện rộng toàn trường, hội đồng chấm tập trung & cấp chứng nhận đồng thương hiệu.', 
        0, 0, 0, 0, 10000, 99999, 50000, 50000, TRUE, TRUE, TRUE,
        '["Khảo thí diện rộng theo đợt tập trung (Campaigns)", "Báo cáo độ trưởng thành số cấp đơn vị", "Bàn chấm hội đồng tập trung & chấm chéo bảo mật", "Chứng chỉ số gắn Logo thương hiệu riêng", "Tích hợp SSO & LMS (Canvas, Moodle...)", "Hợp đồng pháp lý, hóa đơn VAT & cam kết SLA 99.9%"]'::jsonb, 
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
