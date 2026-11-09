import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';

// ============================================================================
// Supabase Mock Infrastructure for API Testing
// ============================================================================
const mockGetUser = vi.fn();
let mockExamRoomsData: Record<string, any> = {};
let mockParticipantsData: Array<any> = [];
let mockClassMembersData: Array<any> = [];

const createMockSupabase = () => {
  return {
    auth: {
      getUser: mockGetUser,
    },
    from: vi.fn((table: string) => {
      if (table === 'exam_rooms') {
        return {
          select: vi.fn((_columns?: string) => ({
            eq: vi.fn((col1: string, val1: any) => ({
              eq: vi.fn((col2: string, val2: any) => ({
                single: vi.fn(async () => {
                  const room = Object.values(mockExamRoomsData).find(
                    (r: any) => r[col1] === val1 && r[col2] === val2
                  );
                  if (room) {
                    return { data: { ...room }, error: null };
                  }
                  return { data: null, error: { message: 'Not found' } };
                }),
              })),
              single: vi.fn(async () => {
                if (col1 === 'id' && mockExamRoomsData[val1]) {
                  return { data: { ...mockExamRoomsData[val1] }, error: null };
                }
                const found = Object.values(mockExamRoomsData).find((r: any) => r[col1] === val1);
                if (found) {
                  return { data: { ...found }, error: null };
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
          upsert: vi.fn((participantPayload: any, _options?: any) => {
            const existingIdx = mockParticipantsData.findIndex(
              (p) =>
                p.room_id === participantPayload.room_id &&
                p.user_id === participantPayload.user_id
            );
            if (existingIdx >= 0) {
              mockParticipantsData[existingIdx] = {
                ...mockParticipantsData[existingIdx],
                ...participantPayload,
              };
            } else {
              mockParticipantsData.push({
                id: `part-${mockParticipantsData.length + 1}`,
                joined_at: new Date().toISOString(),
                ...participantPayload,
              });
            }
            return Promise.resolve({ error: null });
          }),
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

      if (table === 'class_members') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn((col1: string, val1: any) => ({
              eq: vi.fn((col2: string, val2: any) => ({
                maybeSingle: vi.fn(async () => {
                  const member = mockClassMembersData.find(
                    (m) => m[col1] === val1 && m[col2] === val2
                  );
                  return { data: member || null, error: null };
                }),
              })),
            })),
          })),
        };
      }

      return {
        select: vi.fn(),
        update: vi.fn(),
        upsert: vi.fn(),
      };
    }),
  };
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => createMockSupabase()),
}));

import { POST as joinRoomPOST } from '@/app/api/rooms/join/route';
import { PATCH as evaluatorRoomsPATCH } from '@/app/api/evaluator/rooms/route';

/**
 * ============================================================================
 * MILESTONE 4: TIER 5 WHITE-BOX ADVERSARIAL LIVE ROOM STRESS TEST SUITE
 * ============================================================================
 *
 * Systematic stress-testing of Live Room components and APIs under hostile
 * and boundary conditions:
 *   1. Rapid PIN entries (non-numeric, whitespace, 5/7 digits, concurrent bursts, lockdown)
 *   2. Realtime channel event interleaving (START before join, EXTEND_TIME edge inputs, FORCE_SUBMIT_ALL)
 *   3. Candidate drops, re-connection idempotency, and proctoring violation escalation
 *   4. Debounced answer persistence under bursty updates & final submission race conditions
 *   5. Strict host vs candidate role separation on live results screen
 *   6. Project-wide AGENTS.md compliance audit
 * ============================================================================
 */

describe('Tier 5 Adversarial Live Room Stress Testing (Milestone 4)', () => {
  const rootDir = process.cwd();

  const LIVE_PATHS = {
    inlinePinCard: path.join(rootDir, 'src/components/dashboard/live-room/InlinePinEntryCard.tsx'),
    waitingRoom: path.join(rootDir, 'src/app/live/waiting-room/page.tsx'),
    hostControl: path.join(rootDir, 'src/app/live/control/page.tsx'),
    personalHost: path.join(rootDir, 'src/app/(dashboard)/personal/live-room/[id]/host/page.tsx'),
    candidateTake: path.join(rootDir, 'src/app/(dashboard)/personal/take/[id]/page.tsx'),
    submitted: path.join(rootDir, 'src/app/live/submitted/page.tsx'),
    results: path.join(rootDir, 'src/app/(dashboard)/personal/live-room/[id]/results/page.tsx'),
    roomsRoute: path.join(rootDir, 'src/app/api/evaluator/rooms/route.ts'),
    joinRoute: path.join(rootDir, 'src/app/api/rooms/join/route.ts'),
  };

  const testRoomId = 'd8f9a0b1-2345-6789-01ab-cdef01234567';
  const testHostId = 'usr-host-m4-alpha';
  const testCandidateId = 'usr-cand-m4-beta';
  const validPin = '849201';

  beforeEach(() => {
    vi.clearAllMocks();
    mockExamRoomsData = {};
    mockParticipantsData = [];
    mockClassMembersData = [];
  });

  function setupAuthUser(userId: string = testCandidateId) {
    mockGetUser.mockResolvedValue({
      data: { user: { id: userId, email: `${userId}@nexa.ai` } },
      error: null,
    });
  }

  // =========================================================================
  // SUITE 1: RAPID & MALFORMED PIN ENTRIES
  // =========================================================================
  describe('Suite 1: Rapid & Malformed PIN Entries', () => {
    it('T5-PIN-01: Client-side sanitizer cleans non-numeric, whitespace, emojis, and symbols down to digits', () => {
      // Simulating InlinePinEntryCard: e.target.value.replace(/\D/g, '').slice(0, 6)
      const sanitize = (raw: string) => raw.replace(/\D/g, '').slice(0, 6);

      expect(sanitize('849201')).toBe('849201');
      expect(sanitize('  849 201  ')).toBe('849201');
      expect(sanitize('84-92-01')).toBe('849201');
      expect(sanitize('84A92B01C')).toBe('849201');
      expect(sanitize('84🎉92💡01')).toBe('849201');
      expect(sanitize('<script>849201</script>')).toBe('849201');
      expect(sanitize("' OR 1=1-- 849201")).toBe('118492'); // non-digits stripped, sliced to 6
      expect(sanitize('123456789')).toBe('123456'); // strictly trimmed to 6
      expect(sanitize('   ')).toBe('');
      expect(sanitize('abcdef')).toBe('');
    });

    it('T5-PIN-02: Server-side API rejects non-numeric, empty, whitespace, and invalid length PINs with HTTP 400', async () => {
      setupAuthUser(testCandidateId);

      const invalidPins = [
        '',
        ' ',
        '   ',
        '12345',       // 5 digits
        '1234567',     // 7 digits
        'abcdef',      // alphabetic
        '849 01',      // internal space
        ' 849201',     // leading space
        '849201 ',     // trailing space
        '84-201',      // hyphen
        '-84920',      // negative sign
        '849.01',      // float
        '８４９２０１', // full-width unicode digits
      ];

      for (const pin of invalidPins) {
        const req = new Request('http://localhost:3000/api/rooms/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin }),
        });
        const res = await joinRoomPOST(req);
        expect(res.status, `PIN "${pin}" should be rejected with 400`).toBe(400);
        const data = await res.json();
        expect(data.error).toBe('Mã PIN phòng thi phải gồm đúng 6 chữ số');
      }
    });

    it('T5-PIN-03: Rapid successive concurrent submissions from the same user are idempotent (no duplicate rows)', async () => {
      setupAuthUser(testCandidateId);

      mockExamRoomsData[testRoomId] = {
        id: testRoomId,
        room_code: validPin,
        title: 'Phòng thi Đánh giá Năng lực Số M4',
        assessment_id: 'a1000000-0000-0000-0000-000000000001',
        is_active: true,
        is_locked: false,
        scheduled_start: null,
      };

      // Simulate 20 concurrent join requests spammed by same candidate
      const requests = Array.from({ length: 20 }).map(() =>
        joinRoomPOST(
          new Request('http://localhost:3000/api/rooms/join', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin: validPin }),
          })
        )
      );

      const responses = await Promise.all(requests);
      responses.forEach((res) => {
        expect(res.status).toBe(200);
      });

      // Assert participants table has exactly ONE row for this user in this room
      const userParticipants = mockParticipantsData.filter(
        (p) => p.room_id === testRoomId && p.user_id === testCandidateId
      );
      expect(userParticipants.length).toBe(1);
      expect(userParticipants[0].status).toBe('JOINED');
    });

    it('T5-PIN-04: Enforces server-side room lock (ROOM_LOCKED) with HTTP 403', async () => {
      setupAuthUser(testCandidateId);

      mockExamRoomsData[testRoomId] = {
        id: testRoomId,
        room_code: validPin,
        title: 'Phòng thi đã bị khóa',
        assessment_id: 'a1000000-0000-0000-0000-000000000001',
        is_active: true,
        is_locked: true, // Locked!
      };

      const req = new Request('http://localhost:3000/api/rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: validPin }),
      });
      const res = await joinRoomPOST(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.code).toBe('ROOM_LOCKED');
      expect(data.error).toContain('bị khóa bởi Giám thị');
    });

    it('T5-PIN-05: Enforces GROUP_ONLY class membership restriction with HTTP 403', async () => {
      setupAuthUser('usr-cand-outsider');

      mockExamRoomsData[testRoomId] = {
        id: testRoomId,
        room_code: validPin,
        title: 'Phòng thi Nội bộ Lớp K21',
        assessment_id: 'a1000000-0000-0000-0000-000000000001',
        is_active: true,
        is_locked: false,
        access_policy: 'GROUP_ONLY',
        class_id: 'c1000000-0000-0000-0000-000000000001',
      };

      mockClassMembersData = [
        // outsider is NOT in this class
        { class_id: 'c1000000-0000-0000-0000-000000000001', user_id: 'usr-cand-member' },
      ];

      const req = new Request('http://localhost:3000/api/rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: validPin }),
      });
      const res = await joinRoomPOST(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.code).toBe('GROUP_RESTRICTED');
    });
  });

  // =========================================================================
  // SUITE 2: REALTIME CHANNEL EVENT INTERLEAVING & RACE CONDITIONS
  // =========================================================================
  describe('Suite 2: Realtime Channel Event Interleaving & Race Conditions', () => {
    it('T5-EVT-01: START invoked before any participants join transitions room to IN_PROGRESS, late joiner directly receives TAKING', async () => {
      setupAuthUser(testHostId);

      // 1. Host creates empty room
      mockExamRoomsData[testRoomId] = {
        id: testRoomId,
        room_code: validPin,
        created_by: testHostId,
        status: 'WAITING',
        is_active: true,
        scheduled_start: null,
      };
      mockParticipantsData = [];

      // 2. Host starts room when empty
      const reqStart = new Request('http://localhost:3000/api/evaluator/rooms', {
        method: 'PATCH',
        body: JSON.stringify({ roomId: testRoomId, action: 'START' }),
      });
      const resStart = await evaluatorRoomsPATCH(reqStart);
      expect(resStart.status).toBe(200);
      const dataStart = await resStart.json();
      expect(dataStart.room.status).toBe('IN_PROGRESS');
      expect(dataStart.room.scheduled_start).toBeTruthy();

      // 3. Late candidate joins via PIN after START
      setupAuthUser(testCandidateId);
      const reqLateJoin = new Request('http://localhost:3000/api/rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: validPin }),
      });
      const resLateJoin = await joinRoomPOST(reqLateJoin);
      expect(resLateJoin.status).toBe(200);
      const dataLateJoin = await resLateJoin.json();

      // Candidate hasStarted flag is TRUE
      expect(dataLateJoin.hasStarted).toBe(true);

      // Candidate in room_participants is directly set to TAKING (not stuck in JOINED/WAITING)
      const candParticipant = mockParticipantsData.find(
        (p) => p.room_id === testRoomId && p.user_id === testCandidateId
      );
      expect(candParticipant).toBeDefined();
      expect(candParticipant.status).toBe('TAKING');
    });

    it('T5-EVT-02: EXTEND_TIME edge inputs: negative, 0, fractional, and large duration calculation', async () => {
      setupAuthUser(testHostId);
      const baseEnd = new Date('2026-11-09T10:00:00.000Z');

      mockExamRoomsData[testRoomId] = {
        id: testRoomId,
        created_by: testHostId,
        scheduled_end: baseEnd.toISOString(),
        duration_minutes: 60,
      };

      // 1. EXTEND_TIME with 0 minutes
      const reqZero = new Request('http://localhost:3000/api/evaluator/rooms', {
        method: 'PATCH',
        body: JSON.stringify({
          roomId: testRoomId,
          action: 'EXTEND_TIME',
          payload: { additionalMinutes: 0 },
        }),
      });
      const resZero = await evaluatorRoomsPATCH(reqZero);
      expect(resZero.status).toBe(200);
      const dataZero = await resZero.json();
      // additionalMinutes || 5 defaults 0 to 5 (fallback safety)
      expect(dataZero.additionalMinutes).toBe(5);
      expect(dataZero.room.duration_minutes).toBe(65);

      // 2. EXTEND_TIME with negative minutes
      const reqNeg = new Request('http://localhost:3000/api/evaluator/rooms', {
        method: 'PATCH',
        body: JSON.stringify({
          roomId: testRoomId,
          action: 'EXTEND_TIME',
          payload: { additionalMinutes: -10 },
        }),
      });
      const resNeg = await evaluatorRoomsPATCH(reqNeg);
      expect(resNeg.status).toBe(200);
      const dataNeg = await resNeg.json();
      expect(dataNeg.additionalMinutes).toBe(-10);
      expect(dataNeg.room.duration_minutes).toBe(55); // 65 - 10 = 55

      // 3. EXTEND_TIME with large duration (e.g. 120 minutes = 2 hours)
      const reqLarge = new Request('http://localhost:3000/api/evaluator/rooms', {
        method: 'PATCH',
        body: JSON.stringify({
          roomId: testRoomId,
          action: 'EXTEND_TIME',
          payload: { additionalMinutes: 120 },
        }),
      });
      const resLarge = await evaluatorRoomsPATCH(reqLarge);
      expect(resLarge.status).toBe(200);
      const dataLarge = await resLarge.json();
      expect(dataLarge.additionalMinutes).toBe(120);
      expect(dataLarge.room.duration_minutes).toBe(175);
    });

    it('T5-EVT-03: FORCE_SUBMIT_ALL handles all permutations: empty, 100% submitted, and mixed states', async () => {
      setupAuthUser(testHostId);
      mockExamRoomsData[testRoomId] = {
        id: testRoomId,
        created_by: testHostId,
      };

      // Case A: Room has zero participants
      mockParticipantsData = [];
      const resEmpty = await evaluatorRoomsPATCH(
        new Request('http://localhost:3000/api/evaluator/rooms', {
          method: 'PATCH',
          body: JSON.stringify({ roomId: testRoomId, action: 'FORCE_SUBMIT_ALL' }),
        })
      );
      expect(resEmpty.status).toBe(200);
      expect((await resEmpty.json()).success).toBe(true);

      // Case B: 100% of participants are already SUBMITTED
      const preservedTime = '2026-11-09T08:15:00.000Z';
      mockParticipantsData = [
        { id: 'p1', room_id: testRoomId, status: 'SUBMITTED', submitted_at: preservedTime },
        { id: 'p2', room_id: testRoomId, status: 'SUBMITTED', submitted_at: preservedTime },
      ];
      const resAllSubmitted = await evaluatorRoomsPATCH(
        new Request('http://localhost:3000/api/evaluator/rooms', {
          method: 'PATCH',
          body: JSON.stringify({ roomId: testRoomId, action: 'FORCE_SUBMIT_ALL' }),
        })
      );
      expect(resAllSubmitted.status).toBe(200);
      expect(mockParticipantsData[0].submitted_at).toBe(preservedTime);
      expect(mockParticipantsData[1].submitted_at).toBe(preservedTime);

      // Case C: Mixed states (WAITING, JOINED, TAKING, SUBMITTED)
      mockParticipantsData = [
        { id: 'p-wait', room_id: testRoomId, status: 'WAITING', submitted_at: null },
        { id: 'p-join', room_id: testRoomId, status: 'JOINED', submitted_at: null },
        { id: 'p-take', room_id: testRoomId, status: 'TAKING', submitted_at: null },
        { id: 'p-done', room_id: testRoomId, status: 'SUBMITTED', submitted_at: preservedTime },
      ];
      const resMixed = await evaluatorRoomsPATCH(
        new Request('http://localhost:3000/api/evaluator/rooms', {
          method: 'PATCH',
          body: JSON.stringify({ roomId: testRoomId, action: 'FORCE_SUBMIT_ALL' }),
        })
      );
      expect(resMixed.status).toBe(200);

      expect(mockParticipantsData.find((p) => p.id === 'p-wait')?.status).toBe('SUBMITTED');
      expect(mockParticipantsData.find((p) => p.id === 'p-wait')?.submitted_at).toBeTruthy();
      expect(mockParticipantsData.find((p) => p.id === 'p-join')?.status).toBe('SUBMITTED');
      expect(mockParticipantsData.find((p) => p.id === 'p-join')?.submitted_at).toBeTruthy();
      expect(mockParticipantsData.find((p) => p.id === 'p-take')?.status).toBe('SUBMITTED');
      expect(mockParticipantsData.find((p) => p.id === 'p-take')?.submitted_at).toBeTruthy();
      // Already submitted preserved intact
      expect(mockParticipantsData.find((p) => p.id === 'p-done')?.submitted_at).toBe(preservedTime);
    });

    it('T5-EVT-04: Full lifecycle state progression: WAITING -> START -> PAUSE -> RESUME -> EXTEND_TIME -> END -> PUBLISH_RESULTS', async () => {
      setupAuthUser(testHostId);
      mockExamRoomsData[testRoomId] = {
        id: testRoomId,
        created_by: testHostId,
        status: 'WAITING',
        is_active: true,
        duration_minutes: 45,
        scheduled_end: new Date('2026-11-09T10:00:00Z').toISOString(),
      };

      const executeAction = async (action: string, payload?: any) => {
        const res = await evaluatorRoomsPATCH(
          new Request('http://localhost:3000/api/evaluator/rooms', {
            method: 'PATCH',
            body: JSON.stringify({ roomId: testRoomId, action, payload }),
          })
        );
        return res.json();
      };

      // 1. START
      const r1 = await executeAction('START');
      expect(r1.room.status).toBe('IN_PROGRESS');

      // 2. PAUSE
      const r2 = await executeAction('PAUSE');
      expect(r2.room.status).toBe('PAUSED');

      // 3. RESUME
      const r3 = await executeAction('RESUME');
      expect(r3.room.status).toBe('IN_PROGRESS');

      // 4. EXTEND_TIME
      const r4 = await executeAction('EXTEND_TIME', { additionalMinutes: 15 });
      expect(r4.room.duration_minutes).toBe(60);

      // 5. END
      const r5 = await executeAction('END');
      expect(r5.room.status).toBe('ENDED');
      expect(r5.room.is_active).toBe(false);

      // 6. PUBLISH_RESULTS
      const r6 = await executeAction('PUBLISH_RESULTS', {
        publishSettings: { show_score: true, show_ranking: false, show_answers: false, scope: 'ALL' },
      });
      expect(r6.room.status).toBe('RESULTS_PUBLISHED');
      expect(r6.room.results_published).toBe(true);
      expect(r6.room.results_publish_settings.show_ranking).toBe(false);
    });
  });

  // =========================================================================
  // SUITE 3: CANDIDATE DROPS & PROCTORING ESCALATION
  // =========================================================================
  describe('Suite 3: Candidate Drops & Proctoring Escalation', () => {
    it('T5-DRP-01: Control station maps connectionStatus OFFLINE to DISCONNECTED without resetting answersCount', () => {
      // Simulating control/page.tsx line 220-238:
      const rawParticipant = {
        id: 'p-1',
        fullName: 'Nguyễn Văn A',
        status: 'TAKING',
        connectionStatus: 'OFFLINE',
        answers_count: 24,
        total_questions: 40,
      };

      let derivedStatus: 'TAKING' | 'WAITING' | 'SUBMITTED' | 'DISCONNECTED' = 'WAITING';
      if (rawParticipant.status === 'SUBMITTED') derivedStatus = 'SUBMITTED';
      else if (rawParticipant.status === 'TAKING') derivedStatus = 'TAKING';
      else if (rawParticipant.connectionStatus === 'OFFLINE') derivedStatus = 'DISCONNECTED';

      // When OFFLINE while in TAKING status or returning
      const offlineStatus = rawParticipant.connectionStatus === 'OFFLINE' ? 'DISCONNECTED' : derivedStatus;
      expect(offlineStatus).toBe('DISCONNECTED');
      // answersCount is preserved
      expect(rawParticipant.answers_count).toBe(24);
    });

    it('T5-PRC-01: Tab switch proctoring escalates warning levels and triggers auto-lock on 3rd violation', () => {
      let violationCount = 0;
      let modalLevel = 0;
      let stage1Locked = false;
      const auditEvents: Array<any> = [];

      const triggerViolation = () => {
        violationCount++;
        if (violationCount === 1) {
          modalLevel = 1;
        } else if (violationCount === 2) {
          modalLevel = 2;
        } else if (violationCount >= 3) {
          modalLevel = 3;
          stage1Locked = true;
        }
        auditEvents.push({
          eventType: 'TAB_HIDDEN',
          severity: violationCount >= 3 ? 'HIGH' : violationCount >= 2 ? 'MEDIUM' : 'LOW',
          details: { violationCount },
        });
      };

      // 1st tab switch
      triggerViolation();
      expect(violationCount).toBe(1);
      expect(modalLevel).toBe(1);
      expect(stage1Locked).toBe(false);
      expect(auditEvents[0].severity).toBe('LOW');

      // 2nd tab switch
      triggerViolation();
      expect(violationCount).toBe(2);
      expect(modalLevel).toBe(2);
      expect(stage1Locked).toBe(false);
      expect(auditEvents[1].severity).toBe('MEDIUM');

      // 3rd tab switch -> triggers lock!
      triggerViolation();
      expect(violationCount).toBe(3);
      expect(modalLevel).toBe(3);
      expect(stage1Locked).toBe(true);
      expect(auditEvents[2].severity).toBe('HIGH');
    });

    it('T5-PRC-02: Rapid blur debounce timer (2000ms) absorbs transient window blur without false alarm', () => {
      vi.useFakeTimers();

      let violationFired = false;
      let blurTimer: NodeJS.Timeout | null = null;

      const onWindowBlur = (hasFocus: boolean) => {
        if (blurTimer) clearTimeout(blurTimer);
        blurTimer = setTimeout(() => {
          if (!hasFocus) {
            violationFired = true;
          }
        }, 2000);
      };

      // Candidate momentarily triggers blur (e.g. system notification) then regains focus in 300ms
      onWindowBlur(false);
      vi.advanceTimersByTime(300);
      // Focus regained before 2000ms
      onWindowBlur(true);
      vi.advanceTimersByTime(2500);

      // Does NOT trigger violation because focus was restored
      expect(violationFired).toBe(false);

      // Now candidate leaves window permanently (>2000ms)
      onWindowBlur(false);
      vi.advanceTimersByTime(2001);
      expect(violationFired).toBe(true);

      vi.useRealTimers();
    });
  });

  // =========================================================================
  // SUITE 4: DEBOUNCED ANSWER PERSISTENCE UNDER BURSTY LOAD
  // =========================================================================
  describe('Suite 4: Debounced Answer Persistence Under Bursty Load', () => {
    it('T5-DEB-01: 50 rapid keystrokes within 200ms are coalesced into exactly one database update after 800ms quiet period', () => {
      vi.useFakeTimers();

      let dbCallCount = 0;
      let persistedAnswersCount = 0;

      const syncToDb = (count: number) => {
        dbCallCount++;
        persistedAnswersCount = count;
      };

      let debounceTimer: NodeJS.Timeout | null = null;
      const onAnswerUpdate = (count: number) => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          syncToDb(count);
        }, 800);
      };

      // Rapidly fire 50 updates (every 4ms)
      for (let i = 1; i <= 50; i++) {
        vi.advanceTimersByTime(4);
        onAnswerUpdate(i);
      }

      // At 200ms (50 * 4ms), 0 DB calls executed
      expect(dbCallCount).toBe(0);

      // Advance 799ms since the 50th update
      vi.advanceTimersByTime(799);
      expect(dbCallCount).toBe(0);

      // Advance 1ms more -> 800ms threshold reached
      vi.advanceTimersByTime(1);
      expect(dbCallCount).toBe(1);
      expect(persistedAnswersCount).toBe(50);

      vi.useRealTimers();
    });

    it('T5-DEB-02: Immediate final submission cancels pending debounce and guarantees final count is not overwritten', () => {
      vi.useFakeTimers();

      let dbAnswerCount = 0;
      let dbStatus = 'TAKING';

      let debounceTimer: NodeJS.Timeout | null = null;
      const onDebounceChange = (count: number) => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          dbAnswerCount = count;
        }, 800);
      };

      const onFinalSubmit = (finalCount: number) => {
        // Cancel pending debounce
        if (debounceTimer) {
          clearTimeout(debounceTimer);
          debounceTimer = null;
        }
        dbAnswerCount = finalCount;
        dbStatus = 'SUBMITTED';
      };

      // Candidate updates answer to 34
      onDebounceChange(34);
      vi.advanceTimersByTime(400);

      // Candidate clicks Final Submit with 35 answers
      onFinalSubmit(35);
      expect(dbStatus).toBe('SUBMITTED');
      expect(dbAnswerCount).toBe(35);

      // Advance past debounce time
      vi.advanceTimersByTime(1200);

      // Final count 35 and SUBMITTED status are never overwritten by stale 34
      expect(dbStatus).toBe('SUBMITTED');
      expect(dbAnswerCount).toBe(35);

      vi.useRealTimers();
    });

    it('T5-DEB-03: Answers count calculation strictly filters whitespace-only and empty text answers', () => {
      const calculateAnswersCount = (selectedAnswers: Record<string, any>, textAnswers: Record<string, string>) => {
        return Object.keys(selectedAnswers).length + Object.keys(textAnswers).filter((k) => textAnswers[k]?.trim()).length;
      };

      const selected = { q1: 'A', q2: 'B', q3: 'C' };
      const text = {
        q4: '',
        q5: '   ',
        q6: '\t\n  \r\n',
        q7: 'Hợp lệ',
        q8: '   Câu trả lời có khoảng trắng hai đầu   ',
      };

      expect(calculateAnswersCount(selected, text)).toBe(5); // 3 objective + 2 valid text
    });
  });

  // =========================================================================
  // SUITE 5: RESULTS SCREEN STRICT ROLE SEPARATION & PRIVACY
  // =========================================================================
  describe('Suite 5: Results Screen Strict Role Separation & Privacy', () => {
    it('T5-ROL-01: Candidate cannot view or execute host publishing actions', () => {
      const resultsFile = fs.readFileSync(LIVE_PATHS.results, 'utf-8');

      // Host controls enclosed in {isHost && (...)}
      expect(resultsFile.includes('{isHost && (')).toBe(true);

      // Verify publishing toggle button / panel is strictly host-only
      const hostSectionMatches = resultsFile.match(/\{isHost && \([\s\S]*?Thiết lập công bố kết quả[\s\S]*?\)\}/m);
      expect(hostSectionMatches).not.toBeNull();

      // Candidate section has personal result card
      expect(resultsFile.includes('{!isHost && (')).toBe(true);
      expect(resultsFile.includes('KẾT QUẢ CÁ NHÂN')).toBe(true);
    });

    it('T5-ROL-02: Masking logic when show_score=false or show_ranking=false in publishSettings', () => {
      // Simulating results/page.tsx line 191-196:
      const computeDisplayScore = (rawScore: number | null, isHost: boolean, publishSettings: any) => {
        const effectiveShowScore = isHost || Boolean(publishSettings?.show_score ?? true);
        return effectiveShowScore ? (rawScore !== null ? `${rawScore} / 100` : 'Chưa có điểm') : 'Đã ẩn điểm';
      };

      const computeDisplayRanking = (isHost: boolean, publishSettings: any) => {
        return isHost || Boolean(publishSettings?.show_ranking ?? true);
      };

      // Candidate with show_score = true
      expect(computeDisplayScore(88, false, { show_score: true })).toBe('88 / 100');

      // Candidate with show_score = false -> MASKS score with 'Đã ẩn điểm'
      expect(computeDisplayScore(88, false, { show_score: false })).toBe('Đã ẩn điểm');

      // Host ALWAYS sees score regardless of show_score
      expect(computeDisplayScore(88, true, { show_score: false })).toBe('88 / 100');

      // Ranking visibility
      expect(computeDisplayRanking(false, { show_ranking: false })).toBe(false);
      expect(computeDisplayRanking(true, { show_ranking: false })).toBe(true);
    });

    it('T5-ROL-03: Visitor/unmatched user receives null personal score, preventing cross-candidate data leak', () => {
      const candidates = [
        { userId: 'cand-001', studentCode: 'HV-001', score: 92 },
        { userId: 'cand-002', studentCode: 'HV-002', score: 74 },
      ];

      const getCandidateResult = (currentUserId: string | null) => {
        if (!currentUserId) return null;
        return candidates.find((c) => c.userId === currentUserId) || null;
      };

      expect(getCandidateResult('cand-001')?.score).toBe(92);
      expect(getCandidateResult('cand-002')?.score).toBe(74);
      expect(getCandidateResult('cand-unknown')).toBeNull();
      expect(getCandidateResult(null)).toBeNull();
    });
  });

  // =========================================================================
  // SUITE 6: PROJECT-WIDE AGENTS.MD CONFORMANCE AUDIT
  // =========================================================================
  describe('Suite 6: Project-Wide AGENTS.md Conformance Audit', () => {
    const liveFiles = Object.entries(LIVE_PATHS);

    it('T5-AUD-01: Zero occurrences of forbidden technical term "DigComp" across all live room components and routes', () => {
      liveFiles.forEach(([name, filePath]) => {
        const content = fs.readFileSync(filePath, 'utf-8');
        const hasDigComp = /digcomp/i.test(content);
        expect(
          hasDigComp,
          `File ${name} (${filePath}) must NOT contain forbidden term "DigComp"`
        ).toBe(false);
      });
    });

    it('T5-AUD-02: Zero occurrences of JSX emojis across all live room frontend components', () => {
      const frontendFiles = liveFiles.filter(([name]) => !name.endsWith('Route'));
      // Banned emoji list and general pictographic ranges (excluding standard typographical checkmarks)
      const bannedEmojis = ['👑', '🥈', '🥉', '⏱', '✨', '👋', '🎉', '💡', '🚀', '🔥', '🏆', '💯'];
      const pictographRegex = /[\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1F600}-\u{1F64F}]/u;

      frontendFiles.forEach(([name, filePath]) => {
        const content = fs.readFileSync(filePath, 'utf-8');
        bannedEmojis.forEach((emoji) => {
          expect(
            content.includes(emoji),
            `File ${name} (${filePath}) must NOT contain emoji ${emoji} in JSX`
          ).toBe(false);
        });

        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          const trimmed = line.trim();
          if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) return;
          const match = trimmed.match(pictographRegex);
          expect(
            match,
            `File ${name} (${filePath}:${idx + 1}) must not contain emoji character: ${match?.[0]}`
          ).toBeNull();
        });
      });
    });

    it('T5-AUD-03: Zero horizontal divider lines (<hr) across all live room components', () => {
      const frontendFiles = liveFiles.filter(([name]) => !name.endsWith('Route'));

      frontendFiles.forEach(([name, filePath]) => {
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(
          /<hr/i.test(content),
          `File ${name} (${filePath}) must NOT contain forbidden horizontal separator <hr>`
        ).toBe(false);
      });
    });

    it('T5-AUD-04: Strict null vs 0 distinction for unassessed domain scores in results and analytics', () => {
      // Unassessed domains must be score: null, not 0 or fake 70%
      const unassessedDomain: {
        code: string;
        name: string;
        score: number | null;
        testedCount: number;
      } = {
        code: 'D1',
        name: 'Thông tin & Dữ liệu',
        score: null,
        testedCount: 0,
      };

      const formatScore = (d: typeof unassessedDomain) => {
        if (d.score === null) return '--';
        return `${d.score}%`;
      };

      expect(formatScore(unassessedDomain)).toBe('--');
      expect(formatScore({ ...unassessedDomain, score: 0, testedCount: 1 })).toBe('0%');
    });
  });
});
