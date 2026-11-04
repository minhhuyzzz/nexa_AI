import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PATCH } from './route';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

describe('/api/org/[slug]/settings Route Handler', () => {
  const orgId = '11111111-2222-3333-4444-555555555555';
  const ownerUserId = 'owner-1111-1111-1111-111111111111';
  const adminUserId = 'admin-2222-2222-2222-222222222222';
  const memberUserId = 'member-3333-3333-3333-333333333333';
  const targetNewOwnerId = 'target-4444-4444-4444-444444444444';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('từ chối 401 khi chưa đăng nhập', async () => {
    vi.mocked(createClient).mockResolvedValueOnce({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error('Unauthenticated') }),
      },
    } as any);

    const req = new NextRequest('http://localhost:3000/api/org/fpt-polytechnic/settings');
    const res = await GET(req, { params: Promise.resolve({ slug: 'fpt-polytechnic' }) });

    expect(res.status).toBe(401);
  });

  it('cho phép ORG_ADMIN xem cài đặt và chính sách tổ chức', async () => {
    vi.mocked(createClient).mockResolvedValueOnce({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: adminUserId, email: 'admin@poly.edu.vn' } }, error: null }),
      },
    } as any);

    vi.mocked(createAdminClient).mockReturnValueOnce({
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'organizations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: orgId, name: 'Trường FPT Polytechnic', slug: 'fpt-polytechnic', code: 'NX-POLY-1' },
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
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: { org_role: 'ORG_ADMIN', status: 'ACTIVE' },
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'organization_policies') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { organization_id: orgId, passing_score: 75, allowed_domains: ['poly.edu.vn'] },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      }),
    } as any);

    const req = new NextRequest('http://localhost:3000/api/org/fpt-polytechnic/settings');
    const res = await GET(req, { params: Promise.resolve({ slug: 'fpt-polytechnic' }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.organization.name).toBe('Trường FPT Polytechnic');
    expect(body.policy.passing_score).toBe(75);
    expect(body.userRole).toBe('ORG_ADMIN');
  });

  it('chặn 403 khi MEMBER thông thường cố lưu thay đổi cài đặt', async () => {
    vi.mocked(createClient).mockResolvedValueOnce({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: memberUserId } }, error: null }),
      },
    } as any);

    vi.mocked(createAdminClient).mockReturnValueOnce({
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'organizations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: orgId, name: 'Trường FPT Polytechnic', slug: 'fpt-polytechnic' },
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
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: { org_role: 'MEMBER', status: 'ACTIVE' },
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      }),
    } as any);

    const req = new NextRequest('http://localhost:3000/api/org/fpt-polytechnic/settings', {
      method: 'PATCH',
      body: JSON.stringify({
        organizationData: { name: 'Hacked Name' },
      }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ slug: 'fpt-polytechnic' }) });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('Chỉ Quản trị viên (ORG_ADMIN) hoặc Chủ sở hữu (ORG_OWNER)');
  });

  it('cho phép ORG_ADMIN cập nhật thông tin và chính sách khảo thí', async () => {
    vi.mocked(createClient).mockResolvedValueOnce({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: adminUserId, email: 'admin@poly.edu.vn' } }, error: null }),
      },
    } as any);

    const mockOrgUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    const mockPolicyUpsert = vi.fn().mockResolvedValue({ error: null });
    const mockAuditInsert = vi.fn().mockResolvedValue({ error: null });

    vi.mocked(createAdminClient).mockReturnValueOnce({
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'organizations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: orgId, name: 'Trường FPT Polytechnic', slug: 'fpt-polytechnic' },
                  error: null,
                }),
              }),
            }),
            update: mockOrgUpdate,
          };
        }
        if (table === 'user_organizations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: { org_role: 'ORG_ADMIN', status: 'ACTIVE' },
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'organization_policies') {
          return {
            upsert: mockPolicyUpsert,
          };
        }
        if (table === 'org_audit_logs') {
          return {
            insert: mockAuditInsert,
          };
        }
        return {};
      }),
    } as any);

    const req = new NextRequest('http://localhost:3000/api/org/fpt-polytechnic/settings', {
      method: 'PATCH',
      body: JSON.stringify({
        organizationData: {
          name: 'Trường Cao đẳng FPT Polytechnic',
          description: 'Cơ sở đào tạo thực hành chuẩn năng lực số',
        },
        policyData: {
          passing_score: 75,
          auto_publish_results: false,
          allowed_domains: ['poly.edu.vn', 'fpt.edu.vn'],
        },
      }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ slug: 'fpt-polytechnic' }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);

    expect(mockOrgUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Trường Cao đẳng FPT Polytechnic',
        description: 'Cơ sở đào tạo thực hành chuẩn năng lực số',
      })
    );
    expect(mockPolicyUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        passing_score: 75,
        auto_publish_results: false,
        allowed_domains: ['poly.edu.vn', 'fpt.edu.vn'],
      })
    );
    expect(mockAuditInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'UPDATE_SETTINGS',
        actor_id: adminUserId,
      })
    );
  });

  it('chặn 403 khi ORG_ADMIN cố chuyển giao quyền sở hữu (chỉ ORG_OWNER được phép)', async () => {
    vi.mocked(createClient).mockResolvedValueOnce({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: adminUserId } }, error: null }),
      },
    } as any);

    vi.mocked(createAdminClient).mockReturnValueOnce({
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'organizations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: orgId, name: 'Trường FPT Polytechnic', slug: 'fpt-polytechnic' },
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
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: { org_role: 'ORG_ADMIN', status: 'ACTIVE' },
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      }),
    } as any);

    const req = new NextRequest('http://localhost:3000/api/org/fpt-polytechnic/settings', {
      method: 'PATCH',
      body: JSON.stringify({
        action: 'TRANSFER_OWNERSHIP',
        targetOwnerId: targetNewOwnerId,
      }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ slug: 'fpt-polytechnic' }) });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('Chỉ Chủ sở hữu hiện tại (ORG_OWNER)');
  });

  it('cho phép ORG_OWNER chuyển quyền sở hữu và ghi audit log', async () => {
    vi.mocked(createClient).mockResolvedValueOnce({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: ownerUserId, email: 'owner@poly.edu.vn' } }, error: null }),
      },
    } as any);

    const mockUpdateRole = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });
    const mockAuditInsert = vi.fn().mockResolvedValue({ error: null });

    vi.mocked(createAdminClient).mockReturnValueOnce({
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'organizations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: orgId, name: 'Trường FPT Polytechnic', slug: 'fpt-polytechnic' },
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
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockImplementation(() => {
                      return Promise.resolve({
                        data: { id: 'membership-id', org_role: 'ORG_OWNER', status: 'ACTIVE' },
                        error: null,
                      });
                    }),
                  }),
                }),
              }),
            }),
            update: mockUpdateRole,
          };
        }
        if (table === 'org_audit_logs') {
          return {
            insert: mockAuditInsert,
          };
        }
        return {};
      }),
    } as any);

    const req = new NextRequest('http://localhost:3000/api/org/fpt-polytechnic/settings', {
      method: 'PATCH',
      body: JSON.stringify({
        action: 'TRANSFER_OWNERSHIP',
        targetOwnerId: targetNewOwnerId,
      }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ slug: 'fpt-polytechnic' }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);

    expect(mockAuditInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'TRANSFER_OWNERSHIP',
        actor_id: ownerUserId,
        target_id: targetNewOwnerId,
      })
    );
  });

  it('từ chối 400 khi contact_email không đúng định dạng', async () => {
    vi.mocked(createClient).mockResolvedValueOnce({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: adminUserId, email: 'admin@poly.edu.vn' } }, error: null }),
      },
    } as any);

    vi.mocked(createAdminClient).mockReturnValueOnce({
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'organizations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: orgId, name: 'Trường FPT Polytechnic', slug: 'fpt-polytechnic' },
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
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: { org_role: 'ORG_ADMIN', status: 'ACTIVE' },
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      }),
    } as any);

    const req = new NextRequest('http://localhost:3000/api/org/fpt-polytechnic/settings', {
      method: 'PATCH',
      body: JSON.stringify({
        organizationData: {
          contact_email: 'invalid-email-address',
        },
      }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ slug: 'fpt-polytechnic' }) });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Email liên hệ không hợp lệ');
  });
});
