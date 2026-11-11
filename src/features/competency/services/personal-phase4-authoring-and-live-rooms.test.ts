import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Handlers under test for Phase 4: Authoring & Live Rooms (UC-P13, UC-P14, UC-P15, UC-P19)
import { GET as getPersonalAssessments, POST as createPersonalAssessment } from '@/app/api/personal/assessments/route';
import { GET as getPersonalAssessmentDetail, PATCH as updatePersonalAssessment } from '@/app/api/personal/assessments/[id]/route';
import { POST as saveAssessmentItems } from '@/app/api/personal/assessments/[id]/items/route';
import { GET as getEvaluatorRooms, POST as createLiveRoom } from '@/app/api/evaluator/rooms/route';
import { POST as joinLiveRoom } from '@/app/api/rooms/join/route';
import { POST as setReadyStatus } from '@/app/api/rooms/ready/route';
import { GET as getRoomStatus } from '@/app/api/rooms/status/route';
import { GET as getContributions, POST as createContribution } from '@/app/api/contributions/route';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

vi.mock('@/features/billing/services/quota-enforcement.service', () => ({
  QuotaEnforcementService: {
    checkLiveRoomQuota: vi.fn().mockResolvedValue({ allowed: true }),
  },
}));

vi.mock('@/features/gamification/services/point-ledger.service', () => ({
  PointLedgerService: {
    grantPoints: vi.fn().mockResolvedValue({ success: true, points: 50 }),
  },
}));

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { QuotaEnforcementService } from '@/features/billing/services/quota-enforcement.service';

