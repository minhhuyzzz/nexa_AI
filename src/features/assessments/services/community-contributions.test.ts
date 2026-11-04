import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { GET, POST, PATCH } from '@/app/api/contributions/route';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

vi.mock('@/lib/auth/admin-guard', () => ({
  requirePlatformAdmin: vi.fn(),
}));

vi.mock('@/features/gamification/services/point-ledger.service', () => ({
  PointLedgerService: {
    grantPoints: vi.fn().mockResolvedValue(true),
  },
}));

vi.mock('@/lib/audit/admin-audit.service', () => ({
  recordAdminAudit: vi.fn().mockResolvedValue(true),
}));

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requirePlatformAdmin } from '@/lib/auth/admin-guard';
import { PointLedgerService } from '@/features/gamification/services/point-ledger.service';
import { recordAdminAudit } from '@/lib/audit/admin-audit.service';

describe('UC-P15 & UC-A15: Community Contributions Submission & Moderation', () => {
  const learnerId = '11111111-1111-1111-1111-111111111111';
  const adminId = '88888888-8888-8888-8888-888888888888';
  const contribId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // UC-P15 & UC-A15: GET /api/contributions
  // ============================================================================
  describe('GET /api/contributions', () => {
    it('chặn 401 khi chưa đăng nhập', async () => {
      vi.mocked(createClient).mockResolvedValueOnce({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error('Unauthorized') }),
        },
      } as any);

      const req = new NextRequest('http://localhost:3000/api/contributions');
      const res = await GET(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toContain('Chưa đăng nhập');
    });

    it('người học thông thường chỉ xem danh sách đóng góp của chính mình', async () => {
      vi.mocked(createClient).mockResolvedValueOnce({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: learnerId, email: 'learner@nexa.ai' } },
            error: null,
          }),
        },
      } as any);

      const mockEqUserId = vi.fn().mockResolvedValue({
        data: [
          {
            id: contribId,
            code: 'CB-1024',
            user_id: learnerId,
            title: 'Tình huống xử lý xung đột Git',
            domain: 'D2 - Giao tiếp và hợp tác số',
            question_type: 'SCENARIO',
            difficulty: 'INTERMEDIATE',
            status: 'PENDING',
            prompt: 'Mô tả tình huống xung đột khi merge branch...',
            solution_notes: 'Giải pháp là rebase hoặc merge commit chuẩn',
            admin_feedback: null,
            points_rewarded: 0,
            attached_files: [],
            created_at: new Date().toISOString(),
            reviewed_at: null,
            profiles: { nickname: 'Learner One', email: 'learner@nexa.ai' },
          },
        ],
        error: null,
      });

      vi.mocked(createAdminClient).mockReturnValueOnce({
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'profiles') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { role: 'LEARNER' }, // Không phải ADMIN
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === 'community_contributions') {
            return {
              select: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  eq: mockEqUserId,
                }),
              }),
            };
          }
          return {};
        }),
      } as any);

      const req = new NextRequest('http://localhost:3000/api/contributions');
      const res = await GET(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.contributions).toHaveLength(1);
      expect(body.contributions[0].title).toBe('Tình huống xử lý xung đột Git');
      expect(body.contributions[0].authorName).toBe('Learner One');
      expect(mockEqUserId).toHaveBeenCalledWith('user_id', learnerId);
    });

    it('quản trị viên xem tất cả đóng góp và hỗ trợ lọc theo trạng thái status', async () => {
      vi.mocked(createClient).mockResolvedValueOnce({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: adminId, email: 'admin@nexa.ai' } },
            error: null,
          }),
        },
      } as any);

      const mockEqStatus = vi.fn().mockResolvedValue({
        data: [
          {
            id: contribId,
            code: 'CB-2048',
            user_id: learnerId,
            title: 'Bài thực hành Excel Pivot Table',
            domain: 'D1 - Thông tin và dữ liệu số',
            question_type: 'PRACTICAL_FILE',
            difficulty: 'ADVANCED',
            status: 'APPROVED',
            prompt: 'Tải file và tính toán doanh số theo quý...',
            solution_notes: 'Dùng hàm SUMIFS hoặc Pivot',
            admin_feedback: 'Đề xuất rất thực tế',
            points_rewarded: 50,
            attached_files: ['excel_sample.xlsx'],
            created_at: new Date().toISOString(),
            reviewed_at: new Date().toISOString(),
            profiles: { nickname: 'Pro Contributor', email: 'pro@nexa.ai' },
          },
        ],
        error: null,
      });

      vi.mocked(createAdminClient).mockReturnValueOnce({
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'profiles') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { role: 'ADMIN' },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === 'community_contributions') {
            return {
              select: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  eq: mockEqStatus,
                }),
              }),
            };
          }
          return {};
        }),
      } as any);

      const req = new NextRequest('http://localhost:3000/api/contributions?status=approved');
      const res = await GET(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.contributions).toHaveLength(1);
      expect(body.contributions[0].status).toBe('approved');
      expect(mockEqStatus).toHaveBeenCalledWith('status', 'APPROVED');
    });
  });

  // ============================================================================
  // UC-P15: Gửi đề xuất đóng góp câu hỏi cộng đồng (POST)
  // ============================================================================
  describe('UC-P15: POST /api/contributions', () => {
    it('chặn 401 khi chưa đăng nhập', async () => {
      vi.mocked(createClient).mockResolvedValueOnce({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error('Unauthorized') }),
        },
      } as any);

      const req = new NextRequest('http://localhost:3000/api/contributions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Đề xuất mới',
          domain: 'D1',
          questionType: 'MCQ',
          prompt: 'Nội dung câu hỏi hợp lệ',
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it('chặn 400 khi thiếu thông tin bắt buộc hoặc tiêu đề < 5 ký tự', async () => {
      vi.mocked(createClient).mockResolvedValueOnce({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: learnerId } },
            error: null,
          }),
        },
      } as any);

      const req = new NextRequest('http://localhost:3000/api/contributions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Ngắn', // < 5 ký tự
          domain: 'D1',
          questionType: 'MCQ',
          prompt: 'Nội dung ngắn',
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('Dữ liệu không hợp lệ');
    });

    it('gửi đề xuất thành công với mã số CB-xxxx và trạng thái PENDING', async () => {
      vi.mocked(createClient).mockResolvedValueOnce({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: learnerId } },
            error: null,
          }),
        },
      } as any);

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: contribId,
              code: 'CB-5678',
              created_at: new Date().toISOString(),
            },
            error: null,
          }),
        }),
      });

      vi.mocked(createAdminClient).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          insert: mockInsert,
        }),
      } as any);

      const req = new NextRequest('http://localhost:3000/api/contributions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Nhận biết email lừa đảo mạo danh ngân hàng',
          domain: 'D4 - An toàn số',
          questionType: 'SCENARIO',
          difficulty: 'INTERMEDIATE',
          prompt: 'Một email thông báo trúng thưởng từ ngân hàng kèm liên kết lạ...',
          solutionNotes: 'Kiểm tra tên miền gửi và không bấm link lạ',
          attachedFiles: ['sample_phishing.eml'],
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.message).toContain('thành công');
      expect(body.contribution.code).toBe('CB-5678');

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: learnerId,
          title: 'Nhận biết email lừa đảo mạo danh ngân hàng',
          domain: 'D4 - An toàn số',
          status: 'PENDING',
          attached_files: ['sample_phishing.eml'],
        })
      );
    });
  });

  // ============================================================================
  // UC-A15: Quản trị viên duyệt đề xuất đóng góp (PATCH)
  // ============================================================================
  describe('UC-A15: PATCH /api/contributions', () => {
    it('chặn 403 khi người dùng không phải Platform Admin', async () => {
      vi.mocked(requirePlatformAdmin).mockResolvedValueOnce({
        isAuthorized: false,
        errorResponse: NextResponse.json({ error: 'Từ chối quyền truy cập' }, { status: 403 }),
      });

      const req = new NextRequest('http://localhost:3000/api/contributions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: contribId,
          status: 'APPROVED',
          pointsRewarded: 50,
        }),
      });

      const res = await PATCH(req);
      expect(res.status).toBe(403);
    });

    it('chặn 404 khi không tìm thấy hồ sơ đóng góp tương ứng', async () => {
      vi.mocked(requirePlatformAdmin).mockResolvedValueOnce({
        isAuthorized: true,
        user: { id: adminId },
      });

      vi.mocked(createAdminClient).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: new Error('Not found'),
              }),
            }),
          }),
        }),
      } as any);

      const req = new NextRequest('http://localhost:3000/api/contributions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: contribId,
          status: 'APPROVED',
          pointsRewarded: 50,
        }),
      });

      const res = await PATCH(req);
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toContain('Không tìm thấy');
    });

    it('phê duyệt đóng góp (APPROVED): cộng điểm PTS cho tác giả, tạo mục ngân hàng đề và ghi audit log', async () => {
      vi.mocked(requirePlatformAdmin).mockResolvedValueOnce({
        isAuthorized: true,
        user: { id: adminId },
      });

      const mockContribution = {
        id: contribId,
        user_id: learnerId,
        code: 'CB-9999',
        title: 'Thực hành phân tích dữ liệu CSV',
        domain: 'D1',
        question_type: 'PRACTICAL_FILE',
        difficulty: 'ADVANCED',
        status: 'PENDING',
        prompt: 'Thực hiện phân tích bảng tính...',
        solution_notes: 'Hướng dẫn giải chi tiết...',
        attached_files: [],
      };

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      const mockInsertQB = vi.fn().mockResolvedValue({ error: null });

      vi.mocked(createAdminClient).mockReturnValue({
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'community_contributions') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: mockContribution,
                    error: null,
                  }),
                }),
              }),
              update: mockUpdate,
            };
          }
          if (table === 'question_bank_items') {
            return {
              insert: mockInsertQB,
            };
          }
          return {};
        }),
      } as any);

      const req = new NextRequest('http://localhost:3000/api/contributions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: contribId,
          status: 'APPROVED',
          adminFeedback: 'Nội dung rất hay và hữu ích cho ngân hàng đề',
          pointsRewarded: 75,
        }),
      });

      const res = await PATCH(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);

      // Verify update contribution
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'APPROVED',
          admin_feedback: 'Nội dung rất hay và hữu ích cho ngân hàng đề',
          points_rewarded: 75,
          reviewed_by: adminId,
        })
      );

      // Verify inserted into question_bank_items
      expect(mockInsertQB).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'QB-CB-9999',
          type: 'PRACTICE_FILE',
          difficulty_level: 'ADVANCED',
          default_points: 75,
          status: 'APPROVED',
          created_by: learnerId,
        })
      );

      // Verify PointLedgerService.grantPoints was called for learner
      expect(PointLedgerService.grantPoints).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userId: learnerId,
          delta: 75,
          sourceType: 'ADMIN',
          sourceId: contribId,
        })
      );

      // Verify recordAdminAudit
      expect(recordAdminAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId: adminId,
          action: 'APPROVE',
          targetType: 'COMMUNITY_CONTRIBUTION',
          targetId: contribId,
        })
      );
    });

    it('yêu cầu chỉnh sửa (NEEDS_REVISION): lưu phản hồi, không cộng điểm, ghi audit log', async () => {
      vi.mocked(requirePlatformAdmin).mockResolvedValueOnce({
        isAuthorized: true,
        user: { id: adminId },
      });

      const mockContribution = {
        id: contribId,
        user_id: learnerId,
        code: 'CB-8888',
        title: 'Đề trắc nghiệm an toàn số',
        domain: 'D4',
        question_type: 'MCQ',
        difficulty: 'INTERMEDIATE',
        status: 'PENDING',
        prompt: 'Câu hỏi chưa đủ các phương án lựa chọn',
      };

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      vi.mocked(createAdminClient).mockReturnValue({
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'community_contributions') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: mockContribution,
                    error: null,
                  }),
                }),
              }),
              update: mockUpdate,
            };
          }
          return {};
        }),
      } as any);

      const req = new NextRequest('http://localhost:3000/api/contributions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: contribId,
          status: 'NEEDS_REVISION',
          adminFeedback: 'Vui lòng bổ sung ít nhất 4 đáp án lựa chọn và đáp án đúng.',
          pointsRewarded: 0,
        }),
      });

      const res = await PATCH(req);
      expect(res.status).toBe(200);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'NEEDS_REVISION',
          admin_feedback: 'Vui lòng bổ sung ít nhất 4 đáp án lựa chọn và đáp án đúng.',
          points_rewarded: 0,
        })
      );

      expect(PointLedgerService.grantPoints).not.toHaveBeenCalled();

      expect(recordAdminAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId: adminId,
          action: 'UPDATE',
          targetType: 'COMMUNITY_CONTRIBUTION',
          targetId: contribId,
        })
      );
    });
  });
});
