import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requirePlatformAdmin } from '@/lib/auth/admin-guard';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createAssessmentSchema = z.object({
  title: z.string().min(3, 'Tiêu đề bài thi ít nhất 3 ký tự'),
  description: z.string().optional(),
  duration_minutes: z.number().int().min(5).max(300).default(45),
  passing_score: z.number().min(0).max(100).default(70),
  point_reward: z.number().int().min(0).max(1000).default(50),
  is_published: z.boolean().default(true),
  is_vip: z.boolean().default(false),
  access_tier: z.enum(['FREE', 'VIP']).default('FREE'),
  framework_id: z.string().uuid().optional(),
  organization_id: z.string().uuid().optional().nullable(),
});

export async function GET() {
  try {
    const auth = await requirePlatformAdmin();
    if (!auth.isAuthorized) {
      return auth.errorResponse!;
    }

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
        updated_at,
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

    if (error) {
      console.error('Error fetching admin assessments:', error);
      return NextResponse.json({ error: 'Không thể tải danh sách bài khảo thí' }, { status: 500 });
    }

    const formatted = (assessments || []).map((a) => {
      const items = Array.isArray(a.assessment_items) ? a.assessment_items : [];
      const questionCount = items.length;

      const rawTypes = [...new Set(items.map((i: any) => i.type))];
      const typeLabels: string[] = [];
      if (rawTypes.includes('MCQ')) typeLabels.push('Trắc nghiệm');
      if (rawTypes.includes('SCENARIO')) typeLabels.push('Tình huống');
      if (rawTypes.includes('DIGITAL_EVIDENCE') || rawTypes.includes('PRACTICAL_TASK') || rawTypes.includes('PRACTICAL_FILE')) {
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
      ];

      const domainName =
        domainCodes.length === 0
          ? 'Chưa phân miền'
          : domainCodes.length > 1
          ? 'Đa Miền Năng Lực Số'
          : `Miền ${domainCodes[0]}`;

      return {
        id: a.id,
        title: a.title,
        description: a.description,
        duration_minutes: a.duration_minutes,
        passing_score: Number(a.passing_score),
        point_reward: a.point_reward,
        is_published: a.is_published,
        is_vip: Boolean((a as any).is_vip || (a as any).access_tier === 'VIP'),
        access_tier: (a as any).access_tier || ((a as any).is_vip ? 'VIP' : 'FREE'),
        created_at: a.created_at,
        questionCount,
        types: rawTypes,
        typeLabel: typeLabels.length > 0 ? typeLabels.join(', ') : 'Chưa có câu hỏi',
        domainName,
        domainCodes,
      };
    });

    return NextResponse.json({ assessments: formatted });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requirePlatformAdmin();
    if (!auth.isAuthorized) {
      return auth.errorResponse!;
    }

    const supabase = await createClient();
    const body = await req.json();

    const parsed = createAssessmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { data: framework } = await supabase
      .from('assessment_frameworks')
      .select('id')
      .limit(1)
      .single();

    const framework_id = parsed.data.framework_id || framework?.id;
    const { data: { user } } = await supabase.auth.getUser();

    const { data: created, error } = await supabase
      .from('assessments')
      .insert({
        title: parsed.data.title,
        description: parsed.data.description || 'Bài khảo thí chuẩn hóa đo lường năng lực số DigComp.',
        duration_minutes: parsed.data.duration_minutes,
        passing_score: parsed.data.passing_score,
        point_reward: parsed.data.point_reward,
        is_published: parsed.data.is_published,
        is_vip: parsed.data.is_vip || parsed.data.access_tier === 'VIP',
        access_tier: parsed.data.access_tier,
        framework_id,
        organization_id: parsed.data.organization_id || null,
        owner_user_id: user?.id || null,
        created_by: user?.id || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting assessment:', error);
      return NextResponse.json({ error: 'Không thể tạo bài khảo thí mới' }, { status: 500 });
    }

    return NextResponse.json({ assessment: created }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
