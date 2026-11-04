import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/personal/learning-path/route';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

describe('UC-P08, UC-P09: Personal Learning Path & Progress Tracking', () => {
  const userId = '11111111-1111-1111-1111-111111111111';
  const otherUserId = '99999999-9999-9999-9999-999999999999';
  const analysisId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const moduleId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // UC-P08: Tra cứu lộ trình học tập cá nhân (GET)
  // ============================================================================
  describe('UC-P08: GET /api/personal/learning-path', () => {
    it('chặn 401 khi người dùng chưa đăng nhập', async () => {
      vi.mocked(createClient).mockResolvedValueOnce({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error('Unauthorized') }),
        },
      } as any);

      const res = await GET();
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toContain('Yêu cầu đăng nhập');
    });

    it('trả về 200 kèm lộ trình phân tích AI, tiến độ hoàn thành và danh sách học phần xuất bản', async () => {
      vi.mocked(createClient).mockResolvedValueOnce({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: userId, email: 'learner@nexa.ai' } },
            error: null,
          }),
        },
      } as any);

      const mockAnalysis = {
        id: analysisId,
        user_id: userId,
        overall_level: 'INTERMEDIATE',
        radar_data: { D1: 80, D2: 60, D3: 40, D4: 70, D5: 50 },
        skill_gaps: ['D3 - Sáng tạo nội dung số'],
        learning_pathway: [
          {
            stepNumber: 1,
            title: 'Khai thác AI tạo sinh an toàn',
            targetSkill: 'D3',
            objective: 'Hiểu các rủi ro bản quyền và xác thực nội dung',
            is_completed: false,
          },
          {
            stepNumber: 2,
            title: 'Bảo mật dữ liệu cá nhân',
            targetSkill: 'D4',
            objective: 'Cấu hình bảo mật 2 lớp và phòng chống lừa đảo',
            is_completed: false,
          },
        ],
        created_at: new Date().toISOString(),
      };

      const mockProgress = [
        {
          module_id: moduleId,
          is_completed: true,
          completed_at: new Date().toISOString(),
          points_awarded: 25,
        },
      ];

      const mockModules = [
        {
          id: moduleId,
          title: 'Học phần AI căn bản',
          is_published: true,
          order_index: 1,
        },
      ];

      vi.mocked(createAdminClient).mockReturnValueOnce({
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'competency_analyses') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      maybeSingle: vi.fn().mockResolvedValue({
                        data: mockAnalysis,
                        error: null,
                      }),
                    }),
                  }),
                }),
              }),
            };
          }
          if (table === 'user_learning_progress') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: mockProgress,
                  error: null,
                }),
              }),
            };
          }
          if (table === 'learning_modules') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({
                    data: mockModules,
                    error: null,
                  }),
                }),
              }),
            };
          }
          return {};
        }),
      } as any);

      const res = await GET();
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.analysis.id).toBe(analysisId);
      expect(body.analysis.overall_level).toBe('INTERMEDIATE');
      expect(body.progress).toHaveLength(1);
      expect(body.modules).toHaveLength(1);
    });

    it('trả về 200 với analysis null khi học viên chưa làm bài đánh giá đầu vào', async () => {
      vi.mocked(createClient).mockResolvedValueOnce({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: userId, email: 'newbie@nexa.ai' } },
            error: null,
          }),
        },
      } as any);

      vi.mocked(createAdminClient).mockReturnValueOnce({
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'competency_analyses') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      maybeSingle: vi.fn().mockResolvedValue({
                        data: null,
                        error: null,
                      }),
                    }),
                  }),
                }),
              }),
            };
          }
          if (table === 'user_learning_progress') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            };
          }
          if (table === 'learning_modules') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({
                    data: [],
                    error: null,
                  }),
                }),
              }),
            };
          }
          return {};
        }),
      } as any);

      const res = await GET();
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.analysis).toBeNull();
      expect(body.progress).toEqual([]);
      expect(body.modules).toEqual([]);
    });
  });

  // ============================================================================
  // UC-P09: Cập nhật tiến độ hoàn thành bước học (POST)
  // ============================================================================
  describe('UC-P09: POST /api/personal/learning-path', () => {
    it('chặn 401 khi chưa đăng nhập', async () => {
      vi.mocked(createClient).mockResolvedValueOnce({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error('Unauthorized') }),
        },
      } as any);

      const req = new Request('http://localhost:3000/api/personal/learning-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisId, stepNumber: 1, completed: true }),
      });

      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it('chặn 400 khi dữ liệu đầu vào không hợp lệ (sai định dạng UUID hoặc stepNumber ngoài 1-20)', async () => {
      vi.mocked(createClient).mockResolvedValueOnce({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: userId } },
            error: null,
          }),
        },
      } as any);

      const req = new Request('http://localhost:3000/api/personal/learning-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisId: 'invalid-uuid', stepNumber: 99 }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    it('chặn 404 khi không tìm thấy hồ sơ phân tích lộ trình', async () => {
      vi.mocked(createClient).mockResolvedValueOnce({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: userId } },
            error: null,
          }),
        },
      } as any);

      vi.mocked(createAdminClient).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const req = new Request('http://localhost:3000/api/personal/learning-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisId, stepNumber: 1, completed: true }),
      });

      const res = await POST(req);
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toContain('Không tìm thấy lộ trình');
    });

    it('chặn 403 khi người dùng cố chỉnh sửa lộ trình của người khác', async () => {
      vi.mocked(createClient).mockResolvedValueOnce({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: userId } },
            error: null,
          }),
        },
      } as any);

      vi.mocked(createAdminClient).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: analysisId,
                  user_id: otherUserId, // Thuộc về người khác
                  learning_pathway: [{ stepNumber: 1, title: 'Bước 1' }],
                },
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const req = new Request('http://localhost:3000/api/personal/learning-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisId, stepNumber: 1, completed: true }),
      });

      const res = await POST(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain('không có quyền');
    });

    it('chặn 404 khi bước số (stepNumber) không tồn tại trong lộ trình', async () => {
      vi.mocked(createClient).mockResolvedValueOnce({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: userId } },
            error: null,
          }),
        },
      } as any);

      vi.mocked(createAdminClient).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: analysisId,
                  user_id: userId,
                  learning_pathway: [{ stepNumber: 1, title: 'Bước 1' }],
                },
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const req = new Request('http://localhost:3000/api/personal/learning-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisId, stepNumber: 4, completed: true }),
      });

      const res = await POST(req);
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toContain('Không tìm thấy bước số 4');
    });

    it('cập nhật thành công bước học thành đã hoàn thành (is_completed: true, completed_at set)', async () => {
      vi.mocked(createClient).mockResolvedValueOnce({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: userId } },
            error: null,
          }),
        },
      } as any);

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      vi.mocked(createAdminClient).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: analysisId,
                  user_id: userId,
                  learning_pathway: [
                    { stepNumber: 1, title: 'Bước 1', is_completed: false },
                    { stepNumber: 2, title: 'Bước 2', is_completed: false },
                  ],
                },
                error: null,
              }),
            }),
          }),
          update: mockUpdate,
        }),
      } as any);

      const req = new Request('http://localhost:3000/api/personal/learning-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisId, stepNumber: 1, completed: true }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.message).toBe('Đã hoàn thành bước học');
      expect(data.learningPathway[0].is_completed).toBe(true);
      expect(data.learningPathway[0].completed_at).toBeDefined();
      expect(data.learningPathway[1].is_completed).toBe(false);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          learning_pathway: expect.arrayContaining([
            expect.objectContaining({ stepNumber: 1, is_completed: true }),
          ]),
        })
      );
    });

    it('cho phép hủy đánh dấu hoàn thành bước học (is_completed: false, completed_at: null)', async () => {
      vi.mocked(createClient).mockResolvedValueOnce({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: userId } },
            error: null,
          }),
        },
      } as any);

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      vi.mocked(createAdminClient).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: analysisId,
                  user_id: userId,
                  learning_pathway: [
                    { stepNumber: 1, title: 'Bước 1', is_completed: true, completed_at: '2026-11-01T00:00:00Z' },
                  ],
                },
                error: null,
              }),
            }),
          }),
          update: mockUpdate,
        }),
      } as any);

      const req = new Request('http://localhost:3000/api/personal/learning-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisId, stepNumber: 1, completed: false }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.message).toBe('Đã bỏ đánh dấu hoàn thành');
      expect(data.learningPathway[0].is_completed).toBe(false);
      expect(data.learningPathway[0].completed_at).toBeNull();
    });
  });
});
