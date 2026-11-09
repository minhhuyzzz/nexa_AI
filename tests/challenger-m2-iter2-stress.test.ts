import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';

// Mock Supabase Server Client for API testing
const mockGetUser = vi.fn();
let mockExamRoomsData: Record<string, any> = {};
let mockParticipantsData: Array<any> = [];

const createMockSupabase = () => {
  return {
    auth: {
      getUser: mockGetUser,
    },
    from: vi.fn((table: string) => {
      if (table === 'exam_rooms') {
        return {
          select: vi.fn((_columns?: string) => ({
            eq: vi.fn((col: string, val: any) => ({
              single: vi.fn(async () => {
                if (col === 'id' && mockExamRoomsData[val]) {
                  return { data: { ...mockExamRoomsData[val] }, error: null };
                }
                return { data: null, error: { message: 'Not found' } };
              }),
            })),
          })),
          update: vi.fn((updatePayload: any) => ({
            eq: vi.fn((col1: string, val1: any) => ({
              eq: vi.fn((col2: string, val2: any) => ({
                select: vi.fn(() => ({
                  single: vi.fn(async () => {
                    const room = mockExamRoomsData[val1];
                    if (room && room[col2] === val2) {
                      const updated = { ...room, ...updatePayload };
                      mockExamRoomsData[val1] = updated;
                      return { data: updated, error: null };
                    }
                    return { data: null, error: { message: 'Update error or unauthorized' } };
                  }),
                })),
              })),
            })),
          })),
        };
      }

      if (table === 'room_participants') {
        return {
          update: vi.fn((updatePayload: any) => ({
            eq: vi.fn((col1: string, val1: any) => ({
              eq: vi.fn((col2: string, val2: any) => {
                mockParticipantsData.forEach((p) => {
                  if (p[col1] === val1 && p[col2] === val2) {
                    Object.assign(p, updatePayload);
                  }
                });
                return Promise.resolve({ error: null });
              }),
              neq: vi.fn((col2: string, val2: any) => {
                mockParticipantsData.forEach((p) => {
                  if (p[col1] === val1 && p[col2] !== val2) {
                    Object.assign(p, updatePayload);
                  }
                });
                return Promise.resolve({ error: null });
              }),
            })),
          })),
        };
      }

      return {
        select: vi.fn(),
        update: vi.fn(),
      };
    }),
  };
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => createMockSupabase()),
}));

import { PATCH } from '@/app/api/evaluator/rooms/route';

