import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import {
  AdminAssessmentBankClient,
  type AssessmentItemRecord,
} from './admin-assessment-bank-client';

export const dynamic = 'force-dynamic';

export default async function AdminContentPage() {
  const adminSupabase = createAdminClient();
  const userSupabase = await createClient();

  // 1. Fetch official canonical system assessments only (Exclude Org & Personal assessments)
  // Dual-client fallback: if service_role lacks table privileges on competencies (42501), fallback to authenticated user client
  let rawAssessments: any[] | null = null;
  const adminAssessmentsRes = await adminSupabase
    .from('assessments')
    .select(`
      id,
      title,
      description,
      duration_minutes,
      passing_score,
      point_reward,
      is_published,
      is_vip,
      access_tier,
      visibility,
      organization_id,
      security_settings,
      created_at,
      assessment_items (
        id,
        type,
        points,
        competency_id,
        is_multi_competency,
        competencies (
          skill_code,
          domain_id,
          competency_domains (
            code,
            title
          )
        )
      )
    `)
    .is('organization_id', null)
    .order('created_at', { ascending: false });

  if (adminAssessmentsRes.error || !adminAssessmentsRes.data) {
    const userAssessmentsRes = await userSupabase
      .from('assessments')
      .select(`
        id,
        title,
        description,
        duration_minutes,
        passing_score,
        point_reward,
        is_published,
        is_vip,
        access_tier,
        visibility,
        organization_id,
        security_settings,
        created_at,
        assessment_items (
          id,
          type,
          points,
          competency_id,
          is_multi_competency,
          competencies (
            skill_code,
            domain_id,
            competency_domains (
              code,
              title
            )
          )
        )
      `)
      .is('organization_id', null)
      .order('created_at', { ascending: false });
    rawAssessments = userAssessmentsRes.data;
  } else {
    rawAssessments = adminAssessmentsRes.data;
  }

  // Strictly isolate: only include system canonical assessments (PUBLIC / SYSTEM_CURATED), never Org or Personal tests
  // Also isolate the Baseline Intake exam into its dedicated '/admin/baseline' workspace
  const filteredCanonical = (rawAssessments || []).filter((a: any) => {
    if (a.organization_id) return false;
    if (a.visibility === 'PERSONAL' || a.visibility === 'ORGANIZATION') return false;
    if (
      a.id === 'a0000000-0000-0000-0000-000000000001' ||
      a.slug === 'baseline' ||
      a.title?.toLowerCase().includes('đầu vào')
    ) {
      return false;
    }
    return true;
  });

  // 2. Fetch competency domains
  let rawDomains: any[] | null = null;
  const adminDomainsRes = await adminSupabase
    .from('competency_domains')
    .select('id, code, title')
    .order('domain_index', { ascending: true });

  if (adminDomainsRes.error || !adminDomainsRes.data) {
    const userDomainsRes = await userSupabase
      .from('competency_domains')
      .select('id, code, title')
      .order('domain_index', { ascending: true });
    rawDomains = userDomainsRes.data;
  } else {
    rawDomains = adminDomainsRes.data;
  }

  // 3. Fetch competencies
  let rawCompetencies: any[] | null = null;
  const adminCompRes = await adminSupabase
    .from('competencies')
    .select('id, skill_code, title, domain_id')
    .order('skill_code', { ascending: true });

  if (adminCompRes.error || !adminCompRes.data) {
    const userCompRes = await userSupabase
      .from('competencies')
      .select('id, skill_code, title, domain_id')
      .order('skill_code', { ascending: true });
    rawCompetencies = userCompRes.data;
  } else {
    rawCompetencies = adminCompRes.data;
  }

  // 4. Fetch real pending contributions count from community_contributions
  let pendingContributionsCount = 0;
  const adminContribRes = await adminSupabase
    .from('community_contributions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'PENDING');

  if (adminContribRes.error) {
    const userContribRes = await userSupabase
      .from('community_contributions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'PENDING');
    pendingContributionsCount = userContribRes.count ?? 0;
  } else {
    pendingContributionsCount = adminContribRes.count ?? 0;
  }

  // Format assessments
  const assessments: AssessmentItemRecord[] = filteredCanonical.map((a: any) => {
    const items = Array.isArray(a.assessment_items) ? a.assessment_items : [];
    const questionCount = items.length;

    const rawTypes = [...new Set(items.map((i: any) => i.type))];
    const typeLabels: string[] = [];
    if (rawTypes.includes('MCQ')) typeLabels.push('Trắc nghiệm');
    if (rawTypes.includes('SCENARIO')) typeLabels.push('Tình huống');
    if (
      rawTypes.includes('DIGITAL_EVIDENCE') ||
      rawTypes.includes('PRACTICAL_TASK') ||
      rawTypes.includes('PRACTICAL_FILE')
    ) {
      typeLabels.push('Thực hành');
    }

    const domainCodes = [
      ...new Set(
        items
          .map((i: any) => {
            const comp = Array.isArray(i.competencies) ? i.competencies[0] : i.competencies;
            const dom = Array.isArray(comp?.competency_domains)
              ? comp?.competency_domains[0]
              : comp?.competency_domains;
            return dom?.code;
          })
          .filter(Boolean)
      ),
    ] as string[];

    const domainName =
      domainCodes.length === 0
        ? 'Chưa phân miền'
        : domainCodes.length > 1
        ? 'Đa Miền Năng Lực'
        : `Miền ${domainCodes[0]}`;

    return {
      id: a.id,
      title: a.title,
      description: a.description || '',
      duration_minutes: a.duration_minutes || 45,
      passing_score: Number(a.passing_score) || 70,
      point_reward: a.point_reward || 50,
      is_published: Boolean(a.is_published),
      is_vip: Boolean(a.is_vip || a.access_tier === 'VIP'),
      access_tier: (a.access_tier || (a.is_vip ? 'VIP' : 'FREE')) as 'FREE' | 'VIP',
      created_at: a.created_at,
      questionCount,
      types: rawTypes as string[],
      typeLabel: typeLabels.length > 0 ? typeLabels.join(', ') : 'Chưa có câu hỏi',
      domainName,
      domainCodes,
      security_settings: a.security_settings || null,
    };
  });

  const domains = (rawDomains || []) as Array<{ id: string; code: string; title: string }>;
  const competencies = (rawCompetencies || []) as Array<{
    id: string;
    skill_code: string;
    title: string;
    domain_id: string;
  }>;

  return (
    <AdminAssessmentBankClient
      initialAssessments={assessments}
      domains={domains}
      competencies={competencies}
      pendingContributionsCount={pendingContributionsCount || 0}
    />
  );
}
