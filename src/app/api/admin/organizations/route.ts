import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { requirePlatformAdmin } from '@/lib/auth/admin-guard';
import { sendOrgOwnerWelcomeEmail, sendOrgInvitationEmail } from '@/lib/email/email-service';

export const dynamic = 'force-dynamic';

const createOrgSchema = z.object({
  name: z.string().trim().min(2, 'Tên tổ chức tối thiểu 2 ký tự').max(100),
  code: z.string().trim().min(2, 'Mã tổ chức tối thiểu 2 ký tự').max(30),
  type: z.enum(['ACADEMY', 'EDUCATIONAL', 'ENTERPRISE', 'COMMUNITY']).default('EDUCATIONAL'),
  contactName: z.string().trim().optional(),
  contactEmail: z.string().trim().email('Email liên hệ không hợp lệ').optional().or(z.literal('')),
  contactPhone: z.string().trim().optional(),
  expectedLearners: z.number().int().positive().default(500),
  notes: z.string().optional(),
});

const patchOrgSchema = z.object({
  id: z.string().uuid('ID tổ chức không hợp lệ'),
  status: z.enum(['ACTIVE', 'PENDING_CONTACT', 'PROVISIONING', 'SUSPENDED', 'CLOSED']).optional(),
  code: z.string().trim().min(2).max(30).optional(),
  notes: z.string().optional(),
});

