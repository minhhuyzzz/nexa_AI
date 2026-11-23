import { NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/auth/admin-guard';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePlatformAdmin();
    if (!auth.isAuthorized) {
      return auth.errorResponse!;
    }

    const { id: credentialId } = await params;
    const body = await request.json().catch(() => ({}));
    const { isRevoked = true, revokedReason = '' } = body;

    const adminSupabase = createAdminClient();

    // 1. Kiểm tra chứng chỉ tồn tại
    const { data: existing, error: existErr } = await adminSupabase
      .from('credentials')
      .select('id, credential_code, candidate_name, is_revoked')
      .eq('id', credentialId)
      .single();

    if (existErr || !existing) {
      return NextResponse.json(
        { error: 'Không tìm thấy chứng chỉ số này' },
        { status: 404 }
      );
    }

    const nowIso = new Date().toISOString();

    // 2. Cập nhật trạng thái thu hồi / khôi phục
    const { error: updateErr } = await adminSupabase
      .from('credentials')
      .update({
        is_revoked: Boolean(isRevoked),
        revoked_reason: isRevoked ? revokedReason.trim() || 'Thu hồi do phát hiện vi phạm liêm chính khảo thí' : null,
        updated_at: nowIso,
      })
      .eq('id', credentialId);

    if (updateErr) {
      console.error('[REVOKE_CREDENTIAL_UPDATE_ERROR]', updateErr);
      return NextResponse.json(
        { error: 'Không thể cập nhật trạng thái chứng chỉ' },
        { status: 500 }
      );
    }

    // 3. Ghi audit log
    try {
      await adminSupabase.from('audit_logs').insert({
        actor_id: auth.user?.id,
        action: isRevoked ? 'REVOKE_CREDENTIAL' : 'RESTORE_CREDENTIAL',
        entity_type: 'CREDENTIAL',
        entity_id: credentialId,
        details: {
          credential_code: existing.credential_code,
          candidate_name: existing.candidate_name,
          reason: revokedReason,
          actor_email: auth.user?.email,
        },
        created_at: nowIso,
      });
    } catch (auditErr) {
      console.warn('[REVOKE_CREDENTIAL_AUDIT_LOG_WARN]', auditErr);
    }

    return NextResponse.json({
      success: true,
      message: isRevoked
        ? `Đã thu hồi chứng chỉ ${existing.credential_code} thành công`
        : `Đã khôi phục chứng chỉ ${existing.credential_code} thành công`,
      credentialId,
      isRevoked: Boolean(isRevoked),
      revokedReason: isRevoked ? revokedReason : null,
    });
  } catch (err: any) {
    console.error('[REVOKE_CREDENTIAL_API_ERROR]', err);
    return NextResponse.json(
      { error: err?.message || 'Lỗi hệ thống khi cập nhật chứng chỉ' },
      { status: 500 }
    );
  }
}
