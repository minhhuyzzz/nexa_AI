import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';
import { GET } from './route';

vi.mock('@/lib/auth/admin-guard', () => ({
  requirePlatformAdmin: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

import { requirePlatformAdmin } from '@/lib/auth/admin-guard';
import { createAdminClient } from '@/lib/supabase/admin';

describe('GET /api/admin/assessments/[id]/survey-export', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('từ chối 401 khi không phải Platform Admin', async () => {
    vi.mocked(requirePlatformAdmin).mockResolvedValueOnce({
      isAuthorized: false,
      errorResponse: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    });

    const res = await GET({} as Request, { params: Promise.resolve({ id: 'asm-123' }) });
    expect(res.status).toBe(401);
  });

  it('trả về 404 khi không tìm thấy bài khảo thí', async () => {
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

    const res = await GET({} as Request, { params: Promise.resolve({ id: 'non-existent' }) });
    expect(res.status).toBe(404);
  });

  it('trả về 200 và dữ liệu phân tích khảo sát đầy đủ khi hợp lệ', async () => {
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
                  data: {
                    id: 'asm-123',
                    title: 'Khảo sát Năng Lực Số',
                    description: 'Khảo thí đầu vào',
                    duration_minutes: 45,
                    passing_score: 70,
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'assessment_items') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: [
                    {
                      id: 'item-1',
                      prompt: 'Câu hỏi về dữ liệu?',
                      points: 1,
                      order_index: 1,
                      competencies: {
                        skill_code: '1.1',
                        competency_domains: { code: '01', title: 'Thông tin và dữ liệu' },
                      },
                      item_options: [
                        { id: 'opt-1', content: 'Đáp án A đúng', is_correct: true, order_index: 0 },
                        { id: 'opt-2', content: 'Đáp án B sai', is_correct: false, order_index: 1 },
                      ],
                    },
                  ],
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
                  order: vi.fn().mockResolvedValue({
                    data: [
                      {
                        id: 'sub-1',
                        user_id: 'user-1',
                        score: 1,
                        percentage: 100,
                        time_spent_seconds: 120,
                        submitted_at: '2026-11-22T10:00:00Z',
                        profiles: { full_name: 'Nguyễn Văn A', email: 'a@test.com' },
                      },
                    ],
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'submission_answers') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [
                  {
                    submission_id: 'sub-1',
                    item_id: 'item-1',
                    selected_option_id: 'opt-1',
                    is_correct: true,
                    score_awarded: 1,
                  },
                ],
                error: null,
              }),
            }),
          };
        }
        return {};
      }),
    };
    vi.mocked(createAdminClient).mockReturnValue(mockAdminSupabase as any);

    const res = await GET({} as Request, { params: Promise.resolve({ id: 'asm-123' }) });
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.participants).toHaveLength(1);
    expect(json.participants[0].fullName).toBe('Nguyễn Văn A');
    expect(json.participants[0].totalScorePercent).toBe(100);
    expect(json.questionAnalytics).toHaveLength(1);
    expect(json.questionAnalytics[0].correctRate).toBe(100);
    expect(json.questionAnalytics[0].optionStats[0].count).toBe(1);
  });
});
