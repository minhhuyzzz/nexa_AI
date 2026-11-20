-- ==============================================================================
-- NEXA AI: ROLLBACK MIGRATION 56
-- Migration: 56_rollback_cleanup_legacy_plans.sql
-- ==============================================================================

-- Revert activation status if needed
UPDATE public.service_plans 
SET is_active = TRUE 
WHERE code IN ('LEARNER_FREE', 'LEARNER_PLUS', 'LEARNER_PRO', 'ORG_CAMPUS');
