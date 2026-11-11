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
  target_domain: z.string().optional().default('ALL'),
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
        visibility,
        target_domain,
        organization_id,
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
      .is('organization_id', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching admin assessments:', error);
      return NextResponse.json({ error: 'Không thể tải danh sách bài khảo thí' }, { status: 500 });
    }

    // Exclude any assessments created in Personal or Org workspaces
    const systemOnly = (assessments || []).filter((a: any) => {
      if (a.organization_id) return false;
      if (a.visibility === 'PERSONAL' || a.visibility === 'ORGANIZATION') return false;
      return true;
    });

    const formatted = systemOnly.map((a) => {
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

      const DOMAIN_NAME_MAP: Record<string, string> = {
        '01': 'Miền 01: Thông tin & Dữ liệu số',
        '02': 'Miền 02: Giao tiếp & Cộng tác số',
        '03': 'Miền 03: Sáng tạo Nội dung số & AI',
        '04': 'Miền 04: An toàn & Bảo mật số',
        '05': 'Miền 05: Giải quyết Vấn đề số',
      };

      const targetDomain = (a as any).target_domain || (domainCodes.length === 1 ? domainCodes[0] : 'ALL');
      const resolvedDomainCodes =
        targetDomain !== 'ALL'
          ? [targetDomain]
          : domainCodes.length > 0
          ? domainCodes
          : ['01', '02', '03', '04', '05'];

      const domainName =
        targetDomain !== 'ALL' && DOMAIN_NAME_MAP[targetDomain]
          ? DOMAIN_NAME_MAP[targetDomain]
          : resolvedDomainCodes.length > 1
          ? 'Đa Miền Năng Lực Số'
          : resolvedDomainCodes[0] && DOMAIN_NAME_MAP[resolvedDomainCodes[0]]
          ? DOMAIN_NAME_MAP[resolvedDomainCodes[0]]
          : 'Đa Miền Năng Lực Số';

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
        domainCodes: resolvedDomainCodes,
        target_domain: targetDomain,
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
    const effectiveUserId = auth.user?.id || user?.id || null;

    const { data: created, error } = await supabase
      .from('assessments')
      .insert({
        title: parsed.data.title,
        description: parsed.data.description || 'Bài khảo thí chuẩn hóa đo lường 5 miền năng lực số.',
        duration_minutes: parsed.data.duration_minutes,
        passing_score: parsed.data.passing_score,
        point_reward: parsed.data.point_reward,
        is_published: parsed.data.is_published,
        is_vip: parsed.data.is_vip || parsed.data.access_tier === 'VIP',
        access_tier: parsed.data.access_tier,
        framework_id,
        organization_id: null,
        visibility: 'PUBLIC',
        target_domain: parsed.data.target_domain || 'ALL',
        owner_user_id: effectiveUserId,
        created_by: effectiveUserId,
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