export async function GET() {
  try {
    // 1. Enforce Platform Admin authorization
    const authCheck = await requirePlatformAdmin();
    if (!authCheck.isAuthorized || authCheck.errorResponse) {
      return authCheck.errorResponse!;
    }

    const supabase = createAdminClient();

    // 2. Fetch organizations
    const { data: orgs, error } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('GET /api/admin/organizations error:', error.message);
      return NextResponse.json({ organizations: [] });
    }

    // 3. Fetch member counts per organization
    const { data: userOrgs } = await supabase
      .from('user_organizations')
      .select('organization_id');

    const memberCountMap: Record<string, number> = {};
    (userOrgs || []).forEach((uo) => {
      if (uo.organization_id) {
        memberCountMap[uo.organization_id] = (memberCountMap[uo.organization_id] || 0) + 1;
      }
    });

    const formatted = (orgs || []).map((org) => {
      return {
        id: org.id,
        code: org.code || (org.slug || org.name.slice(0, 4)).toUpperCase(),
        name: org.name,
        type: org.type === 'EDUCATIONAL' ? 'ACADEMY' : (org.type || 'ENTERPRISE'),
        contactName: org.contact_name || 'Chưa cập nhật',
        contactEmail: org.contact_email || '—',
        contactPhone: org.contact_phone || '—',
        expectedLearners: org.expected_learners || org.max_members || 500,
        activeMembers: memberCountMap[org.id] || 0,
        status: org.status || (org.is_active ? 'ACTIVE' : 'PENDING_CONTACT'),
        notes: org.notes || '',
        createdAt: org.created_at,
      };
    });

    return NextResponse.json({ success: true, organizations: formatted });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request | NextRequest) {
  try {
    // 1. Enforce Platform Admin authorization
    const authCheck = await requirePlatformAdmin();
    if (!authCheck.isAuthorized || authCheck.errorResponse) {
      return authCheck.errorResponse!;
    }

    const body = await request.json();
    const validation = createOrgSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const { name, code, contactName, contactEmail, contactPhone, expectedLearners, notes, type } =
      validation.data;

    const supabase = createAdminClient();
    const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    const cleanSlug = cleanCode.toLowerCase();
    const cleanEmail = (contactEmail || '').trim().toLowerCase();

    // Kiểm tra xem email người đại diện đã có tài khoản trên NEXA chưa
    let existingProfile: { id: string; email: string; full_name?: string } | null = null;
    if (cleanEmail) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('email', cleanEmail)
        .maybeSingle();
      existingProfile = profile;
    }

    const initialStatus = existingProfile ? 'ACTIVE' : cleanEmail ? 'PENDING_OWNER' : 'ACTIVE';

    const { data, error } = await supabase
      .from('organizations')
      .insert({
        name: name.trim(),
        code: cleanCode,
        slug: cleanSlug,
        type: type === 'ACADEMY' ? 'EDUCATIONAL' : type,
        contact_name: (contactName || '').trim(),
        contact_email: cleanEmail,
        contact_phone: (contactPhone || '').trim(),
        expected_learners: expectedLearners,
        max_members: expectedLearners,
        quota_assessments: expectedLearners * 10,
        status: initialStatus,
        is_active: true,
        plan_tier: 'BUSINESS',
        notes: (notes || '').trim(),
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: `Mã tổ chức "${cleanCode}" đã tồn tại. Vui lòng chọn mã khác.` },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const origin = 'nextUrl' in request ? request.nextUrl.origin : new URL(request.url).origin;
    let inviteUrl = '';
    let isDirectAssigned = false;
    let emailSent = false;

    if (cleanEmail) {
      const token =
        crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').slice(0, 8);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      if (existingProfile) {
        // CASE 1: Email ĐÃ CÓ tài khoản -> Cấp thẳng quyền ORG_OWNER vào user_organizations
        isDirectAssigned = true;
        await supabase.from('user_organizations').upsert(
          {
            user_id: existingProfile.id,
            organization_id: data.id,
            org_role: 'ORG_OWNER',
            status: 'ACTIVE',
          },
          { onConflict: 'user_id, organization_id' }
        );

        // Ghi nhận bản ghi lời mời đã chấp nhận
        await supabase.from('organization_invitations').insert({
          organization_id: data.id,
          email: cleanEmail,
          org_role: 'ORG_OWNER',
          token,
          status: 'ACCEPTED',
          accepted_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
        });

        // Gửi email thông báo bổ nhiệm quyền Chủ sở hữu
        const mailRes = await sendOrgOwnerWelcomeEmail({
          toEmail: cleanEmail,
          fullName: existingProfile.full_name || contactName,
          orgName: data.name,
          orgSlug: cleanSlug,
          origin,
        });
        emailSent = mailRes.success;
      } else {
        // CASE 2: Email CHƯA CÓ tài khoản -> Lưu lời mời PENDING và gửi email mở tài khoản
        await supabase.from('organization_invitations').insert({
          organization_id: data.id,
          email: cleanEmail,
          org_role: 'ORG_OWNER',
          token,
          status: 'PENDING',
          expires_at: expiresAt.toISOString(),
        });

        inviteUrl = `${origin}/accept-invite?token=${token}`;

        // Gửi email kích hoạt tài khoản
        const mailRes = await sendOrgInvitationEmail({
          toEmail: cleanEmail,
          fullName: contactName,
          orgName: data.name,
          orgRole: 'ORG_OWNER',
          inviteUrl,
          expiresAt: expiresAt.toISOString(),
        });
        emailSent = mailRes.success;
      }
    }

    return NextResponse.json({
      success: true,
      organization: data,
      inviteUrl,
      isDirectAssigned,
      emailSent,
      message: isDirectAssigned
        ? `Đã tạo tổ chức và tự động gán quyền Chủ sở hữu cho tài khoản ${cleanEmail}`
        : 'Đã tạo tổ chức và phát hành lời mời kích hoạt tài khoản',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request | NextRequest) {
  try {
    // 1. Enforce Platform Admin authorization
    const authCheck = await requirePlatformAdmin();
    if (!authCheck.isAuthorized || authCheck.errorResponse) {
      return authCheck.errorResponse!;
    }

    const body = await request.json();
    const validation = patchOrgSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const { id, status, code, notes } = validation.data;

    const supabase = createAdminClient();
    const updates: Record<string, unknown> = {};

    if (status) {
      updates.status = status;
      updates.is_active = status === 'ACTIVE';
    }

    if (code) {
      updates.code = code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    }

    if (notes !== undefined) {
      updates.notes = notes;
    }

    const { data, error } = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, organization: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request | NextRequest) {
  try {
    const authCheck = await requirePlatformAdmin('MANAGE_ORGANIZATIONS');
    if (!authCheck.isAuthorized || authCheck.errorResponse) {
      return authCheck.errorResponse!;
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Thiếu ID tổ chức cần xử lý' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Soft deactivation: chuyển sang SUSPENDED/ARCHIVED, bảo toàn dữ liệu lịch sử
    const { error } = await supabase
      .from('organizations')
      .update({
        status: 'SUSPENDED',
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Đã tạm ngừng hoạt động tổ chức và bảo toàn dữ liệu lịch sử thành công',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
