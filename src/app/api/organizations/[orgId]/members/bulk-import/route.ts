import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const memberRowSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  orgRole: z
    .enum(['ORG_ADMIN', 'ASSESSOR', 'EVALUATOR', 'REPORT_VIEWER', 'MEMBER'])
    .default('MEMBER'),
  fullName: z.string().trim().max(100).optional(),
  studentId: z.string().trim().max(50).optional(),
});

const bulkImportSchema = z.object({
  members: z.array(memberRowSchema).min(1, 'Danh sách import tối thiểu 1 thành viên'),
});

async function checkOrgManager(userId: string, orgId: string) {
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

  return member && ['ORG_OWNER', 'ORG_ADMIN'].includes(member.org_role);
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

    const isManager = await checkOrgManager(user.id, orgId);
    if (!isManager) {
      return NextResponse.json(
        { error: 'Bạn không có quyền import thành viên cho tổ chức này' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = bulkImportSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || 'Dữ liệu danh sách không hợp lệ' },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();

    // 1. Check organization and seat quota
    const { data: org, error: orgErr } = await adminSupabase
      .from('organizations')
      .select('id, name, slug, max_members, is_active')
      .eq('id', orgId)
      .single();

    if (orgErr || !org) {
      return NextResponse.json({ error: 'Không tìm thấy tổ chức' }, { status: 404 });
    }

    if (org.is_active === false) {
      return NextResponse.json(
        { error: 'Tổ chức đang bị tạm ngưng hoạt động. Không thể mời thêm thành viên.' },
        { status: 403 }
      );
    }

    const { count: currentMemberCount } = await adminSupabase
      .from('user_organizations')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('status', 'ACTIVE');

    const maxSeats = org.max_members || 50;
    const remainingSeats = Math.max(0, maxSeats - (currentMemberCount || 0));

    // Deduplicate emails in submission
    const rawMembers = validation.data.members;
    const emailMap = new Map<string, z.infer<typeof memberRowSchema>>();
    for (const m of rawMembers) {
      if (!emailMap.has(m.email)) {
        emailMap.set(m.email, m);
      }
    }
    const uniqueMembers = Array.from(emailMap.values());

    if (uniqueMembers.length > remainingSeats) {
      return NextResponse.json(
        {
          error: `Số lượng import (${uniqueMembers.length} người) vượt quá số ghế còn lại của tổ chức (${remainingSeats} ghế trống trên tổng ${maxSeats}). Vui lòng nâng cấp hợp đồng.`,
          remainingSeats,
          requestedCount: uniqueMembers.length,
        },
        { status: 400 }
      );
    }

    // 2. Fetch existing active members to avoid duplicate invites
    const emails = uniqueMembers.map((m) => m.email);
    const { data: existingProfiles } = await adminSupabase
      .from('profiles')
      .select('id, email')
      .in('email', emails);

    const existingUserIds = (existingProfiles || []).map((p) => p.id);
    let existingMemberEmails = new Set<string>();

    if (existingUserIds.length > 0) {
      const { data: existingUserOrgs } = await adminSupabase
        .from('user_organizations')
        .select('user_id')
        .eq('organization_id', orgId)
        .eq('status', 'ACTIVE')
        .in('user_id', existingUserIds);

      const activeUserIdsSet = new Set((existingUserOrgs || []).map((uo) => uo.user_id));
      existingMemberEmails = new Set(
        (existingProfiles || [])
          .filter((p) => activeUserIdsSet.has(p.id))
          .map((p) => p.email.toLowerCase())
      );
    }

    const newCandidates = uniqueMembers.filter(
      (m) => !existingMemberEmails.has(m.email)
    );

    if (newCandidates.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Tất cả các tài khoản trong danh sách đã là thành viên chính thức của tổ chức',
        importedCount: 0,
        skippedCount: uniqueMembers.length,
      });
    }

    // 3. Batch insert invitations
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    const invitationRecords = newCandidates.map((c) => {
      const token =
        crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').slice(0, 8);
      return {
        organization_id: orgId,
        email: c.email,
        org_role: c.orgRole,
        token,
        status: 'PENDING',
        invited_by: user.id,
        expires_at: expiresAt,
      };
    });

    const { data: inserted, error: batchErr } = await adminSupabase
      .from('organization_invitations')
      .insert(invitationRecords)
      .select('id, email, org_role, token, status');

    if (batchErr) {
      return NextResponse.json({ error: batchErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Đã gửi thành công ${newCandidates.length} lời mời gia nhập tổ chức`,
      importedCount: newCandidates.length,
      skippedCount: uniqueMembers.length - newCandidates.length,
      invitations: inserted || [],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
