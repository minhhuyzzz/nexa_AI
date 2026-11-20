-- ============================================================================
-- MIGRATION 53: PERSONAL AI QUESTION EXPLANATIONS CACHE
-- File: src/database/migrations/53_personal_ai_question_explanations_cache.sql
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TẠO BẢNG LƯU TRỮ VÀ CACHE GIẢI THÍCH CÂU HỎI BẰNG AI (ai_question_explanations)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.ai_question_explanations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL,
    item_id UUID,
    question_version INT NOT NULL DEFAULT 1,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    explanation_text TEXT NOT NULL,
    model_used TEXT NOT NULL,
    tokens_used INT DEFAULT 0,
    credit_cost INT DEFAULT 1,
    access_context JSONB DEFAULT '{}'::jsonb,
    request_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- ----------------------------------------------------------------------------
-- 2. TẠO CHỈ MỤC (INDICES)
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_ai_question_explanations_q_version 
    ON public.ai_question_explanations(question_id, question_version);

CREATE INDEX IF NOT EXISTS idx_ai_question_explanations_user 
    ON public.ai_question_explanations(user_id);

CREATE INDEX IF NOT EXISTS idx_ai_question_explanations_lookup
    ON public.ai_question_explanations(user_id, question_id, question_version);

CREATE INDEX IF NOT EXISTS idx_ai_question_explanations_req
    ON public.ai_question_explanations(request_id);

CREATE INDEX IF NOT EXISTS idx_ai_question_explanations_item
    ON public.ai_question_explanations(item_id);

-- ----------------------------------------------------------------------------
-- 3. CHÍNH SÁCH BẢO MẬT HÀNG (ROW LEVEL SECURITY - RLS)
-- ----------------------------------------------------------------------------

ALTER TABLE public.ai_question_explanations ENABLE ROW LEVEL SECURITY;

-- Người dùng chỉ được SELECT bản ghi giải thích của chính mình
DROP POLICY IF EXISTS "Users can read own question explanations" ON public.ai_question_explanations;
CREATE POLICY "Users can read own question explanations"
    ON public.ai_question_explanations
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Service role có toàn quyền (INSERT/UPDATE/DELETE/SELECT)
DROP POLICY IF EXISTS "Service role full access on question explanations" ON public.ai_question_explanations;
CREATE POLICY "Service role full access on question explanations"
    ON public.ai_question_explanations
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
