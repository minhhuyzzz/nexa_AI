import { createAdminClient } from '@/lib/supabase/admin';
import { BaselineAdminClient } from './baseline-admin-client';

export const dynamic = 'force-dynamic';

export default async function AdminBaselinePage() {
  const supabase = createAdminClient();

  // 1. Fetch the canonical baseline assessment
  const { data: baselineAssessment } = await supabase
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

  // 2. Fetch all 5 competency domains for tagging
  const { data: domains } = await supabase
    .from('competency_domains')
    .select('id, code, title')
    .order('domain_index', { ascending: true });

  // 3. Fetch competencies to map to domains
  const { data: competencies } = await supabase
    .from('competencies')
    .select('id, skill_code, title, domain_id')
    .order('skill_code', { ascending: true });

  return (
    <BaselineAdminClient
      assessment={baselineAssessment as any}
      domains={domains || []}
      competencies={competencies || []}
    />
  );
}
