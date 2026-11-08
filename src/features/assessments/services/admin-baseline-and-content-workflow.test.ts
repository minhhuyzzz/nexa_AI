import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getAssessmentsList } from '@/app/api/assessments/route';
import { GET as getSingleAssessment } from '@/app/api/assessments/[id]/route';
import { POST as submitAssessment } from '@/app/api/assessments/[id]/submit/route';
import { POST as createAssessmentItem, DELETE as clearAssessmentItems } from '@/app/api/admin/assessments/[id]/items/route';
import { PUT as updateAssessmentItem, DELETE as deleteAssessmentItem } from '@/app/api/admin/assessments/[id]/items/[itemId]/route';
import { PUT as updateAssessment } from '@/app/api/admin/assessments/[id]/route';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

vi.mock('@/lib/auth/admin-guard', () => ({
  requirePlatformAdmin: vi.fn().mockResolvedValue({
    isAuthorized: true,
    user: { id: 'admin-user-0000-0000-000000000001', email: 'admin@nexa.ai', adminRole: 'SUPER_ADMIN' },
  }),
}));

vi.mock('@/lib/audit/admin-audit.service', () => ({
  recordAdminAudit: vi.fn().mockResolvedValue(true),
}));

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

function createMockSupabase() {
  const defaultItem = {
    id: 'item-new-001',
    prompt: 'Nội dung câu hỏi mẫu',
    points: 4,
    type: 'MCQ',
    order_index: 1,
  };

  const defaultAssessment = {
    id: 'a0000000-0000-0000-0000-000000000001',
    title: 'Đánh Giá Năng Lực Số Chuẩn 5 Miền (Khảo Thí Đầu Vào)',
    is_published: true,
    is_vip: false,
    duration_minutes: 45,
    passing_score: 70,
    organization_id: null,
  };

  const createChain = (resolveValue: any = { data: null, error: null }) => {
    const chain: any = {
      select: vi.fn(() => chain),
      insert: vi.fn(() => chain),
      update: vi.fn(() => chain),
      delete: vi.fn(() => chain),
      eq: vi.fn(() => chain),
      in: vi.fn(() => chain),
      is: vi.fn(() => chain),
      or: vi.fn(() => chain),
      order: vi.fn(() => chain),
      limit: vi.fn(() => chain),
      single: vi.fn().mockResolvedValue(resolveValue),
      maybeSingle: vi.fn().mockResolvedValue(resolveValue),
      then: (fn: any) => Promise.resolve(resolveValue).then(fn),
    };
    return chain;
  };

  const mockClient = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'learner-user-0000-0000-000000000002' } },
        error: null,
      }),
    },
    from: vi.fn((table: string) => {
      if (table === 'assessments') {
        return createChain({ data: defaultAssessment, error: null });
      }
      if (table === 'assessment_items') {
        return createChain({ data: defaultItem, error: null });
      }
      if (table === 'item_options') {
        return createChain({ data: [{ id: 'opt-1' }], error: null });
      }
      if (table === 'assessment_submissions') {
        return createChain({ data: null, count: 0, error: null });
      }
      return createChain({ data: null, error: null });
    }),
    rpc: vi.fn().mockResolvedValue({
      data: {
        assessment: defaultAssessment,
        items: [
          {
            id: 'item-01',
            prompt: 'Khi cần tìm tài liệu học thuật đáng tin cậy, công cụ nào phù hợp nhất?',
            type: 'MCQ',
            options: [
              { id: 'opt-1', content: 'TikTok' },
              { id: 'opt-2', content: 'Google Scholar' },
            ],
          },
        ],
      },
      error: null,
    }),
  };

  return mockClient;
}

