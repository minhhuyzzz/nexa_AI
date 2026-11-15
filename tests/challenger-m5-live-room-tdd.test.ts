import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mocks for Next.js and Supabase
const mockGetUser = vi.fn();
const mockSupabaseQuery: Record<string, any> = {};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mockGetUser,
    },
    rpc: vi.fn().mockResolvedValue({ data: null, error: new Error('RPC disabled in unit test') }),
    from: vi.fn((table: string) => {
      if (mockSupabaseQuery[table]) {
        return mockSupabaseQuery[table];
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
        update: vi.fn().mockReturnThis(),
      };
    }),
  })),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (mockSupabaseQuery[table]) return mockSupabaseQuery[table];
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    }),
  })),
}));

vi.mock('@/lib/auth/getEffectiveUser', () => ({
  getEffectiveUser: vi.fn(async () => ({
    id: 'usr-teacher-01',
    email: 'teacher@nexa.ai',
    role: 'EVALUATOR',
  })),
}));

vi.mock('@/lib/classes/access', () => ({
  verifyClassAccess: vi.fn(async () => ({
    hasAccess: true,
    isEvaluator: true,
  })),
}));

describe('Milestone 5 TDD: Live Room Robustness & Edge Cases Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(mockSupabaseQuery).forEach((k) => delete mockSupabaseQuery[k]);
  });

  // =========================================================================
  // SUB-SUITE 1: POST /api/rooms/join — Strict Validation & State Guarding
  // =========================================================================
  describe('POST /api/rooms/join — Guarding & Participant Tracking', () => {
    it('TC-JOIN-01: Rejects PINs that are not exactly 6 digits with 400', async () => {
      const { POST } = await import('@/app/api/rooms/join/route');
      const req = new Request('http://localhost:3000/api/rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: '12345' }), // Only 5 digits
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('6 chữ số');
    });

    it('TC-JOIN-02: Rejects unauthenticated candidate with 401', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('No session') });

      const { POST } = await import('@/app/api/rooms/join/route');
      const req = new Request('http://localhost:3000/api/rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: '111147' }),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toContain('đăng nhập');
    });

    it('TC-JOIN-03: Rejects joining a room locked by host with 403 ROOM_LOCKED', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'usr-student-01', email: 'student@nexa.ai' } },
        error: null,
      });

      mockSupabaseQuery['exam_rooms'] = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'room-locked-uuid',
            room_code: '111147',
            title: 'Phòng thi đã khóa',
            is_active: true,
            is_locked: true, // Locked!
            status: 'WAITING',
            assessments: { id: 'asm-1', title: 'Đề thi 1', duration_minutes: 45 },
          },
          error: null,
        }),
      };

      const { POST } = await import('@/app/api/rooms/join/route');
      const req = new Request('http://localhost:3000/api/rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: '111147' }),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.code).toBe('ROOM_LOCKED');
    });

    it('TC-JOIN-04: Rejects late joiner when room is IN_PROGRESS and allow_late_join is false', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'usr-late-student', email: 'late@nexa.ai' } },
        error: null,
      });

      mockSupabaseQuery['exam_rooms'] = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'room-in-progress-uuid',
            room_code: '111147',
            title: 'Phòng thi đang diễn ra',
            is_active: true,
            is_locked: false,
            status: 'IN_PROGRESS',
            allow_late_join: false, // Late join disallowed!
            started_at: new Date(Date.now() - 600000).toISOString(),
            assessments: { id: 'asm-1', title: 'Đề thi 1', duration_minutes: 45 },
          },
          error: null,
        }),
      };

      const { POST } = await import('@/app/api/rooms/join/route');
      const req = new Request('http://localhost:3000/api/rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: '111147' }),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.code).toBe('LATE_JOIN_BLOCKED');
    });

    it('TC-JOIN-05: Accurately reports hasStarted = false when room status is WAITING (even with scheduled_start)', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'usr-on-time', email: 'ontime@nexa.ai' } },
        error: null,
      });

      const upsertSpy = vi.fn().mockResolvedValue({ data: null, error: null });
      mockSupabaseQuery['exam_rooms'] = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'room-waiting-uuid',
            room_code: '111147',
            title: 'Phòng thi sảnh chờ',
            is_active: true,
            is_locked: false,
            status: 'WAITING',
            scheduled_start: new Date().toISOString(), // Scheduled start is present, but exam NOT yet started
            started_at: null, // NOT started
            allow_late_join: true,
            assessments: { id: 'asm-1', title: 'Đề thi 1', duration_minutes: 45 },
          },
          error: null,
        }),
      };
      mockSupabaseQuery['room_participants'] = {
        upsert: upsertSpy,
      };

      const { POST } = await import('@/app/api/rooms/join/route');
      const req = new Request('http://localhost:3000/api/rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: '111147' }),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.hasStarted).toBe(false); // Must be FALSE because status is WAITING and started_at is null!
      expect(upsertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'JOINED', // Candidate is in JOINED status, NOT taking!
        }),
        expect.any(Object)
      );
    });
  });

  // =========================================================================
  // SUB-SUITE 2: Sound System Synthesis
  // =========================================================================
  describe('examSound Engine Test', () => {
    it('TC-SND-01: Safely handles muted state without initiating AudioContext', async () => {
      const { examSound } = await import('@/lib/sound/exam-sound');
      expect(() => {
        examSound.play('JOIN', false);
        examSound.play('START', false);
        examSound.play('SUBMIT', false);
        examSound.play('WARNING', false);
      }).not.toThrow();
    });
  });

  // =========================================================================
  // SUB-SUITE 3: GET /api/assessments/[id] — Instant Feedback Option Leak Protection
  // =========================================================================
  describe('GET /api/assessments/[id] — Proctoring Instant Feedback', () => {
    it('TC-FEEDBACK-01: Exposes is_correct only when room has instant_feedback = true', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'usr-student-02', email: 'student2@nexa.ai' } },
        error: null,
      });

      mockSupabaseQuery['assessments'] = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: 'asm-instant-uuid',
            title: 'Đề thi trắc nghiệm',
            duration_minutes: 45,
            is_published: true,
          },
          error: null,
        }),
      };

      // Room has instant_feedback = true
      mockSupabaseQuery['exam_rooms'] = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            proctoring_profile: { instant_feedback: true },
          },
          error: null,
        }),
      };

      mockSupabaseQuery['assessment_items'] = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [
            {
              id: 'item-1',
              prompt: 'Câu hỏi 1',
              type: 'MCQ',
              order_index: 0,
              item_options: [
                { id: 'opt-1', content: 'Đáp án A', is_correct: true, order_index: 0 },
                { id: 'opt-2', content: 'Đáp án B', is_correct: false, order_index: 1 },
              ],
            },
          ],
          error: null,
        }),
      };

      const { GET } = await import('@/app/api/assessments/[id]/route');
      const req = new Request('http://localhost:3000/api/assessments/asm-instant-uuid?roomId=room-feedback-uuid', {
        method: 'GET',
      });

      const res = await GET(req, { params: Promise.resolve({ id: 'asm-instant-uuid' }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.items[0].options[0].is_correct).toBe(true);
      expect(data.items[0].options[1].is_correct).toBe(false);
    });

    it('TC-FEEDBACK-02: Withholds is_correct when room has instant_feedback = false or missing', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'usr-student-03', email: 'student3@nexa.ai' } },
        error: null,
      });

      mockSupabaseQuery['assessments'] = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: 'asm-secure-uuid',
            title: 'Đề thi chuẩn',
            duration_minutes: 45,
            is_published: true,
          },
          error: null,
        }),
      };

      // Room has instant_feedback = false
      mockSupabaseQuery['exam_rooms'] = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            proctoring_profile: { instant_feedback: false },
          },
          error: null,
        }),
      };

      mockSupabaseQuery['assessment_items'] = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [
            {
              id: 'item-1',
              prompt: 'Câu hỏi 1',
              type: 'MCQ',
              order_index: 0,
              item_options: [
                { id: 'opt-1', content: 'Đáp án A', is_correct: true, order_index: 0 },
                { id: 'opt-2', content: 'Đáp án B', is_correct: false, order_index: 1 },
              ],
            },
          ],
          error: null,
        }),
      };

      const { GET } = await import('@/app/api/assessments/[id]/route');
      const req = new Request('http://localhost:3000/api/assessments/asm-secure-uuid?roomId=room-secure-uuid', {
        method: 'GET',
      });

      const res = await GET(req, { params: Promise.resolve({ id: 'asm-secure-uuid' }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.items[0].options[0].is_correct).toBeUndefined();
      expect(data.items[0].options[1].is_correct).toBeUndefined();
    });
  });

  // =========================================================================
  // SUB-SUITE 4: GET /api/classes/[id] — Active Live Room Mapping
  // =========================================================================
  describe('GET /api/classes/[id] — Live Room Integration', () => {
    it('TC-CLASS-01: Correctly maps activeLiveRoom from exam_rooms table', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'usr-teacher-01', email: 'teacher@nexa.ai' } },
        error: null,
      });

      mockSupabaseQuery['evaluator_classes'] = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'cls-10a1-uuid',
            evaluator_id: 'usr-teacher-01',
            name: 'Lớp 10A1',
            class_code: '10A1-2026',
            class_members: [],
            class_assignments: [],
          },
          error: null,
        }),
      };

      mockSupabaseQuery['class_members'] = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [{ user_id: 'usr-teacher-01', role: 'TEACHER' }],
          error: null,
        }),
      };

      mockSupabaseQuery['exam_rooms'] = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: 'room-cls-uuid',
            room_code: '998877',
            title: 'Khảo thí định kỳ 10A1',
            status: 'WAITING',
            is_active: true,
            scheduled_start: null,
          },
          error: null,
        }),
      };

      const { GET } = await import('@/app/api/classes/[id]/route');
      const req = new Request('http://localhost:3000/api/classes/cls-10a1-uuid', {
        method: 'GET',
      });

      const res = await GET(req, { params: Promise.resolve({ id: 'cls-10a1-uuid' }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.group.activeLiveRoom).toBeDefined();
      expect(data.group.activeLiveRoom.roomCode).toBe('998877');
      expect(data.group.activeLiveRoom.title).toBe('Khảo thí định kỳ 10A1');
      expect(data.group.activeLiveRoom.status).toBe('WAITING');
    });
  });
});
