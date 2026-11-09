import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { NextRequest } from 'next/server';
import {
  normalizeOrgRole,
  STANDARD_ROLE_LABELS,
  getOrgRoleLabel,
} from '@/lib/auth/org-guard';
import * as acceptanceModule from './round2-acceptance.test';

// Mocks for Supabase clients
const mockAuthUser = vi.fn();
const mockAdminFrom = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mockAuthUser,
    },
  })),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: mockAdminFrom,
  })),
}));

vi.mock('@/lib/auth/superadmin', () => ({
  isSuperadminEmail: vi.fn((email?: string) => email === 'superadmin@nexa.ai'),
}));

describe('Milestone 1 Iteration 2 Remediation Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // Finding 1: Org Layout Guard Casing Check
  // ==========================================================================
  describe('Finding 1: Org Layout Guard Casing & UserRole verification', () => {
    const layoutFilePath = path.join(
      process.cwd(),
      'src/app/(dashboard)/org/[slug]/layout.tsx'
    );
    const layoutSource = fs.readFileSync(layoutFilePath, 'utf-8');

    it('remediation 1.1: layout.tsx tests userRole, NOT rawRole, in ALLOWED_ROLES check', () => {
      // Must not check rawRole directly against uppercase ALLOWED_ROLES
      expect(layoutSource).not.toContain('!ALLOWED_ROLES.includes(rawRole)');
      // Must check normalized userRole
      expect(layoutSource).toContain('!ALLOWED_ROLES.includes(userRole)');
    });

    it('remediation 1.2: lowercase "evaluator" and "assessor" are correctly permitted without redirection', () => {
      const ALLOWED_ROLES = ['ORG_OWNER', 'ORG_ADMIN', 'ASSESSOR', 'EVALUATOR'];

      // Simulate raw roles from database
      const testCases = [
        { raw: 'evaluator', expectedAllowed: true },
        { raw: 'assessor', expectedAllowed: true },
        { raw: 'Assessor', expectedAllowed: true },
        { raw: 'EVALUATOR', expectedAllowed: true },
        { raw: 'org_admin', expectedAllowed: true },
        { raw: 'ORG_ADMIN', expectedAllowed: true },
        { raw: 'org_owner', expectedAllowed: true },
        { raw: 'ORG_OWNER', expectedAllowed: true },
        { raw: 'member', expectedAllowed: false },
        { raw: 'MEMBER', expectedAllowed: false },
        { raw: null, expectedAllowed: false },
        { raw: undefined, expectedAllowed: false },
      ];

      for (const tc of testCases) {
        const userRole = normalizeOrgRole(tc.raw);
        const isBlocked = !ALLOWED_ROLES.includes(userRole);
        expect(!isBlocked).toBe(tc.expectedAllowed);
      }
    });
  });

  // ==========================================================================
  // Finding 2: Classes [classId] Route Security & PATCH Privilege Check
  // ==========================================================================
  describe('Finding 2: classes/[classId] Horizontal Privilege Escalation in PATCH & Casing in checkOrgPermission', () => {
    const routeFilePath = path.join(
      process.cwd(),
      'src/app/api/organizations/[orgId]/classes/[classId]/route.ts'
    );
    const routeSource = fs.readFileSync(routeFilePath, 'utf-8');

    it('remediation 2.1: checkOrgPermission computes isManager using normalizedRole === "ASSESSOR"', () => {
      expect(routeSource).toContain(
        "isManager: isOrgAdminOrOwner || normalizedRole === 'ASSESSOR'"
      );
    });

    it('remediation 2.2: PATCH handler queries existing class to verify instructor_id or evaluator_id ownership', () => {
      expect(routeSource).toContain('.select(\'instructor_id, evaluator_id\')');
      expect(routeSource).toContain('existingClass.instructor_id !== user.id');
      expect(routeSource).toContain('existingClass.evaluator_id !== user.id');
      expect(routeSource).toContain('Bạn chỉ có thể chỉnh sửa lớp học được phân công');
    });

    it('remediation 2.3: ASSESSOR cannot PATCH classes assigned to other instructors (403 Forbidden)', async () => {
      const { PATCH } = await import(
        '@/app/api/organizations/[orgId]/classes/[classId]/route'
      );

      const assessorId = 'assessor-uuid-1';
      const otherInstructorId = 'other-instructor-uuid-2';
      const validOrgId = 'a0000000-0000-4000-8000-000000000001';
      const classId = 'b0000000-0000-4000-8000-000000000002';

      mockAuthUser.mockResolvedValue({
        data: { user: { id: assessorId, email: 'assessor@nexa.ai' } },
        error: null,
      });

      // Mock user_organizations returning lowercase 'assessor' to also test casing fix
      mockAdminFrom.mockImplementation((table: string) => {
        if (table === 'user_organizations') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockImplementation((col: string, val: string) => {
              return {
                eq: vi.fn().mockImplementation(() => ({
                  eq: vi.fn().mockImplementation(() => ({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: { org_role: 'assessor', status: 'ACTIVE' },
                      error: null,
                    }),
                  })),
                })),
              };
            }),
          };
        }
        if (table === 'evaluator_classes') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockImplementation((col: string, val: string) => ({
              eq: vi.fn().mockImplementation(() => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    id: classId,
                    instructor_id: otherInstructorId,
                    evaluator_id: otherInstructorId,
                  },
                  error: null,
                }),
              })),
            })),
          };
        }
        return {};
      });

      const req = new NextRequest(
        `http://localhost:3000/api/organizations/${validOrgId}/classes/${classId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ name: 'Hacked Class Name' }),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const res = await PATCH(req, {
        params: Promise.resolve({ orgId: validOrgId, classId }),
      });

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toBe('Bạn chỉ có thể chỉnh sửa lớp học được phân công');
    });

    it('remediation 2.4: Assigned ASSESSOR can successfully PATCH their assigned class', async () => {
      const { PATCH } = await import(
        '@/app/api/organizations/[orgId]/classes/[classId]/route'
      );

      const assessorId = 'assessor-uuid-1';
      const validOrgId = 'a0000000-0000-4000-8000-000000000001';
      const classId = 'b0000000-0000-4000-8000-000000000002';

      mockAuthUser.mockResolvedValue({
        data: { user: { id: assessorId, email: 'assessor@nexa.ai' } },
        error: null,
      });

      mockAdminFrom.mockImplementation((table: string) => {
        if (table === 'user_organizations') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockImplementation(() => ({
              eq: vi.fn().mockImplementation(() => ({
                eq: vi.fn().mockImplementation(() => ({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { org_role: 'ASSESSOR', status: 'ACTIVE' },
                    error: null,
                  }),
                })),
              })),
            })),
          };
        }
        if (table === 'evaluator_classes') {
          const updateChain = {
            eq: vi.fn().mockImplementation(() => updateChain),
            select: vi.fn().mockImplementation(() => updateChain),
            single: vi.fn().mockResolvedValue({
              data: { id: classId, name: 'Legitimate Update' },
              error: null,
            }),
          };

          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockImplementation(() => ({
              eq: vi.fn().mockImplementation(() => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    id: classId,
                    instructor_id: assessorId, // Caller IS the instructor
                    evaluator_id: null,
                  },
                  error: null,
                }),
              })),
            })),
            update: vi.fn().mockReturnValue(updateChain),
          };
        }
        return {};
      });

      const req = new NextRequest(
        `http://localhost:3000/api/organizations/${validOrgId}/classes/${classId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ name: 'Legitimate Update' }),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const res = await PATCH(req, {
        params: Promise.resolve({ orgId: validOrgId, classId }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });

    it('remediation 2.5: ORG_ADMIN can PATCH any class in the organization regardless of assigned instructor', async () => {
      const { PATCH } = await import(
        '@/app/api/organizations/[orgId]/classes/[classId]/route'
      );

      const adminId = 'admin-uuid-1';
      const otherInstructorId = 'other-instructor-uuid-2';
      const validOrgId = 'a0000000-0000-4000-8000-000000000001';
      const classId = 'b0000000-0000-4000-8000-000000000002';

      mockAuthUser.mockResolvedValue({
        data: { user: { id: adminId, email: 'admin@nexa.ai' } },
        error: null,
      });

      mockAdminFrom.mockImplementation((table: string) => {
        if (table === 'user_organizations') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockImplementation(() => ({
              eq: vi.fn().mockImplementation(() => ({
                eq: vi.fn().mockImplementation(() => ({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { org_role: 'ORG_ADMIN', status: 'ACTIVE' },
                    error: null,
                  }),
                })),
              })),
            })),
          };
        }
        if (table === 'evaluator_classes') {
          const updateChain = {
            eq: vi.fn().mockImplementation(() => updateChain),
            select: vi.fn().mockImplementation(() => updateChain),
            single: vi.fn().mockResolvedValue({
              data: { id: classId, name: 'Admin Updated Class' },
              error: null,
            }),
          };

          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockImplementation(() => ({
              eq: vi.fn().mockImplementation(() => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    id: classId,
                    instructor_id: otherInstructorId,
                    evaluator_id: otherInstructorId,
                  },
                  error: null,
                }),
              })),
            })),
            update: vi.fn().mockReturnValue(updateChain),
          };
        }
        return {};
      });

      const req = new NextRequest(
        `http://localhost:3000/api/organizations/${validOrgId}/classes/${classId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ name: 'Admin Updated Class' }),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const res = await PATCH(req, {
        params: Promise.resolve({ orgId: validOrgId, classId }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });

    it('remediation 2.6: PATCH returns 404 if class does not exist', async () => {
      const { PATCH } = await import(
        '@/app/api/organizations/[orgId]/classes/[classId]/route'
      );

      const validOrgId = 'a0000000-0000-4000-8000-000000000001';
      const nonExistentClassId = 'c0000000-0000-4000-8000-000000000003';

      mockAuthUser.mockResolvedValue({
        data: { user: { id: 'admin-uuid-1', email: 'admin@nexa.ai' } },
        error: null,
      });

      mockAdminFrom.mockImplementation((table: string) => {
        if (table === 'user_organizations') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockImplementation(() => ({
              eq: vi.fn().mockImplementation(() => ({
                eq: vi.fn().mockImplementation(() => ({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { org_role: 'ORG_ADMIN', status: 'ACTIVE' },
                    error: null,
                  }),
                })),
              })),
            })),
          };
        }
        if (table === 'evaluator_classes') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockImplementation(() => ({
              eq: vi.fn().mockImplementation(() => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              })),
            })),
          };
        }
        return {};
      });

      const req = new NextRequest(
        `http://localhost:3000/api/organizations/${validOrgId}/classes/${nonExistentClassId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ name: 'Missing Class' }),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const res = await PATCH(req, {
        params: Promise.resolve({ orgId: validOrgId, classId: nonExistentClassId }),
      });

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toBe('Không tìm thấy lớp học');
    });
  });

  // ==========================================================================
  // Finding 3: Join Codes Casing Check (join-codes/route.ts)
  // ==========================================================================
  describe('Finding 3: join-codes/route.ts Casing & normalizeOrgRole check', () => {
    const joinCodesFilePath = path.join(
      process.cwd(),
      'src/app/api/organizations/[orgId]/join-codes/route.ts'
    );
    const joinCodesSource = fs.readFileSync(joinCodesFilePath, 'utf-8');

    it('remediation 3.1: join-codes/route.ts imports and uses normalizeOrgRole', () => {
      expect(joinCodesSource).toContain("import { normalizeOrgRole } from '@/lib/auth/org-guard'");
      expect(joinCodesSource).toContain('const norm = normalizeOrgRole(member?.org_role)');
      expect(joinCodesSource).toContain(
        "return Boolean(norm === 'ORG_OWNER' || norm === 'ORG_ADMIN' || norm === 'ASSESSOR')"
      );
    });

    it('remediation 3.2: checkOrgManager logic grants access for lowercase and legacy roles', () => {
      const allowedRoles = ['ORG_OWNER', 'ORG_ADMIN', 'ASSESSOR'];

      const cases = [
        { member: { org_role: 'assessor' }, expected: true },
        { member: { org_role: 'evaluator' }, expected: true },
        { rawRole: 'Assessor', expected: true },
        { member: { org_role: 'org_admin' }, expected: true },
        { member: { org_role: 'org_owner' }, expected: true },
        { member: { org_role: 'MEMBER' }, expected: false },
        { member: { org_role: 'member' }, expected: false },
        { member: null, expected: false },
        { member: undefined, expected: false },
      ];

      for (const c of cases) {
        const role = c.member ? c.member.org_role : c.rawRole;
        const norm = normalizeOrgRole(role);
        const isManager = Boolean(
          norm === 'ORG_OWNER' || norm === 'ORG_ADMIN' || norm === 'ASSESSOR'
        );
        expect(isManager).toBe(c.expected);
      }
    });
  });

  // ==========================================================================
  // Finding 4: Acceptance Test Suite Production Imports
  // ==========================================================================
  describe('Finding 4: tests/e2e/round2-acceptance.test.ts imports from production', () => {
    const acceptanceFilePath = path.join(
      process.cwd(),
      'tests/e2e/round2-acceptance.test.ts'
    );
    const acceptanceSource = fs.readFileSync(acceptanceFilePath, 'utf-8');

    it('remediation 4.1: acceptance test imports normalizeOrgRole from @/lib/auth/org-guard', () => {
      expect(acceptanceSource).toMatch(
        /import\s*\{[^}]*normalizeOrgRole[^}]*\}\s*from\s*['"]@\/lib\/auth\/org-guard['"]/
      );
      expect(acceptanceSource).toMatch(
        /import\s*\{[^}]*STANDARD_ROLE_LABELS[^}]*\}\s*from\s*['"]@\/lib\/auth\/org-guard['"]/
      );
      expect(acceptanceSource).toMatch(
        /import\s*\{[^}]*getOrgRoleLabel[^}]*\}\s*from\s*['"]@\/lib\/auth\/org-guard['"]/
      );
    });

    it('remediation 4.2: exported functions from round2-acceptance match production org-guard in memory', () => {
      // Must be identical reference since re-exported from @/lib/auth/org-guard
      expect(acceptanceModule.normalizeOrgRole).toBe(normalizeOrgRole);
      expect(acceptanceModule.STANDARD_ROLE_LABELS).toBe(STANDARD_ROLE_LABELS);
      expect(acceptanceModule.getOrgRoleLabel).toBe(getOrgRoleLabel);
    });
  });
});
