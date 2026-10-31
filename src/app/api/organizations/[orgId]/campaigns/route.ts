import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireOrgApiPermission } from '@/lib/auth/org-guard';

export const dynamic = 'force-dynamic';

const campaignSchema = z.object({
  title: z.string().trim().min(3, 'Tên đợt đánh giá tối thiểu 3 ký tự').max(150),
  description: z.string().trim().optional(),
  assessmentId: z.string().uuid('ID đề thi không hợp lệ'),
  classIds: z.array(z.string().uuid()).min(1, 'Vui lòng chọn ít nhất 1 lớp tham gia'),
  assessorIds: z.array(z.string().uuid()).optional().default([]),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  passingScore: z.number().min(0).max(100).default(70.0),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    const authResult = await requireOrgApiPermission(orgId, 'VIEW_WORKSPACE');
    if (!authResult.authorized) {
      return authResult.response!;
    }

    const adminSupabase = createAdminClient();
    const { data: campaigns, error } = await adminSupabase
      .from('assessment_campaigns')
      .select(`
        *,
        assessments ( id, title, duration_minutes, passing_score, version )
      `)
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, campaigns: campaigns || [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    const authResult = await requireOrgApiPermission(orgId, 'MANAGE_CAMPAIGNS');
    if (!authResult.authorized) {
      return authResult.response!;
    }
    const user = authResult.context!.user;

    const body = await request.json();
    const validation = campaignSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const {
      title,
      description,
      assessmentId,
      classIds,
      assessorIds,
      startsAt,
      endsAt,
      passingScore,
    } = validation.data;

    const adminSupabase = createAdminClient();

    // SEC-03 1. Verify assessment exists AND belongs to org or is public
    const { data: assessment, error: assessErr } = await adminSupabase
      .from('assessments')
      .select('id, title, is_published, version, organization_id, visibility')
      .eq('id', assessmentId)
      .single();

    if (assessErr || !assessment) {
      return NextResponse.json({ error: 'Đề thi không tồn tại' }, { status: 404 });
    }

    const isOrgAssessment = assessment.organization_id === orgId;
    const isPublicTemplate = assessment.visibility === 'PUBLIC';
    if (!isOrgAssessment && !isPublicTemplate) {
      return NextResponse.json(
        { error: 'Đề thi không thuộc quyền quản lý của tổ chức này' },
        { status: 403 }
      );
    }

    // SEC-03 2. Verify all classIds strictly belong to this orgId
    if (classIds && classIds.length > 0) {
      const { data: validClasses } = await adminSupabase
        .from('evaluator_classes')
        .select('id')
        .eq('organization_id', orgId)
        .in('id', classIds);

      if (!validClasses || validClasses.length !== classIds.length) {
        return NextResponse.json(
          { error: 'Một hoặc nhiều lớp học được chọn không thuộc tổ chức này' },
          { status: 400 }
        );
      }
    }

    // SEC-03 3. Verify all assessorIds are active members in this orgId
    if (assessorIds && assessorIds.length > 0) {
      const { data: validAssessors } = await adminSupabase
        .from('user_organizations')
        .select('user_id')
        .eq('organization_id', orgId)
        .eq('status', 'ACTIVE')
        .in('org_role', ['ORG_OWNER', 'ORG_ADMIN', 'ASSESSOR', 'EVALUATOR'])
        .in('user_id', assessorIds);

      if (!validAssessors || validAssessors.length !== assessorIds.length) {
        return NextResponse.json(
          { error: 'Một hoặc nhiều người chấm được chọn không có quyền trong tổ chức này' },
          { status: 400 }
        );
      }
    }

    // 4. Lock version of assessment (freezes content for test integrity)
    await adminSupabase
      .from('assessments')
      .update({
        is_locked: true,
        is_published: true,
        status: 'PUBLISHED',
      })
      .eq('id', assessmentId);

    const startTime = startsAt ? new Date(startsAt) : new Date();
    const endTime = endsAt
      ? new Date(endsAt)
      : new Date(startTime.getTime() + 14 * 24 * 60 * 60 * 1000);

    // 5. Insert Campaign record
    const { data: campaign, error: campErr } = await adminSupabase
      .from('assessment_campaigns')
      .insert({
        organization_id: orgId,
        title,
        description: description || '',
        assessment_id: assessmentId,
        class_ids: classIds,
        assessor_ids: assessorIds,
        starts_at: startTime.toISOString(),
        ends_at: endTime.toISOString(),
        status: 'ACTIVE',
        passing_score: passingScore,
        created_by: user.id,
      })
      .select()
      .single();

    if (campErr || !campaign) {
      return NextResponse.json({ error: campErr?.message || 'Không thể tạo đợt đánh giá' }, { status: 500 });
    }

    // SEC-03 6. Atomic assignment generation with rollback on failure
    for (const cid of classIds) {
      const { error: assignErr } = await adminSupabase.from('class_assignments').upsert(
        {
          class_id: cid,
          assessment_id: assessmentId,
          deadline: endTime.toISOString(),
        },
        { onConflict: 'class_id, assessment_id' }
      );

      if (assignErr) {
        // Rollback campaign to prevent dangling record
        await adminSupabase.from('assessment_campaigns').delete().eq('id', campaign.id);
        return NextResponse.json(
          { error: 'Lỗi khi giao đề thi cho các lớp học, đã hủy đợt đánh giá dở dang' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `Đã khởi tạo đợt đánh giá "${title}" và phân công bài thi tới ${classIds.length} lớp`,
      campaign,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

const updateCampaignSchema = z.object({
  campaignId: z.string().uuid('ID đợt đánh giá không hợp lệ'),
  status: z.enum(['SCHEDULED', 'ACTIVE', 'GRADING', 'COMPLETED', 'ARCHIVED']),
});

const ALLOWED_CAMPAIGN_TRANSITIONS: Record<string, string[]> = {
  SCHEDULED: ['ACTIVE', 'ARCHIVED'],
  ACTIVE: ['GRADING', 'COMPLETED', 'ARCHIVED'],
  GRADING: ['ACTIVE', 'COMPLETED', 'ARCHIVED'],
  COMPLETED: ['ARCHIVED'],
  ARCHIVED: [],
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    const authResult = await requireOrgApiPermission(orgId, 'MANAGE_CAMPAIGNS');
    if (!authResult.authorized) {
      return authResult.response!;
    }

    const body = await request.json();
    const validation = updateCampaignSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const { campaignId, status: nextStatus } = validation.data;
    const adminSupabase = createAdminClient();

    // 1. Fetch current campaign
    const { data: campaign, error: fetchErr } = await adminSupabase
      .from('assessment_campaigns')
      .select('id, organization_id, status, title')
      .eq('id', campaignId)
      .eq('organization_id', orgId)
      .single();

    if (fetchErr || !campaign) {
      return NextResponse.json(
        { error: 'Không tìm thấy đợt đánh giá trong tổ chức này' },
        { status: 404 }
      );
    }

    const currentStatus = campaign.status;

    // 2. Validate state machine transition
    const allowed = ALLOWED_CAMPAIGN_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(nextStatus)) {
      return NextResponse.json(
        {
          error: `Không thể chuyển trạng thái đợt đánh giá từ "${currentStatus}" sang "${nextStatus}". Các trạng thái hợp lệ: ${allowed.join(', ') || 'Không có (đã kết thúc)'}`,
        },
        { status: 400 }
      );
    }

    // 3. Update status
    const { data: updatedCampaign, error: updateErr } = await adminSupabase
      .from('assessment_campaigns')
      .update({
        status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', campaignId)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Đã chuyển đợt đánh giá sang trạng thái "${nextStatus}" thành công`,
      campaign: updatedCampaign,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
