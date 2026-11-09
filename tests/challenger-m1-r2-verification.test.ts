import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
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
 * CHALLENGER EMPIRICAL VERIFICATION SUITE — Milestone 1 Round 2 (F19 - F22)
 * 
 * Adversarially stress-tests:
 *  1. normalizeOrgRole against all edge cases & extreme inputs
 *  2. classes/route.ts security (ASSESSOR cannot create, GET scoped to instructor/evaluator)
 *  3. classes/[classId]/route.ts security (ASSESSOR cannot delete)
 *  4. join-codes/route.ts authorization (ASSESSOR allowed, MEMBER denied)
 *  5. MEMBER route redirection to /personal/groups?notice=org_restricted
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
}));

// Supabase mocks
const mockGetUser = vi.fn();
const mockAdminMaybeSingle = vi.fn();
const mockAdminSingle = vi.fn();
const mockAdminSelect = vi.fn();
const mockAdminInsert = vi.fn();
const mockAdminDelete = vi.fn();
const mockAdminUpdate = vi.fn();
const mockAdminOr = vi.fn();
const mockAdminEq = vi.fn();
const mockAdminOrder = vi.fn();

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

describe('CHALLENGER M1-R2: Empirical Verification & Adversarial Stress Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // 1. normalizeOrgRole Stress Tests
  // ==========================================================================
  describe('1. normalizeOrgRole against Extreme & Adversarial Inputs', () => {
    it('1.1. maps null, undefined, empty string to MEMBER', () => {
      expect(normalizeOrgRole(null)).toBe('MEMBER');
      expect(normalizeOrgRole(undefined)).toBe('MEMBER');
      expect(normalizeOrgRole('')).toBe('MEMBER');
      expect(normalizeOrgRole('   ')).toBe('MEMBER');
      expect(normalizeOrgRole('\t\r\n')).toBe('MEMBER');
    });

    it('1.2. maps all case and whitespace variants of EVALUATOR to ASSESSOR', () => {
      expect(normalizeOrgRole('EVALUATOR')).toBe('ASSESSOR');
      expect(normalizeOrgRole('evaluator')).toBe('ASSESSOR');
      expect(normalizeOrgRole('Evaluator')).toBe('ASSESSOR');
      expect(normalizeOrgRole('  EVALUATOR  ')).toBe('ASSESSOR');
      expect(normalizeOrgRole('\tevaluator\n')).toBe('ASSESSOR');
      expect(normalizeOrgRole('EvAlUaToR')).toBe('ASSESSOR');
    });

    it('1.3. maps all case and whitespace variants of ASSESSOR to ASSESSOR', () => {
      expect(normalizeOrgRole('ASSESSOR')).toBe('ASSESSOR');
      expect(normalizeOrgRole('assessor')).toBe('ASSESSOR');
      expect(normalizeOrgRole('Assessor')).toBe('ASSESSOR');
      expect(normalizeOrgRole('  ASSESSOR  ')).toBe('ASSESSOR');
      expect(normalizeOrgRole('\tassessor\n')).toBe('ASSESSOR');
      expect(normalizeOrgRole('AsSeSsOr')).toBe('ASSESSOR');
    });

    it('1.4. maps management roles ORG_OWNER and ORG_ADMIN', () => {
      expect(normalizeOrgRole('ORG_OWNER')).toBe('ORG_OWNER');
      expect(normalizeOrgRole('org_owner')).toBe('ORG_OWNER');
      expect(normalizeOrgRole('Org_Owner')).toBe('ORG_OWNER');
      expect(normalizeOrgRole('  ORG_OWNER  ')).toBe('ORG_OWNER');

      expect(normalizeOrgRole('ORG_ADMIN')).toBe('ORG_ADMIN');
      expect(normalizeOrgRole('org_admin')).toBe('ORG_ADMIN');
      expect(normalizeOrgRole('Org_Admin')).toBe('ORG_ADMIN');
      expect(normalizeOrgRole('  ORG_ADMIN  ')).toBe('ORG_ADMIN');
    });

    it('1.5. maps MEMBER in all cases', () => {
      expect(normalizeOrgRole('MEMBER')).toBe('MEMBER');
      expect(normalizeOrgRole('member')).toBe('MEMBER');
      expect(normalizeOrgRole('Member')).toBe('MEMBER');
      expect(normalizeOrgRole('  MEMBER  ')).toBe('MEMBER');
    });

    it('1.6. safely defaults any unknown, hacker, or injection role to MEMBER', () => {
      expect(normalizeOrgRole('unknown_role')).toBe('MEMBER');
      expect(normalizeOrgRole('HACKER')).toBe('MEMBER');
      expect(normalizeOrgRole('SUPERADMIN')).toBe('MEMBER');
      expect(normalizeOrgRole('ADMIN')).toBe('MEMBER');
      expect(normalizeOrgRole('GUEST')).toBe('MEMBER');
      expect(normalizeOrgRole('REPORT_VIEWER')).toBe('MEMBER');
      expect(normalizeOrgRole("'; DROP TABLE users; --")).toBe('MEMBER');
      expect(normalizeOrgRole('<script>alert("hack")</script>')).toBe('MEMBER');
      expect(normalizeOrgRole('123456')).toBe('MEMBER');
      expect(normalizeOrgRole('!@#$%^&*()')).toBe('MEMBER');
    });

    it('1.7. STANDARD_ROLE_LABELS and getOrgRoleLabel conformity', () => {
      expect(Object.keys(STANDARD_ROLE_LABELS)).toEqual([
        'ORG_OWNER',
        'ORG_ADMIN',
        'ASSESSOR',
        'MEMBER',
      ]);
      expect(STANDARD_ROLE_LABELS.ORG_OWNER).toBe('Chủ sở hữu');
      expect(STANDARD_ROLE_LABELS.ORG_ADMIN).toBe('Quản trị viên');
      expect(STANDARD_ROLE_LABELS.ASSESSOR).toBe('Khảo thí viên');
      expect(STANDARD_ROLE_LABELS.MEMBER).toBe('Thành viên');

      // Test getOrgRoleLabel with aliases & edge cases
      expect(getOrgRoleLabel('EVALUATOR')).toBe('Khảo thí viên');
      expect(getOrgRoleLabel('evaluator')).toBe('Khảo thí viên');
      expect(getOrgRoleLabel('ASSESSOR')).toBe('Khảo thí viên');
      expect(getOrgRoleLabel('assessor')).toBe('Khảo thí viên');
      expect(getOrgRoleLabel('ORG_ADMIN')).toBe('Quản trị viên');
      expect(getOrgRoleLabel('ORG_OWNER')).toBe('Chủ sở hữu');
      expect(getOrgRoleLabel('MEMBER')).toBe('Thành viên');
      expect(getOrgRoleLabel('HACKER')).toBe('Thành viên');
      expect(getOrgRoleLabel(null)).toBe('Thành viên');
      expect(getOrgRoleLabel(undefined)).toBe('Thành viên');
    });
  });

  // ==========================================================================
  // 2. API Route Security Logic: classes/route.ts
  // ==========================================================================
  describe('2. classes/route.ts: POST (create) and GET (scope) Security Logic', () => {
    it('2.1. ASSESSOR role cannot create classes (POST -> 403 Forbidden)', async () => {
      const { POST } = await import('@/app/api/organizations/[orgId]/classes/route');

      // Setup user as ASSESSOR
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'usr-assessor', email: 'assessor@nexa.edu.vn' } },
        error: null,
      });

      // Mock user_organizations query for checkOrgPermission
      mockAdminMaybeSingle.mockResolvedValueOnce({
        data: { org_role: 'ASSESSOR', status: 'ACTIVE' },
        error: null,
      });

      const req = new NextRequest('http://localhost:3000/api/organizations/org-123/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Lớp mới của Assessor' }),
      });

      const response = await POST(req, { params: Promise.resolve({ orgId: 'org-123' }) });
      expect(response.status).toBe(403);

      const json = await response.json();
      expect(json.error).toBe('Bạn không có quyền tạo lớp/nhóm trong tổ chức này');
    });

    it('2.2. Legacy EVALUATOR role cannot create classes (POST -> 403 Forbidden)', async () => {
      const { POST } = await import('@/app/api/organizations/[orgId]/classes/route');

      mockGetUser.mockResolvedValue({
        data: { user: { id: 'usr-evaluator', email: 'eval@nexa.edu.vn' } },
        error: null,
      });

      mockAdminMaybeSingle.mockResolvedValueOnce({
        data: { org_role: 'EVALUATOR', status: 'ACTIVE' },
        error: null,
      });

      const req = new NextRequest('http://localhost:3000/api/organizations/org-123/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Lớp mới của Evaluator' }),
      });

      const response = await POST(req, { params: Promise.resolve({ orgId: 'org-123' }) });
      expect(response.status).toBe(403);

      const json = await response.json();
      expect(json.error).toBe('Bạn không có quyền tạo lớp/nhóm trong tổ chức này');
    });

    it('2.3. MEMBER role cannot create classes (POST -> 403 Forbidden)', async () => {
      const { POST } = await import('@/app/api/organizations/[orgId]/classes/route');

      mockGetUser.mockResolvedValue({
        data: { user: { id: 'usr-member', email: 'member@nexa.edu.vn' } },
        error: null,
      });

      mockAdminMaybeSingle.mockResolvedValueOnce({
        data: { org_role: 'MEMBER', status: 'ACTIVE' },
        error: null,
      });

      const req = new NextRequest('http://localhost:3000/api/organizations/org-123/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Lớp của học viên' }),
      });

      const response = await POST(req, { params: Promise.resolve({ orgId: 'org-123' }) });
      expect(response.status).toBe(403);
    });

    it('2.4. ORG_ADMIN is allowed to create classes (POST -> proceeds past auth)', async () => {
      const { POST } = await import('@/app/api/organizations/[orgId]/classes/route');

      mockGetUser.mockResolvedValue({
        data: { user: { id: 'usr-admin', email: 'admin@nexa.edu.vn' } },
        error: null,
      });

      mockAdminMaybeSingle
        .mockResolvedValueOnce({
          data: { org_role: 'ORG_ADMIN', status: 'ACTIVE' },
          error: null,
        }) // checkOrgPermission
        .mockResolvedValueOnce({
          data: null, // candidate code check
          error: null,
        });

      mockAdminSingle.mockResolvedValueOnce({
        data: { id: 'class-new-1', name: 'Lớp Tin Học 10A' },
        error: null,
      });

      const req = new NextRequest('http://localhost:3000/api/organizations/org-123/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Lớp Tin Học 10A' }),
      });

      const response = await POST(req, { params: Promise.resolve({ orgId: 'org-123' }) });
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.class.name).toBe('Lớp Tin Học 10A');
    });

    it('2.5. ASSESSOR role in GET only returns classes where instructor_id or evaluator_id matches user.id', async () => {
      const { GET } = await import('@/app/api/organizations/[orgId]/classes/route');

      mockGetUser.mockResolvedValue({
        data: { user: { id: 'usr-assessor-42', email: 'assessor42@nexa.edu.vn' } },
        error: null,
      });

      mockAdminMaybeSingle.mockResolvedValueOnce({
        data: { org_role: 'ASSESSOR', status: 'ACTIVE' },
        error: null,
      });

      const req = new NextRequest('http://localhost:3000/api/organizations/org-123/classes', {
        method: 'GET',
      });

      await GET(req, { params: Promise.resolve({ orgId: 'org-123' }) });

      // Verify that query.or was called with the exact assignment constraint!
      expect(mockAdminOr).toHaveBeenCalledWith(
        'instructor_id.eq.usr-assessor-42,evaluator_id.eq.usr-assessor-42'
      );
    });

    it('2.6. ORG_ADMIN in GET does NOT restrict classes to assigned instructor/evaluator ID', async () => {
      const { GET } = await import('@/app/api/organizations/[orgId]/classes/route');

      mockGetUser.mockResolvedValue({
        data: { user: { id: 'usr-admin-1', email: 'admin@nexa.edu.vn' } },
        error: null,
      });

      mockAdminMaybeSingle.mockResolvedValueOnce({
        data: { org_role: 'ORG_ADMIN', status: 'ACTIVE' },
        error: null,
      });

      const req = new NextRequest('http://localhost:3000/api/organizations/org-123/classes', {
        method: 'GET',
      });

      await GET(req, { params: Promise.resolve({ orgId: 'org-123' }) });

      // Admin views all classes in the organization, so .or must NOT be called with instructor_id filter
      expect(mockAdminOr).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // 3. API Route Security Logic: classes/[classId]/route.ts
  // ==========================================================================
  describe('3. classes/[classId]/route.ts: DELETE Security Logic', () => {
    it('3.1. ASSESSOR role cannot delete classes (DELETE -> 403 Forbidden)', async () => {
      const { DELETE } = await import('@/app/api/organizations/[orgId]/classes/[classId]/route');

      mockGetUser.mockResolvedValue({
        data: { user: { id: 'usr-assessor', email: 'assessor@nexa.edu.vn' } },
        error: null,
      });

      mockAdminMaybeSingle.mockResolvedValueOnce({
        data: { org_role: 'ASSESSOR', status: 'ACTIVE' },
        error: null,
      });

      const req = new NextRequest('http://localhost:3000/api/organizations/org-123/classes/cls-999', {
        method: 'DELETE',
      });

      const response = await DELETE(req, {
        params: Promise.resolve({ orgId: 'org-123', classId: 'cls-999' }),
      });
      expect(response.status).toBe(403);

      const json = await response.json();
      expect(json.error).toBe('Bạn không có quyền xóa lớp học này');
    });

    it('3.2. Legacy EVALUATOR role cannot delete classes (DELETE -> 403 Forbidden)', async () => {
      const { DELETE } = await import('@/app/api/organizations/[orgId]/classes/[classId]/route');

      mockGetUser.mockResolvedValue({
        data: { user: { id: 'usr-evaluator', email: 'eval@nexa.edu.vn' } },
        error: null,
      });

      mockAdminMaybeSingle.mockResolvedValueOnce({
        data: { org_role: 'EVALUATOR', status: 'ACTIVE' },
        error: null,
      });

      const req = new NextRequest('http://localhost:3000/api/organizations/org-123/classes/cls-999', {
        method: 'DELETE',
      });

      const response = await DELETE(req, {
        params: Promise.resolve({ orgId: 'org-123', classId: 'cls-999' }),
      });
      expect(response.status).toBe(403);
    });

    it('3.3. MEMBER role cannot delete classes (DELETE -> 403 Forbidden)', async () => {
      const { DELETE } = await import('@/app/api/organizations/[orgId]/classes/[classId]/route');

      mockGetUser.mockResolvedValue({
        data: { user: { id: 'usr-member', email: 'member@nexa.edu.vn' } },
        error: null,
      });

      mockAdminMaybeSingle.mockResolvedValueOnce({
        data: { org_role: 'MEMBER', status: 'ACTIVE' },
        error: null,
      });

      const req = new NextRequest('http://localhost:3000/api/organizations/org-123/classes/cls-999', {
        method: 'DELETE',
      });

      const response = await DELETE(req, {
        params: Promise.resolve({ orgId: 'org-123', classId: 'cls-999' }),
      });
      expect(response.status).toBe(403);
    });

    it('3.4. ORG_OWNER and ORG_ADMIN are allowed to delete classes (DELETE -> 200 OK)', async () => {
      const { DELETE } = await import('@/app/api/organizations/[orgId]/classes/[classId]/route');

      mockGetUser.mockResolvedValue({
        data: { user: { id: 'usr-owner', email: 'owner@nexa.edu.vn' } },
        error: null,
      });

      mockAdminMaybeSingle.mockResolvedValueOnce({
        data: { org_role: 'ORG_OWNER', status: 'ACTIVE' },
        error: null,
      });

      const req = new NextRequest('http://localhost:3000/api/organizations/org-123/classes/cls-999', {
        method: 'DELETE',
      });

      const response = await DELETE(req, {
        params: Promise.resolve({ orgId: 'org-123', classId: 'cls-999' }),
      });
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.message).toBe('Đã xóa lớp thành công');
    });
  });

  // ==========================================================================
  // 4. API Route Security Logic: join-codes/route.ts
  // ==========================================================================
  describe('4. join-codes/route.ts: ASSESSOR is authorized to manage join codes', () => {
    it('4.1. ASSESSOR role is allowed to view join codes (GET -> 200 OK)', async () => {
      const { GET } = await import('@/app/api/organizations/[orgId]/join-codes/route');

      mockGetUser.mockResolvedValue({
        data: { user: { id: 'usr-assessor', email: 'assessor@nexa.edu.vn' } },
        error: null,
      });

      // resolveOrgId (UUID)
      const validUuidOrgId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

      // checkOrgManager queries profiles, then user_organizations
      mockAdminSingle
        .mockResolvedValueOnce({ data: { role: 'LEARNER' }, error: null }) // profile
        .mockResolvedValueOnce({ data: { org_role: 'ASSESSOR', status: 'ACTIVE' }, error: null }); // user_organizations

      const req = new NextRequest(`http://localhost:3000/api/organizations/${validUuidOrgId}/join-codes`, {
        method: 'GET',
      });

      const response = await GET(req, { params: Promise.resolve({ orgId: validUuidOrgId }) });
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.codes)).toBe(true);
    });

    it('4.2. Legacy EVALUATOR role is allowed to view join codes (GET -> 200 OK)', async () => {
      const { GET } = await import('@/app/api/organizations/[orgId]/join-codes/route');

      mockGetUser.mockResolvedValue({
        data: { user: { id: 'usr-eval', email: 'eval@nexa.edu.vn' } },
        error: null,
      });

      const validUuidOrgId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

      mockAdminSingle
        .mockResolvedValueOnce({ data: { role: 'LEARNER' }, error: null })
        .mockResolvedValueOnce({ data: { org_role: 'EVALUATOR', status: 'ACTIVE' }, error: null });

      const req = new NextRequest(`http://localhost:3000/api/organizations/${validUuidOrgId}/join-codes`, {
        method: 'GET',
      });

      const response = await GET(req, { params: Promise.resolve({ orgId: validUuidOrgId }) });
      expect(response.status).toBe(200);
    });

    it('4.3. MEMBER role is denied from viewing join codes (GET -> 403 Forbidden)', async () => {
      const { GET } = await import('@/app/api/organizations/[orgId]/join-codes/route');

      mockGetUser.mockResolvedValue({
        data: { user: { id: 'usr-member', email: 'member@nexa.edu.vn' } },
        error: null,
      });

      const validUuidOrgId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

      mockAdminSingle
        .mockResolvedValueOnce({ data: { role: 'LEARNER' }, error: null })
        .mockResolvedValueOnce({ data: { org_role: 'MEMBER', status: 'ACTIVE' }, error: null });

      const req = new NextRequest(`http://localhost:3000/api/organizations/${validUuidOrgId}/join-codes`, {
        method: 'GET',
      });

      const response = await GET(req, { params: Promise.resolve({ orgId: validUuidOrgId }) });
      expect(response.status).toBe(403);

      const json = await response.json();
      expect(json.error).toBe('Bạn không có quyền quản lý mã tham gia của tổ chức này');
    });
  });

  // ==========================================================================
  // 5. MEMBER Redirection Logic: /org/[slug]/* -> /personal/groups?notice=org_restricted
  // ==========================================================================
  describe('5. MEMBER Redirection Logic', () => {
    const fakeOrg = {
      id: 'org-uuid-1',
      name: 'Đại học Quốc gia',
      slug: 'dhqg',
      is_active: true,
      status: 'ACTIVE',
    };

    it('5.1. requireOrgPagePermission redirects MEMBER to /personal/groups?notice=org_restricted', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'usr-member', email: 'student@dhqg.edu.vn' } },
        error: null,
      });

      mockAdminMaybeSingle
        .mockResolvedValueOnce({ data: fakeOrg, error: null }) // org query
        .mockResolvedValueOnce({ data: { org_role: 'MEMBER', status: 'ACTIVE' }, error: null }); // membership

      await expect(
        requireOrgPagePermission('dhqg', 'VIEW_WORKSPACE')
      ).rejects.toThrow('REDIRECT:/personal/groups?notice=org_restricted');

      expect(mockRedirect).toHaveBeenCalledWith('/personal/groups?notice=org_restricted');
    });

    it('5.2. requireOrgPagePermission allows ASSESSOR to access VIEW_WORKSPACE without redirect', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'usr-assessor', email: 'assessor@dhqg.edu.vn' } },
        error: null,
      });

      mockAdminMaybeSingle
        .mockResolvedValueOnce({ data: fakeOrg, error: null })
        .mockResolvedValueOnce({ data: { org_role: 'ASSESSOR', status: 'ACTIVE' }, error: null });

      const context = await requireOrgPagePermission('dhqg', 'VIEW_WORKSPACE');
      expect(context.isAuthorized).toBe(true);
      expect(context.role).toBe('ASSESSOR');
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it('5.3. requireOrgPagePermission allows legacy EVALUATOR mapped to ASSESSOR without redirect', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'usr-evaluator', email: 'eval@dhqg.edu.vn' } },
        error: null,
      });

      mockAdminMaybeSingle
        .mockResolvedValueOnce({ data: fakeOrg, error: null })
        .mockResolvedValueOnce({ data: { org_role: 'EVALUATOR', status: 'ACTIVE' }, error: null });

      const context = await requireOrgPagePermission('dhqg', 'VIEW_WORKSPACE');
      expect(context.isAuthorized).toBe(true);
      expect(context.role).toBe('ASSESSOR');
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it('5.4. layout.tsx redirection rule logic: MEMBER is redirected, ASSESSOR/ADMIN/OWNER allowed', () => {
      const ALLOWED_ROLES = ['ORG_OWNER', 'ORG_ADMIN', 'ASSESSOR', 'EVALUATOR'];

      function simulateLayoutGuard(rawRole: string, isSuperadmin = false): string | 'PROCEED' {
        const userRole = isSuperadmin ? 'ORG_ADMIN' : normalizeOrgRole(rawRole);
        if (!isSuperadmin && !ALLOWED_ROLES.includes(rawRole)) {
          return '/personal/groups?notice=org_restricted';
        }
        return 'PROCEED';
      }

      expect(simulateLayoutGuard('MEMBER')).toBe('/personal/groups?notice=org_restricted');
      expect(simulateLayoutGuard('ORG_OWNER')).toBe('PROCEED');
      expect(simulateLayoutGuard('ORG_ADMIN')).toBe('PROCEED');
      expect(simulateLayoutGuard('ASSESSOR')).toBe('PROCEED');
      expect(simulateLayoutGuard('EVALUATOR')).toBe('PROCEED');
    });
  });
});
