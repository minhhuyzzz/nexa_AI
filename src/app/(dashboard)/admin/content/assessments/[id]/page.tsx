import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import {
  AdminAssessmentDetailClient,
  type AssessmentDetailData,
} from './assessment-detail-client';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminAssessmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Fetch assessment with items and options
  const { data: assessment, error } = await supabase
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
        prompt,
        points,
        order_index,
        competency_id,
        is_multi_competency,
        target_competencies,
        rubric_guide,
        competencies (
          id,
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
    .eq('id', id)
    .single();

  if (error || !assessment) {
    return (
      <div className="p-8 rounded-md bg-white border border-slate-200 text-center space-y-3">
        <h2 className="text-sm font-bold text-slate-800">Không tìm thấy bài khảo thí</h2>
        <p className="text-xs text-slate-500">
          Bài khảo thí với mã ID này không tồn tại hoặc đã bị xóa khỏi hệ thống.
        </p>
        <Link
          href="/admin/content"
          className="inline-flex items-center gap-1.5 text-xs text-sky-600 hover:text-sky-700 font-semibold pt-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
          <span>Quay lại Quản trị Kho Đề</span>
        </Link>
      </div>
    );
  }

  // 2. Fetch all competencies for dropdown selection
  const { data: rawCompetencies } = await supabase
    .from('competencies')
    .select('id, skill_code, title, domain_id')
    .order('skill_code', { ascending: true });

  const competenciesList = (rawCompetencies || []) as Array<{
    id: string;
    skill_code: string;
    title: string;
    domain_id: string;
  }>;

  // Sort items by order_index
  const sortedItems = [...(assessment.assessment_items || [])].sort(
    (a: any, b: any) => (a.order_index || 0) - (b.order_index || 0)
  );

  const formattedAssessment: AssessmentDetailData = {
    id: assessment.id,
    title: assessment.title,
    description: assessment.description || '',
    duration_minutes: assessment.duration_minutes || 45,
    passing_score: Number(assessment.passing_score) || 70,
    point_reward: assessment.point_reward || 50,
    is_published: Boolean(assessment.is_published),
    is_vip: Boolean((assessment as any).is_vip || (assessment as any).access_tier === 'VIP'),
    access_tier: ((assessment as any).access_tier || ((assessment as any).is_vip ? 'VIP' : 'FREE')) as
      | 'FREE'
      | 'VIP',
    created_at: assessment.created_at,
    assessment_items: sortedItems as any,
  };

  return (
    <AdminAssessmentDetailClient
      initialAssessment={formattedAssessment}
      competenciesList={competenciesList}
    />
  );
}
