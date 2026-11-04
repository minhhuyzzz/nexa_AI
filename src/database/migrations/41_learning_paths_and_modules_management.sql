-- ==============================================================================
-- NEXA SCHEMA MIGRATION 41: LEARNING PATHS & MODULES MANAGEMENT FOR ADMIN & PERSONAL
-- ==============================================================================

-- 1. Create learning_paths table
CREATE TABLE IF NOT EXISTS public.learning_paths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE,
    description TEXT,
    domain_codes TEXT[] DEFAULT '{}',
    access_tier TEXT NOT NULL DEFAULT 'FREE',
    point_reward INT NOT NULL DEFAULT 100,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    order_index INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Extend learning_modules with path, assessment linkage, and access tier
ALTER TABLE public.learning_modules
    ADD COLUMN IF NOT EXISTS path_id UUID REFERENCES public.learning_paths(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS assessment_id UUID REFERENCES public.assessments(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS access_tier TEXT NOT NULL DEFAULT 'FREE',
    ADD COLUMN IF NOT EXISTS prerequisite_module_id UUID REFERENCES public.learning_modules(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_learning_paths_published ON public.learning_paths(is_published);
CREATE INDEX IF NOT EXISTS idx_learning_modules_path ON public.learning_modules(path_id);
CREATE INDEX IF NOT EXISTS idx_learning_modules_assessment ON public.learning_modules(assessment_id);
