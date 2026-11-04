-- ==============================================================================
-- NEXA MIGRATION 42: SYSTEM BASELINE ASSESSMENT & ENTITLEMENTS HARDENING (P0)
-- ==============================================================================
-- 1. Adds is_system_baseline & system_code to assessments to establish an official,
--    immutable anchor for the 5-domain diagnostic baseline assessment (UC-A28, UC-P02).
-- 2. Prevents personal learner dashboard from querying user-authored tests as baseline.
-- 3. Sets canonical UUID a0000000-0000-0000-0000-000000000001 as the active system baseline.
-- 4. Records baseline_assessment_id in platform_settings for persistent configuration.

-- 1. Add baseline and system identification columns to assessments
ALTER TABLE public.assessments 
ADD COLUMN IF NOT EXISTS is_system_baseline BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS system_code TEXT UNIQUE;

-- 2. Create partial index for ultra-fast lookup of the official baseline assessment
CREATE INDEX IF NOT EXISTS idx_assessments_system_baseline 
ON public.assessments(is_system_baseline) 
WHERE is_system_baseline = TRUE;

CREATE INDEX IF NOT EXISTS idx_assessments_system_code 
ON public.assessments(system_code) 
WHERE system_code IS NOT NULL;

-- 3. Mark canonical baseline assessment if exists
UPDATE public.assessments 
SET 
    is_system_baseline = TRUE,
    system_code = 'BASELINE_5DOMAINS',
    visibility = 'PUBLIC',
    is_published = TRUE
WHERE id = 'a0000000-0000-0000-0000-000000000001';

-- 4. Ensure platform_settings has default baseline entry
INSERT INTO public.platform_settings (key, value, description, updated_at)
VALUES (
    'baseline_assessment_config',
    jsonb_build_object(
        'assessment_id', 'a0000000-0000-0000-0000-000000000001',
        'system_code', 'BASELINE_5DOMAINS',
        'is_active', true,
        'title', 'Đánh Giá Năng Lực Số Chuẩn 5 Miền (Khảo Thí Đầu Vào)'
    ),
    'Cấu hình đề khảo thí năng lực số đầu vào chuẩn của hệ thống (UC-A28)',
    NOW()
)
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = NOW();
