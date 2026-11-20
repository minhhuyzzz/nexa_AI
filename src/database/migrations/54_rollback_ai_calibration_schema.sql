-- ============================================================================
-- ROLLBACK MIGRATION 54: AI CALIBRATION AND HITL AUDIT SCHEMA
-- File: src/database/migrations/54_rollback_ai_calibration_schema.sql
-- ============================================================================

DROP POLICY IF EXISTS "org_assessors_select_ai_calibration_logs" ON public.ai_calibration_logs;
DROP POLICY IF EXISTS "platform_admin_select_ai_calibration_logs" ON public.ai_calibration_logs;
DROP POLICY IF EXISTS "service_role_all_ai_calibration_logs" ON public.ai_calibration_logs;

DROP TABLE IF EXISTS public.ai_calibration_logs CASCADE;
