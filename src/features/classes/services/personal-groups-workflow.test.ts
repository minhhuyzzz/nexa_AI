import { describe, it, expect } from 'vitest';

describe('Personal Groups & Classes Workflow (9 Screens)', () => {
  describe('Unified Space Monogram Generation', () => {
    function getSpaceMonogram(name: string): string {
      return (name.trim() ? name.trim()[0] : 'K').toUpperCase();
    }

    it('generates uppercase monogram for any class or study group name', () => {
      expect(getSpaceMonogram('Lớp Kỹ năng số K48')).toBe('L');
      expect(getSpaceMonogram('Nhóm Ôn tập Tin học')).toBe('N');
      expect(getSpaceMonogram('chuyên đề An toàn thông tin')).toBe('C');
      expect(getSpaceMonogram('')).toBe('K');
    });
  });

  describe('Workspace Isolation (Personal vs Organization)', () => {
    it('strictly filters out classes that belong to an organization', () => {
      const sampleClasses = [
        { id: '1', name: 'Lớp cá nhân 1', organization_id: null },
        { id: '2', name: 'Lớp Trường Đại học CNTT', organization_id: 'org-123' },
        { id: '3', name: 'Nhóm học tập cá nhân', organization_id: null },
        { id: '4', name: 'Lớp Doanh nghiệp Corp', organization_id: 'org-456' },
      ];

      const personalClasses = sampleClasses.filter((c) => c.organization_id === null);
      expect(personalClasses.length).toBe(2);
      expect(personalClasses.map((c) => c.id)).toEqual(['1', '3']);
      expect(personalClasses.some((c) => c.organization_id !== null)).toBe(false);
    });
  });

  describe('Role-based Tabs & Permission Enforcement', () => {
    function getAllowedTabs(isOwner: boolean): string[] {
      if (isOwner) {
        return ['stream', 'assignments', 'materials', 'members', 'settings'];
      }
      return ['stream', 'assignments', 'materials', 'members'];
    }

    it('grants 5 tabs including settings to owner', () => {
      const ownerTabs = getAllowedTabs(true);
      expect(ownerTabs.length).toBe(5);
      expect(ownerTabs).toContain('settings');
    });

    it('restricts member to 4 tabs and excludes settings', () => {
      const memberTabs = getAllowedTabs(false);
      expect(memberTabs.length).toBe(4);
      expect(memberTabs).not.toContain('settings');
    });
  });

  describe('Code Normalization & Member Preview Verification', () => {
    function normalizeClassCode(input: string): string {
      return input.trim().toUpperCase();
    }

    it('normalizes input codes cleanly', () => {
      expect(normalizeClassCode('  cls-4821  ')).toBe('CLS-4821');
      expect(normalizeClassCode('k48-ai')).toBe('K48-AI');
      expect(normalizeClassCode('nx-group-1')).toBe('NX-GROUP-1');
    });

    it('computes correct member access status in preview', () => {
      const currentUserId = 'user-abc';
      const classOwnerId = 'user-abc';
      const enrolledUserIds = ['user-1', 'user-2'];

      const isOwner = classOwnerId === currentUserId;
      const isMember = enrolledUserIds.includes(currentUserId);

      expect(isOwner).toBe(true);
      expect(isMember).toBe(false);
    });
  });

  describe('Pending Assignments Metric Calculation', () => {
    it('accurately computes pending assignments for learner', () => {
      const classAssignments = [
        { id: 'ca-1', assessment_id: 'asm-1' },
        { id: 'ca-2', assessment_id: 'asm-2' },
        { id: 'ca-3', assessment_id: 'asm-3' },
      ];

      const userSubmissions = [
        { class_assignment_id: 'ca-1', status: 'SUBMITTED' },
        { class_assignment_id: 'ca-2', status: 'EVALUATED' },
      ];

      const submittedSet = new Set(userSubmissions.map((s) => s.class_assignment_id));
      const pendingCount = classAssignments.filter((a) => !submittedSet.has(a.id)).length;

      expect(pendingCount).toBe(1); // ca-3 is still pending
    });
  });

  describe('Chat Drawer Quote & 15-Minute Deletion Policy', () => {
    function parseQuotedMessage(rawContent: string) {
      const match = rawContent.match(/^> \[([^\]]+)\]: (.*?)\n([\s\S]*)$/);
      if (match) {
        return {
          isQuoted: true,
          quoteAuthor: match[1],
          quoteSnippet: match[2],
          actualContent: match[3],
        };
      }
      return {
        isQuoted: false,
        actualContent: rawContent,
      };
    }

    function canDeleteChatMessage(
      isEvaluator: boolean,
      isSender: boolean,
      messageCreatedAt: string,
      now: number = Date.now()
    ): boolean {
      if (isEvaluator) return true;
      if (!isSender) return false;

      const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
      const age = now - new Date(messageCreatedAt).getTime();
      return age <= FIFTEEN_MINUTES_MS;
    }

    it('parses quoted replies correctly without requiring DB schema changes', () => {
      const quoted = '> [Minh Huy]: Chào mừng các bạn đến với lớp\nDạ em cảm ơn thầy!';
      const parsed = parseQuotedMessage(quoted);

      expect(parsed.isQuoted).toBe(true);
      expect(parsed.quoteAuthor).toBe('Minh Huy');
      expect(parsed.quoteSnippet).toBe('Chào mừng các bạn đến với lớp');
      expect(parsed.actualContent).toBe('Dạ em cảm ơn thầy!');

      const plain = 'Đây là tin nhắn thường không trích dẫn';
      const parsedPlain = parseQuotedMessage(plain);
      expect(parsedPlain.isQuoted).toBe(false);
      expect(parsedPlain.actualContent).toBe(plain);
    });

    it('allows sender to delete their message within 15 minutes', () => {
      const now = Date.now();
      const tenMinsAgo = new Date(now - 10 * 60 * 1000).toISOString();

      const canDelete = canDeleteChatMessage(false, true, tenMinsAgo, now);
      expect(canDelete).toBe(true);
    });

    it('blocks sender from deleting their message after 15 minutes', () => {
      const now = Date.now();
      const twentyMinsAgo = new Date(now - 20 * 60 * 1000).toISOString();

      const canDelete = canDeleteChatMessage(false, true, twentyMinsAgo, now);
      expect(canDelete).toBe(false);
    });

    it('allows managers/evaluators to delete any message anytime for moderation', () => {
      const now = Date.now();
      const threeDaysAgo = new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString();

      const canDeleteAsManager = canDeleteChatMessage(true, false, threeDaysAgo, now);
      expect(canDeleteAsManager).toBe(true);
    });
  });
});
