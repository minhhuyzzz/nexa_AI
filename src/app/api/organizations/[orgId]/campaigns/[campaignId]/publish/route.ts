import { NextResponse } from 'next/server';
import { getOrgAuthContext } from '@/lib/auth/org-guard';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ orgId: string; campaignId: string }> }
) {
  try {
    const { orgId, campaignId } = await params;
    const auth = await getOrgAuthContext(orgId, { isId: true });

    if (!auth || !auth.isAuthorized) {
      return NextResponse.json(
        { error: 'Bạn không có quyền quản trị tổ chức này' },
        { status: 403 }
      );
    }

    // Chỉ ORG_OWNER hoặc ORG_ADMIN mới có quyền công bố điểm toàn đợt
    if (auth.role !== 'ORG_OWNER' && auth.role !== 'ORG_ADMIN' && !auth.isSuperadmin) {
      return NextResponse.json(
        { error: 'Chỉ Quản trị viên hoặc Chủ sở hữu tổ chức mới có quyền công bố điểm toàn đợt' },
        { status: 403 }
      );
    }

    const adminSupabase = createAdminClient();

    // 1. Kiểm tra đợt khảo thí thuộc về tổ chức
    const { data: campaign, error: campErr } = await adminSupabase
      .from('assessment_campaigns')
      .select('id, title, organization_id, security_settings, status')
      .eq('id', campaignId)
      .eq('organization_id', auth.organization.id)
      .single();

    if (campErr || !campaign) {
      return NextResponse.json(
        { error: 'Không tìm thấy đợt khảo thí thuộc tổ chức này' },
        { status: 404 }
      );
    }

    const currentSecurity = (campaign.security_settings as Record<string, any>) || {};
    const nowIso = new Date().toISOString();

    const updatedSecurity = {
      ...currentSecurity,
      results_published: true,
      results_published_at: nowIso,
      results_published_by: auth.user.id,
    };

    // 2. Cập nhật trạng thái công bố kết quả của đợt thi
    const { error: updateCampErr } = await adminSupabase
      .from('assessment_campaigns')
      .update({
        security_settings: updatedSecurity,
        updated_at: nowIso,
      })
      .eq('id', campaignId);

    if (updateCampErr) {
      return NextResponse.json(
        { error: 'Không thể cập nhật trạng thái công bố kết quả' },
        { status: 500 }
      );
    }

    // 3. Lấy danh sách các bài thi đã nộp để ghi nhận thông báo cho thí sinh
    const { data: submissions } = await adminSupabase
      .from('assessment_submissions')
      .select('id, user_id, status, total_score')
      .eq('campaign_id', campaignId);

    const safeSubs = submissions || [];
    const userIds = Array.from(new Set(safeSubs.map((s) => s.user_id).filter(Boolean)));

    // 4. Gửi thông báo đến người học nếu có học viên
    if (userIds.length > 0) {
      try {
        const notifications = userIds.map((uid) => ({
          user_id: uid,
          title: 'Kết quả khảo thí đã được công bố',
          content: `Kết quả chính thức của đợt thi "${campaign.title}" đã được công bố. Bạn có thể vào xem điểm và nhận xét chi tiết.`,
          type: 'ASSESSMENT_RESULT',
          is_read: false,
          created_at: nowIso,
        }));

        await adminSupabase.from('user_notifications').insert(notifications);
      } catch (notifErr) {
        console.warn('[PUBLISH_RESULTS_NOTIF_WARN]', notifErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Đã công bố kết quả đợt thi thành công cho ${userIds.length} học viên`,
      campaignId,
      resultsPublished: true,
      publishedAt: nowIso,
      totalParticipants: userIds.length,
    });
  } catch (err: any) {
    console.error('[PUBLISH_CAMPAIGN_RESULTS_ERROR]', err);
    return NextResponse.json(
      { error: err?.message || 'Lỗi hệ thống khi công bố kết quả' },
      { status: 500 }
    );
  }
}
