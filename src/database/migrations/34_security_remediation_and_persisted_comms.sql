-- ==============================================================================
-- NEXA MIGRATION 34: SECURITY REMEDIATION, QUESTION BANK ENHANCEMENT & PERSISTED COMMS
-- ==============================================================================

-- 1. Session Revocation on profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS tokens_revoked_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_tokens_revoked_at ON public.profiles(tokens_revoked_at);

-- 2. Question Bank enhancements for Personal Creators & Rubrics
ALTER TABLE public.question_bank_items
ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS scope VARCHAR(20) DEFAULT 'PERSONAL' CHECK (scope IN ('PERSONAL', 'ORGANIZATION', 'PLATFORM')),
ADD COLUMN IF NOT EXISTS rubric_definition JSONB;

CREATE INDEX IF NOT EXISTS idx_question_bank_items_owner ON public.question_bank_items(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_question_bank_items_scope ON public.question_bank_items(scope);

-- Backfill owner_user_id from created_by if created_by is uuid
UPDATE public.question_bank_items
SET owner_user_id = created_by
WHERE owner_user_id IS NULL AND created_by IS NOT NULL;

-- 3. Assessments Immutable Snapshot
ALTER TABLE public.assessments
ADD COLUMN IF NOT EXISTS snapshot_data JSONB;

-- 4. User Notifications Table (Replacing localStorage)
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'SYSTEM' CHECK (category IN ('SYSTEM', 'ASSIGNMENT', 'GRADE', 'SECURITY', 'CAMPAIGN')),
  link_url TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON public.user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_is_read ON public.user_notifications(user_id, is_read);

ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
ON public.user_notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update read status of their own notifications"
ON public.user_notifications FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. Organization Policies Table (Replacing Hardcoded Domains)
CREATE TABLE IF NOT EXISTS public.organization_policies (
  organization_id UUID PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  allowed_domains TEXT[] DEFAULT '{}',
  anti_cheat_enabled BOOLEAN DEFAULT TRUE,
  fullscreen_enforced BOOLEAN DEFAULT FALSE,
  tab_switch_limit INT DEFAULT 3,
  time_limit_minutes INT DEFAULT 60,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.organization_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their org policies"
ON public.organization_policies FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_organizations uo
    WHERE uo.organization_id = organization_policies.organization_id
      AND uo.user_id = auth.uid()
      AND uo.status = 'ACTIVE'
  )
);

CREATE POLICY "Org admins can manage their org policies"
ON public.organization_policies FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_organizations uo
    WHERE uo.organization_id = organization_policies.organization_id
      AND uo.user_id = auth.uid()
      AND uo.org_role IN ('ORG_OWNER', 'ORG_ADMIN')
      AND uo.status = 'ACTIVE'
  )
);

-- 6. Feedback Tickets Table (Replacing Client setTimeout Mock)
CREATE TABLE IF NOT EXISTS public.feedback_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  user_email VARCHAR(255),
  user_name VARCHAR(255),
  category VARCHAR(50) DEFAULT 'GENERAL' CHECK (category IN ('GENERAL', 'BUG', 'FEATURE_REQUEST', 'CONTENT', 'BILLING')),
  subject VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_REVIEW', 'RESOLVED', 'CLOSED')),
  admin_notes TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_tickets_status ON public.feedback_tickets(status);
CREATE INDEX IF NOT EXISTS idx_feedback_tickets_created_at ON public.feedback_tickets(created_at DESC);

ALTER TABLE public.feedback_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own feedback tickets"
ON public.feedback_tickets FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create feedback tickets"
ON public.feedback_tickets FOR INSERT
WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

-- 7. RLS for Personal Creators on question_bank_items
DROP POLICY IF EXISTS "Personal creators can manage their own question bank items" ON public.question_bank_items;
CREATE POLICY "Personal creators can manage their own question bank items"
ON public.question_bank_items FOR ALL
USING (owner_user_id = auth.uid() OR created_by = auth.uid())
WITH CHECK (owner_user_id = auth.uid() OR created_by = auth.uid());

DROP POLICY IF EXISTS "Personal creators can manage options for their items" ON public.question_bank_options;
CREATE POLICY "Personal creators can manage options for their items"
ON public.question_bank_options FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.question_bank_items qbi
    WHERE qbi.id = question_bank_options.item_id
      AND (qbi.owner_user_id = auth.uid() OR qbi.created_by = auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.question_bank_items qbi
    WHERE qbi.id = question_bank_options.item_id
      AND (qbi.owner_user_id = auth.uid() OR qbi.created_by = auth.uid())
  )
);

-- 8. Link Submissions to Assessment Campaigns (Finding NEXA-10)
ALTER TABLE public.assessment_submissions
ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES public.assessment_campaigns(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_assessment_submissions_campaign ON public.assessment_submissions(campaign_id);

