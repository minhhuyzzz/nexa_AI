import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizeOrgRole } from '@/lib/auth/org-guard';

export interface ClassAccessResult {
  isEvaluator: boolean;
  isMember: boolean;
  hasAccess: boolean;
}

export async function verifyClassAccess(
  supabase: SupabaseClient,
  classId: string,
  userId: string,
  role?: string
): Promise<ClassAccessResult> {
  // Platform Admin has full access
  if (role === 'ADMIN') {
    return { isEvaluator: true, isMember: true, hasAccess: true };
  }

  // 1. Fetch class record with owner, evaluator, instructor & organization context
  const classQuery = supabase
    .from('evaluator_classes')
    .select('id, evaluator_id, owner_user_id, organization_id, instructor_id')
    .eq('id', classId);

  const { data: cls } = await (typeof (classQuery as any).maybeSingle === 'function'
    ? (classQuery as any).maybeSingle()
    : (classQuery as any).single());

  if (!cls) {
    return { isEvaluator: false, isMember: false, hasAccess: false };
  }

  // 2. Personal group or explicit instructor: creator/evaluator/instructor has evaluator access
  const isDirectManager =
    cls.evaluator_id === userId ||
    cls.owner_user_id === userId ||
    cls.instructor_id === userId;

  if (isDirectManager) {
    return { isEvaluator: true, isMember: true, hasAccess: true };
  }

  // 3. Organization class: check if user is ORG_OWNER, ORG_ADMIN or ASSESSOR in that organization
  if (cls.organization_id) {
    const orgQuery = supabase
      .from('user_organizations')
      .select('org_role, status')
      .eq('organization_id', cls.organization_id)
      .eq('user_id', userId)
      .eq('status', 'ACTIVE');

    const { data: orgMembership } = await (typeof (orgQuery as any).maybeSingle === 'function'
      ? (orgQuery as any).maybeSingle()
      : (orgQuery as any).single());

    if (orgMembership && ['ORG_OWNER', 'ORG_ADMIN', 'ASSESSOR'].includes(normalizeOrgRole(orgMembership.org_role))) {
      return { isEvaluator: true, isMember: true, hasAccess: true };
    }
  }

  // 4. Enrolled cohort member check
  const memberQuery = supabase
    .from('class_members')
    .select('id')
    .eq('class_id', classId)
    .eq('user_id', userId);

  const { data: member } = await (typeof (memberQuery as any).maybeSingle === 'function'
    ? (memberQuery as any).maybeSingle()
    : (memberQuery as any).single());

  const isMember = Boolean(member);
  return {
    isEvaluator: false,
    isMember,
    hasAccess: isMember,
  };
}
