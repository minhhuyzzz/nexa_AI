import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { BaselineAdminClient } from './baseline-admin-client';

export const dynamic = 'force-dynamic';

export default async function AdminBaselinePage() {
  const adminSupabase = createAdminClient();
  const userSupabase = await createClient();

  // 1. Fetch the canonical baseline assessment
  // Dual-client fallback: if service_role lacks table privileges on competencies (42501), fallback to authenticated user client
  let baselineAssessment: any = null;
  const adminRes = await adminSupabase
    .from('assessments')
    .select(`
      id,
      title,
      description,
      duration_minutes,
      passing_score,
      point_reward,
      is_published,
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
    `)
    .eq('id', 'a0000000-0000-0000-0000-000000000001')
    .single();

  if (adminRes.error || !adminRes.data) {
    const userRes = await userSupabase
      .from('assessments')
      .select(`
        id,
        title,
        description,
        duration_minutes,
        passing_score,
        point_reward,
        is_published,
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
      `)
      .eq('id', 'a0000000-0000-0000-0000-000000000001')
      .single();
    baselineAssessment = userRes.data;
  } else {
    baselineAssessment = adminRes.data;
  }

  // 2. Fetch all 5 competency domains for tagging
  let domains: any[] | null = null;
  const adminDomains = await adminSupabase
    .from('competency_domains')
    .select('id, code, title')
    .order('domain_index', { ascending: true });

  if (adminDomains.error || !adminDomains.data) {
    const userDomains = await userSupabase
      .from('competency_domains')
      .select('id, code, title')
      .order('domain_index', { ascending: true });
    domains = userDomains.data;
  } else {
    domains = adminDomains.data;
  }

  // 3. Fetch competencies to map to domains
  let competencies: any[] | null = null;
  const adminComp = await adminSupabase
    .from('competencies')
    .select('id, skill_code, title, domain_id')
    .order('skill_code', { ascending: true });

  if (adminComp.error || !adminComp.data) {
    const userComp = await userSupabase
      .from('competencies')
      .select('id, skill_code, title, domain_id')
      .order('skill_code', { ascending: true });
    competencies = userComp.data;
  } else {
    competencies = adminComp.data;
  }

  return (
    <BaselineAdminClient
      assessment={baselineAssessment as any}
      domains={domains || []}
      competencies={competencies || []}
    />
  );
}
