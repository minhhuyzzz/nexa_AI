import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';
import { PUT } from './route';

vi.mock('@/lib/auth/admin-guard', () => ({
  requirePlatformAdmin: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

import { requirePlatformAdmin } from '@/lib/auth/admin-guard';
import { createAdminClient } from '@/lib/supabase/admin';

describe('PUT /api/admin/baseline-sets/[id]/activate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('từ chối 401 khi không phải Platform Admin', async () => {
    vi.mocked(requirePlatformAdmin).mockResolvedValueOnce({
      isAuthorized: false,
      errorResponse: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    });

    const res = await PUT({} as Request, { params: Promise.resolve({ id: 'set-1' }) });
    expect(res.status).toBe(401);
  });

  it('từ chối 404 khi không tìm thấy bộ khảo sát', async () => {
    vi.mocked(requirePlatformAdmin).mockResolvedValueOnce({
      isAuthorized: true,
      user: { id: 'admin-1', email: 'admin@nexa.ai' },
    });

    const mockAdminSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'assessments') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
              }),
            }),
          };
        }
        return {};
      }),
    };
    vi.mocked(createAdminClient).mockReturnValue(mockAdminSupabase as any);

    const res = await PUT({} as Request, { params: Promise.resolve({ id: 'not-found' }) });
    expect(res.status).toBe(404);
  });

  it('từ chối 400 nếu bộ khảo sát chưa có câu hỏi nào', async () => {
    vi.mocked(requirePlatformAdmin).mockResolvedValueOnce({
      isAuthorized: true,
      user: { id: 'admin-1', email: 'admin@nexa.ai' },
    });

    const mockAdminSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'assessments') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'set-empty', title: 'Bộ trống', is_system_baseline: false },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'assessment_items') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ count: 0, error: null }),
            }),
          };
        }
        return {};
      }),
    };
    vi.mocked(createAdminClient).mockReturnValue(mockAdminSupabase as any);

    const res = await PUT({} as Request, { params: Promise.resolve({ id: 'set-empty' }) });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('ít nhất 1 câu hỏi');
  });

  it('kích hoạt thành công khi có câu hỏi hợp lệ', async () => {
    vi.mocked(requirePlatformAdmin).mockResolvedValueOnce({
      isAuthorized: true,
      user: { id: 'admin-1', email: 'admin@nexa.ai' },
    });

    const mockUpdateAssessments = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    const mockUpsertPlatformSettings = vi.fn().mockResolvedValue({ error: null });

    const mockAdminSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'assessments') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'set-ok', title: 'Bộ chuẩn 2026', is_system_baseline: false },
                  error: null,
                }),
              }),
            }),
            update: mockUpdateAssessments,
          };
        }
        if (table === 'assessment_items') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ count: 25, error: null }),
            }),
          };
        }
        if (table === 'platform_settings') {
          return {
            upsert: mockUpsertPlatformSettings,
          };
        }
        return {};
      }),
    };
    vi.mocked(createAdminClient).mockReturnValue(mockAdminSupabase as any);

    const res = await PUT({} as Request, { params: Promise.resolve({ id: 'set-ok' }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.message).toContain('Đã kích hoạt');
  });
});
