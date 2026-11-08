import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { PATCH as updateOrgStatus } from '@/app/api/admin/organizations/route';
import { POST as createRenewalRequest } from '@/app/api/organizations/[orgId]/renewal-requests/route';

vi.mock('@/lib/auth/admin-guard', () => ({
  requirePlatformAdmin: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

import { requirePlatformAdmin } from '@/lib/auth/admin-guard';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

describe('Organization Suspension, Archiving & Renewal Workflow Suite', () => {
  let mockAdminSupabase: any;
  let mockServerSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockAdminSupabase = {
      from: vi.fn(),
      auth: {
        admin: {
          createUser: vi.fn(),
        },
      },
    };

    mockServerSupabase = {
      auth: {
        getUser: vi.fn(),
      },
      from: vi.fn(),
    };

    vi.mocked(createAdminClient).mockReturnValue(mockAdminSupabase);
    vi.mocked(createClient).mockResolvedValue(mockServerSupabase);
    vi.mocked(requirePlatformAdmin).mockResolvedValue({
      isAuthorized: true,
      user: { id: 'admin-uuid', email: 'admin@nexa.ai' },
    } as any);
  });

  it('Admin tạm ngưng tổ chức: chuyển status thành SUSPENDED và is_active = false mà KHÔNG xóa dữ liệu', async () => {
    const singleMock = vi.fn().mockResolvedValue({
      data: { id: '00000000-0000-0000-0000-000000000001', status: 'SUSPENDED', is_active: false },
      error: null,
    });
    const selectMock = vi.fn().mockReturnValue({ single: singleMock });
    const eqMock = vi.fn().mockReturnValue({ select: selectMock });
    const updateMock = vi.fn().mockReturnValue({ eq: eqMock });

    mockAdminSupabase.from.mockImplementation((table: string) => {
      if (table === 'organizations') {
        return { update: updateMock };
      }
      return { select: vi.fn().mockReturnThis() };
    });

    const req = new NextRequest('http://localhost:3000/api/admin/organizations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: '00000000-0000-0000-0000-000000000001',
        status: 'SUSPENDED',
      }),
    });

    const res = await updateOrgStatus(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'SUSPENDED',
        is_active: false,
      })
    );
  });

  it('Admin kích hoạt lại tổ chức: chuyển status thành ACTIVE và is_active = true', async () => {
    const singleMock = vi.fn().mockResolvedValue({
      data: { id: '00000000-0000-0000-0000-000000000001', status: 'ACTIVE', is_active: true },
      error: null,
    });
    const selectMock = vi.fn().mockReturnValue({ single: singleMock });
    const eqMock = vi.fn().mockReturnValue({ select: selectMock });
    const updateMock = vi.fn().mockReturnValue({ eq: eqMock });

    mockAdminSupabase.from.mockImplementation((table: string) => {
      if (table === 'organizations') {
        return { update: updateMock };
      }
      return { select: vi.fn().mockReturnThis() };
    });

    const req = new NextRequest('http://localhost:3000/api/admin/organizations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: '00000000-0000-0000-0000-000000000001',
        status: 'ACTIVE',
      }),
    });

    const res = await updateOrgStatus(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'ACTIVE',
        is_active: true,
      })
    );
  });

  it('Chủ sở hữu gửi yêu cầu gia hạn từ tài khoản business đang tạm ngưng', async () => {
    // UUID format for organizationId
    const orgUuid = '00000000-0000-0000-0000-000000000002';

    mockServerSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'owner-uuid', email: 'owner@business.com' } },
      error: null,
    });

    mockAdminSupabase.from.mockImplementation((table: string) => {
      if (table === 'user_organizations') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { org_role: 'ORG_OWNER', status: 'ACTIVE' },
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        };
      }
      if (table === 'renewal_requests') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'renewal-req-123',
                  organization_id: orgUuid,
                  requested_seats: 500,
                  period_months: 12,
                  notes: 'Cần gia hạn năm học mới',
                  status: 'PENDING',
                },
                error: null,
              }),
            }),
          }),
        };
      }
      return { select: vi.fn().mockReturnThis() };
    });

    const req = new NextRequest(`http://localhost:3000/api/organizations/${orgUuid}/renewal-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        periodMonths: 12,
        requestedSeats: 500,
        notes: 'Cần gia hạn năm học mới',
      }),
    });

    const res = await createRenewalRequest(req, {
      params: Promise.resolve({ orgId: orgUuid }),
    });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.renewalRequest.status).toBe('PENDING');
    expect(json.renewalRequest.period_months).toBe(12);
  });
});