describe('Personal User Phase 4: Authoring & Live Rooms (UC-P13, UC-P14, UC-P15, UC-P19)', () => {
  const learnerId = '11111111-2222-3333-4444-555555555555';
  const otherUserId = '99999999-8888-7777-6666-555555555555';
  const assessmentId = 'aaaaaaaa-1111-2222-3333-444444444444';
  const roomId = 'bbbbbbbb-1111-2222-3333-444444444444';
  const roomPin = '849201';

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock_service_key';
  });

  // =========================================================================
  // UC-P13: Quản lý đề đánh giá cá nhân (Authoring)
  // =========================================================================
  describe('UC-P13: Quản lý đề đánh giá cá nhân', () => {
    it('GET /api/personal/assessments: chặn 401 khi chưa đăng nhập', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error('No auth') }),
        },
      } as any);

      const res = await getPersonalAssessments();
      expect(res.status).toBe(401);
    });

    it('POST /api/personal/assessments: tạo bản ghi đề thi mới với trạng thái bản nháp', async () => {
      const mockCreated = {
        id: assessmentId,
        title: 'Đề kiểm tra kỹ năng số',
        description: 'Đề dành cho lớp',
        duration_minutes: 45,
        passing_score: 75,
        is_published: false,
        created_by: learnerId,
        owner_user_id: learnerId,
      };

      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: learnerId } }, error: null }),
        },
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockCreated, error: null }),
            }),
          }),
        }),
      } as any);

      const req = new NextRequest('http://localhost:3000/api/personal/assessments', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Đề kiểm tra kỹ năng số',
          description: 'Đề dành cho lớp',
          duration_minutes: 45,
          passing_score: 75,
        }),
      });

      const res = await createPersonalAssessment(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.assessment.id).toBe(assessmentId);
      expect(data.assessment.is_published).toBe(false);
    });

    it('GET /api/personal/assessments/[id]: chặn 403 khi người dùng không sở hữu đề thi', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: learnerId } }, error: null }),
        },
      } as any);

      vi.mocked(createAdminClient).mockReturnValue({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: assessmentId, created_by: otherUserId, owner_user_id: otherUserId },
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const res = await getPersonalAssessmentDetail(
        new Request(`http://localhost:3000/api/personal/assessments/${assessmentId}`),
        { params: Promise.resolve({ id: assessmentId }) }
      );

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain('không có quyền truy cập');
    });

    it('PATCH /api/personal/assessments/[id]: cập nhật thông tin và xuất bản đề thi', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: learnerId } }, error: null }),
        },
      } as any);

      const mockUpdated = {
        id: assessmentId,
        title: 'Đề kiểm tra đã cập nhật',
        passing_score: 80,
        is_published: true,
        created_by: learnerId,
        owner_user_id: learnerId,
      };

      vi.mocked(createAdminClient).mockReturnValue({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: assessmentId, created_by: learnerId, owner_user_id: learnerId },
                error: null,
              }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockUpdated, error: null }),
              }),
            }),
          }),
        }),
      } as any);

      const req = new NextRequest(`http://localhost:3000/api/personal/assessments/${assessmentId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: 'Đề kiểm tra đã cập nhật',
          passing_score: 80,
          is_published: true,
        }),
      });

      const res = await updatePersonalAssessment(req, { params: Promise.resolve({ id: assessmentId }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.assessment.is_published).toBe(true);
      expect(data.assessment.passing_score).toBe(80);
    });

    it('POST /api/personal/assessments/[id]/items: lưu danh sách câu hỏi vào đề thi', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: learnerId } }, error: null }),
        },
      } as any);

      vi.mocked(createAdminClient).mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === 'assessments') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { id: assessmentId, created_by: learnerId, owner_user_id: learnerId },
                    error: null,
                  }),
                }),
              }),
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null }),
              }),
            };
          }
          if (table === 'assessment_items') {
            return {
              delete: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null }),
              }),
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockImplementation(() => {
                  const items = [{ id: 'item-1', order_index: 0 }];
                  const promise = Promise.resolve({ data: items, error: null });
                  (promise as any).single = vi.fn().mockResolvedValue({ data: items[0], error: null });
                  return promise;
                }),
              }),
            };
          }
          if (table === 'item_options') {
            return {
              insert: vi.fn().mockResolvedValue({ error: null }),
            };
          }
          return { select: vi.fn().mockReturnThis() };
        }),
      } as any);

      const req = new NextRequest(`http://localhost:3000/api/personal/assessments/${assessmentId}/items`, {
        method: 'POST',
        body: JSON.stringify({
          questions: [
            {
              type: 'MCQ',
              prompt: 'Phishing là hình thức tấn công nào?',
              points: 10,
              domainCode: '04',
              options: [
                { text: 'Lừa đảo mạo danh', isCorrect: true },
                { text: 'Tấn công từ chối dịch vụ', isCorrect: false },
              ],
            },
          ],
        }),
      });

      const res = await saveAssessmentItems(req, { params: Promise.resolve({ id: assessmentId }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.count).toBe(1);
    });
  });

  // =========================================================================
  // UC-P14: Tổ chức phòng thi trực tiếp cá nhân (Host Live Room)
  // =========================================================================
  describe('UC-P14: Tổ chức phòng thi trực tiếp cá nhân', () => {
    it('chặn 401 khi chưa đăng nhập tạo phòng thi', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        },
      } as any);

      const req = new NextRequest('http://localhost:3000/api/evaluator/rooms', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Phòng thi K48',
          assessmentId,
        }),
      });

      const res = await createLiveRoom(req);
      expect(res.status).toBe(401);
    });

    it('chặn 403 khi vượt hạn ngạch Live Room cá nhân (Quota Enforcement)', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: learnerId } }, error: null }),
        },
      } as any);

      vi.mocked(QuotaEnforcementService.checkLiveRoomQuota).mockResolvedValueOnce({
        allowed: false,
        reason: 'Tài khoản miễn phí chỉ được mở tối đa 1 phòng thi trực tiếp đồng thời',
        currentUsage: 1,
        maxAllowed: 1,
      } as any);

      const req = new NextRequest('http://localhost:3000/api/evaluator/rooms', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Phòng thi K48 Vượt Hạn Ngạch',
          assessmentId,
        }),
      });

      const res = await createLiveRoom(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain('tối đa 1 phòng thi');
    });

    it('tạo phòng thi thành công: sinh mã PIN 6 chữ số và trạng thái ban đầu WAITING', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: learnerId } }, error: null }),
        },
        from: vi.fn((table: string) => {
          if (table === 'exam_rooms') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: null, error: null }), // PIN chưa bị trùng
                }),
              }),
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      id: roomId,
                      title: 'Phòng thi năng lực số K48',
                      assessment_id: assessmentId,
                      room_code: '849201',
                      room_mode: 'OPEN',
                      theme_id: 'minimal_white',
                      is_active: true,
                      status: 'WAITING',
                      evaluator_id: learnerId,
                    },
                    error: null,
                  }),
                }),
              }),
            };
          }
          return { select: vi.fn().mockReturnThis() };
        }),
      } as any);

      const req = new NextRequest('http://localhost:3000/api/evaluator/rooms', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Phòng thi năng lực số K48',
          assessmentId,
          roomMode: 'OPEN',
          themeId: 'minimal_white',
        }),
      });

      const res = await createLiveRoom(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.room.id).toBe(roomId);
      expect(data.room.roomCode).toMatch(/^\d{6}$/);
      expect(data.room.status).toBe('WAITING');
    });

    it('GET /api/evaluator/rooms: tải danh sách các phòng thi do người dùng quản lý', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: learnerId } }, error: null }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockImplementation(() => {
            const chain: any = {};
            chain.order = vi.fn(() => chain);
            chain.eq = vi.fn(() => chain);
            chain.then = (resolve: any) =>
              resolve({
                data: [
                  {
                    id: roomId,
                    room_code: '849201',
                    title: 'Phòng thi thử',
                    assessment_id: assessmentId,
                    status: 'WAITING',
                    is_active: true,
                    assessments: { title: 'Đề khảo thí mẫu', duration_minutes: 45, passing_score: 70 },
                    room_participants: [{ id: 'p1', is_ready: true, status: 'WAITING' }],
                  },
                ],
                error: null,
              });
            return chain;
          }),
        }),
      } as any);

      const req = new NextRequest('http://localhost:3000/api/evaluator/rooms');
      const res = await getEvaluatorRooms(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.rooms).toHaveLength(1);
      expect(data.rooms[0].roomCode).toBe('849201');
      expect(data.rooms[0].participantCount).toBe(1);
      expect(data.rooms[0].readyCount).toBe(1);
    });
  });

  // =========================================================================
  // UC-P15: Đóng góp nội dung đánh giá (Community Contributions)
  // =========================================================================
  describe('UC-P15: Đóng góp nội dung đánh giá', () => {
    it('chặn 401 khi chưa đăng nhập đóng góp nội dung', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        },
      } as any);

      const req = new NextRequest('http://localhost:3000/api/contributions', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Câu hỏi mới về an toàn số',
          domain: '04',
          questionType: 'MCQ',
          prompt: 'Đây là nội dung câu hỏi đóng góp',
        }),
      });

      const res = await createContribution(req);
      expect(res.status).toBe(401);
    });

    it('gửi nội dung đóng góp thành công với trạng thái PENDING', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: learnerId } }, error: null }),
        },
      } as any);

      const mockContribution = {
        id: 'contrib-1',
        code: 'CB-2026-0001',
        user_id: learnerId,
        title: 'Tình huống nhận diện lừa đảo Deepfake',
        domain: '04',
        question_type: 'SCENARIO',
        difficulty: 'INTERMEDIATE',
        status: 'PENDING',
        prompt: 'Một nhân viên nhận được video call từ Giám đốc yêu cầu chuyển tiền khẩn cấp...',
      };

      vi.mocked(createAdminClient).mockReturnValue({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockContribution, error: null }),
            }),
          }),
        }),
      } as any);

      const req = new NextRequest('http://localhost:3000/api/contributions', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Tình huống nhận diện lừa đảo Deepfake',
          domain: '04',
          questionType: 'SCENARIO',
          difficulty: 'INTERMEDIATE',
          prompt: 'Một nhân viên nhận được video call từ Giám đốc yêu cầu chuyển tiền khẩn cấp...',
        }),
      });

      const res = await createContribution(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.contribution.code).toBe('CB-2026-0001');
    });

    it('GET /api/contributions: chỉ trả về các bài đóng góp của chính người dùng (cách ly phi admin)', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: learnerId } }, error: null }),
        },
      } as any);

      vi.mocked(createAdminClient).mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === 'profiles') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: { role: 'LEARNER' }, error: null }),
                }),
              }),
            };
          }
          if (table === 'community_contributions') {
            const chain: any = {};
            chain.order = vi.fn(() => chain);
            chain.eq = vi.fn(() => chain);
            chain.then = (resolve: any) =>
              resolve({
                data: [
                  { id: 'contrib-1', code: 'CB-2026-0001', title: 'Bài đóng góp cá nhân', user_id: learnerId, status: 'PENDING' },
                ],
                error: null,
              });
            return {
              select: vi.fn().mockReturnValue(chain),
            };
          }
          return { select: vi.fn().mockReturnThis() };
        }),
      } as any);

      const req = new NextRequest('http://localhost:3000/api/contributions');
      const res = await getContributions(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.contributions).toHaveLength(1);
      expect(data.contributions[0].title).toBe('Bài đóng góp cá nhân');
    });
  });

  // =========================================================================
  // UC-P19: Tham gia phòng thi trực tiếp (Candidate Live Room)
  // =========================================================================
  describe('UC-P19: Tham gia phòng thi trực tiếp', () => {
    it('chặn 400 khi mã PIN phòng thi không hợp lệ (không đủ 6 số)', async () => {
      const req = new NextRequest('http://localhost:3000/api/rooms/join', {
        method: 'POST',
        body: JSON.stringify({ pin: '123' }),
      });

      const res = await joinLiveRoom(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('đúng 6 chữ số');
    });

    it('chặn 404 khi mã PIN không tồn tại hoặc phòng thi đã đóng', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: learnerId } }, error: null }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: new Error('Not found') }),
              }),
            }),
          }),
        }),
      } as any);

      const req = new NextRequest('http://localhost:3000/api/rooms/join', {
        method: 'POST',
        body: JSON.stringify({ pin: '999999' }),
      });

      const res = await joinLiveRoom(req);
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toContain('không tồn tại hoặc phòng thi đã đóng');
    });

    it('chặn 403 khi phòng thi bị khóa bởi Giám thị (is_locked = true)', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: learnerId } }, error: null }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: roomId,
                    room_code: roomPin,
                    is_active: true,
                    is_locked: true, // Bị khóa
                  },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      } as any);

      const req = new NextRequest('http://localhost:3000/api/rooms/join', {
        method: 'POST',
        body: JSON.stringify({ pin: roomPin }),
      });

      const res = await joinLiveRoom(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain('bị khóa bởi Giám thị');
      expect(data.code).toBe('ROOM_LOCKED');
    });

    it('tham gia phòng thi thành công và ghi danh vào room_participants', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: learnerId } }, error: null }),
        },
        from: vi.fn((table: string) => {
          if (table === 'exam_rooms') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: {
                        id: roomId,
                        room_code: roomPin,
                        title: 'Đề thi Live',
                        is_active: true,
                        is_locked: false,
                        access_policy: 'OPEN',
                        assessments: { id: assessmentId, title: 'Đề thi Live', duration_minutes: 30, passing_score: 70 },
                      },
                      error: null,
                    }),
                  }),
                }),
              }),
            };
          }
          if (table === 'room_participants') {
            return {
              upsert: vi.fn().mockResolvedValue({ error: null }),
            };
          }
          return { select: vi.fn().mockReturnThis() };
        }),
      } as any);

      const req = new NextRequest('http://localhost:3000/api/rooms/join', {
        method: 'POST',
        body: JSON.stringify({ pin: roomPin }),
      });

      const res = await joinLiveRoom(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.roomId).toBe(roomId);
      expect(data.roomCode).toBe(roomPin);
    });

    it('POST /api/rooms/ready: thí sinh cập nhật trạng thái sẵn sàng làm bài', async () => {
      const mockUpdatedParticipant = {
        id: 'part-1',
        room_id: roomId,
        user_id: learnerId,
        is_ready: true,
        ready_at: new Date().toISOString(),
        status: 'WAITING',
      };

      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: learnerId } }, error: null }),
        },
        from: vi.fn().mockReturnValue({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: mockUpdatedParticipant, error: null }),
                }),
              }),
            }),
          }),
        }),
      } as any);

      const req = new NextRequest('http://localhost:3000/api/rooms/ready', {
        method: 'POST',
        body: JSON.stringify({ roomId, isReady: true }),
      });

      const res = await setReadyStatus(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.participant.is_ready).toBe(true);
    });

    it('GET /api/rooms/status: tra cứu trạng thái phòng thi và danh sách thí sinh', async () => {
      const mockRoom = {
        id: roomId,
        room_code: roomPin,
        title: 'Phòng thi trực tiếp',
        assessment_id: assessmentId,
        is_active: true,
        status: 'IN_PROGRESS',
        assessments: { id: assessmentId, title: 'Đề thi số', duration_minutes: 45, passing_score: 70 },
      };

      vi.mocked(createClient).mockResolvedValue({
        from: vi.fn((table: string) => {
          if (table === 'exam_rooms') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: mockRoom, error: null }),
                }),
              }),
            };
          }
          if (table === 'room_participants') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({
                    data: [
                      { id: 'part-1', user_id: learnerId, is_ready: true, status: 'IN_PROGRESS' },
                    ],
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === 'profiles') {
            return {
              select: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({
                  data: [
                    { id: learnerId, full_name: 'Nguyen Van A', avatar_url: null },
                  ],
                  error: null,
                }),
              }),
            };
          }
          return { select: vi.fn().mockReturnThis() };
        }),
      } as any);

      const req = new Request(`http://localhost:3000/api/rooms/status?roomId=${roomId}`);
      const res = await getRoomStatus(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.room.status).toBe('IN_PROGRESS');
      expect(data.participants).toHaveLength(1);
      expect(data.participants[0].isReady).toBe(true);
    });
  });
});
