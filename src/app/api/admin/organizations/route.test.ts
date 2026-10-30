import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST, PATCH } from './route';

// Mock dependencies
vi.mock('@/lib/auth/admin-guard', () => ({
  requirePlatformAdmin: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

import { requirePlatformAdmin } from '@/lib/auth/admin-guard';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

describe('Platform Admin /api/admin/organizations Authorization Guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('từ chối 401 khi user chưa đăng nhập', async () => {
    vi.mocked(requirePlatformAdmin).mockResolvedValueOnce({
      isAuthorized: false,
      errorResponse: NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 }),
    });

    const res = await GET();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain('Yêu cầu đăng nhập');
  });

  it('từ chối 403 khi user thường gọi GET', async () => {
    vi.mocked(requirePlatformAdmin).mockResolvedValueOnce({
      isAuthorized: false,
      errorResponse: NextResponse.json(
        { error: 'Bạn không có quyền truy cập vào cổng quản trị Platform Admin' },
        { status: 403 }
      ),
    });

    const res = await GET();
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('không có quyền truy cập');
  });

  it('từ chối 403 khi user thường gọi POST tạo tổ chức', async () => {
    vi.mocked(requirePlatformAdmin).mockResolvedValueOnce({
      isAuthorized: false,
      errorResponse: NextResponse.json({ error: 'Từ chối quyền truy cập' }, { status: 403 }),
    });

    const req = new Request('http://localhost:3000/api/admin/organizations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Học Viện Mới', slug: 'hoc-vien-moi' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('cho phép Platform Admin truy vấn danh sách tổ chức', async () => {
    vi.mocked(requirePlatformAdmin).mockResolvedValueOnce({
      isAuthorized: true,
      user: { id: 'admin-uuid', email: 'admin.nexa@gmail.com' },
    });

    const mockAdminSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [
              {
                id: 'org-1',
                name: 'FPT Poly',
                slug: 'fpt-poly',
                is_active: true,
                max_members: 100,
                quota_assessments: 500,
                created_at: new Date().toISOString(),
                user_organizations: [],
              },
            ],
            error: null,
          }),
        }),
      }),
    };

    vi.mocked(createAdminClient).mockReturnValue(mockAdminSupabase as unknown as ReturnType<typeof createAdminClient>);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.organizations).toHaveLength(1);
    expect(body.organizations[0].name).toBe('FPT Poly');
  });

  it('validate dữ liệu bằng Zod khi Platform Admin tạo tổ chức mới', async () => {
    vi.mocked(requirePlatformAdmin).mockResolvedValueOnce({
      isAuthorized: true,
      user: { id: 'admin-uuid', email: 'admin.nexa@gmail.com' },
    });

    // Body thiếu slug
    const req = new Request('http://localhost:3000/api/admin/organizations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Tổ Chức Không Có Slug' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });
});
