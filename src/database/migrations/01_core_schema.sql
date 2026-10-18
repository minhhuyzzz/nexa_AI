-- ==============================================================================
-- NEXA CORE SCHEMA MIGRATION 01: IDENTITY, PROFILES & DYNAMIC FRAMEWORK
-- ==============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. Organizations (B2B Multi-tenancy)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL DEFAULT 'ENTERPRISE' CHECK (type IN ('ENTERPRISE', 'EDUCATIONAL', 'GOVERNMENT')),
    logo_url TEXT,
    max_members INT NOT NULL DEFAULT 50,
    quota_assessments INT NOT NULL DEFAULT 500,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 2. Profiles (Sync from auth.users, Static Role, Points, ND13)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    role TEXT NOT NULL CHECK (role IN ('LEARNER', 'EVALUATOR', 'ADMIN')),
    plan_tier TEXT NOT NULL DEFAULT 'FREE' CHECK (plan_tier IN ('FREE', 'PRO', 'ENTERPRISE')),
    credits INT NOT NULL DEFAULT 3,
    points INT NOT NULL DEFAULT 0,
    rank_tier TEXT NOT NULL DEFAULT 'NOVICE' CHECK (rank_tier IN ('NOVICE', 'EXPLORER', 'PRACTITIONER', 'SPECIALIST', 'ELITE')),
    avg_competency_score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    specialization TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: Prevent changing role after registration (Static Role rule)
CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.role IS NOT NULL AND NEW.role <> OLD.role THEN
        RAISE EXCEPTION 'Role is immutable. 1 Email = 1 Static Role.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prevent_role_change ON public.profiles;
CREATE TRIGGER trigger_prevent_role_change
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_role_change();

-- ------------------------------------------------------------------------------
-- 3. Evaluator Profiles (Vetting for Evaluators)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.evaluator_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    organization_name TEXT,
    certificate_url TEXT,
    is_verified_badge BOOLEAN NOT NULL DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4. User Organizations (Memberships)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    org_role TEXT NOT NULL DEFAULT 'MEMBER' CHECK (org_role IN ('ORG_ADMIN', 'EVALUATOR', 'MEMBER')),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, organization_id)
);

-- ------------------------------------------------------------------------------
-- 5. Consent Logs (Nghị định 13/2023/NĐ-CP)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.consent_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    consent_version TEXT NOT NULL,
    is_granted BOOLEAN NOT NULL DEFAULT TRUE,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 6. Dynamic Framework Engine (assessment_frameworks, domains, competencies)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.assessment_frameworks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    version TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('DRAFT', 'ACTIVE', 'ARCHIVED')),
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.competency_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    framework_id UUID NOT NULL REFERENCES public.assessment_frameworks(id) ON DELETE CASCADE,
    domain_index INT NOT NULL,
    code TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    weight_percent DECIMAL(5,2) NOT NULL DEFAULT 20.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(framework_id, domain_index)
);

CREATE TABLE IF NOT EXISTS public.competencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_id UUID NOT NULL REFERENCES public.competency_domains(id) ON DELETE CASCADE,
    skill_code TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    behavioral_indicators JSONB NOT NULL DEFAULT '[]'::jsonb,
    target_level INT NOT NULL DEFAULT 4,
    display_order INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(domain_id, skill_code)
);

-- Index for points leaderboard (Top 100+)
CREATE INDEX IF NOT EXISTS idx_profiles_points_desc ON public.profiles (points DESC, avg_competency_score DESC);

-- ------------------------------------------------------------------------------
-- 7. Row Level Security (100% RLS Required by Architecture Guardrails)
-- ------------------------------------------------------------------------------
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competency_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competencies ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by authenticated users"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile (except role)"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- Frameworks Public Read
CREATE POLICY "Frameworks are viewable by all users"
ON public.assessment_frameworks FOR SELECT
TO public
USING (true);

CREATE POLICY "Competency domains are viewable by all users"
ON public.competency_domains FOR SELECT
TO public
USING (true);

CREATE POLICY "Competencies are viewable by all users"
ON public.competencies FOR SELECT
TO public
USING (true);

-- Admin Framework Management
CREATE POLICY "Admins can manage frameworks"
ON public.assessment_frameworks FOR ALL
TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN')
);

CREATE POLICY "Admins can manage competency domains"
ON public.competency_domains FOR ALL
TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN')
);

CREATE POLICY "Admins can manage competencies"
ON public.competencies FOR ALL
TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN')
);
