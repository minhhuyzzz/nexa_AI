import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';
import { GET, POST } from './route';

vi.mock('@/lib/auth/admin-guard', () => ({
  requirePlatformAdmin: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

import { requirePlatformAdmin } from '@/lib/auth/admin-guard';
import { createAdminClient } from '@/lib/supabase/admin';

describe('Admin Baseline Sets API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/admin/baseline-sets', () => {
    it('từ chối 401 khi không phải Platform Admin', async () => {
      vi.mocked(requirePlatformAdmin).mockResolvedValueOnce({
        isAuthorized: false,
        errorResponse: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      });

      const res = await GET();
      expect(res.status).toBe(401);
    });

    it('trả về danh sách bộ khảo sát đầu vào', async () => {
      vi.mocked(requirePlatformAdmin).mockResolvedValueOnce({
        isAuthorized: true,
        user: { id: 'admin-1', email: 'admin@nexa.ai' },
      });

      const mockData = [
        {
          id: 'a0000000-0000-0000-0000-000000000001',
          title: 'Đánh Giá Năng Lực Số Chuẩn 5 Miền (Khảo Thí Đầu Vào)',
          description: 'Bài chuẩn',
          is_published: true,
          is_system_baseline: true,
          system_code: 'BASELINE_5DOMAINS',
          created_at: '2026-01-01T00:00:00Z',
          assessment_items: [{ id: 'item-1' }, { id: 'item-2' }],
        },
        {
          id: 'b0000000-0000-0000-0000-000000000002',
          title: 'Khảo Sát Đợt 2 - 2026',
          description: 'Đợt 2',
          is_published: false,
          is_system_baseline: false,
          system_code: 'BASELINE_12345',
          created_at: '2026-02-01T00:00:00Z',
          assessment_items: [],
        },
      ];

      const mockAdminSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            or: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
            }),
          }),
        }),
      };
      vi.mocked(createAdminClient).mockReturnValue(mockAdminSupabase as any);

      const res = await GET();
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.sets).toHaveLength(2);
      expect(json.sets[0].isActive).toBe(true);
      expect(json.sets[0].questionCount).toBe(2);
      expect(json.sets[1].isActive).toBe(false);
      expect(json.sets[1].questionCount).toBe(0);
    });
  });

  describe('POST /api/admin/baseline-sets', () => {
    it('từ chối 400 nếu tiêu đề quá ngắn', async () => {
      vi.mocked(requirePlatformAdmin).mockResolvedValueOnce({
        isAuthorized: true,
        user: { id: 'admin-1', email: 'admin@nexa.ai' },
      });

      const req = new Request('http://localhost:3000/api/admin/baseline-sets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'a' }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('tạo thành công bộ khảo sát mới ở trạng thái nháp', async () => {
      vi.mocked(requirePlatformAdmin).mockResolvedValueOnce({
        isAuthorized: true,
        user: { id: 'admin-1', email: 'admin@nexa.ai' },
      });

      const mockInserted = {
        id: 'new-set-id',
        title: 'Khảo Sát Năng Lực Số Mới',
        is_published: false,
        is_system_baseline: false,
        system_code: 'BASELINE_99999',
        created_at: '2026-03-01T00:00:00Z',
      };

      const mockAdminSupabase = {
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockInserted, error: null }),
            }),
          }),
        }),
      };
      vi.mocked(createAdminClient).mockReturnValue(mockAdminSupabase as any);

      const req = new Request('http://localhost:3000/api/admin/baseline-sets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Khảo Sát Năng Lực Số Mới' }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.set.id).toBe('new-set-id');
      expect(json.set.isActive).toBe(false);
    });
  });
});
