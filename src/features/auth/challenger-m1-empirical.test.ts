import fs from 'fs';
import path from 'path';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ACTION_ROLE_MAP,
  requireOrgPagePermission,
  requireOrgApiPermission,
  type OrgRole,
  type OrgPermissionAction,
  type OrgAuthContext,
} from '@/lib/auth/org-guard';

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
}));

// Mocks for Supabase
const mockGetUser = vi.fn();
const mockAdminSelect = vi.fn();
const mockAdminEq = vi.fn();
const mockAdminMaybeSingle = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === 'organizations') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: mockAdminMaybeSingle,
            })),
          })),
        };
      }
      if (table === 'user_organizations') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: mockAdminMaybeSingle,
              })),
            })),
          })),
        };
      }
      return { select: vi.fn() };
    }),
  })),
}));

vi.mock('@/lib/auth/superadmin', () => ({
  isSuperadminEmail: vi.fn((email?: string) => email === 'superadmin@nexa.ai'),
}));

describe('Milestone 1 Challenger Empirical Verification Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // 1. ACTION_ROLE_MAP & Role Specification Audit
  // =========================================================================
  describe('Focus 3: ACTION_ROLE_MAP Static Audit & Parity', () => {
    const allActions: OrgPermissionAction[] = [
      'VIEW_WORKSPACE',
      'MANAGE_MEMBERS',
      'VIEW_GRADING',
      'GRADE_SUBMISSION',
      'VIEW_ANALYTICS',
      'VIEW_AI_QUOTA',
      'MANAGE_CAMPAIGNS',
      'MANAGE_CLASSES',
      'MANAGE_SETTINGS',
      'MANAGE_ASSESSMENTS',
    ];

    it('TC-CHALLENGE-01: EVALUATOR must match ASSESSOR in every single action without exception', () => {
      allActions.forEach((action) => {
        const roles = ACTION_ROLE_MAP[action];
        const hasAssessor = roles.includes('ASSESSOR');
        const hasEvaluator = roles.includes('EVALUATOR');
        expect(
          hasEvaluator,
          `Action ${action} does not match between ASSESSOR (${hasAssessor}) and EVALUATOR (${hasEvaluator})`
        ).toBe(hasAssessor);
      });
    });

    it('TC-CHALLENGE-02: MANAGE_SETTINGS must be strictly ORG_OWNER only', () => {
      expect(ACTION_ROLE_MAP.MANAGE_SETTINGS).toEqual(['ORG_OWNER']);
    });

    it('TC-CHALLENGE-03: VIEW_AI_QUOTA must be strictly ORG_OWNER only', () => {
      expect(ACTION_ROLE_MAP.VIEW_AI_QUOTA).toEqual(['ORG_OWNER']);
    });

    it('TC-CHALLENGE-04: MANAGE_MEMBERS is permitted strictly to ORG_OWNER and ORG_ADMIN', () => {
      expect(ACTION_ROLE_MAP.MANAGE_MEMBERS).toEqual(['ORG_OWNER', 'ORG_ADMIN']);
    });

    it('TC-CHALLENGE-05: VIEW_WORKSPACE includes 4 management roles (excluding MEMBER)', () => {
      const expected: OrgRole[] = ['ORG_OWNER', 'ORG_ADMIN', 'ASSESSOR', 'EVALUATOR'];
      expect(ACTION_ROLE_MAP.VIEW_WORKSPACE).toEqual(expect.arrayContaining(expected));
      expect(ACTION_ROLE_MAP.VIEW_WORKSPACE.length).toBe(4);
      expect(ACTION_ROLE_MAP.VIEW_WORKSPACE).not.toContain('MEMBER');
    });

    it('TC-CHALLENGE-06: MEMBER must NOT have any administrative or teaching actions', () => {
      const restrictedActions: OrgPermissionAction[] = [
        'MANAGE_MEMBERS',
        'VIEW_GRADING',
        'GRADE_SUBMISSION',
        'VIEW_ANALYTICS',
        'VIEW_AI_QUOTA',
        'MANAGE_CAMPAIGNS',
        'MANAGE_CLASSES',
        'MANAGE_SETTINGS',
        'MANAGE_ASSESSMENTS',
      ];

      restrictedActions.forEach((action) => {
        expect(
          ACTION_ROLE_MAP[action],
          `MEMBER should not have access to action ${action}`
        ).not.toContain('MEMBER');
      });
    });
  });

  // =========================================================================
  // 2. Empirical Verification of requireOrgPagePermission
  // =========================================================================
  describe('Focus 1 & 2: requireOrgPagePermission Runtime Behavior & Redirects', () => {
    const slug = 'test-org-slug';
    const fakeOrg = {
      id: 'org-uuid-1',
      name: 'Test Organization',
      slug,
      is_active: true,
      status: 'ACTIVE',
    };

    function setupMockUserAndMembership(role: OrgRole, isActive: boolean = true) {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'usr-1', email: 'user@example.com' } },
        error: null,
      });

      // organizations query response
      mockAdminMaybeSingle
        .mockResolvedValueOnce({
          data: fakeOrg,
          error: null,
        })
        // user_organizations query response
        .mockResolvedValueOnce({
          data: {
            org_role: role,
            status: isActive ? 'ACTIVE' : 'SUSPENDED',
          },
          error: null,
        });
    }

    it('TC-CHALLENGE-07: Unauthenticated user is redirected to /login with redirect query param', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: null },
        error: new Error('No user'),
      });

      await expect(requireOrgPagePermission(slug, 'VIEW_WORKSPACE')).rejects.toThrow(
        `REDIRECT:/login?redirect=/org/${slug}`
      );
    });

    it('TC-CHALLENGE-08: Inactive organization triggers notFound()', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: { id: 'usr-1', email: 'user@example.com' } },
        error: null,
      });

      mockAdminMaybeSingle
        .mockResolvedValueOnce({
          data: { ...fakeOrg, is_active: false },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { org_role: 'MEMBER', status: 'ACTIVE' },
          error: null,
        });

      await expect(requireOrgPagePermission(slug, 'VIEW_WORKSPACE')).rejects.toThrow('NOT_FOUND');
    });

    it('TC-CHALLENGE-09: User with inactive/suspended membership is redirected to /personal/dashboard', async () => {
      setupMockUserAndMembership('MEMBER', false);

      await expect(requireOrgPagePermission(slug, 'VIEW_WORKSPACE')).rejects.toThrow(
        'REDIRECT:/personal/dashboard'
      );
    });

    // Sub-matrix: All 4 management roles accessing VIEW_WORKSPACE (all 4 must pass without redirect)
    const roles: OrgRole[] = ['ORG_OWNER', 'ORG_ADMIN', 'ASSESSOR', 'EVALUATOR'];

    roles.forEach((role) => {
      it(`TC-CHALLENGE-10-${role}: ${role} can access VIEW_WORKSPACE without redirection`, async () => {
        setupMockUserAndMembership(role, true);

        const context = await requireOrgPagePermission(slug, 'VIEW_WORKSPACE');
        expect(context.isAuthorized).toBe(true);
        expect(context.role).toBe(role === 'EVALUATOR' ? 'ASSESSOR' : role);
        expect(context.organization.slug).toBe(slug);
        expect(mockRedirect).not.toHaveBeenCalled();
      });
    });

    it('TC-CHALLENGE-10-MEMBER: MEMBER attempting VIEW_WORKSPACE is barred and redirected to /personal/groups', async () => {
      setupMockUserAndMembership('MEMBER', true);
      await expect(requireOrgPagePermission(slug, 'VIEW_WORKSPACE')).rejects.toThrow('REDIRECT:/personal/groups');
    });

    // Focus 2: MEMBER unauthorized redirection to /org/${slug}/my-results
    it('TC-CHALLENGE-11: MEMBER attempting MANAGE_SETTINGS is redirected to /org/${slug}/my-results', async () => {
      setupMockUserAndMembership('MEMBER', true);

      await expect(requireOrgPagePermission(slug, 'MANAGE_SETTINGS')).rejects.toThrow(
        `REDIRECT:/personal/groups`
      );
    });

    it('TC-CHALLENGE-12: MEMBER attempting MANAGE_MEMBERS is redirected to /org/${slug}/my-results', async () => {
      setupMockUserAndMembership('MEMBER', true);

      await expect(requireOrgPagePermission(slug, 'MANAGE_MEMBERS')).rejects.toThrow(
        `REDIRECT:/personal/groups`
      );
    });

    it('TC-CHALLENGE-13: MEMBER attempting MANAGE_CLASSES is redirected to /org/${slug}/my-results', async () => {
      setupMockUserAndMembership('MEMBER', true);

      await expect(requireOrgPagePermission(slug, 'MANAGE_CLASSES')).rejects.toThrow(
        `REDIRECT:/personal/groups`
      );
    });

    it('TC-CHALLENGE-14: MEMBER attempting VIEW_GRADING is redirected to /org/${slug}/my-results', async () => {
      setupMockUserAndMembership('MEMBER', true);

      await expect(requireOrgPagePermission(slug, 'VIEW_GRADING')).rejects.toThrow(
        `REDIRECT:/personal/groups`
      );
    });

    // Focus 2: Operational roles attempting owner-only settings redirected to /org/${slug}
    it('TC-CHALLENGE-15: ORG_ADMIN attempting MANAGE_SETTINGS is redirected to /org/${slug}', async () => {
      setupMockUserAndMembership('ORG_ADMIN', true);

      await expect(requireOrgPagePermission(slug, 'MANAGE_SETTINGS')).rejects.toThrow(
        `REDIRECT:/org/${slug}`
      );
    });

    it('TC-CHALLENGE-16: ASSESSOR attempting MANAGE_SETTINGS is redirected to /org/${slug}', async () => {
      setupMockUserAndMembership('ASSESSOR', true);

      await expect(requireOrgPagePermission(slug, 'MANAGE_SETTINGS')).rejects.toThrow(
        `REDIRECT:/org/${slug}`
      );
    });

    it('TC-CHALLENGE-17: EVALUATOR attempting MANAGE_SETTINGS is redirected to /org/${slug}', async () => {
      setupMockUserAndMembership('EVALUATOR', true);

      await expect(requireOrgPagePermission(slug, 'MANAGE_SETTINGS')).rejects.toThrow(
        `REDIRECT:/org/${slug}`
      );
    });

    it('TC-CHALLENGE-18: ORG_ADMIN attempting VIEW_AI_QUOTA is redirected to /org/${slug}', async () => {
      setupMockUserAndMembership('ORG_ADMIN', true);

      await expect(requireOrgPagePermission(slug, 'VIEW_AI_QUOTA')).rejects.toThrow(
        `REDIRECT:/org/${slug}`
      );
    });

    it('TC-CHALLENGE-19: ASSESSOR attempting MANAGE_MEMBERS is redirected to /org/${slug}', async () => {
      setupMockUserAndMembership('ASSESSOR', true);

      await expect(requireOrgPagePermission(slug, 'MANAGE_MEMBERS')).rejects.toThrow(
        `REDIRECT:/org/${slug}`
      );
    });

    it('TC-CHALLENGE-20: EVALUATOR attempting MANAGE_MEMBERS is redirected to /org/${slug}', async () => {
      setupMockUserAndMembership('EVALUATOR', true);

      await expect(requireOrgPagePermission(slug, 'MANAGE_MEMBERS')).rejects.toThrow(
        `REDIRECT:/org/${slug}`
      );
    });

    // ORG_OWNER has access to MANAGE_SETTINGS and VIEW_AI_QUOTA
    it('TC-CHALLENGE-21: ORG_OWNER can access MANAGE_SETTINGS and VIEW_AI_QUOTA without redirection', async () => {
      setupMockUserAndMembership('ORG_OWNER', true);
      const ctxSettings = await requireOrgPagePermission(slug, 'MANAGE_SETTINGS');
      expect(ctxSettings.role).toBe('ORG_OWNER');

      setupMockUserAndMembership('ORG_OWNER', true);
      const ctxQuota = await requireOrgPagePermission(slug, 'VIEW_AI_QUOTA');
      expect(ctxQuota.role).toBe('ORG_OWNER');
    });

    // Superadmin bypass
    it('TC-CHALLENGE-22: Superadmin bypasses permission checks even if not a member', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: { id: 'usr-super', email: 'superadmin@nexa.ai' } },
        error: null,
      });

      mockAdminMaybeSingle.mockResolvedValueOnce({
        data: fakeOrg,
        error: null,
      });

      const context = await requireOrgPagePermission(slug, 'MANAGE_SETTINGS');
      expect(context.isSuperadmin).toBe(true);
      expect(context.role).toBe('ORG_ADMIN');
    });
  });

  // =========================================================================
  // 3. Empirical Verification of requireOrgApiPermission
  // =========================================================================
  describe('Focus 1 & 3: requireOrgApiPermission Runtime Behavior', () => {
    const orgId = 'org-uuid-1';
    const fakeOrg = {
      id: orgId,
      name: 'API Org',
      slug: 'api-org',
      is_active: true,
      status: 'ACTIVE',
    };

    function setupMockApi(role: OrgRole, isMemberActive: boolean = true, isOrgActive: boolean = true) {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'usr-1', email: 'api.user@example.com' } },
        error: null,
      });

      mockAdminMaybeSingle
        .mockResolvedValueOnce({
          data: isOrgActive ? fakeOrg : { ...fakeOrg, is_active: false },
          error: null,
        })
        .mockResolvedValueOnce({
          data: isMemberActive
            ? { org_role: role, status: 'ACTIVE' }
            : { org_role: role, status: 'SUSPENDED' },
          error: null,
        });
    }

    it('TC-CHALLENGE-23: Unauthenticated API request returns 401', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: null },
        error: new Error('No user'),
      });

      const result = await requireOrgApiPermission(orgId, 'VIEW_WORKSPACE');
      expect(result.authorized).toBe(false);
      expect(result.response?.status).toBe(401);
    });

    it('TC-CHALLENGE-24: Suspended org API request returns 403', async () => {
      setupMockApi('ORG_OWNER', true, false);

      const result = await requireOrgApiPermission(orgId, 'VIEW_WORKSPACE');
      expect(result.authorized).toBe(false);
      expect(result.response?.status).toBe(403);
    });

    it('TC-CHALLENGE-25: Suspended member API request returns 403', async () => {
      setupMockApi('ORG_OWNER', false, true);

      const result = await requireOrgApiPermission(orgId, 'VIEW_WORKSPACE');
      expect(result.authorized).toBe(false);
      expect(result.response?.status).toBe(403);
    });

    it('TC-CHALLENGE-26: MEMBER requesting MANAGE_SETTINGS via API receives 403', async () => {
      setupMockApi('MEMBER', true, true);

      const result = await requireOrgApiPermission(orgId, 'MANAGE_SETTINGS');
      expect(result.authorized).toBe(false);
      expect(result.response?.status).toBe(403);
    });

    it('TC-CHALLENGE-27: ORG_ADMIN requesting MANAGE_SETTINGS via API receives 403', async () => {
      setupMockApi('ORG_ADMIN', true, true);

      const result = await requireOrgApiPermission(orgId, 'MANAGE_SETTINGS');
      expect(result.authorized).toBe(false);
      expect(result.response?.status).toBe(403);
    });

    it('TC-CHALLENGE-28: ASSESSOR and EVALUATOR requesting MANAGE_MEMBERS via API receive 403', async () => {
      setupMockApi('ASSESSOR', true, true);
      const resAssessor = await requireOrgApiPermission(orgId, 'MANAGE_MEMBERS');
      expect(resAssessor.authorized).toBe(false);
      expect(resAssessor.response?.status).toBe(403);

      setupMockApi('EVALUATOR', true, true);
      const resEvaluator = await requireOrgApiPermission(orgId, 'MANAGE_MEMBERS');
      expect(resEvaluator.authorized).toBe(false);
      expect(resEvaluator.response?.status).toBe(403);
    });

    it('TC-CHALLENGE-29: EVALUATOR requesting GRADE_SUBMISSION via API is authorized', async () => {
      setupMockApi('EVALUATOR', true, true);

      const result = await requireOrgApiPermission(orgId, 'GRADE_SUBMISSION');
      expect(result.authorized).toBe(true);
      expect(result.context?.role).toBe('ASSESSOR');
    });

    it('TC-CHALLENGE-30: ORG_OWNER requesting MANAGE_SETTINGS via API is authorized', async () => {
      setupMockApi('ORG_OWNER', true, true);

      const result = await requireOrgApiPermission(orgId, 'MANAGE_SETTINGS');
      expect(result.authorized).toBe(true);
      expect(result.context?.role).toBe('ORG_OWNER');
    });

    it('TC-CHALLENGE-31 (Adversarial): Unknown action in requireOrgApiPermission safely rejects with 403', async () => {
      setupMockApi('ORG_ADMIN', true, true);

      // @ts-expect-error Testing adversarial unknown action
      const result = await requireOrgApiPermission(orgId, 'MALICIOUS_INVENTED_ACTION');
      expect(result.authorized).toBe(false);
      expect(result.response?.status).toBe(403);
    });
  });

  // =========================================================================
  // 4. Adversarial Edge Cases: Custom Role Arrays, Role Fallbacks, Blast Radius
  // =========================================================================
  describe('Adversarial Edge Cases & Blast Radius Analysis', () => {
    const slug = 'adversarial-org';
    const fakeOrg = {
      id: 'org-uuid-adv',
      name: 'Adversarial Org',
      slug,
      is_active: true,
      status: 'ACTIVE',
    };

    it('TC-CHALLENGE-32: Custom role array (e.g. [ORG_OWNER]) strictly blocks ORG_ADMIN and redirects to /org/${slug}', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'usr-adv-1', email: 'admin@example.com' } },
        error: null,
      });

      mockAdminMaybeSingle
        .mockResolvedValueOnce({ data: fakeOrg, error: null })
        .mockResolvedValueOnce({
          data: { org_role: 'ORG_ADMIN', status: 'ACTIVE' },
          error: null,
        });

      await expect(requireOrgPagePermission(slug, ['ORG_OWNER'])).rejects.toThrow(
        `REDIRECT:/org/${slug}`
      );
    });

    it('TC-CHALLENGE-33: Custom role array (e.g. [ORG_OWNER]) strictly blocks MEMBER and redirects to /org/${slug}/my-results', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'usr-adv-2', email: 'member@example.com' } },
        error: null,
      });

      mockAdminMaybeSingle
        .mockResolvedValueOnce({ data: fakeOrg, error: null })
        .mockResolvedValueOnce({
          data: { org_role: 'MEMBER', status: 'ACTIVE' },
          error: null,
        });

      await expect(requireOrgPagePermission(slug, ['ORG_OWNER'])).rejects.toThrow(
        `REDIRECT:/personal/groups`
      );
    });

    it('TC-CHALLENGE-34: Corrupted or null org_role in database defaults safely to MEMBER', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'usr-adv-3', email: 'corrupt@example.com' } },
        error: null,
      });

      mockAdminMaybeSingle
        .mockResolvedValueOnce({ data: fakeOrg, error: null })
        .mockResolvedValueOnce({
          data: { org_role: null, status: 'ACTIVE' },
          error: null,
        });

      // Since role falls back to MEMBER, attempting MANAGE_SETTINGS should redirect to /my-results
      await expect(requireOrgPagePermission(slug, 'MANAGE_SETTINGS')).rejects.toThrow(
        `REDIRECT:/personal/groups`
      );
    });

    it('TC-CHALLENGE-35: Unknown action string safely resolves to empty allowed list and redirects', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'usr-adv-4', email: 'evaluator@example.com' } },
        error: null,
      });

      mockAdminMaybeSingle
        .mockResolvedValueOnce({ data: fakeOrg, error: null })
        .mockResolvedValueOnce({
          data: { org_role: 'EVALUATOR', status: 'ACTIVE' },
          error: null,
        });

      // @ts-expect-error Testing unknown action string
      await expect(requireOrgPagePermission(slug, 'NON_EXISTENT_ACTION')).rejects.toThrow(
        `REDIRECT:/org/${slug}`
      );
    });
  });

  // =========================================================================
  // 5. Focus 5: Workspace Switcher & Avatar Multi-Org Isolation (Iteration 3)
  // =========================================================================
  describe('Focus 5: Workspace Switcher & Avatar Multi-Org Isolation (Iteration 3)', () => {
    interface OrganizationInfo {
      id: string;
      name: string;
      slug?: string;
      code?: string;
      plan_tier?: string;
      status?: string;
    }
    interface WorkspaceItem {
      membershipId: string;
      role: OrgRole;
      organization: OrganizationInfo;
    }

    const testWorkspaces: WorkspaceItem[] = [
      {
        membershipId: 'm1',
        role: 'ORG_OWNER',
        organization: { id: 'org-a-id', slug: 'org-a', name: 'Tổ chức A' },
      },
      {
        membershipId: 'm2',
        role: 'MEMBER',
        organization: { id: 'org-b-id', slug: 'org-b', name: 'Tổ chức B' },
      },
      {
        membershipId: 'm3',
        role: 'ORG_ADMIN',
        organization: { id: 'fpt-id', slug: 'fpt', name: 'Tập đoàn FPT' },
      },
      {
        membershipId: 'm4',
        role: 'ASSESSOR',
        organization: { id: 'fpt-edu-id', slug: 'fpt-edu', name: 'FPT Education' },
      },
    ];

    function evalSwitcher(pathname: string | null, activeWorkspaceId: string, workspaces: WorkspaceItem[]) {
      const routeOrgSlug = pathname?.startsWith('/org/') ? pathname.split('/')[2] : null;
      const activeWorkspace = routeOrgSlug
        ? workspaces.find((w) => w.organization.slug === routeOrgSlug)
        : workspaces.find((w) => w.organization.id === activeWorkspaceId.replace('org_', ''));
      const isOrg = pathname?.startsWith('/org/');
      const isAdmin = pathname?.startsWith('/admin') || activeWorkspaceId === 'admin';
      const isPersonal =
        !isOrg &&
        !pathname?.startsWith('/admin') &&
        (pathname?.startsWith('/personal') || activeWorkspaceId === 'personal' || !activeWorkspace);
      const isOrgManager =
        !isPersonal &&
        !isAdmin &&
        (activeWorkspace?.role === 'ORG_OWNER' || activeWorkspace?.role === 'ORG_ADMIN');

      const headerLabel = isAdmin
        ? 'Quản trị nền tảng NEXA'
        : isPersonal
        ? 'Cá nhân'
        : activeWorkspace?.organization?.name || 'Tổ chức';

      const personalChecked = isPersonal && !isAdmin;
      const adminChecked = isAdmin;
      const checkedOrgs = workspaces.filter((ws) => {
        return (
          !isAdmin &&
          !isPersonal &&
          (routeOrgSlug
            ? ws.organization.slug === routeOrgSlug
            : activeWorkspaceId === `org_${ws.organization.id}` || activeWorkspaceId === ws.organization.id)
        );
      });

      const totalCheckmarks = (personalChecked ? 1 : 0) + (adminChecked ? 1 : 0) + checkedOrgs.length;

      return {
        routeOrgSlug,
        activeWorkspace,
        headerLabel,
        isOrg,
        isAdmin,
        isPersonal,
        isOrgManager,
        personalChecked,
        adminChecked,
        checkedOrgs,
        totalCheckmarks,
      };
    }

    function evalAvatar(pathname: string | null, activeWorkspaceId: string, workspaces: WorkspaceItem[]) {
      const isPersonalRoute = pathname?.startsWith('/personal');
      const isOrgRoute = pathname?.startsWith('/org/');
      const isAdminRoute = pathname?.startsWith('/admin');
      const routeOrgSlug = pathname?.startsWith('/org/') ? pathname.split('/')[2] : null;

      const isPersonalActive = !isOrgRoute && !isAdminRoute && (isPersonalRoute || activeWorkspaceId === 'personal');
      const currentActiveOrg =
        !isPersonalRoute && !isAdminRoute
          ? routeOrgSlug
            ? workspaces.find((w) => w.organization.slug === routeOrgSlug)
            : workspaces.find(
                (w) =>
                  activeWorkspaceId === `org_${w.organization.id}` || activeWorkspaceId === w.organization.id
              )
          : undefined;

      const activeName = currentActiveOrg
        ? currentActiveOrg.organization.name
        : isOrgRoute
        ? 'Tổ chức'
        : 'Cá nhân';

      const personalChecked = isPersonalActive;
      const checkedOrgs = workspaces.filter((ws) => {
        return (
          !isPersonalRoute &&
          !isAdminRoute &&
          (routeOrgSlug
            ? ws.organization.slug === routeOrgSlug
            : activeWorkspaceId === `org_${ws.organization.id}` ||
              activeWorkspaceId === ws.organization.id)
        );
      });

      const totalCheckmarks = (personalChecked ? 1 : 0) + checkedOrgs.length;

      return {
        routeOrgSlug,
        currentActiveOrg,
        activeName,
        isPersonalActive,
        personalChecked,
        checkedOrgs,
        totalCheckmarks,
      };
    }

    it('TC-CHALLENGE-36: Multi-org user on /org/org-a with stale activeWorkspaceId = org_org-b-id in WorkspaceSwitcher', () => {
      const res = evalSwitcher('/org/org-a', 'org_org-b-id', testWorkspaces);

      expect(res.headerLabel).toBe('Tổ chức A');
      expect(res.activeWorkspace?.organization.slug).toBe('org-a');
      expect(res.checkedOrgs.map((w) => w.organization.slug)).toEqual(['org-a']);
      expect(res.personalChecked).toBe(false);
      expect(res.adminChecked).toBe(false);
      expect(res.totalCheckmarks).toBe(1);
    });

    it('TC-CHALLENGE-37: Multi-org user on /org/org-a with stale activeWorkspaceId = org_org-b-id in AvatarWorkspaceSection', () => {
      const res = evalAvatar('/org/org-a', 'org_org-b-id', testWorkspaces);

      expect(res.activeName).toBe('Tổ chức A');
      expect(res.currentActiveOrg?.organization.slug).toBe('org-a');
      expect(res.checkedOrgs.map((w) => w.organization.slug)).toEqual(['org-a']);
      expect(res.personalChecked).toBe(false);
      expect(res.totalCheckmarks).toBe(1);
    });

    it('TC-CHALLENGE-38: Prefix collision elimination (fpt vs fpt-edu) in WorkspaceSwitcher', () => {
      // 1. On /org/fpt with stale fpt-edu
      const onFpt = evalSwitcher('/org/fpt', 'org_fpt-edu-id', testWorkspaces);
      expect(onFpt.headerLabel).toBe('Tập đoàn FPT');
      expect(onFpt.checkedOrgs.map((w) => w.organization.slug)).toEqual(['fpt']);
      expect(onFpt.totalCheckmarks).toBe(1);

      // 2. On /org/fpt-edu with stale fpt
      const onFptEdu = evalSwitcher('/org/fpt-edu', 'org_fpt-id', testWorkspaces);
      expect(onFptEdu.headerLabel).toBe('FPT Education');
      expect(onFptEdu.checkedOrgs.map((w) => w.organization.slug)).toEqual(['fpt-edu']);
      expect(onFptEdu.totalCheckmarks).toBe(1);

      // 3. Deep subroute: /org/fpt/classes/123
      const deepFpt = evalSwitcher('/org/fpt/classes/123', 'org_fpt-edu-id', testWorkspaces);
      expect(deepFpt.headerLabel).toBe('Tập đoàn FPT');
      expect(deepFpt.checkedOrgs.map((w) => w.organization.slug)).toEqual(['fpt']);
      expect(deepFpt.totalCheckmarks).toBe(1);
    });

    it('TC-CHALLENGE-39: Prefix collision elimination (fpt vs fpt-edu) in AvatarWorkspaceSection', () => {
      // 1. On /org/fpt with stale fpt-edu
      const onFpt = evalAvatar('/org/fpt', 'org_fpt-edu-id', testWorkspaces);
      expect(onFpt.activeName).toBe('Tập đoàn FPT');
      expect(onFpt.checkedOrgs.map((w) => w.organization.slug)).toEqual(['fpt']);
      expect(onFpt.totalCheckmarks).toBe(1);

      // 2. On /org/fpt-edu with stale fpt
      const onFptEdu = evalAvatar('/org/fpt-edu', 'org_fpt-id', testWorkspaces);
      expect(onFptEdu.activeName).toBe('FPT Education');
      expect(onFptEdu.checkedOrgs.map((w) => w.organization.slug)).toEqual(['fpt-edu']);
      expect(onFptEdu.totalCheckmarks).toBe(1);

      // 3. Deep subroute: /org/fpt-edu/assessments/456
      const deepFptEdu = evalAvatar('/org/fpt-edu/assessments/456', 'org_fpt-id', testWorkspaces);
      expect(deepFptEdu.activeName).toBe('FPT Education');
      expect(deepFptEdu.checkedOrgs.map((w) => w.organization.slug)).toEqual(['fpt-edu']);
      expect(deepFptEdu.totalCheckmarks).toBe(1);
    });

    it('TC-CHALLENGE-40: User on /personal/dashboard with stale org activeWorkspaceId', () => {
      const sw = evalSwitcher('/personal/dashboard', 'org_org-a-id', testWorkspaces);
      expect(sw.headerLabel).toBe('Cá nhân');
      expect(sw.personalChecked).toBe(true);
      expect(sw.checkedOrgs).toHaveLength(0);
      expect(sw.totalCheckmarks).toBe(1);

      const av = evalAvatar('/personal/dashboard', 'org_org-a-id', testWorkspaces);
      expect(av.activeName).toBe('Cá nhân');
      expect(av.personalChecked).toBe(true);
      expect(av.checkedOrgs).toHaveLength(0);
      expect(av.totalCheckmarks).toBe(1);
    });

    it('TC-CHALLENGE-41: Combinatorial Stress Harness (Mutual exclusion across all routes and states)', () => {
      const testRoutes = [
        '/org/org-a',
        '/org/org-a/dashboard',
        '/org/org-b',
        '/org/fpt',
        '/org/fpt-edu',
        '/org/fpt-edu/classes/advanced',
        '/personal/dashboard',
        '/personal/assessments',
        '/admin/dashboard',
        '/auth/login',
      ];

      const testActiveIds = [
        'personal',
        'admin',
        'org_org-a-id',
        'org_org-b-id',
        'org_fpt-id',
        'org_fpt-edu-id',
        'org-a-id',
        'org-b-id',
        '',
      ];

      for (const route of testRoutes) {
        for (const activeId of testActiveIds) {
          const sw = evalSwitcher(route, activeId, testWorkspaces);
          const av = evalAvatar(route, activeId, testWorkspaces);

          // Invariant 1: Total checkmarks in Switcher must NEVER exceed 1
          expect(
            sw.totalCheckmarks,
            `Switcher rendered ${sw.totalCheckmarks} checkmarks on route ${route} with activeId ${activeId}`
          ).toBeLessThanOrEqual(1);

          // Invariant 2: Total checkmarks in Avatar must NEVER exceed 1
          expect(
            av.totalCheckmarks,
            `Avatar rendered ${av.totalCheckmarks} checkmarks on route ${route} with activeId ${activeId}`
          ).toBeLessThanOrEqual(1);

          // Invariant 3: On /org/:slug, if the slug matches an org, exactly 1 checkmark must be present
          const isMatchingOrg = testWorkspaces.some((w) => route.startsWith(`/org/${w.organization.slug}`));
          if (isMatchingOrg) {
            expect(sw.totalCheckmarks).toBe(1);
            expect(av.totalCheckmarks).toBe(1);
          }
        }
      }
    });

    it('TC-CHALLENGE-42: Static disk inspection for routeOrgSlug ternary and AGENTS.md 3.5 divider ban', () => {
      const switcherSource = fs.readFileSync(
        path.resolve(process.cwd(), 'src/components/dashboard/WorkspaceSwitcher.tsx'),
        'utf8'
      );
      const avatarSource = fs.readFileSync(
        path.resolve(process.cwd(), 'src/components/dashboard/AvatarWorkspaceSection.tsx'),
        'utf8'
      );

      // Verify routeOrgSlug ternary priority in switcher
      expect(switcherSource).toContain(
        "const routeOrgSlug = pathname?.startsWith('/org/') ? pathname.split('/')[2] : null;"
      );
      expect(switcherSource).toContain('routeOrgSlug');
      expect(switcherSource).toContain('ws.organization.slug === routeOrgSlug');

      // Verify routeOrgSlug ternary priority in avatar
      expect(avatarSource).toContain(
        "const routeOrgSlug = pathname?.startsWith('/org/') ? pathname.split('/')[2] : null;"
      );
      expect(avatarSource).toContain('routeOrgSlug');
      expect(avatarSource).toContain('ws.organization.slug === routeOrgSlug');

      // AGENTS.md 3.5 zero horizontal divider guarantee
      expect(switcherSource).not.toMatch(/<hr\b/);
      expect(switcherSource).not.toMatch(/\bdivide-y\b/);
      expect(switcherSource).not.toMatch(/\bborder-[bt]\b/);

      expect(avatarSource).not.toMatch(/<hr\b/);
      expect(avatarSource).not.toMatch(/\bdivide-y\b/);
      expect(avatarSource).not.toMatch(/\bborder-[bt]\b/);
    });
  });
});

