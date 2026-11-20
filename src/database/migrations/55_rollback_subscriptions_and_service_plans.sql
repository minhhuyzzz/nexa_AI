-- ==============================================================================
-- ROLLBACK: 55_rollback_subscriptions_and_service_plans.sql
-- ==============================================================================

DROP TABLE IF EXISTS public.user_trial_history CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;

DELETE FROM public.service_plans WHERE code IN ('BASIC', 'STANDARD', 'ADVANCED', 'ENTERPRISE');

ALTER TABLE public.service_plans 
DROP COLUMN IF EXISTS badge,
DROP COLUMN IF EXISTS trial_days,
DROP COLUMN IF EXISTS annual_price_vnd,
DROP COLUMN IF EXISTS yearly_monthly_equivalent,
DROP COLUMN IF EXISTS max_classes,
DROP COLUMN IF EXISTS max_class_members,
DROP COLUMN IF EXISTS max_live_participants,
DROP COLUMN IF EXISTS unlock_advanced_exams,
DROP COLUMN IF EXISTS sha256_certificate,
DROP COLUMN IF EXISTS export_csv_excel;
