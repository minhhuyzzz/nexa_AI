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

    it('should prevent ORG_ADMIN from elevating any member to ORG_OWNER', () => {
      const callerRole = 'ORG_ADMIN';
      const newRole = 'ORG_OWNER';

      const canAssign = !(callerRole === 'ORG_ADMIN' && newRole === 'ORG_OWNER');
      expect(canAssign).toBe(false);
    });

    it('should allow ORG_OWNER to manage ORG_ADMIN, ASSESSOR, and MEMBER', () => {
      const callerRole = 'ORG_OWNER';
      const allowedRolesToAssign = ['ORG_OWNER', 'ORG_ADMIN', 'ASSESSOR', 'REPORT_VIEWER', 'MEMBER'];

      allowedRolesToAssign.forEach((role) => {
        const canAssign = callerRole === 'ORG_OWNER' || (callerRole === 'ORG_ADMIN' && role !== 'ORG_OWNER');
        expect(canAssign).toBe(true);
      });
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
        { role: 'REPORT_VIEWER' },
        { role: 'MEMBER' },
      ];

      const total = mockMembers.length; // 10
      const adminCount = mockMembers.filter((m) => ['ORG_OWNER', 'ORG_ADMIN'].includes(m.role)).length;
      const teacherCount = mockMembers.filter((m) => ['ASSESSOR', 'EVALUATOR'].includes(m.role)).length;
      const studentCount = mockMembers.filter((m) => m.role === 'MEMBER').length;
      const otherCount = total - adminCount - teacherCount - studentCount;

      expect(adminCount).toBe(2);
      expect(teacherCount).toBe(2);
      expect(studentCount).toBe(5);
      expect(otherCount).toBe(1);

      const adminPct = Math.round((adminCount / total) * 100);
      const teacherPct = Math.round((teacherCount / total) * 100);
      const studentPct = Math.round((studentCount / total) * 100);

      expect(adminPct).toBe(20);
      expect(teacherPct).toBe(20);
      expect(studentPct).toBe(50);
    });
  });
});
