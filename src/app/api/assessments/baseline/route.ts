import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const CANONICAL_BASELINE_ID = 'a0000000-0000-0000-0000-000000000001';

export async function GET() {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // 1. First priority: Query assessment flagged as is_system_baseline = true
    const { data: initialAssessment } = await supabase
      .from('assessments')
      .select(`
        id, 
        title, 
        description, 
        duration_minutes, 
        passing_score, 
        point_reward, 
        is_published, 
        is_system_baseline,
        system_code,
        access_tier,
        is_vip,
        assessment_items (
          id,
          type,
          difficulty_level,
          competency_id,
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
      .eq('is_system_baseline', true)
      .eq('is_published', true)
      .limit(1)
      .maybeSingle();

    let assessment = initialAssessment;

    // 2. Second priority: Query by system_code = 'BASELINE_5DOMAINS' or canonical ID via adminSupabase
    if (!assessment) {
      const fallbackQuery = await adminSupabase
        .from('assessments')
        .select(`
          id, 
          title, 
          description, 
          duration_minutes, 
          passing_score, 
          point_reward, 
          is_published, 
          is_system_baseline,
          system_code,
          access_tier,
          is_vip,
          assessment_items (
            id,
            type,
            difficulty_level,
            competency_id,
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
        .or(`id.eq.${CANONICAL_BASELINE_ID},system_code.eq.BASELINE_5DOMAINS`)
        .limit(1)
        .maybeSingle();

      assessment = fallbackQuery.data;
    }

    if (!assessment) {
      // Third priority: Find any public published assessment as safe fallback
      const { data: publicDefault } = await adminSupabase
        .from('assessments')
        .select(`
          id, 
          title, 
          description, 
          duration_minutes, 
          passing_score, 
          point_reward, 
          is_published, 
          is_system_baseline,
          system_code,
          access_tier,
          is_vip,
          assessment_items (
            id,
            type,
            difficulty_level,
            competency_id,
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
        .eq('is_published', true)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      assessment = publicDefault;
    }

    if (!assessment) {
      return NextResponse.json({
        baselineAssessment: null,
        message: 'Chưa cấu hình bài đánh giá đầu vào của hệ thống',
      });
    }

    const items = Array.isArray(assessment.assessment_items) ? assessment.assessment_items : [];
    const questionCount = items.length;

    // Determine domain coverage
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
    ];

    const formattedBaseline = {
      id: assessment.id,
      title: assessment.title,
      description: assessment.description,
      duration_minutes: assessment.duration_minutes,
      passing_score: assessment.passing_score,
      point_reward: assessment.point_reward,
      questionCount,
      domainCodes,
      domainName: 'Đa Miền Năng Lực Số',
      isSystemBaseline: true,
      systemCode: assessment.system_code || 'BASELINE_5DOMAINS',
    };

    return NextResponse.json({ baselineAssessment: formattedBaseline });
  } catch (err) {
    console.error('Error fetching baseline assessment:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Lỗi máy chủ khi tải đề đầu vào' },
      { status: 500 }
    );
  }
}
