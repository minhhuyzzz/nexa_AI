import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as createJoinCode, PATCH as revokeJoinCode } from '@/app/api/organizations/[orgId]/join-codes/route';
import { POST as submitJoinRequest, PATCH as reviewJoinRequest } from '@/app/api/organizations/[orgId]/membership-requests/route';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

describe('Join Codes & Human-In-The-Loop Membership Approval Queue (DEC-05)', () => {
  const orgId = '11111111-1111-1111-1111-111111111111';
  const managerUserId = '22222222-2222-2222-2222-222222222222';
  const candidateUserId = '33333333-3333-3333-3333-333333333333';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('tạo mã tham gia thành công bởi Org Admin', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: managerUserId, email: 'admin@org.com' } },
          error: null,
        }),
      },
    } as any);

    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'jc-1',
            code: 'NX-ABCD-1234',
            organization_id: orgId,
            max_uses: 100,
            used_count: 0,
            is_revoked: false,
          },
          error: null,
        }),
      }),
    });

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { role: 'LEARNER' } }),
              }),
            }),
          };
        }
        if (table === 'user_organizations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: { org_role: 'ORG_ADMIN', status: 'ACTIVE' } }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'organization_join_codes') {
          return { insert: mockInsert };
        }
        return {};
      }),
    } as any);

    const req = new NextRequest(`http://localhost:3000/api/organizations/${orgId}/join-codes`, {
      method: 'POST',
      body: JSON.stringify({
        title: 'Sinh viên K24 Khảo thí',
        maxUses: 100,
        expiresInDays: 30,
      }),
    });

    const res = await createJoinCode(req, { params: Promise.resolve({ orgId }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.joinCode.code).toBeDefined();
    expect(body.joinCode.joinUrl).toContain('/join/org/');
  });

  it('từ chối yêu cầu gia nhập nếu mã tham gia đã bị thu hồi (is_revoked = true)', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: candidateUserId, email: 'candidate@student.com' } },
          error: null,
        }),
      },
    } as any);

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'organization_join_codes') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      id: 'jc-revoked',
                      is_revoked: true,
                      expires_at: new Date(Date.now() + 100000).toISOString(),
                      used_count: 5,
                      max_uses: 100,
                    },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      }),
    } as any);

    const req = new NextRequest(`http://localhost:3000/api/organizations/${orgId}/membership-requests`, {
      method: 'POST',
      body: JSON.stringify({
        joinCode: 'NX-REVOKED-0000',
        fullName: 'Nguyễn Văn A',
        studentId: 'SV001',
      }),
    });

    const res = await submitJoinRequest(req, { params: Promise.resolve({ orgId }) });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('thu hồi');
  });

  it('duyệt yêu cầu gia nhập gán vai trò MEMBER và kiểm tra số ghế khả dụng', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: managerUserId, email: 'admin@org.com' } },
          error: null,
        }),
      },
    } as any);

    const mockUpsertMember = vi.fn().mockResolvedValue({ error: null });
    const mockUpdateRequest = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { role: 'LEARNER' } }),
              }),
            }),
          };
        }
        if (table === 'user_organizations') {
          return {
            select: vi.fn((cols: string, opts?: { count?: string }) => {
              if (opts?.count === 'exact') {
                return {
                  eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ count: 10, error: null }),
                  }),
                };
              }
              return {
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                      single: vi.fn().mockResolvedValue({ data: { org_role: 'ORG_OWNER', status: 'ACTIVE' } }),
                    }),
                  }),
                }),
              };
            }),
            upsert: mockUpsertMember,
          };
        }
        if (table === 'organizations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { max_members: 50 }, error: null }),
              }),
            }),
          };
        }
        if (table === 'organization_membership_requests') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      id: 'req-1',
                      user_id: candidateUserId,
                      full_name: 'Trần Thí Sinh',
                      join_code_id: null,
                    },
                    error: null,
                  }),
                }),
              }),
            }),
            update: mockUpdateRequest,
          };
        }
        return {};
      }),
    } as any);

    const req = new NextRequest(`http://localhost:3000/api/organizations/${orgId}/membership-requests`, {
      method: 'PATCH',
      body: JSON.stringify({
        requestId: '44444444-4444-4444-4444-444444444444',
        action: 'APPROVE',
      }),
    });

    const res = await reviewJoinRequest(req, { params: Promise.resolve({ orgId }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(mockUpsertMember).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: orgId,
        user_id: candidateUserId,
        org_role: 'MEMBER', // Strictly MEMBER, cannot self-escalate
        status: 'ACTIVE',
      }),
      expect.anything()
    );
  });
});
