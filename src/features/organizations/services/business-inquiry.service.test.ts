import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as submitInquiry } from '@/app/api/organizations/inquiry/route';
import { POST as approveInquiry } from '@/app/api/admin/organizations/approve/route';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth/admin-guard', () => ({
  requirePlatformAdmin: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

import { requirePlatformAdmin } from '@/lib/auth/admin-guard';
import { createAdminClient } from '@/lib/supabase/admin';

describe('B2B Business Inquiry & Admin Approval Lifecycle (DEC-03)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('khách hàng gửi form inquiry chỉ lưu vào business_inquiries, không kích hoạt tổ chức', async () => {
    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'inq-123',
            org_name: 'Đại Học Quốc Tế',
            status: 'NEW',
            created_at: new Date().toISOString(),
          },
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
        name: 'Đại Học Quốc Tế',
        contactName: 'Thầy Hiệu Trưởng',
        email: 'rector@intl.edu.vn',
        phone: '0901234567',
        type: 'EDUCATIONAL',
        expectedLearners: 500,
        notes: 'Cần tư vấn triển khai DigComp',
      }),
    });

    const res = await submitInquiry(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.inquiry.status).toBe('NEW');
    expect(mockInsert).toHaveBeenCalledTimes(1);
  });

  it('Platform Admin duyệt inquiry: khởi tạo tổ chức ACTIVE và cấp entitlement', async () => {
    vi.mocked(requirePlatformAdmin).mockResolvedValueOnce({
      isAuthorized: true,
      user: { id: 'admin-uuid', email: 'admin.nexa@gmail.com' },
    });

    const mockInquiry = {
      id: '11111111-1111-1111-1111-111111111111',
      org_name: 'Trường Đại Học Mới',
      contact_name: 'Trưởng Khoa CNTT',
      contact_email: 'khoa.cntt@uni.edu.vn',
      contact_phone: '0988888888',
      org_type: 'EDUCATIONAL',
      notes: 'Hợp đồng 200 thí sinh',
      status: 'NEW',
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
    const mockInquiryUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'business_inquiries') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockInquiry, error: null }),
              }),
            }),
            update: mockInquiryUpdate,
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
});
