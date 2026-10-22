import { createClient } from '@/lib/supabase/server';
import {
  AdminAssessmentBankClient,
  type AssessmentItemRecord,
  type LearningModuleItemRecord,
} from './admin-assessment-bank-client';

export const dynamic = 'force-dynamic';

export default async function AdminContentPage() {
  const supabase = await createClient();

  // 1. Fetch assessments with assessment_items
  const { data: rawAssessments } = await supabase
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
    .order('created_at', { ascending: false });

  // 2. Fetch competency domains
  const { data: rawDomains } = await supabase
    .from('competency_domains')
    .select('id, code, title')
    .order('domain_index', { ascending: true });

  // 3. Fetch competencies
  const { data: rawCompetencies } = await supabase
    .from('competencies')
    .select('id, skill_code, title, domain_id')
    .order('skill_code', { ascending: true });

  // 4. Fetch learning modules
  const { data: rawModules } = await supabase
    .from('learning_modules')
    .select('id, skill_code, domain_code, title, description, duration_minutes, point_reward, is_published')
    .order('order_index', { ascending: true });

  // Format assessments
  const assessments: AssessmentItemRecord[] = (rawAssessments || []).map((a: any) => {
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
    };
  });

  const domains = (rawDomains || []) as Array<{ id: string; code: string; title: string }>;
  const competencies = (rawCompetencies || []) as Array<{
    id: string;
    skill_code: string;
    title: string;
    domain_id: string;
  }>;
  const learningModules = (rawModules || []) as LearningModuleItemRecord[];

  return (
    <AdminAssessmentBankClient
      initialAssessments={assessments}
      domains={domains}
      competencies={competencies}
      learningModules={learningModules}
    />
  );
}
