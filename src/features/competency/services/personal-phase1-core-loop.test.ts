import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Handlers under test for Phase 1: Core Assessment & Competency Loop
import { GET as getAssessmentById } from '@/app/api/assessments/[id]/route';
import { POST as submitAssessment } from '@/app/api/assessments/[id]/submit/route';
import { GET as getCompetencyProfile } from '@/app/api/personal/competency-profile/route';
import { DomainAssessmentSummaryService } from '@/features/competency/services/domain-assessment-summary.service';

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

describe('Personal User Phase 1: Core Assessment & Competency Loop (UC-P02 to UC-P07)', () => {
  const learnerId = '11111111-2222-3333-4444-555555555555';
  const baselineAssessmentId = 'aaaaaaaa-1111-1111-1111-111111111111';
  const proAssessmentId = 'bbbbbbbb-2222-2222-2222-222222222222';
  const itemId = 'cccccccc-3333-3333-3333-333333333333';
  const correctOptionId = 'dddddddd-4444-4444-4444-444444444444';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // UC-P03: Tra cứu & Phân quyền bài đánh giá (Free vs Pro Lock)
  // =========================================================================
  describe('UC-P03: Tra cứu bài đánh giá & Nhận diện Đề Khóa Pro', () => {
    it('chặn 403 UPGRADE_REQUIRED khi tài khoản Free cố truy cập đề VIP/Pro', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: learnerId } }, error: null }),
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
                          id: proAssessmentId,
                          title: 'Đề Khảo Thí Nâng Cao',
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
          return { select: vi.fn() };
        }),
      } as any);

      const req = new NextRequest(`http://localhost:3000/api/assessments/${proAssessmentId}`);
      const res = await getAssessmentById(req, { params: Promise.resolve({ id: proAssessmentId }) });

      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.code).toBe('UPGRADE_REQUIRED');
    });

    it('cho phép tài khoản Free truy cập đề thi Free', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: learnerId } }, error: null }),
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
                          id: baselineAssessmentId,
                          title: 'Đánh Giá Năng Lực Đầu Vào',
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
          return { select: vi.fn() };
        }),
        rpc: vi.fn().mockResolvedValue({
          data: {
            assessment: { id: baselineAssessmentId, title: 'Đánh Giá Năng Lực Đầu Vào' },
            items: [{ id: itemId, prompt: 'Câu hỏi mẫu 1' }],
          },
          error: null,
        }),
      } as any);

      const req = new NextRequest(`http://localhost:3000/api/assessments/${baselineAssessmentId}`);
      const res = await getAssessmentById(req, { params: Promise.resolve({ id: baselineAssessmentId }) });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.assessment.access_tier).toBe('FREE');
      expect(body.items).toHaveLength(1);
    });
  });

  // =========================================================================
  // UC-P04 & UC-P05 & UC-P06: Thực hiện & Nộp bài đánh giá
  // =========================================================================
  describe('UC-P04, UC-P05, UC-P06: Nộp bài đánh giá & Trả kết quả chuẩn xác', () => {
    it('từ chối 400 khi payload nộp bài thiếu trường bắt buộc', async () => {
      const req = new Request(`http://localhost:3000/api/assessments/${baselineAssessmentId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeSpentSeconds: -10,
          answers: 'not-an-array',
        }),
      });

      const res = await submitAssessment(req, { params: Promise.resolve({ id: baselineAssessmentId }) });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    it('tự động chấm điểm đối chiếu barem trắc nghiệm tức thì và trả về trạng thái EVALUATED', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: learnerId } }, error: null }),
        },
      } as any);

      vi.mocked(createAdminClient).mockReturnValue({
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'assessments') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      id: baselineAssessmentId,
                      passing_score: 70,
                      point_reward: 10,
                      is_vip: false,
                      access_tier: 'FREE',
                    },
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
                  single: vi.fn().mockResolvedValue({
                    data: { id: 'sub-new-001' },
                    error: null,
                  }),
                }),
              }),
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                      neq: vi.fn().mockReturnValue({
                        limit: vi.fn().mockResolvedValue({
                          data: [],
                          error: null,
                        }),
                      }),
                    }),
                  }),
                }),
              }),
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null }),
              }),
            };
          }
          if (table === 'submission_answers') {
            return {
              delete: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null }),
              }),
              insert: vi.fn().mockResolvedValue({ error: null }),
            };
          }
          return { select: vi.fn() };
        }),
        rpc: vi.fn().mockImplementation((rpcName: string) => {
          if (rpcName === 'get_assessment_answer_keys_for_submission') {
            return Promise.resolve({
              data: [
                {
                  item_id: itemId,
                  points: 100,
                  correct_option_id: correctOptionId,
                },
              ],
              error: null,
            });
          }
          return Promise.resolve({ data: null, error: null });
        }),
      } as any);

      const req = new Request(`http://localhost:3000/api/assessments/${baselineAssessmentId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeSpentSeconds: 300,
          answers: [
            {
              itemId: itemId,
              selectedOptionId: correctOptionId,
            },
          ],
        }),
      });

      const res = await submitAssessment(req, { params: Promise.resolve({ id: baselineAssessmentId }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.isPassed).toBe(true);
      expect(data.hasOpenResponse).toBe(false);
      expect(data.percentage).toBe(100);
      expect(data.pointsAwarded).toBe(10);
    });
  });

  // =========================================================================
  // UC-P02 & UC-P07: Xem Hồ Sơ Năng Lực 5 Miền & Phát hiện Lỗ hổng
  // =========================================================================
  describe('UC-P02 & UC-P07: Xem Hồ Sơ Năng Lực 5 Miền (Competency Profile)', () => {
    it('trả về 401 khi người dùng chưa đăng nhập gọi hồ sơ năng lực', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: new Error('Yêu cầu đăng nhập'),
          }),
        },
      } as any);

      const res = await getCompetencyProfile();
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toContain('Yêu cầu đăng nhập');
    });

    it('trả về đúng chuẩn 5 Miền DigComp (D1-D5), nhận diện miền mạnh nhất và miền lỗ hổng (<70%)', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: learnerId } },
            error: null,
          }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                }),
              }),
            }),
          }),
        }),
      } as any);

      const mockSummary = {
        userId: learnerId,
        hasTakenAssessment: true,
        totalAssessmentsCompleted: 1,
        assessedDomainsCount: 5,
        totalDomainsCount: 5,
        overallScore: 68,
        overallLevel: 'Level 2',
        radarData: [
          { index: 1, code: 'D1', name: 'Thông tin & Dữ liệu', score: 85, level: 'Advanced', target: 70, status: 'MASTERED' as const, hasData: true, evidenceCount: 5, questionsCount: 5 },
          { index: 2, code: 'D2', name: 'Giao tiếp & Hợp tác', score: 75, level: 'Intermediate', target: 70, status: 'PROFICIENT' as const, hasData: true, evidenceCount: 4, questionsCount: 4 },
          { index: 3, code: 'D3', name: 'Sáng tạo Nội dung số', score: 65, level: 'Basic', target: 70, status: 'DEVELOPING' as const, hasData: true, evidenceCount: 3, questionsCount: 3 },
          { index: 4, code: 'D4', name: 'An toàn & Bảo mật', score: 42, level: 'Foundation', target: 70, status: 'DEVELOPING' as const, hasData: true, evidenceCount: 2, questionsCount: 2 },
          { index: 5, code: 'D5', name: 'Giải quyết Vấn đề', score: 72, level: 'Intermediate', target: 70, status: 'PROFICIENT' as const, hasData: true, evidenceCount: 3, questionsCount: 3 },
        ],
        gapDomainCodes: ['D3', 'D4'],
        latestSubmissionId: 'sub-new-001',
        totalEvidenceCount: 17,
      };

      vi.spyOn(DomainAssessmentSummaryService, 'getUserCompetencySummary').mockResolvedValueOnce(mockSummary as any);

      const res = await getCompetencyProfile();
      expect(res.status).toBe(200);
      const body = await res.json();

      expect(body.success).toBe(true);
      expect(body.radarData).toHaveLength(5);

      // Miền mạnh nhất: D1 (85 điểm)
      expect(body.insights.strongest.code).toBe('D1');
      expect(body.insights.strongest.score).toBe(85);

      // Miền lỗ hổng: D4 (42 điểm, isGap = true)
      expect(body.insights.weakest.code).toBe('D4');
      expect(body.insights.weakest.score).toBe(42);
      expect(body.insights.weakest.isGap).toBe(true);
    });

    it('bảo toàn tính trung thực của thang đo: miền chưa thi trả về score = null (không ép về 0%)', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: learnerId } },
            error: null,
          }),
        },
      } as any);

      const mockUnassessedSummary = {
        userId: learnerId,
        hasTakenAssessment: false,
        totalAssessmentsCompleted: 0,
        assessedDomainsCount: 0,
        totalDomainsCount: 5,
        overallScore: null,
        overallLevel: 'Chưa đánh giá',
        radarData: [
          { index: 1, code: 'D1', name: 'Thông tin & Dữ liệu', score: null, level: 'Chưa đánh giá', target: 70, status: 'INSUFFICIENT_DATA' as const, hasData: false, evidenceCount: 0, questionsCount: 0 },
          { index: 2, code: 'D2', name: 'Giao tiếp & Hợp tác', score: null, level: 'Chưa đánh giá', target: 70, status: 'INSUFFICIENT_DATA' as const, hasData: false, evidenceCount: 0, questionsCount: 0 },
          { index: 3, code: 'D3', name: 'Sáng tạo Nội dung số', score: null, level: 'Chưa đánh giá', target: 70, status: 'INSUFFICIENT_DATA' as const, hasData: false, evidenceCount: 0, questionsCount: 0 },
          { index: 4, code: 'D4', name: 'An toàn & Bảo mật', score: null, level: 'Chưa đánh giá', target: 70, status: 'INSUFFICIENT_DATA' as const, hasData: false, evidenceCount: 0, questionsCount: 0 },
          { index: 5, code: 'D5', name: 'Giải quyết Vấn đề', score: null, level: 'Chưa đánh giá', target: 70, status: 'INSUFFICIENT_DATA' as const, hasData: false, evidenceCount: 0, questionsCount: 0 },
        ],
        gapDomainCodes: [],
        latestSubmissionId: null,
        totalEvidenceCount: 0,
      };

      vi.spyOn(DomainAssessmentSummaryService, 'getUserCompetencySummary').mockResolvedValueOnce(mockUnassessedSummary as any);

      const res = await getCompetencyProfile();
      expect(res.status).toBe(200);
      const body = await res.json();

      expect(body.success).toBe(true);
      expect(body.hasTakenAssessment).toBe(false);
      expect(body.overallScore).toBeNull();
      body.radarData.forEach((d: any) => {
        expect(d.score).toBeNull();
      });
      expect(body.insights).toBeNull();
    });
  });
});