describe('Admin Baseline & Content Bank Workflow (E2E Verification)', () => {
  const baselineAssessmentId = 'a0000000-0000-0000-0000-000000000001';
  const canonicalExam120Id = 'a0000000-0000-0000-0000-000000000002';
  const mockCompetencyId = 'c0000000-0000-0000-0000-000000000001';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // 1. Khảo Thí Đầu Vào (/admin/baseline -> /personal/take/baseline)
  // ==========================================================================
  describe('Khảo Thí Đầu Vào (/admin/baseline) CRUD & Phản ánh sang Personal', () => {
    it('cho phép Admin thêm câu hỏi trắc nghiệm mới vào bài đầu vào (không cần nhập điểm số)', async () => {
      const mockClient = createMockSupabase();
      vi.mocked(createClient).mockResolvedValue(mockClient as any);
      vi.mocked(createAdminClient).mockReturnValue(mockClient as any);

      const body = {
        prompt: 'Khi cần tìm tài liệu học thuật đáng tin cậy, công cụ nào sau đây là phù hợp nhất?',
        type: 'MCQ',
        competency_id: mockCompetencyId,
        options: [
          { content: 'TikTok', is_correct: false },
          { content: 'Google Scholar', is_correct: true },
        ],
      };

      const req = new NextRequest(`http://localhost:3000/api/admin/assessments/${baselineAssessmentId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const res = await createAssessmentItem(req, { params: Promise.resolve({ id: baselineAssessmentId }) });
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.item.id).toBe('item-new-001');
    });

    it('cho phép Admin chỉnh sửa nội dung và đáp án đúng của câu hỏi', async () => {
      const mockClient = createMockSupabase();
      vi.mocked(createClient).mockResolvedValue(mockClient as any);
      vi.mocked(createAdminClient).mockReturnValue(mockClient as any);

      const updateBody = {
        prompt: 'Đã cập nhật câu hỏi số 1: Công cụ học thuật?',
        competency_id: mockCompetencyId,
        options: [
          { content: 'Phương án A mới', is_correct: true },
          { content: 'Phương án B mới', is_correct: false },
        ],
      };

      const req = new NextRequest(`http://localhost:3000/api/admin/assessments/${baselineAssessmentId}/items/item-001`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateBody),
      });

      const res = await updateAssessmentItem(req, {
        params: Promise.resolve({ id: baselineAssessmentId, itemId: 'item-001' }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.item).toBeDefined();
    });

    it('cho phép Admin xóa một câu hỏi khỏi bài khảo thí', async () => {
      const mockClient = createMockSupabase();
      vi.mocked(createClient).mockResolvedValue(mockClient as any);
      vi.mocked(createAdminClient).mockReturnValue(mockClient as any);

      const req = new NextRequest(`http://localhost:3000/api/admin/assessments/${baselineAssessmentId}/items/item-001`, {
        method: 'DELETE',
      });

      const res = await deleteAssessmentItem(req, {
        params: Promise.resolve({ id: baselineAssessmentId, itemId: 'item-001' }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });

    it('cho phép Admin xóa trắng (reset) toàn bộ câu hỏi của bài khảo thí đầu vào', async () => {
      const mockClient = createMockSupabase();
      vi.mocked(createClient).mockResolvedValue(mockClient as any);
      vi.mocked(createAdminClient).mockReturnValue(mockClient as any);

      const req = new NextRequest(`http://localhost:3000/api/admin/assessments/${baselineAssessmentId}/items`, {
        method: 'DELETE',
      });

      const res = await clearAssessmentItems(req, {
        params: Promise.resolve({ id: baselineAssessmentId }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });

    it('thí sinh truy cập /personal/take/baseline nhận đúng dữ liệu và KHÔNG bị rò rỉ đáp án đúng (Zero Leak)', async () => {
      const mockClient = createMockSupabase();
      vi.mocked(createClient).mockResolvedValue(mockClient as any);

      const req = new NextRequest(`http://localhost:3000/api/assessments/baseline`);
      const res = await getSingleAssessment(req, { params: Promise.resolve({ id: 'baseline' }) });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.assessment.id).toBe(baselineAssessmentId);
      expect(data.items).toHaveLength(1);
      expect(data.items[0].prompt).toBe('Khi cần tìm tài liệu học thuật đáng tin cậy, công cụ nào phù hợp nhất?');

      // BẢO MẬT KHẢO THÍ: Không bao giờ trả về is_correct hay explanation cho thí sinh
      const options = data.items[0].options;
      options.forEach((opt: any) => {
        expect(opt.is_correct).toBeUndefined();
        expect(opt.explanation).toBeUndefined();
      });
    });
  });

  // ==========================================================================
  // 2. Ngân Hàng Đề Chuẩn (/admin/content -> /personal/assessments)
  // ==========================================================================
  describe('Ngân Hàng Đề Chuẩn (/admin/content) & Đồng Bộ Trạng Thái Phát Hành', () => {
    it('khi bài thi được phát hành (is_published = true), xuất hiện trên kho bài thi Personal', async () => {
      const mockClient = createMockSupabase();
      mockClient.from = vi.fn((table: string) => {
        if (table === 'assessments') {
          const chain: any = {
            select: vi.fn(() => chain),
            eq: vi.fn(() => chain),
            is: vi.fn(() => chain),
            order: vi.fn().mockResolvedValue({
              data: [
                {
                  id: canonicalExam120Id,
                  title: 'Khảo Thí Đánh Giá Năng Lực Số Toàn Diện 5 Miền (Bộ Chuẩn 120 Câu)',
                  is_published: true,
                  is_vip: true,
                  access_tier: 'VIP',
                  visibility: 'PUBLIC',
                  organization_id: null,
                  assessment_items: [{ id: 'q1', type: 'MCQ' }],
                },
              ],
              error: null,
            }),
          };
          return chain;
        }
        return mockClient.from(table);
      });

      vi.mocked(createClient).mockResolvedValue(mockClient as any);

      const res = await getAssessmentsList();
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.assessments).toHaveLength(1);
      expect(data.assessments[0].id).toBe(canonicalExam120Id);
      expect(data.assessments[0].title).toContain('120 Câu');
    });

    it('khi Admin chuyển bài thi về Bản nháp (is_published = false), bài thi bị ẩn khỏi học viên Personal', async () => {
      const mockClient = createMockSupabase();
      mockClient.from = vi.fn((table: string) => {
        if (table === 'assessments') {
          const chain: any = {
            select: vi.fn(() => chain),
            eq: vi.fn(() => chain),
            is: vi.fn(() => chain),
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          };
          return chain;
        }
        return mockClient.from(table);
      });

      vi.mocked(createClient).mockResolvedValue(mockClient as any);

      const res = await getAssessmentsList();
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.assessments).toHaveLength(0);
    });

    it('bài khảo thí đầu vào tuyệt đối không hiển thị lẫn trong danh sách đề thi tự do của học viên Personal', async () => {
      const mockClient = createMockSupabase();
      mockClient.from = vi.fn((table: string) => {
        if (table === 'assessments') {
          const chain: any = {
            select: vi.fn(() => chain),
            eq: vi.fn(() => chain),
            is: vi.fn(() => chain),
            order: vi.fn().mockResolvedValue({
              data: [
                {
                  id: baselineAssessmentId,
                  title: 'Đánh Giá Năng Lực Số Chuẩn 5 Miền (Khảo Thí Đầu Vào)',
                  is_published: true,
                  is_system_baseline: true,
                  organization_id: null,
                  assessment_items: [{ id: 'q1', type: 'MCQ' }],
                },
                {
                  id: canonicalExam120Id,
                  title: 'Khảo Thí Đánh Giá Năng Lực Số Toàn Diện 5 Miền (Bộ Chuẩn 120 Câu)',
                  is_published: true,
                  is_system_baseline: false,
                  organization_id: null,
                  assessment_items: [{ id: 'q2', type: 'MCQ' }],
                },
              ],
              error: null,
            }),
          };
          return chain;
        }
        return mockClient.from(table);
      });

      vi.mocked(createClient).mockResolvedValue(mockClient as any);

      const res = await getAssessmentsList();
      expect(res.status).toBe(200);
      const data = await res.json();

      // Chỉ bài 120 câu được hiển thị; bài đầu vào bị lọc bỏ hoàn toàn
      expect(data.assessments).toHaveLength(1);
      expect(data.assessments[0].id).toBe(canonicalExam120Id);
      const ids = data.assessments.map((d: any) => d.id);
      expect(ids).not.toContain(baselineAssessmentId);
    });

    it('cho phép Admin cập nhật thông số đề thi qua Modal Cài đặt (Exam Settings)', async () => {
      const mockClient = createMockSupabase();
      vi.mocked(createClient).mockResolvedValue(mockClient as any);
      vi.mocked(createAdminClient).mockReturnValue(mockClient as any);

      const settingsUpdate = {
        title: 'Đề Chuẩn 120 Câu - Đã Cập Nhật',
        description: 'Mô tả mục tiêu mới',
        duration_minutes: 100,
        passing_score: 75,
        is_vip: true,
        access_tier: 'VIP',
        is_published: true,
      };

      const req = new NextRequest(`http://localhost:3000/api/admin/assessments/${canonicalExam120Id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsUpdate),
      });

      const res = await updateAssessment(req, { params: Promise.resolve({ id: canonicalExam120Id }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.assessment).toBeDefined();
    });

    it('thí sinh đã hoàn thành khảo thí đầu vào thì nhận alreadyCompleted: true (quy tắc 1 lần duy nhất)', async () => {
      const mockClient = createMockSupabase();
      // Giả lập thí sinh đã có bản ghi nộp bài khảo thí đầu vào trước đó
      mockClient.from = vi.fn((table: string) => {
        if (table === 'assessments') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                or: vi.fn(() => ({
                  limit: vi.fn(() => ({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: {
                        id: baselineAssessmentId,
                        title: 'Đánh Giá Năng Lực Số Chuẩn 5 Miền (Khảo Thí Đầu Vào)',
                        is_published: true,
                        is_system_baseline: true,
                      },
                      error: null,
                    }),
                  })),
                })),
              })),
            })),
          };
        }
        if (table === 'assessment_submissions') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                in: vi.fn(() => ({
                  or: vi.fn(() => ({
                    order: vi.fn(() => ({
                      limit: vi.fn(() => ({
                        maybeSingle: vi.fn().mockResolvedValue({
                          data: {
                            id: 'sub-completed-001',
                            status: 'EVALUATED',
                            submitted_at: '2026-11-07T10:00:00Z',
                            percentage: 76.5,
                          },
                          error: null,
                        }),
                      })),
                    })),
                  })),
                })),
              })),
            })),
          };
        }
        return (createMockSupabase() as any).from(table);
      });

      vi.mocked(createClient).mockResolvedValue(mockClient as any);

      const req = new NextRequest('http://localhost:3000/api/assessments/baseline');
      const res = await getSingleAssessment(req, { params: Promise.resolve({ id: 'baseline' }) });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.alreadyCompleted).toBe(true);
      expect(data.submissionId).toBe('sub-completed-001');
      expect(data.message).toContain('Mỗi tài khoản chỉ làm bài khảo sát ban đầu 1 lần');
    });

    it('POST submit chặn nộp lại nếu thí sinh đã có kết quả khảo thí đầu vào trước đó', async () => {
      const mockClient = createMockSupabase();
      mockClient.from = vi.fn((table: string) => {
        if (table === 'assessments') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: baselineAssessmentId,
                    title: 'Khảo Thí Đầu Vào',
                    is_system_baseline: true,
                    passing_score: 70,
                    point_reward: 0,
                  },
                  error: null,
                }),
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    id: baselineAssessmentId,
                    title: 'Khảo Thí Đầu Vào',
                    is_system_baseline: true,
                    passing_score: 70,
                    point_reward: 0,
                  },
                  error: null,
                }),
              })),
            })),
          };
        }
        if (table === 'assessment_submissions') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                or: vi.fn(() => ({
                  in: vi.fn(() => ({
                    limit: vi.fn(() => ({
                      maybeSingle: vi.fn().mockResolvedValue({
                        data: {
                          id: 'sub-existing-001',
                          status: 'EVALUATED',
                        },
                        error: null,
                      }),
                    })),
                  })),
                })),
              })),
            })),
          };
        }
        return (createMockSupabase() as any).from(table);
      });

      vi.mocked(createClient).mockResolvedValue(mockClient as any);
      vi.mocked(createAdminClient).mockReturnValue(mockClient as any);

      const req = new NextRequest(`http://localhost:3000/api/assessments/${baselineAssessmentId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: [] }),
      });

      const res = await submitAssessment(req, { params: Promise.resolve({ id: baselineAssessmentId }) });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.code).toBe('BASELINE_ALREADY_COMPLETED');
    });
  });
});
