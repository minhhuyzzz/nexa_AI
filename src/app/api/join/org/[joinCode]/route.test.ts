import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './route';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

describe('Public Join Org Code API (/api/join/org/[joinCode])', () => {
  const joinCode = 'NX-DEMO-2026';
  const orgId = '11111111-1111-1111-1111-111111111111';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET: từ chối 404 khi mã không tồn tại', async () => {
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }),
    } as any);

    const req = new NextRequest(`http://localhost:3000/api/join/org/${joinCode}`);
    const res = await GET(req, { params: Promise.resolve({ joinCode }) });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.valid).toBe(false);
    expect(body.error).toContain('không tồn tại');
  });

  it('GET: từ chối 400 khi mã đã bị thu hồi', async () => {
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                id: 'code-1',
                code: joinCode,
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
    } as any);

    const req = new NextRequest(`http://localhost:3000/api/join/org/${joinCode}`);
    const res = await GET(req, { params: Promise.resolve({ joinCode }) });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.valid).toBe(false);
    expect(body.error).toContain('thu hồi');
  });

  it('GET: trả về thông tin hợp lệ khi mã còn hiệu lực', async () => {
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                id: 'code-1',
                code: joinCode,
                title: 'Đợt sát hạch SV K24',
                is_revoked: false,
                expires_at: new Date(Date.now() + 100000).toISOString(),
                used_count: 5,
                max_uses: 100,
                organization_id: orgId,
                organizations: {
                  id: orgId,
                  name: 'Đại Học Quốc Gia',
                  code: 'VNU',
                  type: 'EDUCATIONAL',
                  status: 'ACTIVE',
                  is_active: true,
                },
              },
              error: null,
            }),
          }),
        }),
      }),
    } as any);

    const req = new NextRequest(`http://localhost:3000/api/join/org/${joinCode}`);
    const res = await GET(req, { params: Promise.resolve({ joinCode }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.valid).toBe(true);
    expect(body.organization.name).toBe('Đại Học Quốc Gia');
    expect(body.joinCode.code).toBe(joinCode);
  });

  it('POST: từ chối 401 khi người dùng chưa đăng nhập', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: { message: 'No session' } }),
      },
    } as any);

    const req = new NextRequest(`http://localhost:3000/api/join/org/${joinCode}`, {
      method: 'POST',
      body: JSON.stringify({ fullName: 'Nguyễn Văn A' }),
    });

    const res = await POST(req, { params: Promise.resolve({ joinCode }) });
    expect(res.status).toBe(401);
  });

  it('POST: tạo yêu cầu gia nhập PENDING thành công cho học viên', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-candidate-1', email: 'student@vnu.edu.vn' } },
          error: null,
        }),
      },
    } as any);

    const mockUpsertMember = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'uo-1',
            organization_id: orgId,
            user_id: 'user-candidate-1',
            org_role: 'MEMBER',
            status: 'ACTIVE',
          },
          error: null,
        }),
      }),
    });

    const mockUpsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'req-1',
            organization_id: orgId,
            user_id: 'user-candidate-1',
            status: 'APPROVED',
          },
          error: null,
        }),
      }),
    });

    const mockUpdateCode = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'organization_join_codes') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    id: 'code-1',
                    code: joinCode,
                    organization_id: orgId,
                    max_uses: 100,
                    used_count: 5,
                    expires_at: new Date(Date.now() + 100000).toISOString(),
                    is_revoked: false,
                    organizations: {
                      id: orgId,
                      name: 'Đại Học Quốc Gia',
                      slug: 'dai-hoc-quoc-gia',
                      status: 'ACTIVE',
                      is_active: true,
                    },
                  },
                  error: null,
                }),
              }),
            }),
            update: mockUpdateCode,
          };
        }
        if (table === 'user_organizations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                }),
              }),
            }),
            upsert: mockUpsertMember,
          };
        }
        if (table === 'profiles') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          };
        }
        if (table === 'organization_membership_requests') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                }),
              }),
            }),
            upsert: mockUpsert,
          };
        }
        return {};
      }),
    } as any);

    const req = new NextRequest(`http://localhost:3000/api/join/org/${joinCode}`, {
      method: 'POST',
      body: JSON.stringify({ fullName: 'Nguyễn Văn A', studentId: 'SV2024001' }),
    });

    const res = await POST(req, { params: Promise.resolve({ joinCode }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.member.status).toBe('ACTIVE');
    expect(mockUpsertMember).toHaveBeenCalledTimes(1);
    expect(mockUpdateCode).toHaveBeenCalledTimes(1);
  });

  it('GET: tìm thấy tổ chức khi nhập mã tổ chức trực tiếp (fallback)', async () => {
    const orgCode = 'FPT-POLY';
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'organization_join_codes') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          };
        }
        if (table === 'organizations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    id: orgId,
                    name: 'Trường FPT Polytechnic',
                    code: orgCode,
                    slug: 'truong-fpt-polytechnic',
                    type: 'EDUCATIONAL',
                    status: 'ACTIVE',
                    is_active: true,
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      }),
    } as any);

    const req = new NextRequest(`http://localhost:3000/api/join/org/${orgCode}`);
    const res = await GET(req, { params: Promise.resolve({ joinCode: orgCode }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.valid).toBe(true);
    expect(body.organization.name).toBe('Trường FPT Polytechnic');
    expect(body.organization.code).toBe(orgCode);
  });
});
