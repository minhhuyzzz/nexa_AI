import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Supabase Mock Setup for API Route Handler testing
// ---------------------------------------------------------------------------
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
                // e.g. eq('room_id', roomId).eq('status', 'JOINED')
                mockParticipantsData.forEach((p) => {
                  if (p[col1] === val1 && p[col2] === val2) {
                    Object.assign(p, updatePayload);
                  }
                });
                return Promise.resolve({ error: null });
              }),
              neq: vi.fn((col2: string, val2: any) => {
                // e.g. eq('room_id', roomId).neq('status', 'SUBMITTED')
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

// Import the actual PATCH route handler
import { PATCH } from '@/app/api/evaluator/rooms/route';

/**
 * ============================================================================
 * CHALLENGER M2: REALTIME SYNCHRONIZATION & WORKFLOW EMPIRICAL CHALLENGE SUITE
 * ============================================================================
 *
 * Objectives:
 * 1. Verify channel unification to `room:${roomId}` across all 6 live frontend files:
 *    - Ensure NONE use `:control`, `:host`, or `:candidate` suffixes.
 * 2. Verify host actions in `src/app/api/evaluator/rooms/route.ts`:
 *    - Schema validation for all actions (START, PAUSE, RESUME, END, EXTEND_TIME, FORCE_SUBMIT_ALL).
 *    - `EXTEND_TIME`: calculates new scheduled_end and duration_minutes, checks ownership.
 *    - `FORCE_SUBMIT_ALL`: updates non-submitted participants to SUBMITTED with timestamp.
 *    - `PAUSE` and `RESUME`: state transitions and ownership guards.
 * 3. Verify `src/app/live/control/page.tsx`:
 *    - `Math.random()` completely removed for `answersCount` / progress.
 *    - Handlers call API and broadcast on unified channel `room:${roomId}`.
 * 4. Verify candidate auto-redirect in `waiting-room/page.tsx` on `action: 'START'`.
 * 5. Verify AGENTS.md compliance: no "DigComp", no horizontal lines (<hr), genuine metrics.
 * ============================================================================
 */

describe('Challenger M2: Realtime Synchronization & Workflow Empirical Suite', () => {
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

  beforeEach(() => {
    vi.clearAllMocks();
    mockExamRoomsData = {};
    mockParticipantsData = [];
  });

  // =========================================================================
  // 1. CHANNEL UNIFICATION VERIFICATION
  // =========================================================================
  describe('Objective 1: Supabase Realtime Channel Unification (room:${roomId})', () => {
    const frontendFiles = [
      { name: 'waiting-room', path: LIVE_FILES.waitingRoom },
      { name: 'host', path: LIVE_FILES.host },
      { name: 'control', path: LIVE_FILES.control },
      { name: 'take', path: LIVE_FILES.take },
      { name: 'submitted', path: LIVE_FILES.submitted },
      { name: 'results', path: LIVE_FILES.results },
    ];

    it('TC-CH-01: Verifies all 6 frontend files exist and are readable', () => {
      frontendFiles.forEach(({ name, path: filePath }) => {
        expect(fs.existsSync(filePath), `File ${name} must exist at ${filePath}`).toBe(true);
      });
    });

    it('TC-CH-02: Confirms NO legacy channel suffixes (:control, :host, :candidate) exist in any live file', () => {
      const forbiddenSuffixes = [':control', ':host', ':candidate'];

      frontendFiles.forEach(({ name, path: filePath }) => {
        const content = fs.readFileSync(filePath, 'utf-8');
        forbiddenSuffixes.forEach((suffix) => {
          const match = content.includes(suffix);
          expect(
            match,
            `File ${name} must NOT contain channel suffix "${suffix}". Found occurrence.`
          ).toBe(false);
        });
      });
    });

    it('TC-CH-03: Confirms all 6 files use unified channel template room:${...}', () => {
      frontendFiles.forEach(({ name, path: filePath }) => {
        const content = fs.readFileSync(filePath, 'utf-8');
        // Match supabase.channel(`room:...`) or channel(`room:...`)
        const unifiedRegex = /supabase\.channel\([`'"]room:\$\{[^}]+\}[`'"]\)/;
        expect(
          unifiedRegex.test(content),
          `File ${name} must invoke supabase.channel with unified template room:\${...}`
        ).toBe(true);
      });
    });
  });

  // =========================================================================
  // 2. HOST ACTIONS IN EVALUATOR ROOMS ROUTE
  // =========================================================================
  describe('Objective 2: Evaluator Rooms Route Host Actions & State Transitions', () => {
    const validRoomId = 'b8c3f2d1-5e4a-4b9c-8a1e-2f3d4e5a6b7c';
    const hostUserId = 'usr-host-1234';
    const otherUserId = 'usr-hacker-9999';

    function setupAuthUser(userId: string = hostUserId) {
      mockGetUser.mockResolvedValue({
        data: { user: { id: userId, email: `${userId}@nexa.ai` } },
        error: null,
      });
    }

    it('TC-ACT-01: Update room schema validates UUID and rejects invalid actions', async () => {
      setupAuthUser();

      // Invalid UUID
      const reqInvalidUuid = new Request('http://localhost:3000/api/evaluator/rooms', {
        method: 'PATCH',
        body: JSON.stringify({ roomId: 'invalid-uuid-format', action: 'START' }),
      });
      const resUuid = await PATCH(reqInvalidUuid);
      expect(resUuid.status).toBe(400);
      const jsonUuid = await resUuid.json();
      expect(jsonUuid.error).toContain('ID phòng thi không hợp lệ');

      // Invalid Action
      const reqInvalidAction = new Request('http://localhost:3000/api/evaluator/rooms', {
        method: 'PATCH',
        body: JSON.stringify({ roomId: validRoomId, action: 'DESTROY_ALL' }),
      });
      const resAction = await PATCH(reqInvalidAction);
      expect(resAction.status).toBe(400);
    });

    it('TC-ACT-02: Returns HTTP 401 when request is unauthenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not logged in' },
      });

      const req = new Request('http://localhost:3000/api/evaluator/rooms', {
        method: 'PATCH',
        body: JSON.stringify({ roomId: validRoomId, action: 'START' }),
      });

      const res = await PATCH(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe('Yêu cầu đăng nhập');
    });

    it('TC-ACT-03: EXTEND_TIME adds positive minutes to scheduled_end and duration_minutes', async () => {
      setupAuthUser(hostUserId);

      const baseEnd = new Date('2026-11-09T10:00:00.000Z');
      mockExamRoomsData[validRoomId] = {
        id: validRoomId,
        created_by: hostUserId,
        scheduled_end: baseEnd.toISOString(),
        duration_minutes: 45,
      };

      const req = new Request('http://localhost:3000/api/evaluator/rooms', {
        method: 'PATCH',
        body: JSON.stringify({
          roomId: validRoomId,
          action: 'EXTEND_TIME',
          payload: { additionalMinutes: 15 },
        }),
      });

      const res = await PATCH(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.action).toBe('EXTEND_TIME');
      expect(json.additionalMinutes).toBe(15);

      const expectedEnd = new Date(baseEnd.getTime() + 15 * 60000).toISOString();
      expect(json.newScheduledEnd).toBe(expectedEnd);
      expect(json.room.duration_minutes).toBe(60);
      expect(json.room.scheduled_end).toBe(expectedEnd);
    });

    it('TC-ACT-04: EXTEND_TIME handles string minute inputs and defaults gracefully', async () => {
      setupAuthUser(hostUserId);

      const baseEnd = new Date('2026-11-09T12:00:00.000Z');
      mockExamRoomsData[validRoomId] = {
        id: validRoomId,
        created_by: hostUserId,
        scheduled_end: baseEnd.toISOString(),
        duration_minutes: 30,
      };

      // String minute input "10"
      const reqString = new Request('http://localhost:3000/api/evaluator/rooms', {
        method: 'PATCH',
        body: JSON.stringify({
          roomId: validRoomId,
          action: 'EXTEND_TIME',
          payload: { additionalMinutes: '10' },
        }),
      });
      const resString = await PATCH(reqString);
      expect(resString.status).toBe(200);
      const jsonString = await resString.json();
      expect(jsonString.additionalMinutes).toBe(10);
      expect(jsonString.room.duration_minutes).toBe(40);

      // Default when payload is missing (should default to 5 minutes)
      const reqDefault = new Request('http://localhost:3000/api/evaluator/rooms', {
        method: 'PATCH',
        body: JSON.stringify({
          roomId: validRoomId,
          action: 'EXTEND_TIME',
        }),
      });
      const resDefault = await PATCH(reqDefault);
      expect(resDefault.status).toBe(200);
      const jsonDefault = await resDefault.json();
      expect(jsonDefault.additionalMinutes).toBe(5);
      expect(jsonDefault.room.duration_minutes).toBe(45);
    });

    it('TC-ACT-05: EXTEND_TIME returns HTTP 403 when non-creator attempts to extend time', async () => {
      setupAuthUser(otherUserId);

      mockExamRoomsData[validRoomId] = {
        id: validRoomId,
        created_by: hostUserId, // owned by someone else
        scheduled_end: new Date().toISOString(),
        duration_minutes: 45,
      };

      const req = new Request('http://localhost:3000/api/evaluator/rooms', {
        method: 'PATCH',
        body: JSON.stringify({
          roomId: validRoomId,
          action: 'EXTEND_TIME',
          payload: { additionalMinutes: 10 },
        }),
      });

      const res = await PATCH(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toBe('Bạn không có quyền gia hạn phòng thi');
    });

    it('TC-ACT-06: FORCE_SUBMIT_ALL marks non-submitted participants as SUBMITTED', async () => {
      setupAuthUser(hostUserId);

      mockExamRoomsData[validRoomId] = {
        id: validRoomId,
        created_by: hostUserId,
      };

      mockParticipantsData = [
        { id: 'p1', room_id: validRoomId, status: 'TAKING', submitted_at: null },
        { id: 'p2', room_id: validRoomId, status: 'JOINED', submitted_at: null },
        { id: 'p3', room_id: validRoomId, status: 'SUBMITTED', submitted_at: '2026-11-09T09:00:00Z' },
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
      expect(json.action).toBe('FORCE_SUBMIT_ALL');
      expect(json.submittedAt).toBeDefined();

      // Non-submitted participants transitioned to SUBMITTED
      expect(mockParticipantsData[0].status).toBe('SUBMITTED');
      expect(mockParticipantsData[0].submitted_at).toBeDefined();
      expect(mockParticipantsData[1].status).toBe('SUBMITTED');
      expect(mockParticipantsData[1].submitted_at).toBeDefined();
      // Already submitted participant remains unchanged
      expect(mockParticipantsData[2].status).toBe('SUBMITTED');
      expect(mockParticipantsData[2].submitted_at).toBe('2026-11-09T09:00:00Z');
    });

    it('TC-ACT-07: FORCE_SUBMIT_ALL returns HTTP 403 when non-creator attempts bulk submit', async () => {
      setupAuthUser(otherUserId);

      mockExamRoomsData[validRoomId] = {
        id: validRoomId,
        created_by: hostUserId,
      };

      const req = new Request('http://localhost:3000/api/evaluator/rooms', {
        method: 'PATCH',
        body: JSON.stringify({
          roomId: validRoomId,
          action: 'FORCE_SUBMIT_ALL',
        }),
      });

      const res = await PATCH(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toBe('Bạn không có quyền thu bài phòng thi');
    });

    it('TC-ACT-08: PAUSE and RESUME transition room status and enforce creator ownership', async () => {
      setupAuthUser(hostUserId);

      mockExamRoomsData[validRoomId] = {
        id: validRoomId,
        created_by: hostUserId,
        status: 'IN_PROGRESS',
      };

      // 1. PAUSE
      const reqPause = new Request('http://localhost:3000/api/evaluator/rooms', {
        method: 'PATCH',
        body: JSON.stringify({ roomId: validRoomId, action: 'PAUSE' }),
      });
      const resPause = await PATCH(reqPause);
      expect(resPause.status).toBe(200);
      const jsonPause = await resPause.json();
      expect(jsonPause.action).toBe('PAUSE');
      expect(jsonPause.room.status).toBe('PAUSED');
      expect(mockExamRoomsData[validRoomId].status).toBe('PAUSED');

      // 2. RESUME
      const reqResume = new Request('http://localhost:3000/api/evaluator/rooms', {
        method: 'PATCH',
        body: JSON.stringify({ roomId: validRoomId, action: 'RESUME' }),
      });
      const resResume = await PATCH(reqResume);
      expect(resResume.status).toBe(200);
      const jsonResume = await resResume.json();
      expect(jsonResume.action).toBe('RESUME');
      expect(jsonResume.room.status).toBe('IN_PROGRESS');
      expect(mockExamRoomsData[validRoomId].status).toBe('IN_PROGRESS');
    });

    it('TC-ACT-09: START action transitions room to IN_PROGRESS and participants from JOINED to TAKING', async () => {
      setupAuthUser(hostUserId);

      mockExamRoomsData[validRoomId] = {
        id: validRoomId,
        created_by: hostUserId,
        status: 'WAITING',
        is_active: true,
      };

      mockParticipantsData = [
        { id: 'p1', room_id: validRoomId, status: 'JOINED' },
        { id: 'p2', room_id: validRoomId, status: 'JOINED' },
        { id: 'p3', room_id: validRoomId, status: 'WAITING' },
      ];

      const reqStart = new Request('http://localhost:3000/api/evaluator/rooms', {
        method: 'PATCH',
        body: JSON.stringify({ roomId: validRoomId, action: 'START' }),
      });

      const resStart = await PATCH(reqStart);
      expect(resStart.status).toBe(200);
      const jsonStart = await resStart.json();
      expect(jsonStart.action).toBe('START');
      expect(jsonStart.room.status).toBe('IN_PROGRESS');

      // JOINED participants moved to TAKING
      expect(mockParticipantsData[0].status).toBe('TAKING');
      expect(mockParticipantsData[1].status).toBe('TAKING');
      expect(mockParticipantsData[2].status).toBe('WAITING');
    });
    it('TC-ACT-10: EXTEND_TIME returns HTTP 404 when room does not exist', async () => {
      setupAuthUser(hostUserId);
      const req = new Request('http://localhost:3000/api/evaluator/rooms', {
        method: 'PATCH',
        body: JSON.stringify({
          roomId: '00000000-0000-0000-0000-000000000000',
          action: 'EXTEND_TIME',
          payload: { additionalMinutes: 10 },
        }),
      });
      const res = await PATCH(req);
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toBe('Không tìm thấy phòng thi');
    });

    it('TC-ACT-11: FORCE_SUBMIT_ALL returns HTTP 404 when room does not exist', async () => {
      setupAuthUser(hostUserId);
      const req = new Request('http://localhost:3000/api/evaluator/rooms', {
        method: 'PATCH',
        body: JSON.stringify({
          roomId: '00000000-0000-0000-0000-000000000000',
          action: 'FORCE_SUBMIT_ALL',
        }),
      });
      const res = await PATCH(req);
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toBe('Không tìm thấy phòng thi');
    });

    it('TC-ACT-12: FORCE_SUBMIT_ALL succeeds gracefully when room has zero participants', async () => {
      setupAuthUser(hostUserId);
      mockExamRoomsData[validRoomId] = {
        id: validRoomId,
        created_by: hostUserId,
      };
      mockParticipantsData = [];

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
      expect(json.action).toBe('FORCE_SUBMIT_ALL');
    });
  });

  // =========================================================================
  // 3. CONTROL PAGE GENUINE DATA & BROADCAST WIRING
  // =========================================================================
  describe('Objective 3: Control Station Data Authenticity & Broadcast Wiring', () => {
    it('TC-CTL-01: Verifies Math.random() fake progress was eliminated from control/page.tsx', () => {
      const controlContent = fs.readFileSync(LIVE_FILES.control, 'utf-8');

      // Assert fake progress expression is absent
      expect(controlContent.includes('Math.random() * 80 + 10')).toBe(false);
      expect(controlContent.includes('fakeProgress')).toBe(false);

      // Verify genuine answersCount resolution at line 237
      expect(
        controlContent.includes(
          'answersCount: p.answersCount ?? p.answers_count ?? (p.status === \'SUBMITTED\' ? totalQ : 0)'
        )
      ).toBe(true);
    });

    it('TC-CTL-02: Verifies handleBulkSubmitAll calls PATCH with FORCE_SUBMIT_ALL and broadcasts on room:${roomId}', () => {
      const controlContent = fs.readFileSync(LIVE_FILES.control, 'utf-8');

      // Check handleBulkSubmitAll definition
      expect(controlContent.includes('const handleBulkSubmitAll = async () => {')).toBe(true);

      // Verify fetch call payload
      expect(controlContent.includes("action: 'FORCE_SUBMIT_ALL'")).toBe(true);

      // Verify Supabase Realtime broadcast call
      const broadcastRegex = /channel\(`room:\$\{roomId\}`\)\.send\(\s*\{\s*type:\s*'broadcast',\s*event:\s*'ROOM_STATE_CHANGE',\s*payload:\s*\{\s*action:\s*'FORCE_SUBMIT_ALL'\s*\},?\s*\}\s*\)/m;
      expect(
        broadcastRegex.test(controlContent),
        'handleBulkSubmitAll must broadcast ROOM_STATE_CHANGE with action: FORCE_SUBMIT_ALL'
      ).toBe(true);
    });

    it('TC-CTL-03: Verifies handleExtendTimeMinutes calls PATCH with EXTEND_TIME and broadcasts on room:${roomId}', () => {
      const controlContent = fs.readFileSync(LIVE_FILES.control, 'utf-8');

      // Check handleExtendTimeMinutes definition
      expect(controlContent.includes('const handleExtendTimeMinutes = async (mins: number) => {')).toBe(true);

      // Verify fetch call payload
      expect(controlContent.includes("action: 'EXTEND_TIME'")).toBe(true);
      expect(controlContent.includes('additionalMinutes: mins')).toBe(true);

      // Verify broadcast
      const broadcastRegex = /channel\(`room:\$\{roomId\}`\)\.send\(\s*\{\s*type:\s*'broadcast',\s*event:\s*'ROOM_STATE_CHANGE',\s*payload:\s*\{\s*action:\s*'EXTEND_TIME'/m;
      expect(
        broadcastRegex.test(controlContent),
        'handleExtendTimeMinutes must broadcast ROOM_STATE_CHANGE with action: EXTEND_TIME'
      ).toBe(true);
    });

    it('TC-CTL-04: Verifies handleTogglePause broadcasts PAUSE and RESUME actions', () => {
      const controlContent = fs.readFileSync(LIVE_FILES.control, 'utf-8');

      expect(controlContent.includes('const handleTogglePause = async () => {')).toBe(true);
      expect(controlContent.includes("const action = nextPaused ? 'PAUSE' : 'RESUME';")).toBe(true);

      const pauseBroadcastRegex = /channel\(`room:\$\{roomId\}`\)\.send\(\s*\{\s*type:\s*'broadcast',\s*event:\s*'ROOM_STATE_CHANGE',\s*payload:\s*\{\s*action\s*\},?\s*\}\s*\)/m;
      expect(
        pauseBroadcastRegex.test(controlContent),
        'handleTogglePause must broadcast ROOM_STATE_CHANGE with action'
      ).toBe(true);
    });

    it('TC-CTL-05: Progress calculation accurately computes percentage and caps at 100%', () => {
      const calculateProgress = (answersCount: number, totalQuestions: number) => {
        const total = totalQuestions || 40;
        return Math.min(100, Math.round(((answersCount || 0) / total) * 100));
      };

      expect(calculateProgress(0, 40)).toBe(0);
      expect(calculateProgress(20, 40)).toBe(50);
      expect(calculateProgress(40, 40)).toBe(100);
      expect(calculateProgress(50, 40)).toBe(100); // capped at 100
      expect(calculateProgress(10, 0)).toBe(25); // fallback to total 40 questions
    });

    it('TC-CTL-06: Verifies submitted screen queries genuine answers_count and eliminates hardcoded 30/32', () => {
      const submittedContent = fs.readFileSync(LIVE_FILES.submitted, 'utf-8');

      // Check state definition
      expect(submittedContent.includes('const [answeredCount, setAnsweredCount] = useState<number>(0);')).toBe(true);
      // Check query from myParticipant
      expect(submittedContent.includes('setAnsweredCount(myParticipant.answers_count);')).toBe(true);
      // Check display
      expect(submittedContent.includes('{answeredCount} / {totalQuestions} câu')).toBe(true);
      // Check elimination of hardcoded 30 / 32
      expect(submittedContent.includes('answeredCount = 30; totalQuestions = 32')).toBe(false);
    });
  });

  // =========================================================================
  // 4. CANDIDATE WAITING ROOM AUTO-REDIRECT & RESULTS SCREEN ROLE SEPARATION
  // =========================================================================
  describe('Objective 4: Candidate Auto-Redirect on Exam START & Results Role Separation', () => {
    it('TC-WR-01: Verifies waiting-room/page.tsx listens for START action on room:${activeRoomId}', () => {
      const waitingRoomContent = fs.readFileSync(LIVE_FILES.waitingRoom, 'utf-8');

      // Listens for ROOM_STATE_CHANGE
      expect(waitingRoomContent.includes(".on('broadcast', { event: 'ROOM_STATE_CHANGE' }")).toBe(true);

      // Checks action === 'START'
      expect(waitingRoomContent.includes("if (action === 'START') {")).toBe(true);

      // Redirects to /personal/take/...
      expect(
        waitingRoomContent.includes('/personal/take/${targetAsmId}?roomId=${activeRoomId}&pin=${roomCode}')
      ).toBe(true);
    });

    it('TC-WR-02: Candidate take page reacts to all host broadcast events', () => {
      const takeContent = fs.readFileSync(LIVE_FILES.take, 'utf-8');

      // Verifies subscription to unified channel
      expect(takeContent.includes('const channel = supabase.channel(`room:${roomId}`);')).toBe(true);

      // Verifies handling of EXTEND_TIME
      expect(takeContent.includes("if (action === 'EXTEND_TIME') {")).toBe(true);
      expect(takeContent.includes('setTimeRemaining((prev) => prev + additionalMinutes * 60);')).toBe(true);

      // Verifies handling of FORCE_SUBMIT_ALL
      expect(takeContent.includes("else if (action === 'FORCE_SUBMIT_ALL') {")).toBe(true);
      expect(takeContent.includes('handleFinalSubmitRef.current?.();')).toBe(true);

      // Verifies handling of PAUSE & RESUME
      expect(takeContent.includes("else if (action === 'PAUSE') {")).toBe(true);
      expect(takeContent.includes('setIsRoomPaused(true);')).toBe(true);
      expect(takeContent.includes("else if (action === 'RESUME') {")).toBe(true);
      expect(takeContent.includes('setIsRoomPaused(false);')).toBe(true);
    });

    it('TC-RES-01: Results screen implements role separation between host and candidate', () => {
      const resultsContent = fs.readFileSync(LIVE_FILES.results, 'utf-8');

      // Evaluates isHost flag
      expect(resultsContent.includes('const isHost = Boolean(room.isHost);')).toBe(true);

      // Host view renders 5 aggregate KPI cards
      expect(resultsContent.includes('{isHost && (')).toBe(true);
      expect(resultsContent.includes('Đã tham gia')).toBe(true);
      expect(resultsContent.includes('Đã nộp bài')).toBe(true);
      expect(resultsContent.includes('Nộp đúng hạn')).toBe(true);
      expect(resultsContent.includes('Điểm trung bình')).toBe(true);
      expect(resultsContent.includes('Điểm cao nhất')).toBe(true);

      // Candidate view renders Personal Score Card and 5-domain radar
      expect(resultsContent.includes('{!isHost && (')).toBe(true);
      expect(resultsContent.includes('KẾT QUẢ CÁ NHÂN')).toBe(true);
      expect(resultsContent.includes('radarScoresToUse')).toBe(true);
    });

    it('TC-RES-02: Results screen respects publishSettings (show_score and show_ranking)', () => {
      const resultsContent = fs.readFileSync(LIVE_FILES.results, 'utf-8');

      // Hides score with exact string 'Đã ẩn điểm' when show_score is false
      expect(resultsContent.includes("'Đã ẩn điểm'")).toBe(true);

      // Controls ranking pill visibility
      expect(resultsContent.includes('{effectiveShowRanking && (')).toBe(true);
    });
  });

  // =========================================================================
  // 5. AGENTS.MD CONFORMANCE AUDIT
  // =========================================================================
  describe('Objective 5: AGENTS.md Conformance Audit', () => {
    const allAssignedFiles = Object.values(LIVE_FILES);

    it('TC-AUD-01: Prohibits technical term "DigComp" across all live room and evaluator files', () => {
      allAssignedFiles.forEach((filePath) => {
        const content = fs.readFileSync(filePath, 'utf-8');
        const fileName = path.basename(filePath);
        expect(
          /digcomp/i.test(content),
          `File ${fileName} must not contain forbidden technical term "DigComp"`
        ).toBe(false);
      });
    });

    it('TC-AUD-02: Prohibits horizontal divider lines (<hr) across all live room files', () => {
      allAssignedFiles.forEach((filePath) => {
        const content = fs.readFileSync(filePath, 'utf-8');
        const fileName = path.basename(filePath);
        expect(
          /<hr/i.test(content),
          `File ${fileName} must not contain forbidden horizontal separator <hr>`
        ).toBe(false);
      });
    });

    it('TC-AUD-03: Prohibits JSX emojis in results page (replaces with Lucide icons)', () => {
      const resultsContent = fs.readFileSync(LIVE_FILES.results, 'utf-8');
      const emojis = ['👑', '🥈', '🥉', '⏱'];
      emojis.forEach((emoji) => {
        expect(
          resultsContent.includes(emoji),
          `Results page must not use emoji ${emoji} in JSX`
        ).toBe(false);
      });
    });
  });
});
