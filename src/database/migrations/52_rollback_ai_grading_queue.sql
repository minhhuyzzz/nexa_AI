-- ============================================================================
-- ROLLBACK MIGRATION 52: AI JOBS & HITL GRADING QUEUE SCHEMA
-- File: src/database/migrations/52_rollback_ai_grading_queue.sql
-- ============================================================================

DROP TRIGGER IF EXISTS trg_ai_grading_jobs_updated_at ON public.ai_grading_jobs;
DROP FUNCTION IF EXISTS public.set_ai_grading_jobs_updated_at();

DROP POLICY IF EXISTS "assessor_update_hitl_ai_grading_jobs" ON public.ai_grading_jobs;
DROP POLICY IF EXISTS "assessor_select_ai_grading_jobs" ON public.ai_grading_jobs;
DROP POLICY IF EXISTS "org_admin_owner_select_ai_grading_jobs" ON public.ai_grading_jobs;
DROP POLICY IF EXISTS "service_role_all_ai_grading_jobs" ON public.ai_grading_jobs;

DROP TABLE IF EXISTS public.ai_grading_jobs CASCADE;
