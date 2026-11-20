-- ============================================================================
-- ROLLBACK MIGRATION 53: PERSONAL AI QUESTION EXPLANATIONS CACHE
-- File: src/database/migrations/53_rollback_personal_ai_explanations.sql
-- ============================================================================

DROP POLICY IF EXISTS "Service role full access on question explanations" ON public.ai_question_explanations;
DROP POLICY IF EXISTS "Users can read own question explanations" ON public.ai_question_explanations;

DROP INDEX IF EXISTS public.idx_ai_question_explanations_item;
DROP INDEX IF EXISTS public.idx_ai_question_explanations_req;
DROP INDEX IF EXISTS public.idx_ai_question_explanations_lookup;
DROP INDEX IF EXISTS public.idx_ai_question_explanations_user;
DROP INDEX IF EXISTS public.idx_ai_question_explanations_q_version;

DROP TABLE IF EXISTS public.ai_question_explanations;
