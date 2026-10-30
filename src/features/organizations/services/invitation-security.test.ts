import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as sendInvite } from '@/app/api/organizations/invite/route';
import { POST as acceptInvite } from '@/app/api/organizations/accept-invite/route';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

describe('Organization Invitation Security & Privilege Escalation Protection (ORG-F08)', () => {
  const orgId = '11111111-1111-1111-1111-111111111111';
  const managerUserId = '22222222-2222-2222-2222-222222222222';
  const inviteeUserId = '33333333-3333-3333-3333-333333333333';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('chặn gửi lời mời với vai trò ORG_OWNER (chống tự phong quyền sở hữu)', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: managerUserId, email: 'admin@org.com' } },
          error: null,
        }),
      },
    } as any);

    const req = new NextRequest('http://localhost:3000/api/organizations/invite', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: orgId,
        email: 'newuser@org.com',
        orgRole: 'ORG_OWNER',
      }),
    });

    const res = await sendInvite(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Dữ liệu không hợp lệ');
  });

  it('từ chối chấp nhận lời mời nếu tổ chức bị vô hiệu hóa (is_active = false)', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: inviteeUserId, email: 'candidate@test.com' } },
          error: null,
        }),
      },
    } as any);

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'organization_invitations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'inv-1',
                    organization_id: orgId,
                    email: 'candidate@test.com',
                    org_role: 'MEMBER',
                    status: 'PENDING',
                    expires_at: new Date(Date.now() + 100000).toISOString(),
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'organizations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: orgId, name: 'Tổ Chức Test', is_active: false },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      }),
    } as any);

    const req = new NextRequest('http://localhost:3000/api/organizations/accept-invite', {
      method: 'POST',
      body: JSON.stringify({ token: 'valid-invitation-token-12345678' }),
    });

    const res = await acceptInvite(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('tạm ngưng hoạt động');
  });

  it('từ chối chấp nhận lời mời nếu tổ chức đã đạt số ghế tối đa', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: inviteeUserId, email: 'candidate@test.com' } },
          error: null,
        }),
      },
    } as any);

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'organization_invitations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'inv-1',
                    organization_id: orgId,
                    email: 'candidate@test.com',
                    org_role: 'MEMBER',
                    status: 'PENDING',
                    expires_at: new Date(Date.now() + 100000).toISOString(),
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'organizations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: orgId, name: 'Tổ Chức Test', is_active: true, max_members: 10 },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'user_organizations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ count: 10, error: null }),
              }),
            }),
          };
        }
        return {};
      }),
    } as any);

    const req = new NextRequest('http://localhost:3000/api/organizations/accept-invite', {
      method: 'POST',
      body: JSON.stringify({ token: 'valid-invitation-token-12345678' }),
    });

    const res = await acceptInvite(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('giới hạn thành viên tối đa');
  });

  it('trả về slug chính xác khi chấp nhận lời mời thành công', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: inviteeUserId, email: 'candidate@test.com' } },
          error: null,
        }),
      },
    } as any);

    const mockUpsert = vi.fn().mockResolvedValue({ error: null });
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'organization_invitations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'inv-1',
                    organization_id: orgId,
                    email: 'candidate@test.com',
                    org_role: 'MEMBER',
                    status: 'PENDING',
                    expires_at: new Date(Date.now() + 100000).toISOString(),
                  },
                  error: null,
                }),
              }),
            }),
            update: mockUpdate,
          };
        }
        if (table === 'organizations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: orgId, name: 'Trường FPT Poly', slug: 'fpt-polytechnic', is_active: true, max_members: 100 },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'user_organizations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ count: 5, error: null }),
              }),
            }),
            upsert: mockUpsert,
          };
        }
        return {};
      }),
    } as any);

    const req = new NextRequest('http://localhost:3000/api/organizations/accept-invite', {
      method: 'POST',
      body: JSON.stringify({ token: 'valid-invitation-token-12345678' }),
    });

    const res = await acceptInvite(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.organization.slug).toBe('fpt-polytechnic');
  });
});
