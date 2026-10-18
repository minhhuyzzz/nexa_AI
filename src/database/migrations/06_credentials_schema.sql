-- ==============================================================================
-- NEXA SCHEMA MIGRATION 06: DIGITAL CREDENTIALS & DUAL SHA-256 VERIFICATION
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    credential_code TEXT UNIQUE NOT NULL, -- e.g. 'NX-2024-XXXXXX'
    submission_id UUID NOT NULL REFERENCES public.assessment_submissions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    candidate_name TEXT NOT NULL,
    assessment_title TEXT NOT NULL,
    score_percentage DECIMAL(5,2) NOT NULL,
    total_score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    max_score DECIMAL(5,2) NOT NULL DEFAULT 100.00,
    competency_level TEXT NOT NULL DEFAULT 'ADVANCED',
    content_sha256 TEXT NOT NULL, -- Hash 1: Metadata SHA-256
    pdf_sha256 TEXT,              -- Hash 2: Generated PDF byte stream SHA-256
    pdf_url TEXT,
    qr_data TEXT,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    revoked_reason TEXT,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_submission_credential UNIQUE (submission_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_credentials_code ON public.credentials(credential_code);
CREATE INDEX IF NOT EXISTS idx_credentials_sub ON public.credentials(submission_id);
CREATE INDEX IF NOT EXISTS idx_credentials_user ON public.credentials(user_id);

-- Enable RLS 100%
ALTER TABLE public.credentials ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- RLS POLICIES
-- ------------------------------------------------------------------------------

-- Public (unauthenticated & authenticated) can view credentials for QR Kiosk Verification
DROP POLICY IF EXISTS "Public can verify credentials" ON public.credentials;
CREATE POLICY "Public can verify credentials"
    ON public.credentials FOR SELECT
    USING (true);

-- Authenticated users can insert their own earned credential
DROP POLICY IF EXISTS "Users can insert own credentials" ON public.credentials;
CREATE POLICY "Users can insert own credentials"
    ON public.credentials FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Evaluators & Admins can update/revoke credentials
DROP POLICY IF EXISTS "Evaluators & Admins can manage credentials" ON public.credentials;
CREATE POLICY "Evaluators & Admins can manage credentials"
    ON public.credentials FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('EVALUATOR', 'ADMIN')
        )
    );
