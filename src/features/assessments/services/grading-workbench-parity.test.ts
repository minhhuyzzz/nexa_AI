import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as checkEvaluator } from '@/app/api/personal/evaluator-check/route';
import { GET as getOrgGrading, POST as postOrgGrading } from '@/app/api/organizations/[orgId]/grading/route';
import { GET as getPersonalSubmissions } from '@/app/api/evaluator/submissions/route';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

vi.mock('@/lib/auth/org-guard', () => ({
  requireOrgApiPermission: vi.fn(),
}));

describe('Grading Workbench & Multi-tenant Isolation', () => {
  const mockUserId = '11111111-1111-1111-1111-111111111111';
  const mockOrgId = '22222222-2222-2222-2222-222222222222';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Personal Sidebar Evaluator Check (/api/personal/evaluator-check)', () => {
    it('trả về canGrade: false nếu người dùng chưa đăng nhập', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error('Unauthorized') }),
        },
      } as any);

      const res = await checkEvaluator();
      const body = await res.json();
      expect(body.canGrade).toBe(false);
    });

    it('trả về canGrade: true nếu người dùng sở hữu nhóm cá nhân (organization_id IS NULL)', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: mockUserId } }, error: null }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              or: vi.fn().mockResolvedValue({ count: 2, error: null }),
            }),
          }),
        }),
      } as any);

      const res = await checkEvaluator();
      const body = await res.json();
      expect(body.canGrade).toBe(true);
    });
  });

  describe('Organization Grading Engine & MCQ Preservation (/api/organizations/[orgId]/grading)', () => {
    it('bảo toàn điểm trắc nghiệm (MCQ) khi chấm câu thực hành cho bài nộp hỗn hợp', async () => {
      const { requireOrgApiPermission } = await import('@/lib/auth/org-guard');
      const { createAdminClient } = await import('@/lib/supabase/admin');

      vi.mocked(requireOrgApiPermission).mockResolvedValue({
        authorized: true,
        context: {
          user: { id: mockUserId },
          role: 'ORG_ADMIN',
          isSuperadmin: false,
        },
      } as any);

      const mockSubUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'sub-hybrid-1', total_score: 80, percentage: 80, status: 'EVALUATED' },
              error: null,
            }),
          }),
        }),
      });

      const mockAnswerUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });

      vi.mocked(createAdminClient).mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === 'assessment_submissions') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      id: 'sub-hybrid-1',
                      max_score: 100,
                      assessments: { organization_id: mockOrgId, passing_score: 70 },
                    },
                    error: null,
                  }),
                }),
              }),
              update: mockSubUpdate,
            };
          }
          if (table === 'submission_answers') {
            return {
              update: mockAnswerUpdate,
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [
                    // Câu 1: MCQ 30đ tự chấm
                    { item_id: 'mcq-1', score_awarded: 30, auto_graded: true },
                    // Câu 2: Thực hành 50đ vừa được chấm
                    { item_id: 'prac-1', score_awarded: 50, auto_graded: false },
                  ],
                  error: null,
                }),
              }),
            };
          }
          return {};
        }),
      } as any);

      const req = new NextRequest(`http://localhost:3000/api/organizations/${mockOrgId}/grading`, {
        method: 'POST',
        body: JSON.stringify({
          submissionId: '55555555-5555-5555-5555-555555555555',
          itemScores: [{ itemId: '44444444-4444-4444-4444-444444444444', score: 50 }],
          feedback: 'Sản phẩm số xuất sắc, đạt tiêu chí Rubric.',
        }),
      });

      const res = await postOrgGrading(req, { params: Promise.resolve({ orgId: mockOrgId }) });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);

      // Điểm tổng kết = 30 (MCQ tự chấm) + 50 (Thực hành) = 80đ
      expect(mockSubUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          total_score: 80,
          percentage: 80,
          is_passed: true,
          status: 'EVALUATED',
          grading_status: 'EVALUATOR_APPROVED',
        })
      );
    });
  });

  describe('Personal Grading Isolation (/api/evaluator/submissions)', () => {
    it('chỉ lấy các nhóm cá nhân (organization_id IS NULL) và loại trừ bài nộp thuộc tổ chức', async () => {
      const { createClient } = await import('@/lib/supabase/server');

      const mockIsOrgNull = vi.fn().mockReturnValue({
        or: vi.fn().mockResolvedValue({
          data: [
            {
              id: 'personal-class-1',
              name: 'Lớp Lập trình Web Cá nhân',
              class_code: 'WEB-P1',
              class_members: [{ user_id: 'student-1' }],
            },
          ],
        }),
      });

      const mockSubQuery = {
        is: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [
            {
              id: 'sub-p1',
              user_id: 'student-1',
              status: 'SUBMITTED',
              grading_status: 'PENDING_REVIEW',
              assessments: { id: 'asm-p1', title: 'Đề tự do', passing_score: 70, organization_id: null },
            },
          ],
          error: null,
        }),
      };

      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: mockUserId } }, error: null }),
        },
        from: vi.fn((table: string) => {
          if (table === 'evaluator_classes') {
            return {
              select: vi.fn().mockReturnValue({
                is: mockIsOrgNull,
              }),
            };
          }
          if (table === 'assessment_submissions') {
            return {
              select: vi.fn().mockReturnValue(mockSubQuery),
            };
          }
          if (table === 'profiles') {
            return {
              select: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({ data: [{ id: 'student-1', full_name: 'Học viên A', email: 'a@test.com' }] }),
              }),
            };
          }
          if (table === 'submission_answers') {
            return {
              select: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({ data: [] }),
              }),
            };
          }
          if (table === 'ai_evaluations') {
            return {
              select: vi.fn().mockReturnValue({
                in: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({ data: [] }),
                }),
              }),
            };
          }
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: [] }),
            }),
          };
        }),
      } as any);

      const req = new NextRequest('http://localhost:3000/api/evaluator/submissions');
      const res = await getPersonalSubmissions(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.classes).toHaveLength(1);
      expect(body.classes[0].name).toBe('Lớp Lập trình Web Cá nhân');

      // Xác nhận truy vấn evaluator_classes lọc chặt organization_id = null
      expect(mockIsOrgNull).toHaveBeenCalledWith('organization_id', null);
      // Xác nhận truy vấn assessment_submissions lọc chặt assessments.organization_id = null
      expect(mockSubQuery.is).toHaveBeenCalledWith('assessments.organization_id', null);
    });
  });
});
