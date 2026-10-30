import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as createCampaign } from '@/app/api/organizations/[orgId]/campaigns/route';
import { POST as submitGrade } from '@/app/api/organizations/[orgId]/grading/route';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

describe('Assessment Campaigns & Org Grading Lifecycle (DEC-07, HITL)', () => {
  const orgId = '11111111-1111-1111-1111-111111111111';
  const assessorUserId = '22222222-2222-2222-2222-222222222222';
  const assessmentId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const classId1 = 'cccccccc-1111-1111-1111-111111111111';
  const classId2 = 'cccccccc-2222-2222-2222-222222222222';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('tạo đợt đánh giá tự động khóa phiên bản đề thi và giao bài cho các lớp', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: assessorUserId, email: 'assessor@org.com' } },
          error: null,
        }),
      },
    } as any);

    const mockAssessmentUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    const mockCampaignInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'camp-123',
            title: 'Khảo thí Giữa kỳ K24',
            organization_id: orgId,
            assessment_id: assessmentId,
            status: 'ACTIVE',
          },
          error: null,
        }),
      }),
    });

    const mockAssignmentUpsert = vi.fn().mockResolvedValue({ error: null });

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { role: 'LEARNER' } }),
              }),
            }),
          };
        }
        if (table === 'user_organizations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: { org_role: 'ASSESSOR', status: 'ACTIVE' },
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'assessments') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: assessmentId, title: 'Đề Chuẩn DigComp 2.2', is_published: true },
                  error: null,
                }),
              }),
            }),
            update: mockAssessmentUpdate,
          };
        }
        if (table === 'assessment_campaigns') {
          return { insert: mockCampaignInsert };
        }
        if (table === 'class_assignments') {
          return { upsert: mockAssignmentUpsert };
        }
        return {};
      }),
    } as any);

    const req = new NextRequest(`http://localhost:3000/api/organizations/${orgId}/campaigns`, {
      method: 'POST',
      body: JSON.stringify({
        title: 'Khảo thí Giữa kỳ K24',
        assessmentId,
        classIds: [classId1, classId2],
        passingScore: 70,
      }),
    });

    const res = await createCampaign(req, { params: Promise.resolve({ orgId }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);

    // Verify assessment version was locked
    expect(mockAssessmentUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        is_locked: true,
        status: 'PUBLISHED',
      })
    );

    // Verify class assignments were created for both classes
    expect(mockAssignmentUpsert).toHaveBeenCalledTimes(2);
  });

  it('giảng viên phê duyệt điểm: cập nhật trạng thái EVALUATED và tính chuẩn đạt', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: assessorUserId, email: 'assessor@org.com' } },
          error: null,
        }),
      },
    } as any);

    const mockSubUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'sub-1',
              status: 'EVALUATED',
              total_score: 85,
              percentage: 85.0,
              is_passed: true,
            },
            error: null,
          }),
        }),
      }),
    });

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { role: 'LEARNER' } }),
              }),
            }),
          };
        }
        if (table === 'user_organizations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: { org_role: 'ASSESSOR', status: 'ACTIVE' },
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'assessment_submissions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'sub-1',
                    max_score: 100,
                    assessments: { organization_id: orgId, passing_score: 70 },
                  },
                  error: null,
                }),
              }),
            }),
            update: mockSubUpdate,
          };
        }
        return {};
      }),
    } as any);

    const req = new NextRequest(`http://localhost:3000/api/organizations/${orgId}/grading`, {
      method: 'POST',
      body: JSON.stringify({
        submissionId: '55555555-5555-5555-5555-555555555555',
        totalScore: 85,
      }),
    });

    const res = await submitGrade(req, { params: Promise.resolve({ orgId }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(mockSubUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        total_score: 85,
        percentage: 85,
        is_passed: true,
        status: 'EVALUATED',
      })
    );
  });
});
