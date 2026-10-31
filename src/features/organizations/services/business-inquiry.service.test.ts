import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as approveInquiry } from '@/app/api/admin/organizations/approve/route';
import { POST as submitInquiry } from '@/app/api/organizations/inquiry/route';
import { createAdminClient } from '@/lib/supabase/admin';
import { requirePlatformAdmin } from '@/lib/auth/admin-guard';

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

vi.mock('@/lib/auth/admin-guard', () => ({
  requirePlatformAdmin: vi.fn(),
}));

vi.mock('@/lib/audit/admin-audit.service', () => ({
  recordAdminAudit: vi.fn().mockResolvedValue(undefined),
}));

describe('B2B Business Inquiry & Admin Approval Lifecycle (DEC-03)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('khách hàng gửi form inquiry chỉ lưu vào business_inquiries, không kích hoạt tổ chức', async () => {
    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: 'inq-1', org_name: 'Trường Đại Học Công Nghệ ABC', status: 'NEW' },
          error: null,
        }),
      }),
    });
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'business_inquiries') {
          return { insert: mockInsert };
        }
        return {};
      }),
    } as unknown as ReturnType<typeof createAdminClient>);

    const req = new NextRequest('http://localhost:3000/api/organizations/inquiry', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Trường Đại Học Công Nghệ ABC',
        contactName: 'Thầy Nguyễn Văn A',
        email: 'contact@abc.edu.vn',
        phone: '0901234567',
        expectedLearners: 500,
        notes: 'Cần tích hợp đánh giá cho 500 sinh viên kỳ 1.',
      }),
    });

    const res = await submitInquiry(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        org_name: 'Trường Đại Học Công Nghệ ABC',
        status: 'NEW',
      })
    );
  });

  it('Platform Admin duyệt inquiry: khởi tạo tổ chức ACTIVE và cấp entitlement', async () => {
    vi.mocked(requirePlatformAdmin).mockResolvedValueOnce({
      isAuthorized: true,
      user: { id: 'admin-uuid', email: 'admin.nexa@gmail.com' },
    });

    const mockInquiry = {
      id: '11111111-1111-1111-1111-111111111111',
      org_name: 'Trường Đại Học Mới',
      org_type: 'EDUCATIONAL',
      contact_name: 'Nguyễn Văn A',
      contact_email: 'nva@daihocmoi.edu.vn',
      contact_phone: '0912345678',
      estimated_learners: 200,
      notes: 'Hợp đồng 200 thí sinh',
      status: 'PENDING',
    };

    const mockOrgInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'org-new-uuid',
            name: mockInquiry.org_name,
            code: 'UNI-NEW',
            slug: 'uni-new',
            is_active: true,
            status: 'ACTIVE',
          },
          error: null,
        }),
      }),
    });

    const mockEntitlementInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'ent-1',
            organization_id: 'org-new-uuid',
            contract_number: 'NEXA-B2B-2026-001',
            max_seats: 200,
            ai_credits_granted: 2000,
          },
          error: null,
        }),
      }),
    });

    const mockInviteInsert = vi.fn().mockResolvedValue({ data: null, error: null });

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'business_inquiries') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  select: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({ data: mockInquiry, error: null }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'organizations') {
          return { insert: mockOrgInsert };
        }
        if (table === 'organization_entitlements') {
          return { insert: mockEntitlementInsert };
        }
        if (table === 'organization_invitations') {
          return { insert: mockInviteInsert };
        }
        if (table === 'admin_audit_logs') {
          return { insert: vi.fn().mockResolvedValue({ data: null, error: null }) };
        }
        return {};
      }),
    } as unknown as ReturnType<typeof createAdminClient>);

    const req = new NextRequest('http://localhost:3000/api/admin/organizations/approve', {
      method: 'POST',
      body: JSON.stringify({
        inquiryId: '11111111-1111-1111-1111-111111111111',
        contractNumber: 'NEXA-B2B-2026-001',
        orgCode: 'UNI-NEW',
        maxSeats: 200,
        maxAssessments: 1000,
        aiCredits: 2000,
      }),
    });

    const res = await approveInquiry(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.organization.status).toBe('ACTIVE');
    expect(body.inviteUrl).toContain('/personal/accept-invite?token=');
    expect(mockOrgInsert).toHaveBeenCalledTimes(1);
    expect(mockEntitlementInsert).toHaveBeenCalledTimes(1);
  });

  it('rollback tổ chức nếu cấp entitlement thất bại', async () => {
    vi.mocked(requirePlatformAdmin).mockResolvedValueOnce({
      isAuthorized: true,
      user: { id: 'admin-uuid', email: 'admin.nexa@gmail.com' },
    });

    const mockInquiry = {
      id: '22222222-2222-2222-2222-222222222222',
      org_name: 'Trường Test Rollback',
      contact_name: 'Admin Test',
      contact_email: 'test@rollback.edu.vn',
      status: 'PENDING',
    };

    const mockOrgDelete = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'business_inquiries') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  select: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({ data: mockInquiry, error: null }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'organizations') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'org-fail-uuid', name: 'Trường Test Rollback', code: 'FAIL-CODE' },
                  error: null,
                }),
              }),
            }),
            delete: mockOrgDelete,
          };
        }
        if (table === 'organization_entitlements') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Database constraint violation on entitlements' },
                }),
              }),
            }),
          };
        }
        return {};
      }),
    } as unknown as ReturnType<typeof createAdminClient>);

    const req = new NextRequest('http://localhost:3000/api/admin/organizations/approve', {
      method: 'POST',
      body: JSON.stringify({
        inquiryId: '22222222-2222-2222-2222-222222222222',
        contractNumber: 'NEXA-FAIL-001',
        orgCode: 'FAIL-CODE',
      }),
    });

    const res = await approveInquiry(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain('Không thể cấp hạn mức hợp đồng');
    expect(mockOrgDelete).toHaveBeenCalledTimes(1);
  });
});
