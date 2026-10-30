-- ==============================================================================
-- Migration 24: Curated Course Catalog & User Course Progress (DigComp 5 Domains)
-- NEXA is an Evidence-based Competency Assessment & Growth Platform (NOT a Marketplace)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.course_catalog (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    provider VARCHAR(100) NOT NULL,
    official_url TEXT NOT NULL,
    domain_codes TEXT[] NOT NULL, -- e.g. ARRAY['D1'], ARRAY['D2', 'D4']
    level VARCHAR(50) DEFAULT 'INTERMEDIATE',
    language VARCHAR(20) DEFAULT 'vi',
    format VARCHAR(50) DEFAULT 'Online',
    duration VARCHAR(50) DEFAULT '2-4 tuần',
    price_type VARCHAR(20) DEFAULT 'FREE' CHECK (price_type IN ('FREE', 'PAID', 'FREE_TRIAL')),
    review_status VARCHAR(20) DEFAULT 'APPROVED' CHECK (review_status IN ('APPROVED', 'DRAFT', 'ARCHIVED')),
    last_verified_at TIMESTAMPTZ DEFAULT NOW(),
    short_description TEXT,
    learning_outcomes TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_course_catalog_review_status ON public.course_catalog(review_status);
CREATE INDEX IF NOT EXISTS idx_course_catalog_domain_codes ON public.course_catalog USING GIN(domain_codes);

-- Enable RLS for course_catalog
ALTER TABLE public.course_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved courses"
    ON public.course_catalog
    FOR SELECT
    TO authenticated, anon
    USING (review_status = 'APPROVED');

-- User Learning / Course Progress (Self-Reported Progress Tracking)
CREATE TABLE IF NOT EXISTS public.user_course_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id VARCHAR(64) NOT NULL REFERENCES public.course_catalog(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'SAVED' CHECK (status IN ('SAVED', 'IN_PROGRESS', 'COMPLETED')),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    is_self_reported BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_user_course UNIQUE (user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_user_course_progress_user ON public.user_course_progress(user_id);

-- Enable RLS for user_course_progress
ALTER TABLE public.user_course_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own course progress"
    ON public.user_course_progress
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
