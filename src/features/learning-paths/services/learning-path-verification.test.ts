import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as submitLearningAssessment } from '@/app/api/personal/learning-path/submit/route';
import { GET as getLearningAssessment } from '@/app/api/personal/learning-path/assessment/[moduleId]/route';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

describe('Hệ Thống Lộ Trình Học Tập: Phòng Kiểm Chứng Toàn Màn Hình & Chấm Điểm', () => {
  const userId = '11111111-1111-1111-1111-111111111111';
  const moduleId = '22222222-2222-2222-2222-222222222222';
  const assessmentId = '33333333-3333-3333-3333-333333333333';
  const item1Id = 'aaaa1111-1111-1111-1111-111111111111';
  const item2Id = 'bbbb2222-2222-2222-2222-222222222222';
  const opt1Correct = 'opt-1-correct';
  const opt1Wrong = 'opt-1-wrong';
  const opt2Correct = 'opt-2-correct';
  const opt2Wrong = 'opt-2-wrong';

  const mockItems = [
    {
      id: item1Id,
      type: 'MCQ',
      prompt: 'Cách xác định nguồn tin số đáng tin cậy là gì?',
      points: 1,
      order_index: 1,
      item_options: [
        { id: opt1Correct, content: 'Đối chiếu nhiều nguồn chính thống', is_correct: true, explanation: 'Cần kiểm chứng chéo thông tin.' },
        { id: opt1Wrong, content: 'Tin vào mạng xã hội ngay', is_correct: false, explanation: 'Mạng xã hội dễ có tin giả.' },
      ],
    },
    {
      id: item2Id,
      type: 'MCQ',
      prompt: 'Khi nhận email lạ yêu cầu mật khẩu, bạn cần làm gì?',
      points: 1,
      order_index: 2,
      item_options: [
        { id: opt2Correct, content: 'Báo cáo lừa đảo và không nhấp vào liên kết', is_correct: true, explanation: 'Tránh tấn công Phishing.' },
        { id: opt2Wrong, content: 'Gửi mật khẩu ngay', is_correct: false, explanation: 'Không bao giờ chia sẻ mật khẩu.' },
      ],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/personal/learning-path/assessment/[moduleId]', () => {
    it('chặn 401 khi chưa đăng nhập', async () => {
      vi.mocked(createClient).mockResolvedValueOnce({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error('No user') }) },
      } as any);

      const req = new NextRequest(`http://localhost:3000/api/personal/learning-path/assessment/${moduleId}`);
      const res = await getLearningAssessment(req, { params: Promise.resolve({ moduleId }) });
      expect(res.status).toBe(401);
    });

    it('trả về đề thi an toàn không để lộ is_correct hoặc explanation', async () => {
      vi.mocked(createClient).mockResolvedValueOnce({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId } }, error: null }) },
      } as any);

      vi.mocked(createAdminClient).mockReturnValueOnce({
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'learning_modules') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      id: moduleId,
                      title: 'Bảo mật thông tin cá nhân',
                      domain_code: 'D4',
                      skill_code: '4.1',
                      duration_minutes: 15,
                      point_reward: 30,
                      assessment_id: assessmentId,
                      is_published: true,
                      assessments: { id: assessmentId, title: 'Bài kiểm chứng D4', passing_score: 100 },
                    },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === 'assessment_submissions') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
                    }),
                  }),
                }),
              }),
            };
          }
          if (table === 'assessment_items') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({ data: mockItems, error: null }),
                }),
              }),
            };
          }
          return {};
        }),
      } as any);

      const req = new NextRequest(`http://localhost:3000/api/personal/learning-path/assessment/${moduleId}`);
      const res = await getLearningAssessment(req, { params: Promise.resolve({ moduleId }) });
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.success).toBe(true);
      expect(data.module.passingScore).toBe(100);
      expect(data.items).toHaveLength(2);

      // Đảm bảo TUYỆT ĐỐI không để lộ is_correct hoặc explanation ra frontend trong lúc làm bài
      const firstOption = data.items[0].options[0];
      expect(firstOption).not.toHaveProperty('is_correct');
      expect(firstOption).not.toHaveProperty('explanation');
      expect(firstOption).toHaveProperty('id');
      expect(firstOption).toHaveProperty('content');
    });
  });

  describe('POST /api/personal/learning-path/submit', () => {
    it('chấm điểm đạt chuẩn 100%: hoàn thành trạm, cộng PTS và tăng lũy tiến 2% điểm miền', async () => {
      vi.mocked(createClient).mockResolvedValueOnce({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId } }, error: null }) },
      } as any);

      const mockProgressUpsert = vi.fn().mockResolvedValue({ error: null });
      const mockProfileUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
      const mockSnapshotInsert = vi.fn().mockResolvedValue({ error: null });
      const mockSubmissionInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id: 'sub-100' }, error: null }),
        }),
      });

      vi.mocked(createAdminClient).mockReturnValueOnce({
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'learning_modules') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      id: moduleId,
                      title: 'Bảo mật thông tin cá nhân',
                      domain_code: '04',
                      skill_code: '4.1',
                      point_reward: 30,
                      duration_minutes: 15,
                      assessment_id: assessmentId,
                      assessments: { id: assessmentId, passing_score: 100 },
                    },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === 'assessment_submissions') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
                    }),
                  }),
                }),
              }),
              insert: mockSubmissionInsert,
            };
          }
          if (table === 'assessment_items') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({ data: mockItems, error: null }),
                }),
              }),
            };
          }
          if (table === 'user_learning_progress') {
            return { upsert: mockProgressUpsert };
          }
          if (table === 'profiles') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: { points: 50 }, error: null }),
                }),
              }),
              update: mockProfileUpdate,
            };
          }
          if (table === 'learner_competency_snapshots') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      maybeSingle: vi.fn().mockResolvedValue({
                        data: {
                          domain_scores: { '01': 70, '02': 60, '03': 80, '04': 50, '05': 65 },
                          overall_score: 65,
                          skill_scores: {},
                        },
                        error: null,
                      }),
                    }),
                  }),
                }),
              }),
              insert: mockSnapshotInsert,
            };
          }
          return {};
        }),
      } as any);

      const req = new NextRequest('http://localhost:3000/api/personal/learning-path/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId,
          answers: {
            [item1Id]: opt1Correct,
            [item2Id]: opt2Correct,
          },
          tabSwitchCount: 0,
          timeSpentSeconds: 120,
        }),
      });

      const res = await submitLearningAssessment(req);
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.success).toBe(true);
      expect(data.isPassed).toBe(true);
      expect(data.percentage).toBe(100);
      expect(data.pointsAwarded).toBe(30);
      expect(data.domainScoreIncremented).toBe(2);

      // Nghiệm thu: Tiến độ được đánh dấu hoàn thành
      expect(mockProgressUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: userId,
          module_id: moduleId,
          is_completed: true,
          points_awarded: 30,
        }),
        expect.anything()
      );

      // Nghiệm thu: Profiles được cộng thêm 30 PTS (50 -> 80)
      expect(mockProfileUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ points: 80 }),
      );

      // Nghiệm thu: Snapshot được tăng lũy tiến 2% điểm miền 04 (50 -> 52)
      expect(mockSnapshotInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          domain_scores: expect.objectContaining({ '04': 52 }),
          snapshot_trigger: 'MODULE_COMPLETED',
        })
      );
    });

    it('chấm điểm chưa đạt (< 100%): không đánh dấu hoàn thành, kích hoạt giải thích chi tiết', async () => {
      vi.mocked(createClient).mockResolvedValueOnce({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId } }, error: null }) },
      } as any);

      const mockProgressUpsert = vi.fn();
      const mockProfileUpdate = vi.fn();

      vi.mocked(createAdminClient).mockReturnValueOnce({
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'learning_modules') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      id: moduleId,
                      title: 'Bảo mật thông tin cá nhân',
                      domain_code: '04',
                      skill_code: '4.1',
                      point_reward: 30,
                      duration_minutes: 15,
                      assessment_id: assessmentId,
                      assessments: { id: assessmentId, passing_score: 100 },
                    },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === 'assessment_submissions') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
                    }),
                  }),
                }),
              }),
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: { id: 'sub-fail' }, error: null }),
                }),
              }),
            };
          }
          if (table === 'assessment_items') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({ data: mockItems, error: null }),
                }),
              }),
            };
          }
          if (table === 'user_learning_progress') {
            return { upsert: mockProgressUpsert };
          }
          if (table === 'profiles') {
            return { update: mockProfileUpdate };
          }
          return {};
        }),
      } as any);

      const req = new NextRequest('http://localhost:3000/api/personal/learning-path/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId,
          answers: {
            [item1Id]: opt1Correct, // Đúng
            [item2Id]: opt2Wrong,   // Sai
          },
          tabSwitchCount: 1,
          timeSpentSeconds: 90,
        }),
      });

      const res = await submitLearningAssessment(req);
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.success).toBe(true);
      expect(data.isPassed).toBe(false);
      expect(data.percentage).toBe(50);
      expect(data.pointsAwarded).toBe(0);

      // Nghiệm thu: KHÔNG cập nhật tiến độ hoàn thành và KHÔNG cộng điểm thưởng
      expect(mockProgressUpsert).not.toHaveBeenCalled();
      expect(mockProfileUpdate).not.toHaveBeenCalled();

      // Nghiệm thu: Trả về lời giải chi tiết cho câu sai để ôn tập
      expect(data.breakdown).toHaveLength(2);
      expect(data.breakdown[1].isCorrect).toBe(false);
      expect(data.breakdown[1].explanation).toBe('Không bao giờ chia sẻ mật khẩu.');
    });

    it('chặn nộp bài khi đang trong thời gian cooldown sau lần thi hỏng gần nhất', async () => {
      vi.mocked(createClient).mockResolvedValueOnce({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId } }, error: null }) },
      } as any);

      // Vừa thi trượt cách đây 5 phút (cooldown quy định 15 phút)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

      vi.mocked(createAdminClient).mockReturnValueOnce({
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'learning_modules') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      id: moduleId,
                      assessment_id: assessmentId,
                      assessments: { id: assessmentId, passing_score: 100 },
                    },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === 'assessment_submissions') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                      limit: vi.fn().mockResolvedValue({
                        data: [{ id: 'old-sub', is_passed: false, submitted_at: fiveMinutesAgo }],
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
      } as any);

      const req = new NextRequest('http://localhost:3000/api/personal/learning-path/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId,
          answers: { [item1Id]: opt1Correct },
          tabSwitchCount: 0,
          timeSpentSeconds: 30,
        }),
      });

      const res = await submitLearningAssessment(req);
      expect(res.status).toBe(429);
      const data = await res.json();
      expect(data.error).toContain('chờ thêm');
      expect(data.cooldownRemainingSeconds).toBeGreaterThan(0);
    });
  });
});
