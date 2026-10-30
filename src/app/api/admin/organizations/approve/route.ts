import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requirePlatformAdmin } from '@/lib/auth/admin-guard';
import { createAdminClient } from '@/lib/supabase/admin';
import { recordAdminAudit } from '@/lib/audit/admin-audit.service';

export const dynamic = 'force-dynamic';

const approveInquirySchema = z.object({
  inquiryId: z.string().uuid('ID yêu cầu tư vấn không hợp lệ'),
  contractNumber: z.string().trim().min(3, 'Số hợp đồng tối thiểu 3 ký tự').max(50),
  orgCode: z.string().trim().min(2, 'Mã tổ chức tối thiểu 2 ký tự').max(30),
  maxSeats: z.number().int().min(5).default(50),
  maxAssessments: z.number().int().min(10).default(500),
  aiCredits: z.number().int().min(50).default(1000),
  startsAt: z.string().optional(),
  expiresAt: z.string().optional(),
});

export async function POST(request: NextRequest | Request) {
  try {
    // 1. Guard: Platform Admin only
    const authCheck = await requirePlatformAdmin();
    if (!authCheck.isAuthorized || authCheck.errorResponse) {
      return authCheck.errorResponse!;
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
      contractNumber,
      orgCode,
      maxSeats,
      maxAssessments,
      aiCredits,
      startsAt,
      expiresAt,
    } = validation.data;

    const adminSupabase = createAdminClient();

    // 2. Fetch inquiry
    const { data: inquiry, error: inqError } = await adminSupabase
      .from('business_inquiries')
      .select('*')
      .eq('id', inquiryId)
      .single();

    if (inqError || !inquiry) {
      return NextResponse.json(
        { error: 'Không tìm thấy yêu cầu tư vấn' },
        { status: 404 }
      );
    }

    if (inquiry.status === 'APPROVED') {
      return NextResponse.json(
        { error: 'Yêu cầu này đã được phê duyệt và khởi tạo tổ chức trước đó' },
        { status: 400 }
      );
    }

    const cleanCode = orgCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    const cleanSlug = cleanCode.toLowerCase();

    // 3. Create active organization
    const { data: org, error: orgError } = await adminSupabase
      .from('organizations')
      .insert({
        name: inquiry.org_name,
        code: cleanCode,
        slug: cleanSlug,
        type: inquiry.org_type || 'EDUCATIONAL',
        contact_name: inquiry.contact_name,
        contact_email: inquiry.contact_email,
        contact_phone: inquiry.contact_phone,
        max_members: maxSeats,
        quota_assessments: maxAssessments,
        status: 'ACTIVE',
        is_active: true,
        notes: `Hợp đồng: ${contractNumber}. Ghi chú inquiry: ${inquiry.notes || 'Không'}`,
      })
      .select()
      .single();

    if (orgError) {
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
      : new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000);

    const { data: entitlement, error: entError } = await adminSupabase
      .from('organization_entitlements')
      .insert({
        organization_id: org.id,
        contract_number: contractNumber.trim(),
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
      // Atomic rollback: remove created organization if entitlement provisioning fails
      await adminSupabase.from('organizations').delete().eq('id', org.id);
      return NextResponse.json(
        { error: `Không thể cấp hạn mức hợp đồng (Entitlement): ${entError.message}` },
        { status: 500 }
      );
    }

    // 5. Generate secure invitation for organization representative
    const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').slice(0, 8);
    const inviteExpiry = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days

    const { error: inviteErr } = await adminSupabase.from('organization_invitations').insert({
      organization_id: org.id,
      email: inquiry.contact_email.trim().toLowerCase(),
      org_role: 'ORG_OWNER',
      token,
      status: 'PENDING',
      expires_at: inviteExpiry.toISOString(),
    });

    if (inviteErr) {
      // Atomic rollback: remove created entitlement and organization
      await adminSupabase.from('organization_entitlements').delete().eq('organization_id', org.id);
      await adminSupabase.from('organizations').delete().eq('id', org.id);
      return NextResponse.json(
        { error: `Không thể tạo lời mời ORG_OWNER: ${inviteErr.message}` },
        { status: 500 }
      );
    }

    // 6. Mark inquiry as APPROVED
    await adminSupabase
      .from('business_inquiries')
      .update({
        status: 'APPROVED',
        reviewed_by: authCheck.user?.id || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', inquiryId);

    // 7. Record admin audit log
    await recordAdminAudit({
      adminId: authCheck.user?.id,
      adminEmail: authCheck.user?.email,
      action: 'ORG_APPROVED',
      targetType: 'ORGANIZATION',
      targetId: org.id,
      details: {
        orgName: org.name,
        orgCode: cleanCode,
        inquiryId,
        contractNumber,
        maxSeats,
        maxAssessments,
        aiCredits,
      },
    });

    const origin = 'nextUrl' in request ? request.nextUrl.origin : new URL(request.url).origin;
    const inviteUrl = `${origin}/personal/accept-invite?token=${token}`;

    return NextResponse.json({
      success: true,
      message: `Đã kích hoạt tổ chức "${org.name}" và cấp hạn mức hợp đồng thành công`,
      organization: org,
      entitlement: entitlement || null,
      inviteUrl,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