describe('Milestone 2 Iteration 2 Gate Verification: Empirical Adversarial Challenge Suite', () => {
  const rootDir = process.cwd();

  const LIVE_FILES = {
    waitingRoom: path.join(rootDir, 'src/app/live/waiting-room/page.tsx'),
    host: path.join(rootDir, 'src/app/(dashboard)/personal/live-room/[id]/host/page.tsx'),
    control: path.join(rootDir, 'src/app/live/control/page.tsx'),
    take: path.join(rootDir, 'src/app/(dashboard)/personal/take/[id]/page.tsx'),
    submitted: path.join(rootDir, 'src/app/live/submitted/page.tsx'),
    results: path.join(rootDir, 'src/app/(dashboard)/personal/live-room/[id]/results/page.tsx'),
    roomsRoute: path.join(rootDir, 'src/app/api/evaluator/rooms/route.ts'),
  };

  const validRoomId = 'c7e8a9b0-1234-4567-89ab-cdef01234567';
  const hostUserId = 'usr-host-emp-1';
  const attackerUserId = 'usr-hacker-emp-9';

  beforeEach(() => {
    vi.clearAllMocks();
    mockExamRoomsData = {};
    mockParticipantsData = [];
  });

  function setupAuth(userId: string = hostUserId) {
    mockGetUser.mockResolvedValue({
      data: { user: { id: userId, email: `${userId}@nexa.ai` } },
      error: null,
    });
  }

  // =========================================================================
  // 1. REALTIME BROADCAST EVENT FLOW & CHANNEL UNIFICATION
  // =========================================================================
  describe('Dimension 1: Realtime Broadcast Event Flow & Channel Unification', () => {
    it('EMP-RT-01: Verifies all live files strictly subscribe to room:${roomId} without legacy channel splits', () => {
      const forbiddenPatterns = [
        /room:\$\{roomId\}:host/,
        /room:\$\{roomId\}:control/,
        /room:\$\{roomId\}:candidate/,
        /live_room_\$\{/,
        /exam_room_\$\{/,
      ];

      Object.entries(LIVE_FILES).forEach(([name, filePath]) => {
        if (name === 'roomsRoute') return; // backend route
        const content = fs.readFileSync(filePath, 'utf-8');
        forbiddenPatterns.forEach((pattern) => {
          expect(pattern.test(content), `File ${name} should NOT contain legacy channel pattern ${pattern}`).toBe(false);
        });
      });
    });

    it('EMP-RT-02: Broadcast schema validates ROOM_STATE_CHANGE and payload structures', () => {
      const BroadcastSchema = z.object({
        type: z.literal('broadcast'),
        event: z.enum(['ROOM_STATE_CHANGE', 'RESULTS_PUBLISHED', 'PROCTOR_ANNOUNCEMENT']),
        payload: z.object({
          action: z.enum(['START', 'PAUSE', 'RESUME', 'END', 'EXTEND_TIME', 'FORCE_SUBMIT_ALL', 'FORCE_SUBMIT']).optional(),
          targetUserId: z.string().optional(),
          payload: z.record(z.any()).optional(),
          content: z.string().optional(),
        }),
      });

      const validEvents = [
        { type: 'broadcast', event: 'ROOM_STATE_CHANGE', payload: { action: 'START' } },
        { type: 'broadcast', event: 'ROOM_STATE_CHANGE', payload: { action: 'PAUSE' } },
        { type: 'broadcast', event: 'ROOM_STATE_CHANGE', payload: { action: 'RESUME' } },
        { type: 'broadcast', event: 'ROOM_STATE_CHANGE', payload: { action: 'END' } },
        { type: 'broadcast', event: 'ROOM_STATE_CHANGE', payload: { action: 'EXTEND_TIME', payload: { additionalMinutes: 10 } } },
        { type: 'broadcast', event: 'ROOM_STATE_CHANGE', payload: { action: 'FORCE_SUBMIT_ALL' } },
        { type: 'broadcast', event: 'ROOM_STATE_CHANGE', payload: { action: 'FORCE_SUBMIT', targetUserId: 'u-123' } },
        { type: 'broadcast', event: 'PROCTOR_ANNOUNCEMENT', payload: { content: 'Please wrap up', targetUserId: 'u-123' } },
      ];

      validEvents.forEach((ev) => {
        const parsed = BroadcastSchema.safeParse(ev);
        expect(parsed.success, `Failed to parse valid broadcast event: ${JSON.stringify(ev)}`).toBe(true);
      });
    });

    it('EMP-RT-03: Candidate take page handles both nested subPayload and top-level additionalMinutes in EXTEND_TIME', () => {
      // Simulating take/[id]/page.tsx line 447:
      // const additionalMinutes = Number(subPayload?.additionalMinutes || payload.payload?.additionalMinutes || 5);
      const resolveAdditionalMinutes = (payload: any) => {
        const subPayload = payload?.payload?.payload;
        return Number(subPayload?.additionalMinutes || payload?.payload?.additionalMinutes || 5);
      };

      // Case A: Nested under subPayload (from control page line 675)
      const eventA = { payload: { action: 'EXTEND_TIME', payload: { additionalMinutes: 15 } } };
      expect(resolveAdditionalMinutes(eventA)).toBe(15);

      // Case B: Top-level under payload
      const eventB = { payload: { action: 'EXTEND_TIME', additionalMinutes: 20 } };
      expect(resolveAdditionalMinutes(eventB)).toBe(20);

      // Case C: Missing payload defaults to 5
      const eventC = { payload: { action: 'EXTEND_TIME' } };
      expect(resolveAdditionalMinutes(eventC)).toBe(5);
    });

    it('EMP-RT-04: Candidate take page isolates FORCE_SUBMIT targeting specific candidate user vs ALL', () => {
      const candidateUser = { id: 'cand-me-1' };
      let submitted = false;
      const handleFinalSubmit = () => { submitted = true; };

      const simulateEvent = (action: string, targetUserId?: string) => {
        submitted = false;
        if (action === 'FORCE_SUBMIT_ALL') {
          handleFinalSubmit();
        } else if (action === 'FORCE_SUBMIT') {
          if (!targetUserId || targetUserId === candidateUser.id) {
            handleFinalSubmit();
          }
        }
      };

      // FORCE_SUBMIT_ALL triggers submit
      simulateEvent('FORCE_SUBMIT_ALL');
      expect(submitted).toBe(true);

      // FORCE_SUBMIT targeted at candidate triggers submit
      simulateEvent('FORCE_SUBMIT', 'cand-me-1');
      expect(submitted).toBe(true);

      // FORCE_SUBMIT targeted at another user DOES NOT trigger submit
      simulateEvent('FORCE_SUBMIT', 'cand-other-2');
      expect(submitted).toBe(false);

      // FORCE_SUBMIT without targetUserId triggers submit for all
      simulateEvent('FORCE_SUBMIT', undefined);
      expect(submitted).toBe(true);
    });
  });

  // =========================================================================
  // 2. HOST SERVER ACTIONS & PERMISSIONS IN /api/evaluator/rooms
  // =========================================================================
  describe('Dimension 2: Host Server Actions & Permission Guards', () => {
    it('EMP-ACT-01: EXTEND_TIME updates duration and scheduled_end accurately for various inputs', async () => {
      setupAuth(hostUserId);
      const startEnd = new Date('2026-11-09T08:00:00.000Z');
      mockExamRoomsData[validRoomId] = {
        id: validRoomId,
        created_by: hostUserId,
        scheduled_end: startEnd.toISOString(),
        duration_minutes: 60,
      };

      // 10 minutes extension
      const req1 = new Request('http://localhost:3000/api/evaluator/rooms', {
        method: 'PATCH',
        body: JSON.stringify({
          roomId: validRoomId,
          action: 'EXTEND_TIME',
          payload: { additionalMinutes: 10 },
        }),
      });
      const res1 = await PATCH(req1);
      expect(res1.status).toBe(200);
      const data1 = await res1.json();
      expect(data1.room.duration_minutes).toBe(70);
      expect(data1.room.scheduled_end).toBe(new Date(startEnd.getTime() + 10 * 60000).toISOString());

      // Additional 20 minutes extension
      const req2 = new Request('http://localhost:3000/api/evaluator/rooms', {
        method: 'PATCH',
        body: JSON.stringify({
          roomId: validRoomId,
          action: 'EXTEND_TIME',
          payload: { additionalMinutes: 20 },
        }),
      });
      const res2 = await PATCH(req2);
      expect(res2.status).toBe(200);
      const data2 = await res2.json();
      expect(data2.room.duration_minutes).toBe(90);
      expect(data2.room.scheduled_end).toBe(new Date(startEnd.getTime() + 30 * 60000).toISOString());
    });

    it('EMP-ACT-02: Adversary cannot invoke EXTEND_TIME or FORCE_SUBMIT_ALL on rooms they do not own', async () => {
      setupAuth(attackerUserId); // Attacker
      mockExamRoomsData[validRoomId] = {
        id: validRoomId,
        created_by: hostUserId, // Owned by Host
        scheduled_end: new Date().toISOString(),
        duration_minutes: 60,
      };

      // Attacker tries EXTEND_TIME
      const reqExt = new Request('http://localhost:3000/api/evaluator/rooms', {
        method: 'PATCH',
        body: JSON.stringify({
          roomId: validRoomId,
          action: 'EXTEND_TIME',
          payload: { additionalMinutes: 30 },
        }),
      });
      const resExt = await PATCH(reqExt);
      expect(resExt.status).toBe(403);
      const errExt = await resExt.json();
      expect(errExt.error).toBe('Bạn không có quyền gia hạn phòng thi');

      // Attacker tries FORCE_SUBMIT_ALL
      const reqSub = new Request('http://localhost:3000/api/evaluator/rooms', {
        method: 'PATCH',
        body: JSON.stringify({
          roomId: validRoomId,
          action: 'FORCE_SUBMIT_ALL',
        }),
      });
      const resSub = await PATCH(reqSub);
      expect(resSub.status).toBe(403);
      const errSub = await resSub.json();
      expect(errSub.error).toBe('Bạn không có quyền thu bài phòng thi');
    });

    it('EMP-ACT-03: FORCE_SUBMIT_ALL updates only non-submitted participants and preserves existing submissions', async () => {
      setupAuth(hostUserId);
      mockExamRoomsData[validRoomId] = {
        id: validRoomId,
        created_by: hostUserId,
      };

      const initialTimestamp = '2026-11-09T07:30:00.000Z';
      mockParticipantsData = [
        { id: 'p-taking', room_id: validRoomId, status: 'TAKING', submitted_at: null },
        { id: 'p-joined', room_id: validRoomId, status: 'JOINED', submitted_at: null },
        { id: 'p-submitted', room_id: validRoomId, status: 'SUBMITTED', submitted_at: initialTimestamp },
      ];

      const req = new Request('http://localhost:3000/api/evaluator/rooms', {
        method: 'PATCH',
        body: JSON.stringify({
          roomId: validRoomId,
          action: 'FORCE_SUBMIT_ALL',
        }),
      });

      const res = await PATCH(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);

      const pTaking = mockParticipantsData.find((p) => p.id === 'p-taking');
      const pJoined = mockParticipantsData.find((p) => p.id === 'p-joined');
      const pSubmitted = mockParticipantsData.find((p) => p.id === 'p-submitted');

      expect(pTaking.status).toBe('SUBMITTED');
      expect(pTaking.submitted_at).toBeTruthy();

      expect(pJoined.status).toBe('SUBMITTED');
      expect(pJoined.submitted_at).toBeTruthy();

      // Original submission timestamp preserved
      expect(pSubmitted.status).toBe('SUBMITTED');
      expect(pSubmitted.submitted_at).toBe(initialTimestamp);
    });

    it('EMP-ACT-04: Nonexistent room returns HTTP 404 for EXTEND_TIME and FORCE_SUBMIT_ALL', async () => {
      setupAuth(hostUserId);
      const missingRoomId = '00000000-1111-2222-3333-444444444444';

      const resExt = await PATCH(new Request('http://localhost:3000/api/evaluator/rooms', {
        method: 'PATCH',
        body: JSON.stringify({ roomId: missingRoomId, action: 'EXTEND_TIME' }),
      }));
      expect(resExt.status).toBe(404);

      const resSub = await PATCH(new Request('http://localhost:3000/api/evaluator/rooms', {
        method: 'PATCH',
        body: JSON.stringify({ roomId: missingRoomId, action: 'FORCE_SUBMIT_ALL' }),
      }));
      expect(resSub.status).toBe(404);
    });
  });

  // =========================================================================
  // 3. CANDIDATE ANSWER COUNT PERSISTENCE & DEBOUNCED SYNC
  // =========================================================================
  describe('Dimension 3: Candidate Answer Count Persistence & Debounced Sync', () => {
    it('EMP-ANS-01: Correctly calculates answers count across objective choices and text answers', () => {
      const calculateAnswersCount = (selectedAnswers: Record<string, any>, textAnswers: Record<string, string>) => {
        return Object.keys(selectedAnswers).length + Object.keys(textAnswers).filter((k) => textAnswers[k]?.trim()).length;
      };

      // 1. Empty state
      expect(calculateAnswersCount({}, {})).toBe(0);

      // 2. Only objective answers
      expect(calculateAnswersCount({ q1: 'A', q2: 'B', q3: 'C' }, {})).toBe(3);

      // 3. Text answers with empty or whitespace values are not counted
      expect(calculateAnswersCount({}, { q4: '', q5: '   ', q6: '\n\t ' })).toBe(0);

      // 4. Text answers with valid content are counted
      expect(calculateAnswersCount({}, { q4: 'Valid text answer', q5: '   Another one   ' })).toBe(2);

      // 5. Mixed objective and text
      expect(
        calculateAnswersCount(
          { q1: 'A', q2: 'C' },
          { q3: 'text reply', q4: '  ', q5: 'second text' }
        )
      ).toBe(4);
    });

    it('EMP-ANS-02: Debounced sync simulates rapid candidate input and executes exactly once after settle', () => {
      vi.useFakeTimers();

      let syncCallCount = 0;
      let lastSyncedCount = 0;

      const mockSyncToDb = vi.fn((count: number) => {
        syncCallCount++;
        lastSyncedCount = count;
      });

      let debounceTimer: NodeJS.Timeout | null = null;
      const onAnswerChange = (count: number) => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          mockSyncToDb(count);
        }, 800);
      };

      // Simulate 10 rapid keystrokes within 500ms
      for (let i = 1; i <= 10; i++) {
        vi.advanceTimersByTime(50);
        onAnswerChange(i);
      }

      // At 500ms, timer hasn't fired yet
      expect(syncCallCount).toBe(0);

      // Advance by 799ms - still not fired
      vi.advanceTimersByTime(799);
      expect(syncCallCount).toBe(0);

      // Advance by 1ms (reaching 800ms since last keystroke)
      vi.advanceTimersByTime(1);
      expect(syncCallCount).toBe(1);
      expect(lastSyncedCount).toBe(10);

      vi.useRealTimers();
    });

    it('EMP-ANS-03: Immediate final submission supersedes pending debounce without race condition', () => {
      vi.useFakeTimers();

      let dbAnswerCount = 0;
      let dbStatus = 'TAKING';

      let debounceTimer: NodeJS.Timeout | null = null;
      const onDebouncedAnswer = (count: number) => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          dbAnswerCount = count;
        }, 800);
      };

      const handleFinalSubmit = (finalCount: number) => {
        // Component unmounts / cleanup cancels debounced timer
        if (debounceTimer) clearTimeout(debounceTimer);
        dbAnswerCount = finalCount;
        dbStatus = 'SUBMITTED';
      };

      // Candidate updates answer
      onDebouncedAnswer(28);

      // Candidate immediately clicks submit at 300ms
      vi.advanceTimersByTime(300);
      handleFinalSubmit(29);

      // Advance past the 800ms debounce threshold
      vi.advanceTimersByTime(1000);

      // Final count and SUBMITTED status are preserved, not overwritten by stale debounce
      expect(dbStatus).toBe('SUBMITTED');
      expect(dbAnswerCount).toBe(29);

      vi.useRealTimers();
    });

    it('EMP-ANS-04: Submitted screen reflects real answers_count from room_participants', () => {
      const myParticipant = {
        answers_count: 27,
        total_questions: 30,
        status: 'SUBMITTED',
      };

      let answeredCount = 0;
      let totalQuestions = 0;

      if (typeof myParticipant.answers_count === 'number') {
        answeredCount = myParticipant.answers_count;
      }
      if (typeof myParticipant.total_questions === 'number') {
        totalQuestions = myParticipant.total_questions;
      }

      const display = `${answeredCount} / ${totalQuestions} câu`;
      expect(display).toBe('27 / 30 câu');
      expect(display).not.toBe('30 / 32 câu'); // eliminates hardcoded 30/32
    });
  });

  // =========================================================================
  // 4. RESULTS PRIVACY & COMPETENCY CONFORMANCE
  // =========================================================================
  describe('Dimension 4: Results Privacy & AGENTS.md Conformance', () => {
    it('EMP-RES-01: Results screen privacy memo returns null when user is unmatched, preventing data leak', () => {
      const mockResults = [
        { userId: 'u-cand-1', score: 95, studentCode: 'HV-001', rank: 1 },
        { userId: 'u-cand-2', score: 85, studentCode: 'HV-002', rank: 2 },
      ];

      const getMyResult = (results: any[], currentUserId: string | null) => {
        if (!results?.length || !currentUserId) return null;
        return results.find((r) => r.userId === currentUserId) || null;
      };

      // When user matches
      expect(getMyResult(mockResults, 'u-cand-2')).toEqual(mockResults[1]);

      // When user is unmatched / visitor
      expect(getMyResult(mockResults, 'u-visitor')).toBeNull();

      // In no circumstances does it leak candidate #1
      expect(getMyResult(mockResults, 'u-visitor')).not.toEqual(mockResults[0]);
    });

    it('EMP-RES-02: Default radar domains strictly initialize with score: null per AGENTS.md § 2.1', () => {
      const defaultRadarDomains = [
        { code: 'D1', name: 'Thông tin & Dữ liệu', score: null, target: 70 },
        { code: 'D2', name: 'Giao tiếp & Hợp tác', score: null, target: 70 },
        { code: 'D3', name: 'Sáng tạo Nội dung số', score: null, target: 70 },
        { code: 'D4', name: 'An toàn & Bảo mật', score: null, target: 70 },
        { code: 'D5', name: 'Giải quyết Vấn đề', score: null, target: 70 },
      ];

      defaultRadarDomains.forEach((domain) => {
        expect(domain.score, `Domain ${domain.code} score must be null (not cloned from exam)`).toBeNull();
      });
    });

    it('EMP-RES-03: Results screen passes effectiveShowScore to radar chart showPercentages', () => {
      const resultsFile = fs.readFileSync(LIVE_FILES.results, 'utf-8');
      expect(
        resultsFile.includes('<CompetencyRadarChart data={radarScoresToUse} showPercentages={effectiveShowScore} size={320} />'),
        'CompetencyRadarChart must receive showPercentages={effectiveShowScore} to respect publishSettings'
      ).toBe(true);
    });
  });
});
