import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { QuotaEnforcementService } from '@/features/billing/services/quota-enforcement.service';

export async function GET(req: Request): Promise<NextResponse>;
export async function GET(): Promise<NextResponse>;
export async function GET(req?: Request): Promise<NextResponse> {
  try {
    const url = req ? new URL(req.url) : null;
    const orgId = url?.searchParams.get('orgId');
    const supabase = await createClient();

    let query = supabase
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
      .eq('is_published', true);

    if (orgId) {
      query = query.or(`organization_id.is.null,organization_id.eq.${orgId}`);
    } else {
      query = query.is('organization_id', null);
    }

    const { data: assessments, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching assessments from Supabase:', error);
      return NextResponse.json({ error: 'Không thể tải danh sách bài khảo thí' }, { status: 500 });
    }

    // Serve system assessments and (if orgId provided) organization bank assessments
    const filteredAssessments = (assessments || []).filter((a: any) => {
      if (orgId && a.organization_id === orgId) return true;
      if (a.organization_id) return false;
      if (a.visibility === 'PERSONAL' || a.visibility === 'ORGANIZATION') return false;
      if (a.is_system_baseline === true) return false;
      if (a.id === 'a0000000-0000-0000-0000-000000000001') return false;
      return true;
    });

    const formatted = filteredAssessments.map((a) => {
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

      const rawDesc = a.description || '';
      const cleanDesc = rawDesc.replace(/21\s*kỹ\s*năng(\s*số)?(\s*cốt\s*lõi)?/gi, '5 miền năng lực số');

      return {
        id: a.id,
        title: a.title,
        description: cleanDesc,
        duration_minutes: a.duration_minutes,
        passing_score: a.passing_score,
        point_reward: a.point_reward,
        questionCount,
        types: rawTypes,
        typeLabel: typeLabels.length > 0 ? typeLabels.join(', ') : 'Trắc nghiệm',
        domain: domainName,
        domainName,
        domainCodes: resolvedDomainCodes,
        target_domain: targetDomain,
        isVip: Boolean((a as any).is_vip || (a as any).access_tier === 'VIP'),
        accessTier: (a as any).access_tier || ((a as any).is_vip ? 'VIP' : 'FREE'),
        organization_id: a.organization_id || null,
        organizationId: a.organization_id || null,
        isOrgBank: Boolean(a.organization_id),
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

    // 2. Authorization check if creating within an Organization (ORG-F04)
    if (organizationId) {
      const { data: membership } = await supabase
        .from('user_organizations')
        .select('org_role, status')
        .eq('user_id', user.id)
        .eq('organization_id', organizationId)
        .maybeSingle();

      const authorizedRoles = ['ORG_OWNER', 'ORG_ADMIN', 'ASSESSOR', 'EVALUATOR'];
      if (!membership || membership.status !== 'ACTIVE' || !authorizedRoles.includes(membership.org_role)) {
        return NextResponse.json(
          { error: 'Bạn không có quyền tạo đề thi trong không gian tổ chức này' },
          { status: 403 }
        );
      }
    }

    // 3. Lấy framework_id mặc định
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
        description: description?.trim() || 'Bài khảo thí 5 miền năng lực số.',
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

