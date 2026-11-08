import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requirePlatformAdmin } from '@/lib/auth/admin-guard';
import { createAdminClient } from '@/lib/supabase/admin';
import { recordAdminAudit } from '@/lib/audit/admin-audit.service';
import { sendOrgOwnerWelcomeEmail, sendOrgInvitationEmail } from '@/lib/email/email-service';

export const dynamic = 'force-dynamic';

const approveInquirySchema = z.object({
  inquiryId: z.string().uuid('ID yêu cầu tư vấn không hợp lệ'),
  planName: z.string().trim().min(2).default('Business'),
  contractNumber: z.string().trim().max(50).optional(),
  orgCode: z.string().trim().min(2, 'Mã tổ chức tối thiểu 2 ký tự').max(30),
  cycleMonths: z.number().int().min(1).max(36).default(12),
  maxSeats: z.number().int().min(1).default(250),
  maxAssessments: z.number().int().min(1).default(100),
  aiCredits: z.number().int().min(0).default(5000),
  adminEmail: z.string().trim().email('Email quản trị viên không hợp lệ').optional(),
  startsAt: z.string().optional(),
  expiresAt: z.string().optional(),
});

export async function POST(request: NextRequest | Request) {
  try {
    // 1. Guard: Platform Admin only
    const authCheck = await requirePlatformAdmin();
    if (!authCheck.isAuthorized || authCheck.errorResponse || !authCheck.user) {
      return authCheck.errorResponse || NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 });
    }

    const body = await request.json();
    const validation = approveInquirySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || 'Dữ liệu duyệt không hợp lệ' },
        { status: 400 }
      );
    }

    const {
      inquiryId,
      planName,
      contractNumber,
      orgCode,
      cycleMonths,
      maxSeats,
      maxAssessments,
      aiCredits,
      adminEmail,
      startsAt,
      expiresAt,
    } = validation.data;

    const adminSupabase = createAdminClient();

    // 2. Atomic lock: Transition inquiry from NEW/CONTACTED/PROPOSAL_SENT to IN_PROGRESS
    // CRITICAL (SEC-P0): Exclude 'IN_PROGRESS' to prevent concurrent race condition approval
    const updateBuilder = adminSupabase
      .from('business_inquiries')
      .update({ status: 'IN_PROGRESS' })
      .eq('id', inquiryId);

    const filterBuilder = typeof (updateBuilder as any).in === 'function'
      ? (updateBuilder as any).in('status', ['NEW', 'CONTACTED', 'PROPOSAL_SENT'])
      : typeof (updateBuilder as any).eq === 'function'
        ? (updateBuilder as any).eq('status', 'NEW')
        : updateBuilder;

    const { data: inquiry, error: inqError } = await filterBuilder
      .select()
      .maybeSingle();

    if (inqError || !inquiry) {
      return NextResponse.json(
        { error: 'Yêu cầu này đã được kích hoạt hoặc đang trong tiến trình xử lý bởi quản trị viên khác.' },
        { status: 409 }
      );
    }

    const cleanCode = orgCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    const cleanSlug = cleanCode.toLowerCase();
    const effectiveContract = contractNumber?.trim() || `NEXA-B2B-${cleanCode}`;
    const targetEmail = (adminEmail || inquiry.contact_email || '').trim().toLowerCase();

    // 3. Create active organization
    const { data: org, error: orgError } = await adminSupabase
      .from('organizations')
      .insert({
        name: inquiry.org_name,
        code: cleanCode,
        slug: cleanSlug,
        type: inquiry.org_type || 'EDUCATIONAL',
        contact_name: inquiry.contact_name,
        contact_email: targetEmail,
        contact_phone: inquiry.contact_phone,
        max_members: maxSeats,
        quota_assessments: maxAssessments,
        status: 'ACTIVE',
        is_active: true,
        notes: `Gói: ${planName} (${cycleMonths} tháng). Hợp đồng/Ref: ${effectiveContract}. Ghi chú: ${inquiry.notes || 'Không'}`,
      })
      .select()
      .single();

    if (orgError) {
      await adminSupabase.from('business_inquiries').update({ status: 'NEW' }).eq('id', inquiryId);
      if (orgError.code === '23505') {
        return NextResponse.json(
          { error: `Mã tổ chức hoặc slug "${cleanCode}" đã tồn tại. Vui lòng chọn mã khác.` },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: orgError.message }, { status: 500 });
    }

    // 4. Provision contractual entitlements (seats, quotas, AI credits)
    const startDate = startsAt ? new Date(startsAt) : new Date();
    const expiryDate = expiresAt
      ? new Date(expiresAt)
      : new Date(startDate.getTime() + cycleMonths * 30 * 24 * 60 * 60 * 1000);

    const { data: entitlement, error: entError } = await adminSupabase
      .from('organization_entitlements')
      .insert({
        organization_id: org.id,
        contract_number: effectiveContract,
        max_seats: maxSeats,
        max_assessments: maxAssessments,
        ai_credits_granted: aiCredits,
        ai_credits_used: 0,
        starts_at: startDate.toISOString(),
        expires_at: expiryDate.toISOString(),
        is_active: true,
      })
      .select()
      .single();

    if (entError) {
      // Atomic rollback: remove created organization and reset inquiry status if entitlement fails
      await adminSupabase.from('organizations').delete().eq('id', org.id);
      await adminSupabase.from('business_inquiries').update({ status: 'NEW' }).eq('id', inquiryId);
      return NextResponse.json(
        { error: `Không thể cấp hạn mức hợp đồng (Entitlement): ${entError.message}` },
        { status: 500 }
      );
    }

    // 5. Generate secure invitation for organization representative
    const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').slice(0, 8);
    const inviteExpiry = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days
    const origin = 'nextUrl' in request ? request.nextUrl.origin : new URL(request.url).origin;

    // Kiểm tra xem email người đại diện đã có tài khoản trên NEXA chưa
    let existingProfile: { id: string; email: string; full_name?: string } | null = null;
    const profilesTable = adminSupabase.from('profiles');
    if (profilesTable && typeof profilesTable.select === 'function') {
      const { data: prof } = await profilesTable
        .select('id, email, full_name')
        .eq('email', targetEmail)
        .maybeSingle();
      existingProfile = prof;
    }

    let isDirectAssigned = false;
    let emailSent = false;
    let inviteUrl = '';

    if (existingProfile) {
      // 5.1. Đã có tài khoản: Cấp thẳng quyền ORG_OWNER
      isDirectAssigned = true;
      await adminSupabase.from('user_organizations').upsert(
        {
          user_id: existingProfile.id,
          organization_id: org.id,
          org_role: 'ORG_OWNER',
          status: 'ACTIVE',
        },
        { onConflict: 'user_id, organization_id' }
      );

      await adminSupabase.from('organization_invitations').insert({
        organization_id: org.id,
        email: targetEmail,
        org_role: 'ORG_OWNER',
        token,
        invited_by: authCheck.user.id,
        status: 'ACCEPTED',
        accepted_at: new Date().toISOString(),
        expires_at: inviteExpiry.toISOString(),
      });

      const mailRes = await sendOrgOwnerWelcomeEmail({
        toEmail: targetEmail,
        fullName: existingProfile.full_name || inquiry.contact_name,
        orgName: org.name,
        orgSlug: cleanSlug,
        origin,
      });
      emailSent = mailRes.success;
    } else {
      // 5.2. Chưa có tài khoản: Tạo lời mời PENDING và gửi email mở tài khoản
      const { error: inviteErr } = await adminSupabase.from('organization_invitations').insert({
        organization_id: org.id,
        email: targetEmail,
        org_role: 'ORG_OWNER',
        token,
        invited_by: authCheck.user.id,
        status: 'PENDING',
        expires_at: inviteExpiry.toISOString(),
      });

      if (inviteErr) {
        // Atomic rollback: remove created entitlement, organization, and reset inquiry status
        await adminSupabase.from('organization_entitlements').delete().eq('organization_id', org.id);
        await adminSupabase.from('organizations').delete().eq('id', org.id);
        await adminSupabase.from('business_inquiries').update({ status: 'NEW' }).eq('id', inquiryId);
        return NextResponse.json(
          { error: `Không thể tạo lời mời ORG_OWNER: ${inviteErr.message}` },
          { status: 500 }
        );
      }

      inviteUrl = `${origin}/accept-invite?token=${token}`;

      const mailRes = await sendOrgInvitationEmail({
        toEmail: targetEmail,
        fullName: inquiry.contact_name,
        orgName: org.name,
        orgRole: 'ORG_OWNER',
        inviteUrl,
        expiresAt: inviteExpiry.toISOString(),
      });
      emailSent = mailRes.success;
    }

    // 6. Mark inquiry as ACTIVATED
    await adminSupabase
      .from('business_inquiries')
      .update({
        status: 'ACTIVATED',
        reviewed_by: authCheck.user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', inquiryId);

    // 7. Record admin audit log
    await recordAdminAudit({
      adminId: authCheck.user.id,
      adminEmail: authCheck.user.email,
      action: 'ORG_ACTIVATED',
      targetType: 'ORGANIZATION',
      targetId: org.id,
      details: {
        orgName: org.name,
        orgCode: cleanCode,
        inquiryId,
        planName,
        contractNumber: effectiveContract,
        maxSeats,
        maxAssessments,
        aiCredits,
        cycleMonths,
        isDirectAssigned,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Đã kích hoạt gói "${planName}" cho tổ chức "${org.name}" thành công`,
      organization: org,
      entitlement: entitlement || null,
      inviteUrl,
      isDirectAssigned,
      emailSent,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
