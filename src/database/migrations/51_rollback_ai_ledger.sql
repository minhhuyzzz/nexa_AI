-- ============================================================================
-- ROLLBACK MIGRATION 51: HOÀN TÁC CHÍNH SÁCH TÁC VỤ AI & SỔ CÁI CREDITS NGUYÊN TỬ
-- File: src/database/migrations/51_rollback_ai_ledger.sql
-- ============================================================================

DROP FUNCTION IF EXISTS public.reconcile_ai_credit_reservations(INTEGER);
DROP FUNCTION IF EXISTS public.release_ai_credits(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.settle_ai_credits(TEXT, UUID);
DROP FUNCTION IF EXISTS public.reserve_ai_credits(TEXT, TEXT, UUID, INTEGER, TEXT, UUID, UUID, UUID, INTEGER, TEXT);

ALTER TABLE public.ai_credit_reservations
    DROP COLUMN IF EXISTS task_type,
    DROP COLUMN IF EXISTS feature,
    DROP COLUMN IF EXISTS idempotent_hash,
    DROP COLUMN IF EXISTS campaign_id,
    DROP COLUMN IF EXISTS entitlement_id,
    DROP COLUMN IF EXISTS submission_id,
    DROP COLUMN IF EXISTS item_id,
    DROP COLUMN IF EXISTS artifact_id,
    DROP COLUMN IF EXISTS execution_deadline_at,
    DROP COLUMN IF EXISTS release_reason;

ALTER TABLE public.ai_evaluations
    DROP COLUMN IF EXISTS request_id;

ALTER TABLE public.ai_usage_events
    DROP COLUMN IF EXISTS request_id;

DROP TABLE IF EXISTS public.ai_task_policies;
