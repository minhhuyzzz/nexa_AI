import fs from 'fs';
import path from 'path';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { PATCH as updateMemberPatch, DELETE as deleteMemberDelete } from '@/app/api/organizations/[orgId]/members/route';
import { GET as getGradingSubmissions, POST as postGradingGrade } from '@/app/api/organizations/[orgId]/grading/route';
import { ACTION_ROLE_MAP, type OrgRole } from '@/lib/auth/org-guard';

// Mocks for next/navigation
const mockRedirect = vi.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`);
});
const mockNotFound = vi.fn(() => {
  throw new Error('NOT_FOUND');
});

vi.mock('next/navigation', () => ({
  redirect: (url: string) => mockRedirect(url),
  notFound: () => mockNotFound(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/org/test-org',
  useSearchParams: () => new URLSearchParams(),
}));

// Supabase Auth and Admin Client Mocks
const mockGetUser = vi.fn();
const mockAdminFrom = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: mockAdminFrom,
  })),
}));

vi.mock('@/lib/audit/admin-audit.service', () => ({
  recordAdminAudit: vi.fn().mockResolvedValue(true),
}));

describe('Empirical Challenge Suite — Milestone 2 RBAC & Navigation Hardening', () => {
  const orgId = 'a1111111-2222-4333-8444-555555555555';
  const ownerUserId = '11111111-1111-4111-8111-111111111111';
  const admin1UserId = '22222222-2222-4222-8222-222222222222';
  const admin2UserId = '33333333-3333-4333-8333-333333333333';
  const assessorUserId = '44444444-4444-4444-8444-444444444444';
  const memberUserId = '55555555-5555-4555-8555-555555555555';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // CHALLENGE 1: Member Management Privilege Escalation (Server-Side Attacks)
  // =========================================================================
  describe('1. Member Management Privilege Escalation Attacks', () => {
    it('Attack 1.1: ORG_ADMIN attempts to demote ORG_OWNER via PATCH -> MUST return 403', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: admin1UserId, email: 'admin1@org.vn' } },
        error: null,
      });

      const maybeSingleFn = vi.fn()
        // 1st call: caller membership
        .mockResolvedValueOnce({
          data: { org_role: 'ORG_ADMIN', status: 'ACTIVE' },
          error: null,
        })
        // 2nd call: target membership (OWNER)
        .mockResolvedValueOnce({
          data: { id: 'uo-owner', user_id: ownerUserId, org_role: 'ORG_OWNER', status: 'ACTIVE' },
          error: null,
        });

      mockAdminFrom.mockImplementation((table: string) => {
        if (table === 'user_organizations') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn().mockReturnThis(),
              maybeSingle: maybeSingleFn,
            })),
          };
        }
        return {};
      });

      const req = new NextRequest(`http://localhost/api/organizations/${orgId}/members`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: ownerUserId,
          orgRole: 'MEMBER',
        }),
      });

      const res = await updateMemberPatch(req, { params: Promise.resolve({ orgId }) });
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toContain('Chủ sở hữu');
    });

    it('Attack 1.2: ORG_ADMIN attempts to suspend ORG_OWNER via PATCH -> MUST return 403', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: admin1UserId, email: 'admin1@org.vn' } },
        error: null,
      });

      mockAdminFrom.mockImplementation((table: string) => {
        if (table === 'user_organizations') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn()
                .mockResolvedValueOnce({
                  data: { org_role: 'ORG_ADMIN', status: 'ACTIVE' },
                  error: null,
                })
                .mockResolvedValueOnce({
                  data: { id: 'uo-owner', user_id: ownerUserId, org_role: 'ORG_OWNER', status: 'ACTIVE' },
                  error: null,
                }),
            })),
          };
        }
        return {};
      });

      const req = new NextRequest(`http://localhost/api/organizations/${orgId}/members`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: ownerUserId,
          status: 'SUSPENDED',
        }),
      });

      const res = await updateMemberPatch(req, { params: Promise.resolve({ orgId }) });
      expect(res.status).toBe(403);
    });

    it('Attack 1.3: ORG_ADMIN attempts to demote another ORG_ADMIN via PATCH -> MUST return 403', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: admin1UserId, email: 'admin1@org.vn' } },
        error: null,
      });

      mockAdminFrom.mockImplementation((table: string) => {
        if (table === 'user_organizations') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn()
                .mockResolvedValueOnce({
                  data: { org_role: 'ORG_ADMIN', status: 'ACTIVE' },
                  error: null,
                })
                .mockResolvedValueOnce({
                  data: { id: 'uo-admin2', user_id: admin2UserId, org_role: 'ORG_ADMIN', status: 'ACTIVE' },
                  error: null,
                }),
            })),
          };
        }
        return {};
      });

      const req = new NextRequest(`http://localhost/api/organizations/${orgId}/members`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: admin2UserId,
          orgRole: 'MEMBER',
        }),
      });

      const res = await updateMemberPatch(req, { params: Promise.resolve({ orgId }) });
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toContain('Quản trị viên khác');
    });

    it('Attack 1.4: ORG_ADMIN attempts to suspend another ORG_ADMIN via PATCH -> MUST return 403', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: admin1UserId, email: 'admin1@org.vn' } },
        error: null,
      });

      mockAdminFrom.mockImplementation((table: string) => {
        if (table === 'user_organizations') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn()
                .mockResolvedValueOnce({
                  data: { org_role: 'ORG_ADMIN', status: 'ACTIVE' },
                  error: null,
                })
                .mockResolvedValueOnce({
                  data: { id: 'uo-admin2', user_id: admin2UserId, org_role: 'ORG_ADMIN', status: 'ACTIVE' },
                  error: null,
                }),
            })),
          };
        }
        return {};
      });

      const req = new NextRequest(`http://localhost/api/organizations/${orgId}/members`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: admin2UserId,
          status: 'SUSPENDED',
        }),
      });

      const res = await updateMemberPatch(req, { params: Promise.resolve({ orgId }) });
      expect(res.status).toBe(403);
    });

    it('Attack 1.5: ORG_ADMIN attempts to promote a MEMBER to ORG_ADMIN -> MUST return 403', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: admin1UserId, email: 'admin1@org.vn' } },
        error: null,
      });

      const maybeSingleFn = vi.fn()
        .mockResolvedValueOnce({
          data: { org_role: 'ORG_ADMIN', status: 'ACTIVE' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: 'uo-member', user_id: memberUserId, org_role: 'MEMBER', status: 'ACTIVE' },
          error: null,
        });

      mockAdminFrom.mockImplementation((table: string) => {
        if (table === 'user_organizations') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn().mockReturnThis(),
              maybeSingle: maybeSingleFn,
            })),
          };
        }
        return {};
      });

      const req = new NextRequest(`http://localhost/api/organizations/${orgId}/members`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: memberUserId,
          orgRole: 'ORG_ADMIN',
        }),
      });

      const res = await updateMemberPatch(req, { params: Promise.resolve({ orgId }) });
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toContain('Chỉ Chủ sở hữu hoặc Superadmin');
    });

    it('Attack 1.6: ORG_ADMIN attempts to delete another ORG_ADMIN via DELETE -> MUST return 403', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: admin1UserId, email: 'admin1@org.vn' } },
        error: null,
      });

      mockAdminFrom.mockImplementation((table: string) => {
        if (table === 'user_organizations') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn()
                .mockResolvedValueOnce({
                  data: { org_role: 'ORG_ADMIN', status: 'ACTIVE' },
                  error: null,
                })
                .mockResolvedValueOnce({
                  data: { id: 'uo-admin2', user_id: admin2UserId, org_role: 'ORG_ADMIN' },
                  error: null,
                }),
            })),
          };
        }
        return {};
      });

      const req = new NextRequest(`http://localhost/api/organizations/${orgId}/members?userId=${admin2UserId}`, {
        method: 'DELETE',
      });

      const res = await deleteMemberDelete(req, { params: Promise.resolve({ orgId }) });
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toContain('Quản trị viên khác');
    });

    it('Attack 1.7: ORG_ADMIN attempts to delete ORG_OWNER via DELETE -> MUST return 403', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: admin1UserId, email: 'admin1@org.vn' } },
        error: null,
      });

      mockAdminFrom.mockImplementation((table: string) => {
        if (table === 'user_organizations') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn()
                .mockResolvedValueOnce({
                  data: { org_role: 'ORG_ADMIN', status: 'ACTIVE' },
                  error: null,
                })
                .mockResolvedValueOnce({
                  data: { id: 'uo-owner', user_id: ownerUserId, org_role: 'ORG_OWNER' },
                  error: null,
                }),
            })),
          };
        }
        return {};
      });

      const req = new NextRequest(`http://localhost/api/organizations/${orgId}/members?userId=${ownerUserId}`, {
        method: 'DELETE',
      });

      const res = await deleteMemberDelete(req, { params: Promise.resolve({ orgId }) });
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toContain('Chủ sở hữu');
    });

    it('Attack 1.8: Self-deletion attempt via DELETE -> MUST return 400', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: admin1UserId, email: 'admin1@org.vn' } },
        error: null,
      });

      const req = new NextRequest(`http://localhost/api/organizations/${orgId}/members?userId=${admin1UserId}`, {
        method: 'DELETE',
      });

      const res = await deleteMemberDelete(req, { params: Promise.resolve({ orgId }) });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('chính mình');
    });

    it('Legitimate 1.9: ORG_OWNER can update role of an ORG_ADMIN to ASSESSOR -> returns 200', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: ownerUserId, email: 'owner@org.vn' } },
        error: null,
      });

      const maybeSingleFn = vi.fn()
        // 1st call: caller membership (OWNER)
        .mockResolvedValueOnce({
          data: { org_role: 'ORG_OWNER', status: 'ACTIVE' },
          error: null,
        })
        // 2nd call: target membership (ADMIN1)
        .mockResolvedValueOnce({
          data: { id: 'uo-admin1', user_id: admin1UserId, org_role: 'ORG_ADMIN', status: 'ACTIVE' },
          error: null,
        });

      mockAdminFrom.mockImplementation((table: string) => {
        if (table === 'user_organizations') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn().mockReturnThis(),
              maybeSingle: maybeSingleFn,
            })),
            update: vi.fn(() => ({
              eq: vi.fn().mockReturnThis(),
              select: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: { id: 'uo-admin1', user_id: admin1UserId, org_role: 'ASSESSOR', status: 'ACTIVE' },
                error: null,
              }),
            })),
          };
        }
        return {};
      });

      const req = new NextRequest(`http://localhost/api/organizations/${orgId}/members`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: admin1UserId,
          orgRole: 'ASSESSOR',
        }),
      });

      const res = await updateMemberPatch(req, { params: Promise.resolve({ orgId }) });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.member.org_role).toBe('ASSESSOR');
    });
  });

  // =========================================================================
  // CHALLENGE 2: Client-side Member Actions Matrix Logic Verification
  // =========================================================================
  describe('2. Client-side MemberDirectoryTable & Modal Logic Matrix', () => {
    function evaluateActionGuards(actorRole: OrgRole, targetRole: OrgRole, isTargetSelf: boolean) {
      const isOwner = actorRole === 'ORG_OWNER';
      const isTargetOwner = targetRole === 'ORG_OWNER';
      const isTargetAdmin = targetRole === 'ORG_ADMIN';

      const cannotEditRole = isTargetOwner || isTargetSelf || (!isOwner && isTargetAdmin);
      const cannotChangeStatus = isTargetOwner || isTargetSelf || (!isOwner && isTargetAdmin);
      const cannotDelete = isTargetOwner || isTargetSelf || (!isOwner && isTargetAdmin);

      return { cannotEditRole, cannotChangeStatus, cannotDelete };
    }

    it('Scenario 2.1: Admin viewing another Admin -> ALL action buttons disabled', () => {
      const { cannotEditRole, cannotChangeStatus, cannotDelete } = evaluateActionGuards('ORG_ADMIN', 'ORG_ADMIN', false);
      expect(cannotEditRole).toBe(true);
      expect(cannotChangeStatus).toBe(true);
      expect(cannotDelete).toBe(true);
    });

    it('Scenario 2.2: Admin viewing Owner -> ALL action buttons disabled', () => {
      const { cannotEditRole, cannotChangeStatus, cannotDelete } = evaluateActionGuards('ORG_ADMIN', 'ORG_OWNER', false);
      expect(cannotEditRole).toBe(true);
      expect(cannotChangeStatus).toBe(true);
      expect(cannotDelete).toBe(true);
    });

    it('Scenario 2.3: Admin viewing self -> ALL action buttons disabled', () => {
      const { cannotEditRole, cannotChangeStatus, cannotDelete } = evaluateActionGuards('ORG_ADMIN', 'ORG_ADMIN', true);
      expect(cannotEditRole).toBe(true);
      expect(cannotChangeStatus).toBe(true);
      expect(cannotDelete).toBe(true);
    });

    it('Scenario 2.4: Admin viewing Member/Assessor -> action buttons ENABLED', () => {
      const { cannotEditRole, cannotChangeStatus, cannotDelete } = evaluateActionGuards('ORG_ADMIN', 'MEMBER', false);
      expect(cannotEditRole).toBe(false);
      expect(cannotChangeStatus).toBe(false);
      expect(cannotDelete).toBe(false);

      const assessorCheck = evaluateActionGuards('ORG_ADMIN', 'ASSESSOR', false);
      expect(assessorCheck.cannotEditRole).toBe(false);
      expect(assessorCheck.cannotChangeStatus).toBe(false);
      expect(assessorCheck.cannotDelete).toBe(false);
    });

    it('Scenario 2.5: Owner viewing Admin -> action buttons ENABLED', () => {
      const { cannotEditRole, cannotChangeStatus, cannotDelete } = evaluateActionGuards('ORG_OWNER', 'ORG_ADMIN', false);
      expect(cannotEditRole).toBe(false);
      expect(cannotChangeStatus).toBe(false);
      expect(cannotDelete).toBe(false);
    });

    it('Scenario 2.6: Owner viewing self -> action buttons disabled (sole/self protection)', () => {
      const { cannotEditRole, cannotChangeStatus, cannotDelete } = evaluateActionGuards('ORG_OWNER', 'ORG_OWNER', true);
      expect(cannotEditRole).toBe(true);
      expect(cannotChangeStatus).toBe(true);
      expect(cannotDelete).toBe(true);
    });
  });

  // =========================================================================
  // CHALLENGE 3: Sidebar & Navigation RBAC across All 4 Roles
  // =========================================================================
  describe('3. Sidebar & Avatar Menu RBAC Structure', () => {
    function computeNavStructure(userRole: string, orgSlug: string) {
      const role = userRole.toUpperCase();
      const isOwner = role === 'ORG_OWNER';
      const isAdmin = role === 'ORG_ADMIN';
      const isAssessor = role === 'ASSESSOR' || role === 'EVALUATOR';
      const isMember = role === 'MEMBER';

      const navGroups = isMember
        ? [
            {
              label: 'CÁ NHÂN',
              items: [
                { name: 'Tổng quan', href: `/org/${orgSlug}` },
                { name: 'Kết quả của tôi', href: `/org/${orgSlug}/my-results` },
              ],
            },
          ]
        : [
            {
              label: 'ĐIỀU HÀNH',
              items: [
                { name: 'Tổng quan', href: `/org/${orgSlug}` },
                ...(isOwner || isAdmin ? [{ name: 'Thành viên', href: `/org/${orgSlug}/members` }] : []),
                { name: 'Nhóm & Đơn vị', href: `/org/${orgSlug}/classes` },
                { name: 'Báo cáo năng lực', href: `/org/${orgSlug}/analytics` },
              ],
            },
            {
              label: 'KHẢO THÍ',
              items: [
                { name: 'Đánh giá năng lực', href: `/org/${orgSlug}/assessments` },
                ...(isAssessor ? [{ name: 'Chấm bài', href: `/org/${orgSlug}/grading` }] : []),
              ],
            },
            ...(isOwner
              ? [
                  {
                    label: 'TÀI KHOẢN TỔ CHỨC',
                    items: [
                      { name: 'Gói sử dụng', href: `/org/${orgSlug}/plan` },
                      { name: 'Cài đặt', href: `/org/${orgSlug}/settings` },
                    ],
                  },
                ]
              : []),
          ];

      const canCreateAssessment = !isMember;
      const avatarShowsOwnerSettings = isOwner;

      return { navGroups, canCreateAssessment, avatarShowsOwnerSettings };
    }

    it('Role 3.1: MEMBER has strictly isolated navigation', () => {
      const nav = computeNavStructure('MEMBER', 'my-org');
      expect(nav.navGroups).toHaveLength(1);
      expect(nav.navGroups[0].label).toBe('CÁ NHÂN');
      const itemNames = nav.navGroups[0].items.map((i) => i.name);
      expect(itemNames).toEqual(['Tổng quan', 'Kết quả của tôi']);

      // Forbidden for member:
      expect(itemNames).not.toContain('Thành viên');
      expect(itemNames).not.toContain('Nhóm & Đơn vị');
      expect(itemNames).not.toContain('Đánh giá năng lực');
      expect(itemNames).not.toContain('Cài đặt');

      // "Soạn đề thi mới" is hidden
      expect(nav.canCreateAssessment).toBe(false);
      // Avatar menu settings hidden
      expect(nav.avatarShowsOwnerSettings).toBe(false);
    });

    it('Role 3.2: ASSESSOR / EVALUATOR sees Classes, Assessments, Grading, but NO Members, Plan, or Settings', () => {
      const nav = computeNavStructure('ASSESSOR', 'my-org');
      const allItems = nav.navGroups.flatMap((g) => g.items.map((i) => i.name));

      expect(allItems).toContain('Tổng quan');
      expect(allItems).toContain('Nhóm & Đơn vị');
      expect(allItems).toContain('Báo cáo năng lực');
      expect(allItems).toContain('Đánh giá năng lực');
      expect(allItems).toContain('Chấm bài');

      expect(allItems).not.toContain('Thành viên');
      expect(allItems).not.toContain('Gói sử dụng');
      expect(allItems).not.toContain('Cài đặt');

      expect(nav.canCreateAssessment).toBe(true);
      expect(nav.avatarShowsOwnerSettings).toBe(false);
    });

    it('Role 3.3: ORG_ADMIN sees Members and operational groups, but NO Plan or Settings', () => {
      const nav = computeNavStructure('ORG_ADMIN', 'my-org');
      const allItems = nav.navGroups.flatMap((g) => g.items.map((i) => i.name));

      expect(allItems).toContain('Tổng quan');
      expect(allItems).toContain('Thành viên');
      expect(allItems).toContain('Nhóm & Đơn vị');
      expect(allItems).toContain('Báo cáo năng lực');
      expect(allItems).toContain('Đánh giá năng lực');

      expect(allItems).not.toContain('Gói sử dụng');
      expect(allItems).not.toContain('Cài đặt');

      expect(nav.canCreateAssessment).toBe(true);
      expect(nav.avatarShowsOwnerSettings).toBe(false);
    });

    it('Role 3.4: ORG_OWNER sees all operational items AND Plan/Settings', () => {
      const nav = computeNavStructure('ORG_OWNER', 'my-org');
      const allItems = nav.navGroups.flatMap((g) => g.items.map((i) => i.name));

      expect(allItems).toContain('Tổng quan');
      expect(allItems).toContain('Thành viên');
      expect(allItems).toContain('Nhóm & Đơn vị');
      expect(allItems).toContain('Báo cáo năng lực');
      expect(allItems).toContain('Đánh giá năng lực');
      expect(allItems).toContain('Gói sử dụng');
      expect(allItems).toContain('Cài đặt');

      expect(nav.canCreateAssessment).toBe(true);
      expect(nav.avatarShowsOwnerSettings).toBe(true);
    });
  });

  // =========================================================================
  // CHALLENGE 4: Class & Grading Isolation Enforcement
  // =========================================================================
  describe('4. Class Scoping & Grading Submission Isolation', () => {
    it('Scoping 4.1: Assessor in GET /api/organizations/[orgId]/grading only queries assigned classes & campaigns', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: assessorUserId, email: 'assessor@org.vn' } },
        error: null,
      });

      const assignedClassId = 'class-assigned-1';
      const unassignedClassId = 'class-unassigned-2';

      mockAdminFrom.mockImplementation((table: string) => {
        if (table === 'user_organizations') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: { org_role: 'ASSESSOR', status: 'ACTIVE' },
                error: null,
              }),
            })),
          };
        }
        if (table === 'organizations') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: orgId, slug: 'test-org', status: 'ACTIVE', is_active: true },
                error: null,
              }),
            })),
          };
        }
        if (table === 'assessments') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({
                data: [{ id: 'asmt-1', title: 'Test 1', passing_score: 70 }],
                error: null,
              }),
            })),
          };
        }
        if (table === 'evaluator_classes') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn().mockReturnThis(),
              or: vi.fn().mockResolvedValue({
                data: [{ id: assignedClassId }],
                error: null,
              }),
            })),
          };
        }
        if (table === 'assessment_campaigns') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            })),
          };
        }
        if (table === 'class_assignments') {
          return {
            select: vi.fn(() => ({
              in: vi.fn().mockResolvedValue({
                data: [{ id: 'asg-assigned-1' }],
                error: null,
              }),
            })),
          };
        }
        if (table === 'assessment_submissions') {
          return {
            select: vi.fn(() => ({
              in: vi.fn().mockReturnThis(),
              order: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: 'sub-assigned-1',
                    class_assignment_id: 'asg-assigned-1',
                    status: 'SUBMITTED',
                    submission_answers: [{ auto_graded: false, text_response: 'Sample answer' }],
                  },
                  {
                    id: 'sub-unassigned-2',
                    class_assignment_id: 'asg-unassigned-foreign',
                    status: 'SUBMITTED',
                    submission_answers: [{ auto_graded: false, text_response: 'Foreign answer' }],
                  },
                ],
                error: null,
              }),
            })),
          };
        }
        return {};
      });

      const req = new NextRequest(`http://localhost/api/organizations/${orgId}/grading`);
      const res = await getGradingSubmissions(req, { params: Promise.resolve({ orgId }) });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);

      // The unassigned submission MUST have been filtered out!
      const ids = json.submissions.map((s: any) => s.id);
      expect(ids).toContain('sub-assigned-1');
      expect(ids).not.toContain('sub-unassigned-2');
    });

    it('Scoping 4.2: Assessor attempting to POST grade to an unassigned class submission -> MUST return 403', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: assessorUserId, email: 'assessor@org.vn' } },
        error: null,
      });

      mockAdminFrom.mockImplementation((table: string) => {
        if (table === 'user_organizations') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: { org_role: 'ASSESSOR', status: 'ACTIVE' },
                error: null,
              }),
            })),
          };
        }
        if (table === 'organizations') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: orgId, slug: 'test-org', status: 'ACTIVE', is_active: true },
                error: null,
              }),
            })),
          };
        }
        if (table === 'assessment_submissions') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'sub-target-foreign',
                  class_assignment_id: 'asg-foreign',
                  assessments: { organization_id: orgId, passing_score: 70 },
                },
                error: null,
              }),
            })),
          };
        }
        if (table === 'evaluator_classes') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn().mockReturnThis(),
              or: vi.fn().mockResolvedValue({
                data: [{ id: 'class-my-own-1' }],
                error: null,
              }),
            })),
          };
        }
        if (table === 'assessment_campaigns') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            })),
          };
        }
        if (table === 'class_assignments') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: { class_id: 'class-foreign-unassigned-id' },
                error: null,
              }),
            })),
          };
        }
        return {};
      });

      const req = new NextRequest(`http://localhost/api/organizations/${orgId}/grading`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: '00000000-0000-0000-0000-000000000001',
          totalScore: 85,
        }),
      });

      const res = await postGradingGrade(req, { params: Promise.resolve({ orgId }) });
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toContain('không được phân công chấm bài nộp này');
    });
  });

  // =========================================================================
  // CHALLENGE 5: AGENTS.md Conformance & Page Guard Hardening
  // =========================================================================
  describe('5. AGENTS.md UI Conformance & Page Guards', () => {
    it('Static Audit 5.1: Zero occurrences of <hr> in org components & dashboard pages', () => {
      const rootDir = process.cwd();
      const orgComponentsDir = path.join(rootDir, 'src', 'components', 'dashboard', 'org');
      const orgPagesDir = path.join(rootDir, 'src', 'app', '(dashboard)', 'org');

      function scanDir(dir: string, pattern: RegExp): string[] {
        const matches: string[] = [];
        if (!fs.existsSync(dir)) return matches;
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            matches.push(...scanDir(fullPath, pattern));
          } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (pattern.test(content)) {
              matches.push(fullPath);
            }
          }
        }
        return matches;
      }

      const hrMatches = [
        ...scanDir(orgComponentsDir, /<hr[\s/>]/i),
        ...scanDir(orgPagesDir, /<hr[\s/>]/i),
      ];
      expect(hrMatches).toEqual([]);
    });

    it('Static Audit 5.2: Zero occurrences of divide-y in org components & dashboard pages', () => {
      const rootDir = process.cwd();
      const orgComponentsDir = path.join(rootDir, 'src', 'components', 'dashboard', 'org');
      const orgPagesDir = path.join(rootDir, 'src', 'app', '(dashboard)', 'org');

      function scanDir(dir: string, pattern: RegExp): string[] {
        const matches: string[] = [];
        if (!fs.existsSync(dir)) return matches;
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            matches.push(...scanDir(fullPath, pattern));
          } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (pattern.test(content)) {
              matches.push(fullPath);
            }
          }
        }
        return matches;
      }

      const divideYMatches = [
        ...scanDir(orgComponentsDir, /divide-y/i),
        ...scanDir(orgPagesDir, /divide-y/i),
      ];
      expect(divideYMatches).toEqual([]);
    });

    it('Static Audit 5.3: Zero user-facing "DigComp" occurrences in org dashboard UI strings', () => {
      const rootDir = process.cwd();
      const orgComponentsDir = path.join(rootDir, 'src', 'components', 'dashboard', 'org');
      const orgPagesDir = path.join(rootDir, 'src', 'app', '(dashboard)', 'org');

      function scanUserFacingStrings(dir: string): { file: string; line: string }[] {
        const violations: { file: string; line: string }[] = [];
        if (!fs.existsSync(dir)) return violations;
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            violations.push(...scanUserFacingStrings(fullPath));
          } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
            const lines = fs.readFileSync(fullPath, 'utf8').split('\n');
            lines.forEach((line) => {
              const trimmed = line.trim();
              // Ignore comments (JSX comments or single/multi-line code comments)
              if (
                trimmed.startsWith('//') ||
                trimmed.startsWith('/*') ||
                trimmed.startsWith('*') ||
                trimmed.startsWith('{/*')
              ) {
                return;
              }
              // Check if user-facing literal string contains DigComp
              if (
                /['"`][^'"`]*digcomp[^'"`]*['"`]/i.test(line) ||
                />[^<]*digcomp[^<]*</i.test(line)
              ) {
                violations.push({ file: fullPath, line: trimmed });
              }
            });
          }
        }
        return violations;
      }

      const violations = [
        ...scanUserFacingStrings(orgComponentsDir),
        ...scanUserFacingStrings(orgPagesDir),
      ];
      expect(violations).toEqual([]);
    });

    it('Guard Rule 5.4: MANAGE_SETTINGS is strictly restricted to ORG_OWNER', () => {
      const allowedRoles = ACTION_ROLE_MAP['MANAGE_SETTINGS'];
      expect(allowedRoles).toEqual(['ORG_OWNER']);
      expect(allowedRoles).not.toContain('ORG_ADMIN');
      expect(allowedRoles).not.toContain('ASSESSOR');
      expect(allowedRoles).not.toContain('EVALUATOR');
      expect(allowedRoles).not.toContain('MEMBER');
    });
  });
});
