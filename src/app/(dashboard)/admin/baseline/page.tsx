import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { BaselineAdminClient } from './baseline-admin-client';

export const dynamic = 'force-dynamic';

const ASSESSMENT_DETAIL_SELECT = `
  id,
  title,
  description,
  duration_minutes,
  passing_score,
  point_reward,
  is_published,
  is_system_baseline,
  access_tier,
  visibility,
  created_at,
  assessment_items (
    id,
    prompt,
    type,
    points,
    order_index,
    competency_id,
    is_multi_competency,
    competencies (
      skill_code,
      title,
      domain_id,
      competency_domains (
        code,
        title
      )
    ),
    item_options (
      id,
      content,
      is_correct,
      explanation,
      order_index
    )
  )
`;

async function fetchWithFallback<T>(
  adminSupabase: ReturnType<typeof createAdminClient>,
  userSupabase: Awaited<ReturnType<typeof createClient>>,
  queryFn: (client: any) => any
): Promise<T | null> {
  const adminRes = await queryFn(adminSupabase);
  if (!adminRes.error && adminRes.data) return adminRes.data as T;
  const userRes = await queryFn(userSupabase);
  return (userRes.data as T) || null;
}

export default async function AdminBaselinePage({
  searchParams,
}: {
  searchParams?: Promise<{ set?: string }>;
}) {
  const adminSupabase = createAdminClient();
  const userSupabase = await createClient();
  const resolvedParams = searchParams ? await searchParams : undefined;
  const requestedSetId = resolvedParams?.set;

  // 1. Fetch ALL baseline sets (with question counts only, for the dropdown)
  const allBaselineSets = await fetchWithFallback<any[]>(
    adminSupabase,
    userSupabase,
    (client) =>
      client
        .from('assessments')
        .select('id, title, is_published, is_system_baseline, created_at, assessment_items(id)')
        .or('id.eq.a0000000-0000-0000-0000-000000000001,is_system_baseline.eq.true,system_code.ilike.BASELINE%')
        .order('created_at', { ascending: false })
  );

  // Format sets for the client
  const baselineSets = (allBaselineSets || []).map((s: any) => ({
    id: s.id,
    title: s.title,
    isPublished: s.is_published,
    isActive: s.is_system_baseline === true,
    questionCount: Array.isArray(s.assessment_items) ? s.assessment_items.length : 0,
    createdAt: s.created_at,
  }));

  // 2. Find the set to display: requested via query param > active set > canonical fallback
  const activeSet = baselineSets.find((s: any) => s.isActive);
  const requestedSet = requestedSetId ? baselineSets.find((s: any) => s.id === requestedSetId) : null;
  const activeId = requestedSet?.id || activeSet?.id || 'a0000000-0000-0000-0000-000000000001';

  // 3. Fetch the full detail of the active baseline assessment
  const baselineAssessment = await fetchWithFallback<any>(
    adminSupabase,
    userSupabase,
    (client) =>
      client
        .from('assessments')
        .select(ASSESSMENT_DETAIL_SELECT)
        .eq('id', activeId)
        .single()
  );

  // 4. Fetch all 5 competency domains for tagging
  const domains = await fetchWithFallback<any[]>(
    adminSupabase,
    userSupabase,
    (client) =>
      client
        .from('competency_domains')
        .select('id, code, title')
        .order('domain_index', { ascending: true })
  );

  // 5. Fetch competencies to map to domains
  const competencies = await fetchWithFallback<any[]>(
    adminSupabase,
    userSupabase,
    (client) =>
      client
        .from('competencies')
        .select('id, skill_code, title, domain_id')
        .order('skill_code', { ascending: true })
  );

  return (
    <BaselineAdminClient
      assessment={baselineAssessment as any}
      domains={domains || []}
      competencies={competencies || []}
      baselineSets={baselineSets}
    />
  );
}
