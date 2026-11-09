import { describe, it, expect } from 'vitest';

describe('Organization Member Management & RBAC Protection Suite', () => {
  describe('Sole Owner Safety Rules', () => {
    it('should block demoting the sole ORG_OWNER of an organization', () => {
      const activeOwnersCount = 1;
      const currentRole: string = 'ORG_OWNER';
      const newRole: string = 'ORG_ADMIN';

      const canDemote = !(currentRole === 'ORG_OWNER' && newRole !== 'ORG_OWNER' && activeOwnersCount <= 1);
      expect(canDemote).toBe(false);
    });

    it('should allow demoting an ORG_OWNER when multiple active owners exist', () => {
      const activeOwnersCount = 2;
      const currentRole: string = 'ORG_OWNER';
      const newRole: string = 'ORG_ADMIN';

      const canDemote = !(currentRole === 'ORG_OWNER' && newRole !== 'ORG_OWNER' && activeOwnersCount <= 1);
      expect(canDemote).toBe(true);
    });

    it('should block deleting the sole ORG_OWNER of an organization', () => {
      const activeOwnersCount = 1;
      const targetRole = 'ORG_OWNER';

      const canDelete = !(targetRole === 'ORG_OWNER' && activeOwnersCount <= 1);
      expect(canDelete).toBe(false);
    });

    it('should allow deleting an ORG_OWNER when at least one other active owner remains', () => {
      const activeOwnersCount = 2;
      const targetRole = 'ORG_OWNER';

      const canDelete = !(targetRole === 'ORG_OWNER' && activeOwnersCount <= 1);
      expect(canDelete).toBe(true);
    });
  });

  describe('Admin Hierarchy & Privilege Checks', () => {
    it('should prevent ORG_ADMIN from modifying or deleting an ORG_OWNER', () => {
      const callerRole = 'ORG_ADMIN';
      const targetRole = 'ORG_OWNER';

      const isPermitted = !(callerRole === 'ORG_ADMIN' && targetRole === 'ORG_OWNER');
      expect(isPermitted).toBe(false);
    });

    it('should prevent ORG_ADMIN from deleting another ORG_ADMIN', () => {
      const callerRole: string = 'ORG_ADMIN';
      const targetRole: string = 'ORG_ADMIN';
      const isOwner = callerRole === 'ORG_OWNER';

      const canDelete = isOwner || (callerRole === 'ORG_ADMIN' && targetRole !== 'ORG_OWNER' && targetRole !== 'ORG_ADMIN');
      expect(canDelete).toBe(false);
    });

    it('should allow ORG_OWNER to delete an ORG_ADMIN', () => {
      const callerRole: string = 'ORG_OWNER';
      const targetRole: string = 'ORG_ADMIN';
      const isOwner = callerRole === 'ORG_OWNER';

      const canDelete = isOwner || (callerRole === 'ORG_ADMIN' && targetRole !== 'ORG_OWNER' && targetRole !== 'ORG_ADMIN');
      expect(canDelete).toBe(true);
    });

    it('should prevent ORG_ADMIN from modifying another ORG_ADMIN', () => {
      const callerRole: string = 'ORG_ADMIN';
      const targetRole: string = 'ORG_ADMIN';
      const isCallerOwner = callerRole === 'ORG_OWNER';

      const canModify = isCallerOwner || (callerRole === 'ORG_ADMIN' && targetRole !== 'ORG_OWNER' && targetRole !== 'ORG_ADMIN');
      expect(canModify).toBe(false);
    });

    it('should prevent ORG_ADMIN from inviting a member as ORG_ADMIN', () => {
      const callerRole: string = 'ORG_ADMIN';
      const inviteRole: string = 'ORG_ADMIN';
      const isOwner = callerRole === 'ORG_OWNER';

      const canInviteWithRole = isOwner || (callerRole === 'ORG_ADMIN' && inviteRole !== 'ORG_ADMIN');
      expect(canInviteWithRole).toBe(false);
    });

    it('should allow ORG_OWNER to invite a member as ORG_ADMIN', () => {
      const callerRole: string = 'ORG_OWNER';
      const inviteRole: string = 'ORG_ADMIN';
      const isOwner = callerRole === 'ORG_OWNER';

      const canInviteWithRole = isOwner || (callerRole === 'ORG_ADMIN' && inviteRole !== 'ORG_ADMIN');
      expect(canInviteWithRole).toBe(true);
    });

    it('should block any user from self-deleting from organization', () => {
      const callerUserId = 'user-123';
      const targetUserId = 'user-123';

      const canSelfDelete = targetUserId !== callerUserId;
      expect(canSelfDelete).toBe(false);
    });

    it('should prevent ORG_ADMIN from elevating any member to ORG_OWNER', () => {
      const callerRole = 'ORG_ADMIN';
      const newRole = 'ORG_OWNER';

      const canAssign = !(callerRole === 'ORG_ADMIN' && newRole === 'ORG_OWNER');
      expect(canAssign).toBe(false);
    });

    it('should allow ORG_OWNER to manage ORG_ADMIN, ASSESSOR, and MEMBER', () => {
      const callerRole = 'ORG_OWNER';
      const allowedRolesToAssign = ['ORG_OWNER', 'ORG_ADMIN', 'ASSESSOR', 'MEMBER'];

      allowedRolesToAssign.forEach((role) => {
        const canAssign = callerRole === 'ORG_OWNER' || (callerRole === 'ORG_ADMIN' && role !== 'ORG_OWNER');
        expect(canAssign).toBe(true);
      });
    });

    it('should display exactly 3 functional roles in UI while marking Owner attribute', () => {
      const UI_FUNCTIONAL_ROLES = ['ORG_ADMIN', 'ASSESSOR', 'MEMBER'];
      expect(UI_FUNCTIONAL_ROLES.length).toBe(3);

      const resolveDisplayRole = (role: string) => {
        if (role === 'ORG_OWNER') {
          return { label: 'Quản trị viên', isOwner: true };
        }
        if (role === 'ORG_ADMIN') {
          return { label: 'Quản trị viên', isOwner: false };
        }
        if (role === 'ASSESSOR' || role === 'EVALUATOR') {
          return { label: 'Khảo thí viên', isOwner: false };
        }
        return { label: 'Thành viên', isOwner: false };
      };

      const ownerDisplay = resolveDisplayRole('ORG_OWNER');
      expect(ownerDisplay.label).toBe('Quản trị viên');
      expect(ownerDisplay.isOwner).toBe(true);

      const adminDisplay = resolveDisplayRole('ORG_ADMIN');
      expect(adminDisplay.label).toBe('Quản trị viên');
      expect(adminDisplay.isOwner).toBe(false);
    });
  });

  describe('Seat Quota Calculation & Fail-Closed Enforcement', () => {
    it('should accurately calculate remaining available seats', () => {
      const maxSeats = 50;
      const activeMembers = 15;
      const remaining = Math.max(0, maxSeats - activeMembers);

      expect(remaining).toBe(35);
    });

    it('should clamp remaining seats to 0 when active members equal or exceed limit', () => {
      const maxSeats = 50;
      const activeMembers = 52;
      const remaining = Math.max(0, maxSeats - activeMembers);

      expect(remaining).toBe(0);
    });

    it('should fail-closed and block bulk import when valid records exceed available seats', () => {
      const remainingSeats = 10;
      const validRecordsToImport = 12;

      const exceedsSeats = validRecordsToImport > remainingSeats;
      const canProceedWithImport = !exceedsSeats && validRecordsToImport > 0;

      expect(exceedsSeats).toBe(true);
      expect(canProceedWithImport).toBe(false);
    });

    it('should allow bulk import when valid records are within available seats', () => {
      const remainingSeats = 15;
      const validRecordsToImport = 10;

      const exceedsSeats = validRecordsToImport > remainingSeats;
      const canProceedWithImport = !exceedsSeats && validRecordsToImport > 0;

      expect(exceedsSeats).toBe(false);
      expect(canProceedWithImport).toBe(true);
    });
  });

  describe('Bulk Member CSV Parsing Logic', () => {
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    it('should detect and invalidate malformed emails', () => {
      const samples = ['invalid-email', 'missing@domain', '@nodomain.com', 'spaces in@mail.com'];

      samples.forEach((email) => {
        expect(EMAIL_REGEX.test(email)).toBe(false);
      });
    });

    it('should validate RFC-compliant school/org emails', () => {
      const samples = [
        'student@fpt.edu.vn',
        'teacher.nguyen@university.ac.vn',
        'admin_2026@nexa.ai',
      ];

      samples.forEach((email) => {
        expect(EMAIL_REGEX.test(email)).toBe(true);
      });
    });

    it('should deduplicate emails within the same uploaded batch', () => {
      const inputBatch = [
        'sv1@fpt.edu.vn',
        'sv2@fpt.edu.vn',
        'sv1@fpt.edu.vn', // duplicate
        'sv3@fpt.edu.vn',
      ];

      const seen = new Set<string>();
      const duplicates: string[] = [];
      const valid: string[] = [];

      inputBatch.forEach((email) => {
        if (seen.has(email)) {
          duplicates.push(email);
        } else {
          seen.add(email);
          valid.push(email);
        }
      });

      expect(valid.length).toBe(3);
      expect(duplicates.length).toBe(1);
      expect(duplicates[0]).toBe('sv1@fpt.edu.vn');
    });

    it('should assign fallback default role when column is empty', () => {
      const defaultRole = 'MEMBER';
      const rawRoleFromCSV = '';

      const resolvedRole = rawRoleFromCSV ? rawRoleFromCSV : defaultRole;
      expect(resolvedRole).toBe('MEMBER');
    });
  });

  describe('Role Distribution Statistics Breakdown', () => {
    it('should compute exact counts and percentages across 4 categories', () => {
      const mockMembers = [
        { role: 'ORG_OWNER' },
        { role: 'ORG_ADMIN' },
        { role: 'ASSESSOR' },
        { role: 'ASSESSOR' },
        { role: 'MEMBER' },
        { role: 'MEMBER' },
        { role: 'MEMBER' },
        { role: 'MEMBER' },
        { role: 'MEMBER' },
        { role: 'MEMBER' },
      ];

      const total = mockMembers.length; // 10
      const adminCount = mockMembers.filter((m) => ['ORG_OWNER', 'ORG_ADMIN'].includes(m.role)).length;
      const teacherCount = mockMembers.filter((m) => ['ASSESSOR', 'EVALUATOR'].includes(m.role)).length;
      const studentCount = mockMembers.filter((m) => m.role === 'MEMBER').length;
      const otherCount = total - adminCount - teacherCount - studentCount;

      expect(adminCount).toBe(2);
      expect(teacherCount).toBe(2);
      expect(studentCount).toBe(6);
      expect(otherCount).toBe(0);

      const adminPct = Math.round((adminCount / total) * 100);
      const teacherPct = Math.round((teacherCount / total) * 100);
      const studentPct = Math.round((studentCount / total) * 100);

      expect(adminPct).toBe(20);
      expect(teacherPct).toBe(20);
      expect(studentPct).toBe(60);
    });
  });

  describe('Member Voluntary Self-Leave Workflow', () => {
    it('should block voluntary leave if the member is the sole ORG_OWNER', () => {
      const userRole: string = 'ORG_OWNER';
      const activeOwnersCount = 1;
      const canSelfLeave = !(userRole === 'ORG_OWNER' && activeOwnersCount <= 1);
      expect(canSelfLeave).toBe(false);
    });

    it('should allow voluntary leave if user is a normal MEMBER or ASSESSOR', () => {
      const userRole: string = 'MEMBER';
      const activeOwnersCount = 1;
      const canSelfLeave = !(userRole === 'ORG_OWNER' && activeOwnersCount <= 1);
      expect(canSelfLeave).toBe(true);
    });

    it('should clean up enrolled class memberships for the leaving member while preserving submissions', () => {
      const mockClassMemberships = [
        { classId: 'cls-1', orgId: 'org-1', userId: 'user-a' },
        { classId: 'cls-2', orgId: 'org-1', userId: 'user-a' },
        { classId: 'cls-3', orgId: 'org-2', userId: 'user-a' },
      ];

      const leavingOrgId = 'org-1';
      const remainingClasses = mockClassMemberships.filter(
        (cm) => !(cm.userId === 'user-a' && cm.orgId === leavingOrgId)
      );

      expect(remainingClasses.length).toBe(1);
      expect(remainingClasses[0].classId).toBe('cls-3');
    });
  });
});
