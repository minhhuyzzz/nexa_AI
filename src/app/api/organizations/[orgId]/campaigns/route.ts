import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

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

async function checkOrgManagerOrAssessor(userId: string, orgId: string) {
  const adminSupabase = createAdminClient();
  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (profile?.role === 'ADMIN') return true;

  const { data: member } = await adminSupabase
    .from('user_organizations')
    .select('org_role, status')
    .eq('user_id', userId)
    .eq('organization_id', orgId)
    .eq('status', 'ACTIVE')
    .single();

  return (
    member &&
    ['ORG_OWNER', 'ORG_ADMIN', 'ASSESSOR', 'EVALUATOR'].includes(member.org_role)
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
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
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    const isAuthorized = await checkOrgManagerOrAssessor(user.id, orgId);
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Bạn không có quyền tạo đợt đánh giá cho tổ chức này' },
        { status: 403 }
      );
    }

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

    // 1. Verify assessment exists and belongs to this organization
    const { data: assessment, error: assessErr } = await adminSupabase
      .from('assessments')
      .select('id, title, is_published, version')
      .eq('id', assessmentId)
      .single();

    if (assessErr || !assessment) {
      return NextResponse.json({ error: 'Đề thi không tồn tại' }, { status: 404 });
    }

    // 2. Lock version of assessment (freezes content for test integrity)
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

    // 3. Insert Campaign record
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

    if (campErr) {
      return NextResponse.json({ error: campErr.message }, { status: 500 });
    }

    // 4. Automatically generate class_assignments for participating cohorts
    for (const cid of classIds) {
      await adminSupabase.from('class_assignments').upsert(
        {
          class_id: cid,
          assessment_id: assessmentId,
          deadline: endTime.toISOString(),
        },
        { onConflict: 'class_id, assessment_id' }
      );
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
