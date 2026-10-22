import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: assessments, error } = await supabase
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
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching assessments from Supabase:', error);
      return NextResponse.json({ error: 'Không thể tải danh sách bài khảo thí' }, { status: 500 });
    }

    const formatted = (assessments || []).map((a) => {
      const items = Array.isArray(a.assessment_items) ? a.assessment_items : [];
      const questionCount = items.length;

      // Group types
      const rawTypes = [...new Set(items.map((i: any) => i.type))];
      const typeLabels: string[] = [];
      if (rawTypes.includes('MCQ')) typeLabels.push('Trắc nghiệm');
      if (rawTypes.includes('SCENARIO')) typeLabels.push('Tình huống');
      if (rawTypes.includes('DIGITAL_EVIDENCE') || rawTypes.includes('PRACTICAL_TASK')) {
        typeLabels.push('Thực hành');
      }

      // Domains
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

      const firstComp = Array.isArray(items[0]?.competencies)
        ? items[0]?.competencies[0]
        : items[0]?.competencies;
      const firstDom = Array.isArray(firstComp?.competency_domains)
        ? firstComp?.competency_domains[0]
        : firstComp?.competency_domains;

      const domainName =
        domainCodes.length > 1
          ? 'Đa Miền Năng Lực Số'
          : firstDom?.title || 'Đa Miền Năng Lực Số';

      return {
        id: a.id,
        title: a.title,
        description: a.description,
        duration_minutes: a.duration_minutes,
        passing_score: a.passing_score,
        point_reward: a.point_reward,
        questionCount,
        types: rawTypes,
        typeLabel: typeLabels.length > 0 ? typeLabels.join(', ') : 'Trắc nghiệm',
        domainName,
        domainCodes,
        isVip: Boolean((a as any).is_vip || (a as any).access_tier === 'VIP'),
        accessTier: (a as any).access_tier || ((a as any).is_vip ? 'VIP' : 'FREE'),
      };
    });

    return NextResponse.json({ assessments: formatted });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi máy chủ';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
