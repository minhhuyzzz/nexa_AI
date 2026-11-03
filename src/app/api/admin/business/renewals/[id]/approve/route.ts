import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requirePlatformAdmin } from '@/lib/auth/admin-guard';
import { createAdminClient } from '@/lib/supabase/admin';
import { recordAdminAudit } from '@/lib/audit/admin-audit.service';

export const dynamic = 'force-dynamic';

const approveRenewalSchema = z.object({
  adminNotes: z.string().trim().optional(),
  grantedSeats: z.number().int().positive().optional(),
  grantedCredits: z.number().int().min(0).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authCheck = await requirePlatformAdmin();
    if (!authCheck.isAuthorized || authCheck.errorResponse || !authCheck.user) {
      return authCheck.errorResponse || NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 });
    }

    let bodyData = {};
    try {
      bodyData = await request.json();
    } catch {
      // Body is optional
    }

    const validation = approveRenewalSchema.safeParse(bodyData);
    const { adminNotes, grantedSeats, grantedCredits } = validation.success ? validation.data : {};

    const adminSupabase = createAdminClient();

    // 1. Fetch pending renewal request
    const { data: renewal, error: renewalErr } = await adminSupabase
      .from('renewal_requests')
      .select('*, organizations ( id, name, slug, code )')
      .eq('id', id)
      .eq('status', 'PENDING')
      .maybeSingle();

    if (renewalErr || !renewal) {
      return NextResponse.json(
        { error: 'Yêu cầu gia hạn này không tồn tại hoặc đã được xử lý trước đó.' },
        { status: 404 }
      );
    }

    const orgId = renewal.organization_id;

    // 2. Fetch latest entitlement of the organization
    const { data: entitlement, error: entErr } = await adminSupabase
      .from('organization_entitlements')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const now = new Date();
    const currentExpiry = entitlement?.expires_at ? new Date(entitlement.expires_at) : now;
    // SEC-08: Zero-loss rule: new_end_at = max(now, current_end_at) + period
    const baseDate = currentExpiry > now ? currentExpiry : now;
    const months = renewal.period_months || 12;
    const newExpiry = new Date(baseDate.getTime() + months * 30 * 24 * 60 * 60 * 1000);

    const updatedSeats = grantedSeats || renewal.requested_seats || entitlement?.max_seats || 250;
    const addCredits = grantedCredits !== undefined ? grantedCredits : (renewal.requested_credits || 0);

    // 3. Update or insert entitlement
    if (entitlement) {
      const { error: updateEntErr } = await adminSupabase
        .from('organization_entitlements')
        .update({
          expires_at: newExpiry.toISOString(),
          max_seats: updatedSeats,
          ai_credits_granted: (entitlement.ai_credits_granted || 0) + addCredits,
          is_active: true,
        })
        .eq('id', entitlement.id);

      if (updateEntErr) {
        return NextResponse.json({ error: `Lỗi cập nhật hạn mức: ${updateEntErr.message}` }, { status: 500 });
      }
    } else {
      // Create new entitlement if missing
      const { error: insertEntErr } = await adminSupabase
        .from('organization_entitlements')
        .insert({
          organization_id: orgId,
          contract_number: `NEXA-RENEW-${renewal.id.slice(0, 8).toUpperCase()}`,
          max_seats: updatedSeats,
          max_assessments: 100,
          ai_credits_granted: addCredits || 5000,
          ai_credits_used: 0,
          starts_at: now.toISOString(),
          expires_at: newExpiry.toISOString(),
          is_active: true,
        });

      if (insertEntErr) {
        return NextResponse.json({ error: `Lỗi khởi tạo hạn mức mới: ${insertEntErr.message}` }, { status: 500 });
      }
    }

    // 4. Update renewal request status to APPROVED
    await adminSupabase
      .from('renewal_requests')
      .update({
        status: 'APPROVED',
        reviewed_by: authCheck.user.id,
        reviewed_at: now.toISOString(),
        admin_notes: adminNotes || null,
        updated_at: now.toISOString(),
      })
      .eq('id', id);

    // 5. Ensure organization status is ACTIVE
    await adminSupabase
      .from('organizations')
      .update({
        status: 'ACTIVE',
        is_active: true,
      })
      .eq('id', orgId);

    // 6. Record Admin Audit Log
    const orgName = (renewal.organizations as any)?.name || 'Tổ chức';
    await recordAdminAudit({
      adminId: authCheck.user.id,
      adminEmail: authCheck.user.email,
      action: 'ORG_RENEWAL_APPROVED',
      targetType: 'RENEWAL_REQUEST',
      targetId: id,
      details: {
        organizationId: orgId,
        organizationName: orgName,
        periodMonths: months,
        newExpiresAt: newExpiry.toISOString(),
        updatedSeats,
        addedCredits: addCredits,
        adminNotes: adminNotes || 'Chấp thuận gia hạn',
      },
    });

    return NextResponse.json({
      success: true,
      message: `Đã phê duyệt gia hạn ${months} tháng cho tổ chức "${orgName}" thành công`,
      newExpiresAt: newExpiry.toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
