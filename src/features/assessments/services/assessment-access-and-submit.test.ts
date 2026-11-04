import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as getAssessment } from '@/app/api/assessments/[id]/route';
import { POST as submitAssessment } from '@/app/api/assessments/[id]/submit/route';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

vi.mock('@/features/gamification/services/point-ledger.service', () => ({
  PointLedgerService: {
    grantPoints: vi.fn().mockResolvedValue(true),
  },
}));

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { PointLedgerService } from '@/features/gamification/services/point-ledger.service';

describe('UC-P03, UC-P04, UC-P05, UC-A11: Assessment Access Control & Submission Workflow', () => {
  const freeUserId = '11111111-1111-1111-1111-111111111111';
  const vipUserId = '22222222-2222-2222-2222-222222222222';
  const freeAssessmentId = 'aaaaaaaa-1111-1111-1111-111111111111';
  const vipAssessmentId = 'bbbbbbbb-2222-2222-2222-222222222222';
  const classAssignmentId = 'cccccccc-3333-3333-3333-333333333333';
  const campaignId = 'dddddddd-4444-4444-4444-444444444444';
  const classId = 'eeeeeeee-5555-5555-5555-555555555555';
  const orgId = 'ffffffff-6666-6666-6666-666666666666';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // Part 1: GET /api/assessments/[id] - Access Control & Tier Enforcement
  // ============================================================================
  describe('GET /api/assessments/[id] — Free vs VIP Access Control', () => {
    it('từ chối 401 khi người dùng chưa đăng nhập', async () => {
      vi.mocked(createClient).mockResolvedValueOnce({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error('Unauthorized') }),
        },
      } as any);

      const req = new NextRequest(`http://localhost:3000/api/assessments/${freeAssessmentId}`);
      const res = await getAssessment(req, { params: Promise.resolve({ id: freeAssessmentId }) });
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe('Yêu cầu đăng nhập');
    });

    it('từ chối 404 khi đề không tồn tại hoặc chưa phát hành', async () => {
      vi.mocked(createClient).mockResolvedValueOnce({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: freeUserId } }, error: null }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                }),
              }),
            }),
          }),
        }),
      } as any);

      const req = new NextRequest(`http://localhost:3000/api/assessments/${freeAssessmentId}`);
      const res = await getAssessment(req, { params: Promise.resolve({ id: freeAssessmentId }) });
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toContain('Không tìm thấy bài đánh giá');
    });

    it('cho phép tài khoản Free truy cập đề thi Free', async () => {
      vi.mocked(createClient).mockResolvedValueOnce({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: freeUserId } }, error: null }),
        },
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'assessments') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      maybeSingle: vi.fn().mockResolvedValue({
                        data: {
                          id: freeAssessmentId,
                          title: 'Đề Khảo Thí Cơ Bản',
                          is_vip: false,
                          access_tier: 'FREE',
                          is_published: true,
                        },
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
        rpc: vi.fn().mockResolvedValue({
          data: { items: [{ id: 'item-1', prompt: 'Câu 1' }] },
          error: null,
        }),
      } as any);

      const req = new NextRequest(`http://localhost:3000/api/assessments/${freeAssessmentId}`);
      const res = await getAssessment(req, { params: Promise.resolve({ id: freeAssessmentId }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.assessment.id).toBe(freeAssessmentId);
      expect(data.assessment.access_tier).toBe('FREE');
    });

    it('chặn 403 UPGRADE_REQUIRED khi tài khoản Free cố truy cập đề VIP trực tiếp', async () => {
      vi.mocked(createClient).mockResolvedValueOnce({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: freeUserId } }, error: null }),
        },
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'assessments') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      maybeSingle: vi.fn().mockResolvedValue({
                        data: {
                          id: vipAssessmentId,
                          title: 'Đề Khảo Thí VIP Nâng Cao',
                          is_vip: true,
                          access_tier: 'VIP',
                          is_published: true,
                        },
                        error: null,
                      }),
                    }),
                  }),
                }),
              }),
            };
          }
          if (table === 'profiles') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { plan_tier: 'FREE', role: 'LEARNER', admin_role: null },
                    error: null,
                  }),
                }),
              }),
            };
          }
          return {};
        }),
      } as any);

      const req = new NextRequest(`http://localhost:3000/api/assessments/${vipAssessmentId}`);
      const res = await getAssessment(req, { params: Promise.resolve({ id: vipAssessmentId }) });
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.code).toBe('UPGRADE_REQUIRED');
      expect(data.error).toContain('VIP / Premium');
    });

    it('cho phép tài khoản Free làm đề VIP nếu có assignmentId hợp lệ trong lớp', async () => {
      vi.mocked(createClient).mockResolvedValueOnce({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: freeUserId } }, error: null }),
        },
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'assessments') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      maybeSingle: vi.fn().mockResolvedValue({
                        data: {
                          id: vipAssessmentId,
                          title: 'Đề Khảo Thí VIP Được Giao',
                          is_vip: true,
                          access_tier: 'VIP',
                          is_published: true,
                        },
                        error: null,
                      }),
                    }),
                  }),
                }),
              }),
            };
          }
          if (table === 'profiles') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { plan_tier: 'FREE', role: 'LEARNER' },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === 'class_assignments') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: { id: classAssignmentId, class_id: classId, assessment_id: vipAssessmentId },
                      error: null,
                    }),
                  }),
                }),
              }),
            };
          }
          if (table === 'class_members') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: { id: 'member-1' },
                      error: null,
                    }),
                  }),
                }),
              }),
            };
          }
          return {};
        }),
        rpc: vi.fn().mockResolvedValue({
          data: { items: [{ id: 'item-1', prompt: 'Câu hỏi VIP' }] },
          error: null,
        }),
      } as any);

      const req = new NextRequest(`http://localhost:3000/api/assessments/${vipAssessmentId}?assignmentId=${classAssignmentId}`);
      const res = await getAssessment(req, { params: Promise.resolve({ id: vipAssessmentId }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.assessment.id).toBe(vipAssessmentId);
    });

    it('cho phép tài khoản có gói VIP truy cập đề VIP trực tiếp', async () => {
      vi.mocked(createClient).mockResolvedValueOnce({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: vipUserId } }, error: null }),
        },
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'assessments') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      maybeSingle: vi.fn().mockResolvedValue({
                        data: {
                          id: vipAssessmentId,
                          title: 'Đề VIP Nâng Cao',
                          is_vip: true,
                          access_tier: 'VIP',
                          is_published: true,
                        },
                        error: null,
                      }),
                    }),
                  }),
                }),
              }),
            };
          }
          if (table === 'profiles') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { plan_tier: 'PRO', role: 'LEARNER' },
                    error: null,
                  }),
                }),
              }),
            };
          }
          return {};
        }),
        rpc: vi.fn().mockResolvedValue({
          data: { items: [{ id: 'item-vip', prompt: 'Câu hỏi VIP' }] },
          error: null,
        }),
      } as any);

      const req = new NextRequest(`http://localhost:3000/api/assessments/${vipAssessmentId}`);
      const res = await getAssessment(req, { params: Promise.resolve({ id: vipAssessmentId }) });
      expect(res.status).toBe(200);
    });
  });

  // ============================================================================
  // Part 2: POST /api/assessments/[id]/submit - Submission Verification
  // ============================================================================
  describe('POST /api/assessments/[id]/submit — Submission & Scoring Engine', () => {
    it('từ chối 400 khi payload không hợp lệ', async () => {
      const req = new Request(`http://localhost:3000/api/assessments/${freeAssessmentId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invalidField: true }),
      });

      const res = await submitAssessment(req, { params: Promise.resolve({ id: freeAssessmentId }) });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    it('chặn 403 UPGRADE_REQUIRED khi nộp bài đề VIP mà tài khoản Free không được giao', async () => {
      vi.mocked(createClient).mockResolvedValueOnce({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: freeUserId } }, error: null }),
        },
      } as any);

      vi.mocked(createAdminClient).mockReturnValueOnce({
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'assessments') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: vipAssessmentId, is_vip: true, access_tier: 'VIP', passing_score: 70 },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === 'profiles') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { plan_tier: 'FREE', role: 'LEARNER' },
                    error: null,
                  }),
                }),
              }),
            };
          }
          return {};
        }),
      } as any);

      const req = new Request(`http://localhost:3000/api/assessments/${vipAssessmentId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeSpentSeconds: 300,
          answers: [
            { itemId: '33333333-3333-3333-3333-333333333333', selectedOptionId: '44444444-4444-4444-4444-444444444444' },
          ],
        }),
      });

      const res = await submitAssessment(req, { params: Promise.resolve({ id: vipAssessmentId }) });
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.code).toBe('UPGRADE_REQUIRED');
    });

    it('nộp bài trắc nghiệm 100% tự động chấm ngay, chuyển EVALUATED và lưu class_assignment_id + campaign_id', async () => {
      const itemId1 = '55555555-5555-5555-5555-555555555555';
      const optId1 = '66666666-6666-6666-6666-666666666666';
      const mockSubId = '77777777-7777-7777-7777-777777777777';

      vi.mocked(createClient).mockResolvedValueOnce({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: freeUserId } }, error: null }),
        },
      } as any);

      const mockSubUpdateEq = vi.fn().mockResolvedValue({ error: null });
      const mockSubUpdate = vi.fn().mockReturnValue({
        eq: mockSubUpdateEq,
      });
      const mockAnsInsert = vi.fn().mockResolvedValue({ data: [], error: null });
      const mockAnsDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      vi.mocked(createAdminClient).mockReturnValueOnce({
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'assessments') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: freeAssessmentId, is_vip: false, access_tier: 'FREE', passing_score: 70, point_reward: 30 },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === 'assessment_submissions') {
            return {
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: { id: mockSubId }, error: null }),
                }),
              }),
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                      neq: vi.fn().mockReturnValue({
                        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
                      }),
                    }),
                  }),
                }),
              }),
              update: mockSubUpdate,
            };
          }
          if (table === 'submission_answers') {
            return {
              delete: mockAnsDelete,
              insert: mockAnsInsert,
            };
          }
          return {};
        }),
        rpc: vi.fn().mockResolvedValue({
          data: [
            { item_id: itemId1, points: 100, correct_option_id: optId1 },
          ],
          error: null,
        }),
      } as any);

      const req = new Request(`http://localhost:3000/api/assessments/${freeAssessmentId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeSpentSeconds: 600,
          campaignId,
          answers: [
            { itemId: itemId1, selectedOptionId: optId1 },
          ],
        }),
      });

      const res = await submitAssessment(req, { params: Promise.resolve({ id: freeAssessmentId }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.totalScore).toBe(100);
      expect(data.isPassed).toBe(true);
      expect(data.hasOpenResponse).toBe(false);

      // Verify campaign_id and scores updated on assessment_submissions
      expect(mockSubUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'EVALUATED',
          grading_status: 'COMPLETED',
          campaign_id: campaignId,
          total_score: 100,
        })
      );

      // Verify points rewarded via grantPoints
      expect(PointLedgerService.grantPoints).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userId: freeUserId,
          delta: 30,
        })
      );
    });
  });
});
