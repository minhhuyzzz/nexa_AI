import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { QuotaEnforcementService } from '@/features/billing/services/quota-enforcement.service';

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

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập để tạo đề thi' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      duration_minutes = 30,
      passing_score = 70,
      point_reward = 0,
      is_published = false,
      organizationId = null,
    } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'Tiêu đề bài thi không được để trống' }, { status: 400 });
    }

    // 1. Server-side Quota Gate Enforcement
    const quotaCheck = await QuotaEnforcementService.checkAssessmentCreationQuota(
      supabase,
      user.id,
      organizationId
    );

    if (!quotaCheck.allowed) {
      return NextResponse.json(
        {
          error: quotaCheck.reason || 'Đã vượt quá hạn mức đề thi của gói dịch vụ',
          quota: quotaCheck,
        },
        { status: 403 }
      );
    }

    // 2. Lấy framework_id mặc định
    const { data: framework } = await supabase
      .from('assessment_frameworks')
      .select('id')
      .limit(1)
      .single();

    // 3. Khởi tạo đề thi với quyền sở hữu cá nhân / tổ chức rõ ràng
    const { data: created, error: insertError } = await supabase
      .from('assessments')
      .insert({
        title: title.trim(),
        description: description?.trim() || 'Bài khảo thí năng lực số DigComp.',
        duration_minutes: Number(duration_minutes),
        passing_score: Number(passing_score),
        point_reward: Number(point_reward),
        is_published: Boolean(is_published),
        owner_user_id: user.id,
        created_by: user.id,
        organization_id: organizationId || null,
        visibility: organizationId ? 'ORGANIZATION' : 'PERSONAL',
        framework_id: framework?.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating assessment:', insertError);
      return NextResponse.json({ error: insertError.message || 'Không thể tạo đề thi' }, { status: 400 });
    }

    return NextResponse.json({ success: true, assessment: created }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

