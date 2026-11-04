import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Handlers under test for Phase 3: Org & Class Collaboration
import { GET as previewClassCode } from '@/app/api/classes/preview/route';
import { POST as joinClass } from '@/app/api/classes/join/route';
import { GET as getClassDetail } from '@/app/api/classes/[id]/route';
import { GET as previewOrgJoinCode, POST as joinOrgByCode } from '@/app/api/join/org/[joinCode]/route';
import { POST as acceptOrgInvite } from '@/app/api/organizations/accept-invite/route';
import { GET as getOrganizationWork } from '@/app/api/personal/organization-work/route';
import { POST as submitAssessment } from '@/app/api/assessments/[id]/submit/route';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

vi.mock('@/lib/auth/getEffectiveUser', () => ({
  getEffectiveUser: vi.fn(),
}));

vi.mock('@/features/gamification/services/point-ledger.service', () => ({
  PointLedgerService: {
    grantPoints: vi.fn().mockResolvedValue({ success: true, points: 10 }),
  },
}));

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getEffectiveUser } from '@/lib/auth/getEffectiveUser';

describe('Personal User Phase 3: Org & Class Collaboration (UC-P10, UC-P11, UC-P12)', () => {
  const learnerId = '11111111-2222-3333-4444-555555555555';
  const otherUserId = '99999999-8888-7777-6666-555555555555';
  const personalClassId = 'aaaaaaaa-1111-2222-3333-444444444444';
  const orgClassId = 'bbbbbbbb-1111-2222-3333-444444444444';
  const orgId = 'cccccccc-1111-2222-3333-444444444444';
  const assignmentId = 'dddddddd-1111-2222-3333-444444444444';
  const assessmentId = 'eeeeeeee-1111-2222-3333-444444444444';
  const itemId = 'ffffffff-1111-2222-3333-444444444444';
  const optionId = '12345678-1111-2222-3333-444444444444';

  const mockLearnerUser = {
    id: learnerId,
    email: 'learner@nexa.edu.vn',
    role: 'LEARNER' as const,
    active_workspace: { type: 'PERSONAL' as const },
    organizations: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // UC-P10: Tham gia lớp hoặc nhóm
  // =========================================================================
  describe('UC-P10: Tham gia lớp hoặc nhóm', () => {
    describe('Tra cứu mã nhóm lớp (GET /api/classes/preview)', () => {
      it('chặn 401 khi chưa đăng nhập', async () => {
        vi.mocked(createClient).mockResolvedValue({} as any);
        vi.mocked(getEffectiveUser).mockResolvedValue(null);

        const req = new NextRequest('http://localhost:3000/api/classes/preview?code=CLS-1234');
        const res = await previewClassCode(req);
        expect(res.status).toBe(401);
      });

      it('chặn 400 khi mã nhóm lớp không hợp lệ hoặc để trống', async () => {
        vi.mocked(createClient).mockResolvedValue({} as any);
        vi.mocked(getEffectiveUser).mockResolvedValue(mockLearnerUser as any);

        const req = new NextRequest('http://localhost:3000/api/classes/preview?code=A');
        const res = await previewClassCode(req);
        expect(res.status).toBe(400);
      });

      it('trả về 404 khi không tìm thấy nhóm cá nhân', async () => {
        vi.mocked(createClient).mockResolvedValue({} as any);
        vi.mocked(getEffectiveUser).mockResolvedValue(mockLearnerUser as any);

        vi.mocked(createAdminClient).mockReturnValue({
          from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              ilike: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: null, error: new Error('Not found') }),
                }),
              }),
            }),
          }),
        } as any);

        const req = new NextRequest('http://localhost:3000/api/classes/preview?code=NOTFOUND');
        const res = await previewClassCode(req);
        expect(res.status).toBe(404);
        const data = await res.json();
        expect(data.error).toContain('Không tìm thấy lớp học hoặc nhóm');
      });

      it('trả về thông tin nhóm lớp hợp lệ kèm số lượng thành viên và trạng thái', async () => {
        vi.mocked(createClient).mockResolvedValue({} as any);
        vi.mocked(getEffectiveUser).mockResolvedValue(mockLearnerUser as any);

        const mockClass = {
          id: personalClassId,
          name: 'Nhóm Tự Học AI DigComp',
          class_code: 'CLS-9999',
          description: 'Cùng nhau rèn luyện 5 miền năng lực số',
          evaluator_id: otherUserId,
          created_at: '2026-02-01T00:00:00Z',
          organization_id: null,
          profiles: { nickname: 'Mentor Nam', avatar_url: null },
        };

        vi.mocked(createAdminClient).mockReturnValue({
          from: vi.fn((table: string) => {
            if (table === 'evaluator_classes') {
              return {
                select: vi.fn().mockReturnValue({
                  ilike: vi.fn().mockReturnValue({
                    is: vi.fn().mockReturnValue({
                      single: vi.fn().mockResolvedValue({ data: mockClass, error: null }),
                    }),
                  }),
                }),
              };
            }
            if (table === 'class_members') {
              return {
                select: vi.fn((_cols: string, opts?: { count?: string; head?: boolean }) => {
                  if (opts?.head) {
                    return {
                      eq: vi.fn().mockResolvedValue({ count: 12, error: null }),
                    };
                  }
                  return {
                    eq: vi.fn().mockReturnValue({
                      eq: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({ data: null, error: null }),
                      }),
                    }),
                  };
                }),
              };
            }
            return { select: vi.fn().mockReturnThis() };
          }),
        } as any);

        const req = new NextRequest('http://localhost:3000/api/classes/preview?code=cls-9999');
        const res = await previewClassCode(req);
        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.class.id).toBe(personalClassId);
        expect(data.class.name).toBe('Nhóm Tự Học AI DigComp');
        expect(data.class.code).toBe('CLS-9999');
        expect(data.class.evaluatorName).toBe('Mentor Nam');
        expect(data.class.memberCount).toBe(12);
        expect(data.class.isOwner).toBe(false);
        expect(data.class.isMember).toBe(false);
      });
    });

    describe('Gia nhập nhóm lớp qua mã (POST /api/classes/join)', () => {
      it('chặn 401 khi chưa đăng nhập', async () => {
        vi.mocked(createClient).mockResolvedValue({} as any);
        vi.mocked(getEffectiveUser).mockResolvedValue(null);

        const req = new NextRequest('http://localhost:3000/api/classes/join', {
          method: 'POST',
          body: JSON.stringify({ classCode: 'CLS-1234' }),
        });
        const res = await joinClass(req);
        expect(res.status).toBe(401);
      });

      it('trả về 404 khi mã lớp không tồn tại', async () => {
        vi.mocked(createClient).mockResolvedValue({
          from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              ilike: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: new Error('Not found') }),
              }),
            }),
          }),
        } as any);
        vi.mocked(getEffectiveUser).mockResolvedValue(mockLearnerUser as any);

        const req = new NextRequest('http://localhost:3000/api/classes/join', {
          method: 'POST',
          body: JSON.stringify({ classCode: 'UNKNOWN-99' }),
        });
        const res = await joinClass(req);
        expect(res.status).toBe(404);
      });

      it('xử lý thành công và thêm người dùng vào class_members (HTTP 201)', async () => {
        const mockInsert = vi.fn().mockResolvedValue({ error: null });

        vi.mocked(createClient).mockResolvedValue({
          from: vi.fn((table: string) => {
            if (table === 'evaluator_classes') {
              return {
                select: vi.fn().mockReturnValue({
                  ilike: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: { id: personalClassId, name: 'Lớp Luyện Thi', class_code: 'CLS-9999', evaluator_id: otherUserId },
                      error: null,
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
                      single: vi.fn().mockResolvedValue({ data: null, error: null }), // Chưa là thành viên
                    }),
                  }),
                }),
                insert: mockInsert,
              };
            }
            return { select: vi.fn().mockReturnThis() };
          }),
        } as any);
        vi.mocked(getEffectiveUser).mockResolvedValue(mockLearnerUser as any);

        const req = new NextRequest('http://localhost:3000/api/classes/join', {
          method: 'POST',
          body: JSON.stringify({ classCode: 'CLS-9999' }),
        });
        const res = await joinClass(req);
        expect(res.status).toBe(201);

        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.classId).toBe(personalClassId);
        expect(mockInsert).toHaveBeenCalledWith({
          class_id: personalClassId,
          user_id: learnerId,
        });
      });

      it('xử lý idempotent: thông báo đã là thành viên nếu người dùng đã tham gia trước đó', async () => {
        vi.mocked(createClient).mockResolvedValue({
          from: vi.fn((table: string) => {
            if (table === 'evaluator_classes') {
              return {
                select: vi.fn().mockReturnValue({
                  ilike: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: { id: personalClassId, name: 'Lớp Luyện Thi', class_code: 'CLS-9999', evaluator_id: otherUserId },
                      error: null,
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
                      single: vi.fn().mockResolvedValue({ data: { id: 'mem-1' }, error: null }), // Đã là thành viên
                    }),
                  }),
                }),
              };
            }
            return { select: vi.fn().mockReturnThis() };
          }),
        } as any);
        vi.mocked(getEffectiveUser).mockResolvedValue(mockLearnerUser as any);

        const req = new NextRequest('http://localhost:3000/api/classes/join', {
          method: 'POST',
          body: JSON.stringify({ classCode: 'CLS-9999' }),
        });
        const res = await joinClass(req);
        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.message).toContain('đã là thành viên');
      });
    });

    describe('Kiểm tra quyền truy cập chi tiết lớp (GET /api/classes/[id])', () => {
      it('chặn 403 khi người dùng không phải thành viên lớp', async () => {
        vi.mocked(createClient).mockResolvedValue({
          from: vi.fn((table: string) => {
            if (table === 'evaluator_classes') {
              return {
                select: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: { id: personalClassId, evaluator_id: otherUserId },
                      error: null,
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
                      single: vi.fn().mockResolvedValue({ data: null, error: null }),
                    }),
                  }),
                }),
              };
            }
            return { select: vi.fn().mockReturnThis() };
          }),
        } as any);
        vi.mocked(getEffectiveUser).mockResolvedValue(mockLearnerUser as any);

        const res = await getClassDetail(new Request('http://localhost:3000/api/classes/' + personalClassId), {
          params: Promise.resolve({ id: personalClassId }),
        });
        expect(res.status).toBe(403);
        const data = await res.json();
        expect(data.error).toBe('Bạn không thuộc nhóm này');
      });

      it('cho phép thành viên truy cập và bảo vệ quyền riêng tư (ẩn email của thành viên khác)', async () => {
        const mockClassData = {
          id: personalClassId,
          evaluator_id: otherUserId,
          name: 'Lớp Luyện Thi Chuẩn DigComp',
          class_code: 'CLS-9999',
          description: 'Mô tả lớp',
          created_at: '2026-02-01T00:00:00Z',
          class_members: [
            {
              id: 'm-1',
              user_id: learnerId,
              joined_at: '2026-02-02T00:00:00Z',
              profiles: { id: learnerId, nickname: 'Learner Me', email: 'learner@nexa.edu.vn', role: 'LEARNER' },
            },
            {
              id: 'm-2',
              user_id: otherUserId,
              joined_at: '2026-02-01T00:00:00Z',
              profiles: { id: otherUserId, nickname: 'Friend', email: 'secret@friend.com', role: 'LEARNER' },
            },
          ],
          class_assignments: [
            {
              id: assignmentId,
              assessment_id: assessmentId,
              deadline: '2026-03-01T23:59:59Z',
              created_at: '2026-02-01T00:00:00Z',
              assessments: { id: assessmentId, title: 'Bài tập 1: An toàn thông tin', duration_minutes: 45, passing_score: 70 },
            },
          ],
        };

        vi.mocked(createClient).mockResolvedValue({
          from: vi.fn((table: string) => {
            if (table === 'evaluator_classes') {
              return {
                select: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: mockClassData,
                      error: null,
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
                      single: vi.fn().mockResolvedValue({ data: { id: 'm-1' }, error: null }),
                    }),
                  }),
                }),
              };
            }
            if (table === 'assessment_submissions') {
              return {
                select: vi.fn().mockReturnValue({
                  in: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ data: [], error: null }),
                  }),
                }),
              };
            }
            if (table === 'profiles') {
              return {
                select: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({ data: { full_name: 'Giảng viên Nam', nickname: 'Nam' }, error: null }),
                  }),
                }),
              };
            }
            return { select: vi.fn().mockReturnThis() };
          }),
        } as any);
        vi.mocked(getEffectiveUser).mockResolvedValue(mockLearnerUser as any);

        const res = await getClassDetail(new Request('http://localhost:3000/api/classes/' + personalClassId), {
          params: Promise.resolve({ id: personalClassId }),
        });
        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data.group.id).toBe(personalClassId);
        expect(data.group.assignments).toHaveLength(1);
        expect(data.group.assignments[0].id).toBe(assignmentId);

        // Privacy check: Learner caller MUST NOT see other members' email addresses
        const otherMember = data.group.members.find((m: any) => m.user_id === otherUserId);
        expect(otherMember.profiles.email).toBeUndefined();
      });
    });
  });

  // =========================================================================
  // UC-P11: Tham gia tổ chức
  // =========================================================================
  describe('UC-P11: Tham gia tổ chức', () => {
    describe('Gia nhập tổ chức qua mã (POST /api/join/org/[joinCode])', () => {
      const joinCode = 'NX-TECH-CORP';

      it('chặn 401 khi chưa đăng nhập', async () => {
        vi.mocked(createClient).mockResolvedValue({
          auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
          },
        } as any);

        const req = new NextRequest(`http://localhost:3000/api/join/org/${joinCode}`, {
          method: 'POST',
          body: JSON.stringify({ fullName: 'Nguyen Van A' }),
        });
        const res = await joinOrgByCode(req, { params: Promise.resolve({ joinCode }) });
        expect(res.status).toBe(401);
      });

      it('chặn 400 khi mã tham gia đã hết hạn', async () => {
        vi.mocked(createClient).mockResolvedValue({
          auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: { id: learnerId } }, error: null }),
          },
        } as any);

        vi.mocked(createAdminClient).mockReturnValue({
          from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    id: 'code-expired',
                    code: joinCode,
                    organization_id: orgId,
                    max_uses: 100,
                    used_count: 5,
                    expires_at: new Date(Date.now() - 100000).toISOString(), // Đã hết hạn
                    is_revoked: false,
                    organizations: { id: orgId, name: 'Tech Corp', slug: 'tech-corp', status: 'ACTIVE', is_active: true },
                  },
                  error: null,
                }),
              }),
            }),
          }),
        } as any);

        const req = new NextRequest(`http://localhost:3000/api/join/org/${joinCode}`, {
          method: 'POST',
          body: JSON.stringify({ fullName: 'Nguyen Van A' }),
        });
        const res = await joinOrgByCode(req, { params: Promise.resolve({ joinCode }) });
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toContain('hết hạn');
      });

      it('gia nhập tổ chức thành công và ghi nhận vai trò MEMBER trong user_organizations', async () => {
        vi.mocked(createClient).mockResolvedValue({
          auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: { id: learnerId, email: 'learner@nexa.edu.vn' } }, error: null }),
          },
        } as any);

        const mockMemberRow = {
          id: 'uo-1',
          user_id: learnerId,
          organization_id: orgId,
          org_role: 'MEMBER',
          status: 'ACTIVE',
        };

        const mockUpsertUserOrg = vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockMemberRow, error: null }),
          }),
        });

        vi.mocked(createAdminClient).mockReturnValue({
          from: vi.fn((table: string) => {
            if (table === 'organization_join_codes') {
              return {
                select: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: {
                        id: 'code-valid',
                        code: joinCode,
                        organization_id: orgId,
                        max_uses: 100,
                        used_count: 5,
                        expires_at: new Date(Date.now() + 100000).toISOString(),
                        is_revoked: false,
                        organizations: { id: orgId, name: 'Tech Corp', slug: 'tech-corp', status: 'ACTIVE', is_active: true },
                      },
                      error: null,
                    }),
                  }),
                }),
                update: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ error: null }),
                }),
              };
            }
            if (table === 'user_organizations') {
              return {
                select: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }), // Chưa là thành viên
                    }),
                  }),
                }),
                upsert: mockUpsertUserOrg,
              };
            }
            if (table === 'profiles') {
              return {
                update: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    is: vi.fn().mockResolvedValue({ error: null }),
                  }),
                }),
              };
            }
            if (table === 'organization_membership_requests') {
              return {
                upsert: vi.fn().mockResolvedValue({ error: null }),
              };
            }
            return { select: vi.fn().mockReturnThis() };
          }),
        } as any);

        const req = new NextRequest(`http://localhost:3000/api/join/org/${joinCode}`, {
          method: 'POST',
          body: JSON.stringify({ fullName: 'Nguyen Van A' }),
        });
        const res = await joinOrgByCode(req, { params: Promise.resolve({ joinCode }) });
        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.member.status).toBe('ACTIVE');
        expect(data.organizationSlug).toBe('tech-corp');
      });
    });

    describe('Chấp nhận lời mời qua email (POST /api/organizations/accept-invite)', () => {
      const inviteToken = 'secure-token-abcdef123456';

      it('chặn 403 khi đăng nhập bằng email khác với email nhận lời mời', async () => {
        vi.mocked(createClient).mockResolvedValue({
          auth: {
            getUser: vi.fn().mockResolvedValue({
              data: { user: { id: learnerId, email: 'wrong-account@nexa.edu.vn' } },
              error: null,
            }),
          },
        } as any);

        vi.mocked(createAdminClient).mockReturnValue({
          from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'inv-1',
                    organization_id: orgId,
                    email: 'learner@nexa.edu.vn', // Lời mời gửi cho learner@nexa.edu.vn
                    org_role: 'MEMBER',
                    status: 'PENDING',
                    expires_at: new Date(Date.now() + 100000).toISOString(),
                  },
                  error: null,
                }),
              }),
            }),
          }),
        } as any);

        const req = new NextRequest('http://localhost:3000/api/organizations/accept-invite', {
          method: 'POST',
          body: JSON.stringify({ token: inviteToken }),
        });
        const res = await acceptOrgInvite(req);
        expect(res.status).toBe(403);
        const data = await res.json();
        expect(data.error).toContain('được gửi cho địa chỉ email learner@nexa.edu.vn');
      });
    });
  });

  // =========================================================================
  // UC-P12: Tiếp nhận và thực hiện bài đánh giá được giao
  // =========================================================================
  describe('UC-P12: Tiếp nhận và thực hiện bài đánh giá được giao', () => {
    it('hiển thị danh sách công việc & bài đánh giá từ tổ chức chưa làm (GET /api/personal/organization-work)', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: learnerId } },
            error: null,
          }),
        },
      } as any);

      vi.mocked(createAdminClient).mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === 'user_organizations') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({
                    data: [
                      {
                        organization_id: orgId,
                        org_role: 'MEMBER',
                        organizations: { id: orgId, name: 'Tập Đoàn Nexa', slug: 'nexa-corp', code: 'NX-CORP' },
                      },
                    ],
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === 'class_members') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  in: vi.fn().mockResolvedValue({
                    data: [{ class_id: orgClassId, role_in_class: 'STUDENT', evaluator_classes: { id: orgClassId, name: 'Lớp Tin Học', organization_id: orgId } }],
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === 'assessment_submissions') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [], // Chưa nộp bài nào
                  error: null,
                }),
              }),
            };
          }
          if (table === 'class_assignments') {
            return {
              select: vi.fn().mockReturnValue({
                in: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockResolvedValue({
                      data: [
                        {
                          id: assignmentId,
                          assessment_id: assessmentId,
                          class_id: orgClassId,
                          deadline: '2026-03-15T23:59:59Z',
                          status: 'PUBLISHED',
                          evaluator_classes: { id: orgClassId, name: 'Lớp Tin Học', organization_id: orgId, organizations: { name: 'Tập Đoàn Nexa' } },
                          assessments: { id: assessmentId, title: 'Bài khảo sát năng lực số Q1', duration_minutes: 60 },
                        },
                      ],
                      error: null,
                    }),
                  }),
                }),
              }),
            };
          }
          if (table === 'assessment_campaigns') {
            return {
              select: vi.fn().mockReturnValue({
                in: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockResolvedValue({ data: [], error: null }),
                  }),
                }),
              }),
            };
          }
          return { select: vi.fn().mockReturnThis() };
        }),
      } as any);

      const req = new NextRequest('http://localhost:3000/api/personal/organization-work');
      const res = await getOrganizationWork(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.hasOrganization).toBe(true);
      expect(data.tasks).toHaveLength(1);
      expect(data.tasks[0].id).toBe(assignmentId);
      expect(data.tasks[0].assessmentId).toBe(assessmentId);
      expect(data.tasks[0].className).toBe('Lớp Tin Học');
      expect(data.tasks[0].orgName).toBe('Tập Đoàn Nexa');
      expect(data.tasks[0].actionUrl).toContain(`/personal/take?assessmentId=${assessmentId}&assignmentId=${assignmentId}`);
    });

    it('nộp bài đánh giá được giao qua lớp: liên kết class_assignment_id và chấm điểm', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: learnerId } }, error: null }),
        },
      } as any);

      vi.mocked(createAdminClient).mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === 'assessments') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      id: assessmentId,
                      title: 'Bài tập năng lực số',
                      is_published: true,
                      passing_score: 70,
                      point_reward: 10,
                      time_limit_minutes: 30,
                    },
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
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { id: assignmentId, class_id: personalClassId, assessment_id: assessmentId },
                    error: null,
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
                    maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'm-1' }, error: null }),
                  }),
                }),
              }),
            };
          }
          if (table === 'assessment_items') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [{ id: itemId, domain_code: 'SAFETY', points: 10, item_type: 'MULTIPLE_CHOICE' }],
                  error: null,
                }),
              }),
            };
          }
          if (table === 'assessment_submissions') {
            const chainableSelect: any = {};
            chainableSelect.eq = vi.fn(() => chainableSelect);
            chainableSelect.neq = vi.fn(() => chainableSelect);
            chainableSelect.limit = vi.fn().mockResolvedValue({ data: [], error: null });

            return {
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: 'sub-assigned-1' },
                    error: null,
                  }),
                }),
              }),
              select: vi.fn().mockReturnValue(chainableSelect),
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
          if (table === 'profiles') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: { id: learnerId, points: 50 }, error: null }),
                }),
              }),
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null }),
              }),
            };
          }
          return { select: vi.fn().mockReturnThis() };
        }),
        rpc: vi.fn().mockImplementation((name: string) => {
          if (name === 'get_assessment_answer_keys_for_submission') {
            return Promise.resolve({
              data: [
                {
                  item_id: itemId,
                  points: 10,
                  correct_option_id: optionId,
                },
              ],
              error: null,
            });
          }
          return Promise.resolve({ data: null, error: null });
        }),
      } as any);

      const req = new NextRequest(`http://localhost:3000/api/assessments/${assessmentId}/submit`, {
        method: 'POST',
        body: JSON.stringify({
          timeSpentSeconds: 120,
          answers: [{ itemId, selectedOptionId: optionId }],
          classAssignmentId: assignmentId,
        }),
      });

      const res = await submitAssessment(req, { params: Promise.resolve({ id: assessmentId }) });
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.isPassed).toBe(true);
      expect(data.percentage).toBe(100);
      expect(data.pointsAwarded).toBe(10);
    });
  });
});
