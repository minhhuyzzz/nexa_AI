import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as getPaths, POST as createPath } from '@/app/api/admin/learning-paths/route';
import { GET as getPathDetail, PATCH as updatePath, DELETE as deletePath } from '@/app/api/admin/learning-paths/[id]/route';
import { GET as getModules, POST as createModule } from '@/app/api/admin/learning-modules/route';
import { PATCH as updateModule, DELETE as deleteModule } from '@/app/api/admin/learning-modules/[id]/route';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/lib/auth/admin-guard', () => ({
  requirePlatformAdmin: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

import { requirePlatformAdmin } from '@/lib/auth/admin-guard';
import { createAdminClient } from '@/lib/supabase/admin';

describe('UC-A12, UC-A13, UC-A14: Platform Admin Learning Paths & Modules Management', () => {
  const pathId = '11111111-1111-1111-1111-111111111111';
  const moduleId = '22222222-2222-2222-2222-222222222222';
  const assessmentId = '33333333-3333-3333-3333-333333333333';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // UC-A12: Quản lý Lộ trình học tập (learning_paths)
  // ============================================================================
  describe('UC-A12: /api/admin/learning-paths CRUD', () => {
    it('chặn 401 khi chưa đăng nhập quản trị viên', async () => {
      vi.mocked(requirePlatformAdmin).mockResolvedValueOnce({
        isAuthorized: false,
        errorResponse: NextResponse.json({ error: 'Yêu cầu đăng nhập tài khoản quản trị viên' }, { status: 401 }),
      });

      const res = await getPaths();
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toContain('đăng nhập');
    });

    it('chặn 403 khi người dùng thông thường cố truy cập API lộ trình', async () => {
      vi.mocked(requirePlatformAdmin).mockResolvedValueOnce({
        isAuthorized: false,
        errorResponse: NextResponse.json({ error: 'Từ chối quyền truy cập' }, { status: 403 }),
      });

      const res = await getPaths();
      expect(res.status).toBe(403);
    });

    it('trả về danh sách lộ trình kèm số lượng học phần và miền năng lực', async () => {
      vi.mocked(requirePlatformAdmin).mockResolvedValueOnce({
        isAuthorized: true,
        user: { id: 'admin-user', email: 'admin@nexa.ai' },
      });

      vi.mocked(createAdminClient).mockReturnValueOnce({
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'learning_paths') {
            return {
              select: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({
                    data: [
                      {
                        id: pathId,
                        title: 'Năng lực số Doanh nghiệp',
                        slug: 'nang-luc-so-dn',
                        domain_codes: ['D1', 'D2'],
                        access_tier: 'FREE',
                        point_reward: 100,
                        is_published: true,
                        order_index: 1,
                        created_at: new Date().toISOString(),
                      },
                    ],
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === 'learning_modules') {
            return {
              select: vi.fn().mockResolvedValue({
                data: [{ id: moduleId, path_id: pathId }],
                error: null,
              }),
            };
          }
          return {};
        }),
      } as any);

      const res = await getPaths();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.paths).toHaveLength(1);
      expect(data.paths[0].modulesCount).toBe(1);
      expect(data.paths[0].domainCodes).toEqual(['D1', 'D2']);
    });

    it('từ chối 400 khi tạo lộ trình với tiêu đề quá ngắn', async () => {
      vi.mocked(requirePlatformAdmin).mockResolvedValueOnce({
        isAuthorized: true,
        user: { id: 'admin-user' },
      });

      const req = new NextRequest('http://localhost:3000/api/admin/learning-paths', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'A' }),
      });

      const res = await createPath(req);
      expect(res.status).toBe(400);
    });

    it('tạo lộ trình mới thành công với slug tự sinh và cấu hình điểm thưởng PTS', async () => {
      vi.mocked(requirePlatformAdmin).mockResolvedValueOnce({
        isAuthorized: true,
        user: { id: 'admin-user' },
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: pathId,
              title: 'Lộ Trình An Toàn Số 2026',
              slug: 'lo-trinh-an-toan-so-2026',
              domain_codes: ['D4'],
              access_tier: 'VIP',
              point_reward: 200,
              is_published: true,
            },
            error: null,
          }),
        }),
      });

      vi.mocked(createAdminClient).mockReturnValueOnce({
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'learning_paths') {
            return { insert: mockInsert };
          }
          return {};
        }),
      } as any);

      const req = new NextRequest('http://localhost:3000/api/admin/learning-paths', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Lộ Trình An Toàn Số 2026',
          domainCodes: ['D4'],
          accessTier: 'VIP',
          pointReward: 200,
          isPublished: true,
        }),
      });

      const res = await createPath(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.path.access_tier).toBe('VIP');
      expect(data.path.point_reward).toBe(200);
    });

    it('cập nhật và xóa lộ trình (gỡ liên kết modules trước khi xóa)', async () => {
      vi.mocked(requirePlatformAdmin).mockResolvedValue({
        isAuthorized: true,
        user: { id: 'admin-user' },
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: pathId, title: 'Đã sửa' }, error: null }),
          }),
        }),
      });

      const mockModuleDetach = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      vi.mocked(createAdminClient).mockReturnValue({
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'learning_paths') {
            return {
              update: mockUpdate,
              delete: mockDelete,
            };
          }
          if (table === 'learning_modules') {
            return {
              update: mockModuleDetach,
            };
          }
          return {};
        }),
      } as any);

      // PATCH
      const patchReq = new NextRequest(`http://localhost:3000/api/admin/learning-paths/${pathId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Đã sửa' }),
      });
      const patchRes = await updatePath(patchReq, { params: Promise.resolve({ id: pathId }) });
      expect(patchRes.status).toBe(200);

      // DELETE
      const deleteReq = new NextRequest(`http://localhost:3000/api/admin/learning-paths/${pathId}`, {
        method: 'DELETE',
      });
      const deleteRes = await deletePath(deleteReq, { params: Promise.resolve({ id: pathId }) });
      expect(deleteRes.status).toBe(200);
      expect(mockModuleDetach).toHaveBeenCalledWith({ path_id: null });
      expect(mockDelete).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // UC-A13 & UC-A14: Quản lý Học phần, Học liệu & Gắn Đề Khảo thí
  // ============================================================================
  describe('UC-A13 & UC-A14: /api/admin/learning-modules CRUD & Assessment Linking', () => {
    it('tạo học phần mới gắn với lộ trình và liên kết đề khảo thí từ ngân hàng đề', async () => {
      vi.mocked(requirePlatformAdmin).mockResolvedValueOnce({
        isAuthorized: true,
        user: { id: 'admin-user' },
      });

      const mockModuleInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: moduleId,
              path_id: pathId,
              domain_code: 'D3',
              skill_code: '3.1',
              title: 'Sáng tạo nội dung với GenAI',
              duration_minutes: 30,
              point_reward: 50,
              content_markdown: '## Hướng dẫn thực hành Prompt Engineering',
              assessment_id: assessmentId,
              access_tier: 'FREE',
            },
            error: null,
          }),
        }),
      });

      vi.mocked(createAdminClient).mockReturnValueOnce({
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'learning_modules') {
            return { insert: mockModuleInsert };
          }
          return {};
        }),
      } as any);

      const req = new NextRequest('http://localhost:3000/api/admin/learning-modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pathId,
          domainCode: 'D3',
          skillCode: '3.1',
          title: 'Sáng tạo nội dung với GenAI',
          durationMinutes: 30,
          pointReward: 50,
          contentMarkdown: '## Hướng dẫn thực hành Prompt Engineering',
          assessmentId,
          accessTier: 'FREE',
        }),
      });

      const res = await createModule(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.module.assessment_id).toBe(assessmentId);
      expect(data.module.point_reward).toBe(50);
    });

    it('lọc danh sách học phần theo pathId', async () => {
      vi.mocked(requirePlatformAdmin).mockResolvedValueOnce({
        isAuthorized: true,
        user: { id: 'admin-user' },
      });

      const mockEq = vi.fn().mockResolvedValue({
        data: [
          { id: moduleId, title: 'Bài học 1', path_id: pathId },
        ],
        error: null,
      });

      vi.mocked(createAdminClient).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              eq: mockEq,
            }),
          }),
        }),
      } as any);

      const req = new NextRequest(`http://localhost:3000/api/admin/learning-modules?pathId=${pathId}`);
      const res = await getModules(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.modules).toHaveLength(1);
      expect(mockEq).toHaveBeenCalledWith('path_id', pathId);
    });

    it('cập nhật và xóa học phần', async () => {
      vi.mocked(requirePlatformAdmin).mockResolvedValue({
        isAuthorized: true,
        user: { id: 'admin-user' },
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: moduleId, title: 'Bài học cập nhật' }, error: null }),
          }),
        }),
      });

      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      vi.mocked(createAdminClient).mockReturnValue({
        from: vi.fn().mockReturnValue({
          update: mockUpdate,
          delete: mockDelete,
        }),
      } as any);

      // PATCH
      const patchReq = new NextRequest(`http://localhost:3000/api/admin/learning-modules/${moduleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Bài học cập nhật' }),
      });
      const patchRes = await updateModule(patchReq, { params: Promise.resolve({ id: moduleId }) });
      expect(patchRes.status).toBe(200);

      // DELETE
      const deleteReq = new NextRequest(`http://localhost:3000/api/admin/learning-modules/${moduleId}`, {
        method: 'DELETE',
      });
      const deleteRes = await deleteModule(deleteReq, { params: Promise.resolve({ id: moduleId }) });
      expect(deleteRes.status).toBe(200);
    });
  });
});
