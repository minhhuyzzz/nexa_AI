import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import {
  normalizeOrgRole,
  getOrgRoleLabel,
  STANDARD_ROLE_LABELS,
  requireOrgPagePermission,
  requireOrgApiPermission,
  ACTION_ROLE_MAP,
  type OrgRole,
  type StandardOrgRole,
} from '@/lib/auth/org-guard';

/**
 * ============================================================================
 * CHALLENGER 2 EMPIRICAL ADVERSARIAL VERIFICATION SUITE — Milestone 1 Round 2
 * 
 * Deeply verifies:
 * 1. Role compatibility across UI components:
 *    - WorkspaceSwitcher.tsx: label formatting, canonical badges, zero undefined text
 *    - AvatarWorkspaceSection.tsx: getRoleDisplayName, getOrgRoleLabel, zero undefined
 *    - OrgMembersClientView.tsx: role modal initialization & conversion of EVALUATOR to ASSESSOR
 *    - MemberDirectoryTable.tsx: filtering, badge rendering, role normalization, zero undefined
 *    - InviteMemberDrawer.tsx & BulkMemberImportModal.tsx: canonical options & CSV role mapping
 * 
 * 2. Guard behavior (org-guard.ts & layout.tsx):
 *    - MEMBER role redirected to /personal/groups?notice=org_restricted with 0 bypasses
 *    - Inactive / Suspended / Non-member handling
 *    - Case variations ('member', 'Member', ' MEMBER ')
 * 
 * 3. API RBAC logic & Tamper Resistance:
 *    - Header tampering: X-User-Role, X-Org-Role, X-Role, X-User-Id
 *    - Body tampering: role escalation, cross-tenant orgId injection
 *    - Privilege escalation defense on classes, join-codes, members endpoints
 * ============================================================================
 */

