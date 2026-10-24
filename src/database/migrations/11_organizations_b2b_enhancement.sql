-- Migration 11: Organizations B2B Enhancement and Organization Code (org_code)
-- Description: Adds fields for B2B Lead capture, contact information, expected learners, status, and unique org_code for self-service student onboarding.

ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS contact_name TEXT,
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT,
ADD COLUMN IF NOT EXISTS expected_learners INTEGER DEFAULT 500,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'PENDING_CONTACT',
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_organizations_code ON public.organizations(code);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON public.organizations(status);

-- Grant privileges for public inquiry submissions and authenticated admin access
GRANT SELECT, INSERT ON public.organizations TO anon;
GRANT ALL ON public.organizations TO authenticated;
GRANT ALL ON public.user_organizations TO anon;
GRANT ALL ON public.user_organizations TO authenticated;