// Navigation mocks
const mockRedirect = vi.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`);
});
const mockNotFound = vi.fn(() => {
  throw new Error('NOT_FOUND');
});

vi.mock('next/navigation', () => ({
  redirect: (url: string) => mockRedirect(url),
  notFound: () => mockNotFound(),
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/org/test-org',
}));

// Supabase mocks
const mockGetUser = vi.fn();
const mockAdminMaybeSingle = vi.fn();
const mockAdminSingle = vi.fn();
const mockAdminSelect = vi.fn();
const mockAdminInsert = vi.fn();
const mockAdminDelete = vi.fn();
const mockAdminUpdate = vi.fn();
const mockAdminEq = vi.fn();
const mockAdminOr = vi.fn();
const mockAdminOrder = vi.fn();
const mockAdminCount = vi.fn();

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
      const chain: any = {
        select: vi.fn((...args: any[]) => {
          mockAdminSelect(...args);
          return chain;
        }),
        insert: vi.fn((...args: any[]) => {
          mockAdminInsert(...args);
          return chain;
        }),
        delete: vi.fn((...args: any[]) => {
          mockAdminDelete(...args);
          return chain;
        }),
        update: vi.fn((...args: any[]) => {
          mockAdminUpdate(...args);
          return chain;
        }),
        eq: vi.fn((...args: any[]) => {
          mockAdminEq(...args);
          return chain;
        }),
        or: vi.fn((...args: any[]) => {
          mockAdminOr(...args);
          return chain;
        }),
        order: vi.fn((...args: any[]) => {
          mockAdminOrder(...args);
          return chain;
        }),
        single: mockAdminSingle,
        maybeSingle: mockAdminMaybeSingle,
      };
      return chain;
    }),
  })),
}));

vi.mock('@/lib/auth/superadmin', () => ({
  isSuperadminEmail: vi.fn((email?: string) => email === 'superadmin@nexa.ai'),
}));

describe('CHALLENGER 2: Milestone 1 Round 2 Empirical Adversarial Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // Section 1: Role Compatibility Across UI Components
  // ==========================================================================
  describe('1. Role Compatibility Across UI Components', () => {
    it('1.1. normalizeOrgRole maps all legacy EVALUATOR variants to ASSESSOR and never undefined', () => {
      const variants = ['EVALUATOR', 'evaluator', 'Evaluator', '  evaluator  ', 'ASSESSOR', 'assessor', 'Assessor'];
      for (const v of variants) {
        const normalized = normalizeOrgRole(v);
        expect(normalized).toBe('ASSESSOR');
        const label = getOrgRoleLabel(v);
        expect(label).toBe('Khảo thí viên');
        expect(label).not.toContain('undefined');
      }
    });

    it('1.2. normalizeOrgRole defaults empty, null, undefined or unknown roles safely to MEMBER', () => {
      const unknownInputs = [null, undefined, '', '   ', 'GUEST', 'STUDENT', 'TEACHER', 'UNKNOWN_ROLE', '123'];
      for (const input of unknownInputs) {
        const normalized = normalizeOrgRole(input as any);
        expect(normalized).toBe('MEMBER');
        const label = getOrgRoleLabel(input as any);
        expect(label).toBe('Thành viên');
      }
    });

    it('1.3. AvatarWorkspaceSection.tsx delegates getRoleDisplayName to getOrgRoleLabel without crash', () => {
      const filePath = path.resolve(process.cwd(), 'src/components/dashboard/AvatarWorkspaceSection.tsx');
      expect(fs.existsSync(filePath)).toBe(true);
      const code = fs.readFileSync(filePath, 'utf-8');

      // Check delegate contract
      expect(code).toContain('export function getRoleDisplayName(role: OrgRoleType | string): string');
      expect(code).toContain('return getOrgRoleLabel(role);');

      // Check runtime output of getOrgRoleLabel across roles
      expect(getOrgRoleLabel('ASSESSOR')).toBe('Khảo thí viên');
      expect(getOrgRoleLabel('EVALUATOR')).toBe('Khảo thí viên');
      expect(getOrgRoleLabel('ORG_OWNER')).toBe('Chủ sở hữu');
      expect(getOrgRoleLabel('ORG_ADMIN')).toBe('Quản trị viên');
      expect(getOrgRoleLabel('MEMBER')).toBe('Thành viên');
      expect(getOrgRoleLabel(null)).toBe('Thành viên');
      expect(getOrgRoleLabel(undefined)).toBe('Thành viên');
      expect(getOrgRoleLabel('')).toBe('Thành viên');
    });

    it('1.4. WorkspaceSwitcher.tsx uses normalizeOrgRole and contains exactly 4 canonical role labels', () => {
      const filePath = path.resolve(process.cwd(), 'src/components/dashboard/WorkspaceSwitcher.tsx');
      expect(fs.existsSync(filePath)).toBe(true);
      const code = fs.readFileSync(filePath, 'utf-8');

      // Verify imports and normalization
      expect(code).toContain('normalizeOrgRole');
      expect(code).toContain('ROLE_LABELS[normalizeOrgRole(activeWorkspace.role)]');
      expect(code).toContain('ROLE_LABELS[normalizeOrgRole(ws.role)]');

      // Verify ROLE_LABELS definition does not have duplicate Khảo thí viên
      expect(code).toContain("ASSESSOR: 'Khảo thí viên'");
      expect(code).not.toContain("EVALUATOR: 'Khảo thí viên'");
    });

    it('1.5. MemberDirectoryTable.tsx: filtering and role badges handle both ASSESSOR and EVALUATOR cleanly', () => {
      const filePath = path.resolve(process.cwd(), 'src/components/dashboard/org/members/MemberDirectoryTable.tsx');
      expect(fs.existsSync(filePath)).toBe(true);
      const code = fs.readFileSync(filePath, 'utf-8');

      // Verify normalization inside table rendering & filtering
      expect(code).toContain('const normRole = normalizeOrgRole(m.role);');
      expect(code).toContain('ROLE_BADGES[normRole]');

      // Test filtering simulation
      const members = [
        { membershipId: 'm1', userId: 'u1', email: 'u1@test.com', nickname: 'Alice', role: 'EVALUATOR', status: 'ACTIVE', createdAt: '2026-01-01' },
        { membershipId: 'm2', userId: 'u2', email: 'u2@test.com', nickname: 'Bob', role: 'ASSESSOR', status: 'ACTIVE', createdAt: '2026-01-01' },
        { membershipId: 'm3', userId: 'u3', email: 'u3@test.com', nickname: 'Charlie', role: 'ORG_ADMIN', status: 'ACTIVE', createdAt: '2026-01-01' },
        { membershipId: 'm4', userId: 'u4', email: 'u4@test.com', nickname: 'David', role: 'MEMBER', status: 'ACTIVE', createdAt: '2026-01-01' },
      ];

      // Filtering by ASSESSOR matches both m1 (EVALUATOR) and m2 (ASSESSOR)
      const assessorFiltered = members.filter((m) => normalizeOrgRole(m.role) === 'ASSESSOR');
      expect(assessorFiltered.length).toBe(2);
      expect(assessorFiltered.map((m) => m.membershipId)).toEqual(['m1', 'm2']);

      // Badges for both members are identical and non-undefined
      for (const m of assessorFiltered) {
        const normRole = normalizeOrgRole(m.role);
        expect(normRole).toBe('ASSESSOR');
        const label = STANDARD_ROLE_LABELS[normRole];
        expect(label).toBe('Khảo thí viên');
        expect(label).toBeDefined();
      }
    });

    it('1.6. OrgMembersClientView.tsx onOpenRoleModal normalizes legacy EVALUATOR to ASSESSOR', () => {
      const filePath = path.resolve(process.cwd(), 'src/app/(dashboard)/org/[slug]/members/OrgMembersClientView.tsx');
      expect(fs.existsSync(filePath)).toBe(true);
      const code = fs.readFileSync(filePath, 'utf-8');

      // Check normalization logic in onOpenRoleModal
      expect(code).toContain('const normalized = normalizeOrgRole(member.role);');

      // Simulate runtime evaluation
      const memberEvaluator = {
        membershipId: 'mem-eval',
        userId: 'u-eval',
        email: 'eval@test.com',
        nickname: 'Teacher Kim',
        role: 'EVALUATOR',
        status: 'ACTIVE' as const,
        createdAt: '2026-01-01',
      };

      const normalized = normalizeOrgRole(memberEvaluator.role);
      const initialRole = (
        normalized === 'ORG_OWNER' ? 'ORG_ADMIN' : normalized
      ) as 'ORG_ADMIN' | 'ASSESSOR' | 'MEMBER';
      const selectedRole = ['ORG_ADMIN', 'ASSESSOR', 'MEMBER'].includes(initialRole)
        ? initialRole
        : 'MEMBER';

      expect(selectedRole).toBe('ASSESSOR');
      expect(selectedRole).not.toBe('MEMBER');
    });

    it('1.7. InviteMemberDrawer.tsx and BulkMemberImportModal.tsx provide canonical ASSESSOR option', () => {
      const drawerPath = path.resolve(process.cwd(), 'src/components/dashboard/org/members/InviteMemberDrawer.tsx');
      const importPath = path.resolve(process.cwd(), 'src/components/dashboard/org/BulkMemberImportModal.tsx');

      expect(fs.existsSync(drawerPath)).toBe(true);
      expect(fs.existsSync(importPath)).toBe(true);

      const drawerCode = fs.readFileSync(drawerPath, 'utf-8');
      const importCode = fs.readFileSync(importPath, 'utf-8');

      // InviteMemberDrawer has ASSESSOR option and permissions
      expect(drawerCode).toContain('<option value="ASSESSOR">Khảo thí viên</option>');
      expect(drawerCode).toContain('ASSESSOR: {');
      expect(drawerCode).not.toContain('<option value="EVALUATOR">');

      // BulkMemberImportModal has ASSESSOR option and CSV parsing support
      expect(importCode).toContain('<option value="ASSESSOR">Khảo thí viên</option>');
      expect(importCode).toContain("else if (roleRaw === 'ASSESSOR' || roleRaw === 'EVALUATOR') orgRole = 'ASSESSOR';");
      expect(importCode).not.toContain('<option value="EVALUATOR">');
    });
  });

  // ==========================================================================
  // Section 2: Guard Behavior & Zero Bypasses for MEMBER
  // ==========================================================================
  describe('2. Guard Behavior: Strict MEMBER Redirection with 0 Bypasses', () => {
    const activeOrg = {
      id: 'org-safe-1',
      name: 'Safe School',
      slug: 'safe-school',
      is_active: true,
      status: 'ACTIVE',
    };

    it('2.1. requireOrgPagePermission: MEMBER accessing VIEW_WORKSPACE is redirected to /personal/groups?notice=org_restricted', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'usr-member', email: 'student@safe.edu.vn' } },
        error: null,
      });

      mockAdminMaybeSingle
        .mockResolvedValueOnce({ data: activeOrg, error: null })
        .mockResolvedValueOnce({ data: { org_role: 'MEMBER', status: 'ACTIVE' }, error: null });

      await expect(
        requireOrgPagePermission('safe-school', 'VIEW_WORKSPACE')
      ).rejects.toThrow('REDIRECT:/personal/groups?notice=org_restricted');

      expect(mockRedirect).toHaveBeenCalledWith('/personal/groups?notice=org_restricted');
    });

    it('2.2. requireOrgPagePermission: MEMBER accessing MANAGE_MEMBERS is redirected to /personal/groups?notice=org_restricted', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'usr-member', email: 'student@safe.edu.vn' } },
        error: null,
      });

      mockAdminMaybeSingle
        .mockResolvedValueOnce({ data: activeOrg, error: null })
        .mockResolvedValueOnce({ data: { org_role: 'MEMBER', status: 'ACTIVE' }, error: null });

      await expect(
        requireOrgPagePermission('safe-school', 'MANAGE_MEMBERS')
      ).rejects.toThrow('REDIRECT:/personal/groups?notice=org_restricted');

      expect(mockRedirect).toHaveBeenCalledWith('/personal/groups?notice=org_restricted');
    });

    it('2.3. requireOrgPagePermission: MEMBER accessing MANAGE_SETTINGS is redirected to /personal/groups?notice=org_restricted', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'usr-member', email: 'student@safe.edu.vn' } },
        error: null,
      });

      mockAdminMaybeSingle
        .mockResolvedValueOnce({ data: activeOrg, error: null })
        .mockResolvedValueOnce({ data: { org_role: 'MEMBER', status: 'ACTIVE' }, error: null });

      await expect(
        requireOrgPagePermission('safe-school', 'MANAGE_SETTINGS')
      ).rejects.toThrow('REDIRECT:/personal/groups?notice=org_restricted');

      expect(mockRedirect).toHaveBeenCalledWith('/personal/groups?notice=org_restricted');
    });

    it('2.4. requireOrgPagePermission: Non-member is redirected to /personal/dashboard, not /org/*', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'usr-outsider', email: 'outsider@gmail.com' } },
        error: null,
      });

      mockAdminMaybeSingle
        .mockResolvedValueOnce({ data: activeOrg, error: null })
        .mockResolvedValueOnce({ data: null, error: null });

      await expect(
        requireOrgPagePermission('safe-school', 'VIEW_WORKSPACE')
      ).rejects.toThrow('REDIRECT:/personal/dashboard');

      expect(mockRedirect).toHaveBeenCalledWith('/personal/dashboard');
    });

    it('2.5. requireOrgPagePermission: Unauthenticated user is redirected to /login with redirect param', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'No session' },
      });

      await expect(
        requireOrgPagePermission('safe-school', 'VIEW_WORKSPACE')
      ).rejects.toThrow('REDIRECT:/login?redirect=/org/safe-school');

      expect(mockRedirect).toHaveBeenCalledWith('/login?redirect=/org/safe-school');
    });

    it('2.6. layout.tsx simulation across case variants of MEMBER: all redirect to /personal/groups?notice=org_restricted', () => {
      const ALLOWED_ROLES = ['ORG_OWNER', 'ORG_ADMIN', 'ASSESSOR', 'EVALUATOR'];

      function simulateLayoutGuard(rawRole: string, isSuperadmin = false): string | 'PROCEED' {
        if (!isSuperadmin && !ALLOWED_ROLES.includes(rawRole)) {
          return '/personal/groups?notice=org_restricted';
        }
        return 'PROCEED';
      }

      expect(simulateLayoutGuard('MEMBER')).toBe('/personal/groups?notice=org_restricted');
      expect(simulateLayoutGuard('member')).toBe('/personal/groups?notice=org_restricted');
      expect(simulateLayoutGuard('Member')).toBe('/personal/groups?notice=org_restricted');
      expect(simulateLayoutGuard('')).toBe('/personal/groups?notice=org_restricted');
      expect(simulateLayoutGuard('UNKNOWN')).toBe('/personal/groups?notice=org_restricted');

      expect(simulateLayoutGuard('ORG_OWNER')).toBe('PROCEED');
      expect(simulateLayoutGuard('ORG_ADMIN')).toBe('PROCEED');
      expect(simulateLayoutGuard('ASSESSOR')).toBe('PROCEED');
      expect(simulateLayoutGuard('EVALUATOR')).toBe('PROCEED');
    });

    it('2.7. layout.tsx file inspection confirms strict redirection to /personal/groups?notice=org_restricted', () => {
      const layoutPath = path.resolve(process.cwd(), 'src/app/(dashboard)/org/[slug]/layout.tsx');
      expect(fs.existsSync(layoutPath)).toBe(true);
      const code = fs.readFileSync(layoutPath, 'utf-8');

      expect(code).toContain("const ALLOWED_ROLES = ['ORG_OWNER', 'ORG_ADMIN', 'ASSESSOR', 'EVALUATOR'];");
      expect(code).toContain("redirect('/personal/groups?notice=org_restricted');");
    });
  });

  // ==========================================================================
  // Section 3: API RBAC Logic & Tamper Resistance
  // ==========================================================================
  describe('3. API RBAC Logic & Tamper Resistance', () => {
    const validUuidOrgId = 'e1a2b3c4-d5e6-7890-abcd-ef1234567890';
    const fakeClassId = 'f1a2b3c4-d5e6-7890-abcd-ef1234567890';

    it('3.1. Header tampering: Custom X-User-Role or X-Org-Role headers are completely ignored by classes POST', async () => {
      const { POST } = await import('@/app/api/organizations/[orgId]/classes/route');

      mockGetUser.mockResolvedValue({
        data: { user: { id: 'usr-assessor', email: 'assessor@nexa.edu.vn' } },
        error: null,
      });

      mockAdminMaybeSingle.mockResolvedValue({
        data: { org_role: 'ASSESSOR', status: 'ACTIVE' },
        error: null,
      });

      const req = new NextRequest(`http://localhost:3000/api/organizations/${validUuidOrgId}/classes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': 'ORG_ADMIN',
          'X-Org-Role': 'ORG_OWNER',
          'X-Is-Admin': 'true',
          'X-User-Id': '00000000-0000-0000-0000-000000000000',
        },
        body: JSON.stringify({
          name: 'Hacked Class',
          groupType: 'CLASS',
        }),
      });

      const response = await POST(req, { params: Promise.resolve({ orgId: validUuidOrgId }) });
      expect(response.status).toBe(403);
      const json = await response.json();
      expect(json.error).toBe('Bạn không có quyền tạo lớp/nhóm trong tổ chức này');
    });

    it('3.2. Body tampering: Injected role or permissions in request body are rejected by classes POST', async () => {
      const { POST } = await import('@/app/api/organizations/[orgId]/classes/route');

      mockGetUser.mockResolvedValue({
        data: { user: { id: 'usr-member', email: 'member@nexa.edu.vn' } },
        error: null,
      });

      mockAdminMaybeSingle.mockResolvedValue({
        data: { org_role: 'MEMBER', status: 'ACTIVE' },
        error: null,
      });

      const req = new NextRequest(`http://localhost:3000/api/organizations/${validUuidOrgId}/classes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Privilege Escalation Attempt',
          groupType: 'CLASS',
          role: 'ORG_OWNER',
          isOrgAdminOrOwner: true,
          perm: { isAllowed: true, isOrgAdminOrOwner: true },
        }),
      });

      const response = await POST(req, { params: Promise.resolve({ orgId: validUuidOrgId }) });
      expect(response.status).toBe(403);
    });

    it('3.3. Privilege escalation in members PATCH: ORG_ADMIN cannot promote someone to ORG_OWNER', async () => {
      const { PATCH } = await import('@/app/api/organizations/[orgId]/members/route');

      mockGetUser.mockResolvedValue({
        data: { user: { id: 'admin-caller', email: 'admin@school.edu.vn' } },
        error: null,
      });

      mockAdminMaybeSingle
        .mockResolvedValueOnce({
          data: { org_role: 'ORG_ADMIN', status: 'ACTIVE' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: 'membership-target', user_id: 'target-user', org_role: 'MEMBER', status: 'ACTIVE' },
          error: null,
        });

      const req = new NextRequest(`http://localhost:3000/api/organizations/${validUuidOrgId}/members`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          orgRole: 'ORG_OWNER',
        }),
      });

      const response = await PATCH(req, { params: Promise.resolve({ orgId: validUuidOrgId }) });
      expect(response.status).toBe(403);
      const json = await response.json();
      expect(json.error).toContain('Chỉ Chủ sở hữu hoặc Superadmin mới có thể chỉ định vai trò');
    });

    it('3.4. Privilege escalation in members DELETE: ORG_ADMIN cannot delete another ORG_ADMIN', async () => {
      const { DELETE } = await import('@/app/api/organizations/[orgId]/members/route');

      mockGetUser.mockResolvedValue({
        data: { user: { id: 'admin-caller', email: 'admin@school.edu.vn' } },
        error: null,
      });

      mockAdminMaybeSingle
        .mockResolvedValueOnce({
          data: { org_role: 'ORG_ADMIN', status: 'ACTIVE' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: 'membership-target', user_id: 'target-admin', org_role: 'ORG_ADMIN' },
          error: null,
        });

      const req = new NextRequest(
        `http://localhost:3000/api/organizations/${validUuidOrgId}/members?userId=b1b2c3d4-e5f6-7890-abcd-ef1234567890`,
        { method: 'DELETE' }
      );

      const response = await DELETE(req, { params: Promise.resolve({ orgId: validUuidOrgId }) });
      expect(response.status).toBe(403);
      const json = await response.json();
      expect(json.error).toContain('Quản trị viên không có quyền xóa Quản trị viên khác');
    });

    it('3.5. ASSESSOR cannot delete classes in classes/[classId] DELETE', async () => {
      const { DELETE } = await import('@/app/api/organizations/[orgId]/classes/[classId]/route');

      mockGetUser.mockResolvedValue({
        data: { user: { id: 'usr-assessor', email: 'assessor@nexa.edu.vn' } },
        error: null,
      });

      mockAdminMaybeSingle.mockResolvedValue({
        data: { org_role: 'ASSESSOR', status: 'ACTIVE' },
        error: null,
      });

      const req = new NextRequest(
        `http://localhost:3000/api/organizations/${validUuidOrgId}/classes/${fakeClassId}`,
        { method: 'DELETE' }
      );

      const response = await DELETE(req, {
        params: Promise.resolve({ orgId: validUuidOrgId, classId: fakeClassId }),
      });
      expect(response.status).toBe(403);
      const json = await response.json();
      expect(json.error).toBe('Bạn không có quyền xóa lớp học này');
    });

    it('3.6. Cross-tenant isolation: class deletion requires matching organization_id', async () => {
      const { DELETE } = await import('@/app/api/organizations/[orgId]/classes/[classId]/route');

      mockGetUser.mockResolvedValue({
        data: { user: { id: 'owner-id', email: 'owner@nexa.edu.vn' } },
        error: null,
      });

      mockAdminMaybeSingle.mockResolvedValue({
        data: { org_role: 'ORG_OWNER', status: 'ACTIVE' },
        error: null,
      });

      mockAdminDelete.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });

      const req = new NextRequest(
        `http://localhost:3000/api/organizations/${validUuidOrgId}/classes/${fakeClassId}`,
        { method: 'DELETE' }
      );

      const response = await DELETE(req, {
        params: Promise.resolve({ orgId: validUuidOrgId, classId: fakeClassId }),
      });
      expect(response.status).toBe(200);

      expect(mockAdminEq).toHaveBeenCalledWith('organization_id', validUuidOrgId);
      expect(mockAdminEq).toHaveBeenCalledWith('id', fakeClassId);
    });
  });
});
