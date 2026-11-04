import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Handlers under test for Phase 2: Learning Roadmap & Credentials
import { GET as getLearningPath, POST as updateLearningPathStep } from '@/app/api/personal/learning-path/route';
import { GET as getLearningModules } from '@/app/api/learning/modules/route';
import { POST as completeLearningModule } from '@/app/api/learning/complete/route';
import { GET as getLeaderboard } from '@/app/api/leaderboard/route';
import { GET as getMyCredentials } from '@/app/api/credentials/my/route';
import { GET as getCredentialPdf } from '@/app/api/credentials/[id]/pdf/route';

vi.mock('@/lib/redis/client', () => ({
  getRedisClient: vi.fn(() => null),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

vi.mock('@/features/gamification/services/point-ledger.service', () => ({
  PointLedgerService: {
    grantPoints: vi.fn().mockResolvedValue({ success: true, points: 530 }),
  },
}));

vi.mock('@/features/credentials/services/certificate-generator.service', () => ({
  CertificateGeneratorService: {
    generate: vi.fn().mockResolvedValue({
      pdfBytes: new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]), // %PDF-
      contentHash: 'a'.repeat(64),
      pdfHash: 'b'.repeat(64),
      qrDataUrl: 'data:image/png;base64,mockqr',
      verificationUrl: 'http://localhost:3000/verify/cred-1',
    }),
  },
}));

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { PointLedgerService } from '@/features/gamification/services/point-ledger.service';

describe('Personal User Phase 2: Learning Roadmap & Credentials (UC-P08, UC-P09, UC-P16, UC-P17)', () => {
  const userId = '11111111-2222-3333-4444-555555555555';
  const otherUserId = '99999999-8888-7777-6666-555555555555';
  const analysisId = 'aaaaaaaa-1111-2222-3333-444444444444';
  const moduleId = 'bbbbbbbb-1111-2222-3333-444444444444';
  const credentialId = 'cccccccc-1111-2222-3333-444444444444';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // UC-P08: Tham gia lộ trình học tập cá nhân hóa
  // =========================================================================
  describe('UC-P08: Tham gia lộ trình học tập', () => {
    it('chặn 401 khi chưa đăng nhập truy cập lộ trình', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error('No session') }),
        },
      } as any);

      const res = await getLearningPath();
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe('Yêu cầu đăng nhập');
    });

    it('trả về lộ trình học tập cá nhân hóa gắn với kết quả AI phân tích', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId } }, error: null }),
        },
      } as any);

      const mockAnalysis = {
        id: analysisId,
        user_id: userId,
        overall_level: 'INTERMEDIATE',
        learning_pathway: [
          { stepNumber: 1, title: 'Bảo mật mật khẩu', is_completed: true },
          { stepNumber: 2, title: 'Chia sẻ dữ liệu an toàn', is_completed: false },
        ],
      };

      const mockProgress = [
        { module_id: moduleId, is_completed: true, completed_at: '2026-03-01T00:00:00Z', points_awarded: 30 },
      ];

      const mockModules = [
        { id: moduleId, title: 'Bảo mật tài khoản', is_published: true, order_index: 1 },
      ];

      vi.mocked(createAdminClient).mockReturnValue({
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'competency_analyses') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      maybeSingle: vi.fn().mockResolvedValue({ data: mockAnalysis, error: null }),
                    }),
                  }),
                }),
              }),
            };
          }
          if (table === 'user_learning_progress') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: mockProgress, error: null }),
              }),
            };
          }
          if (table === 'learning_modules') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({ data: mockModules, error: null }),
                }),
              }),
            };
          }
          return { select: vi.fn().mockReturnThis() };
        }),
      } as any);

      const res = await getLearningPath();
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.analysis.id).toBe(analysisId);
      expect(json.analysis.learning_pathway).toHaveLength(2);
      expect(json.progress).toHaveLength(1);
      expect(json.modules).toHaveLength(1);
    });

    it('tải danh sách học liệu chuẩn kèm trạng thái hoàn thành cá nhân', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId } }, error: null }),
        },
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'learning_modules') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({
                    data: [
                      {
                        id: moduleId,
                        domain_code: 'SAFETY',
                        skill_code: 'SAFE_1',
                        title: 'An toàn số căn bản',
                        duration_minutes: 25,
                        point_reward: 30,
                        order_index: 1,
                        competencies: { name: 'Bảo vệ thiết bị' },
                      },
                    ],
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === 'user_learning_progress') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [{ module_id: moduleId, is_completed: true, completed_at: '2026-03-01T00:00:00Z' }],
                  error: null,
                }),
              }),
            };
          }
          return { select: vi.fn().mockReturnThis() };
        }),
      } as any);

      const res = await getLearningModules();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.modules).toHaveLength(1);
      expect(data.modules[0].id).toBe(moduleId);
      expect(data.modules[0].isCompleted).toBe(true);
      expect(data.modules[0].pointReward).toBe(30);
    });
  });

  // =========================================================================
  // UC-P09: Theo dõi & Cập nhật tiến độ lộ trình học tập
  // =========================================================================
  describe('UC-P09: Theo dõi & Cập nhật tiến độ học tập', () => {
    it('cập nhật thành công bước học trong pathway khi người dùng sở hữu lộ trình', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId } }, error: null }),
        },
      } as any);

      const existingPathway = [
        { stepNumber: 1, title: 'Bước 1', is_completed: false },
        { stepNumber: 2, title: 'Bước 2', is_completed: false },
      ];

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      vi.mocked(createAdminClient).mockReturnValue({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: analysisId, user_id: userId, learning_pathway: existingPathway },
                error: null,
              }),
            }),
          }),
          update: mockUpdate,
        }),
      } as any);

      const req = new NextRequest('http://localhost:3000/api/personal/learning-path', {
        method: 'POST',
        body: JSON.stringify({
          analysisId,
          stepNumber: 1,
          completed: true,
        }),
      });

      const res = await updateLearningPathStep(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.learningPathway[0].is_completed).toBe(true);
      expect(data.learningPathway[0].completed_at).toBeDefined();
      expect(mockUpdate).toHaveBeenCalledWith({
        learning_pathway: expect.arrayContaining([
          expect.objectContaining({ stepNumber: 1, is_completed: true }),
        ]),
      });
    });

    it('chặn 403 khi cố cập nhật lộ trình của người khác', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId } }, error: null }),
        },
      } as any);

      vi.mocked(createAdminClient).mockReturnValue({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: analysisId, user_id: otherUserId, learning_pathway: [] },
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const req = new NextRequest('http://localhost:3000/api/personal/learning-path', {
        method: 'POST',
        body: JSON.stringify({
          analysisId,
          stepNumber: 1,
          completed: true,
        }),
      });

      const res = await updateLearningPathStep(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain('không có quyền');
    });

    it('hoàn thành bài học, ghi nhận tiến độ và cộng điểm qua PointLedgerService', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId } }, error: null }),
        },
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'learning_modules') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: moduleId, title: 'Bảo mật', point_reward: 30, skill_code: 'SEC_1' },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === 'user_learning_progress') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: null, error: null }), // Chưa hoàn thành trước đó
                  }),
                }),
              }),
              upsert: vi.fn().mockResolvedValue({ error: null }),
            };
          }
          return { select: vi.fn().mockReturnThis() };
        }),
      } as any);

      const req = new NextRequest('http://localhost:3000/api/learning/complete', {
        method: 'POST',
        body: JSON.stringify({ moduleId }),
      });

      const res = await completeLearningModule(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.pointsAwarded).toBe(30);
      expect(PointLedgerService.grantPoints).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userId,
          delta: 30,
          eventType: 'MODULE_COMPLETED',
          sourceId: moduleId,
        })
      );
    });

    it('đảm bảo tính Idempotent: không cộng điểm trùng nếu bài học đã hoàn thành trước đó', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId } }, error: null }),
        },
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'learning_modules') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: moduleId, title: 'Bảo mật', point_reward: 30 },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === 'user_learning_progress') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: { id: 'prog-1', is_completed: true }, // Đã hoàn thành rồi
                      error: null,
                    }),
                  }),
                }),
              }),
            };
          }
          return { select: vi.fn().mockReturnThis() };
        }),
      } as any);

      const req = new NextRequest('http://localhost:3000/api/learning/complete', {
        method: 'POST',
        body: JSON.stringify({ moduleId }),
      });

      const res = await completeLearningModule(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.alreadyCompleted).toBe(true);
      expect(data.pointsAwarded).toBe(0);
      expect(PointLedgerService.grantPoints).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // UC-P16: Xem bảng xếp hạng & Điểm thưởng XP/PTS
  // =========================================================================
  describe('UC-P16: Bảng xếp hạng và Điểm thưởng PTS', () => {
    it('xếp hạng học viên theo điểm PTS giảm dần và trả về currentUserRank', async () => {
      const mockProfiles = [
        {
          id: 'u-top1',
          nickname: 'Top 1 Pro',
          avatar_url: null,
          points: 800,
          rank_tier: 'MASTER',
          avg_competency_score: 75.0,
          role: 'LEARNER',
          specialization: 'Security',
          created_at: '2026-01-01T00:00:00Z',
        },
        {
          id: userId,
          nickname: 'Personal Tester',
          avatar_url: null,
          points: 520,
          rank_tier: 'PRACTITIONER',
          avg_competency_score: 90.0,
          role: 'LEARNER',
          specialization: 'Information',
          created_at: '2026-01-02T00:00:00Z',
        },
      ];

      const mockOrder = vi.fn().mockReturnThis();
      const mockLimit = vi.fn().mockResolvedValue({
        data: mockProfiles,
        error: null,
      });
      const mockEq = vi.fn().mockReturnValue({
        order: mockOrder,
        limit: mockLimit,
      });
      mockOrder.mockReturnValue({
        order: mockOrder,
        limit: mockLimit,
      });

      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId } }, error: null }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: mockEq,
          }),
        }),
      } as any);

      const res = await getLeaderboard(new Request('http://localhost:3000/api/leaderboard'));
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.leaderboard).toHaveLength(2);
      expect(data.leaderboard[0].userId).toBe('u-top1');
      expect(data.leaderboard[0].points).toBe(800);
      expect(data.leaderboard[0].rank).toBe(1);

      expect(data.leaderboard[1].userId).toBe(userId);
      expect(data.leaderboard[1].points).toBe(520);
      expect(data.leaderboard[1].rank).toBe(2);

      expect(data.currentUserRank).not.toBeNull();
      expect(data.currentUserRank.userId).toBe(userId);
      expect(data.currentUserRank.rank).toBe(2);
    });
  });

  // =========================================================================
  // UC-P17: Xem & Tải Chứng chỉ Năng lực số (Master Certificate)
  // Quy tắc chuẩn: Cần đủ 500 điểm VÀ hoàn thành 100% lộ trình mới mở khóa
  // =========================================================================
  describe('UC-P17: Chứng chỉ Năng lực số (Điều kiện kép: >= 500 PTS và 100% Lộ trình)', () => {
    it('chặn 401 khi chưa đăng nhập (không dùng fallback learner@nexa.edu.vn)', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        },
      } as any);

      const res = await getMyCredentials();
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe('Yêu cầu đăng nhập');
    });

    it('khóa chứng chỉ (isUnlocked = false) khi đạt >= 500 điểm nhưng CHƯA hoàn thành 100% lộ trình', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId } }, error: null }),
        },
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'profiles') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: userId, full_name: 'Nguyen Van A', points: 550, role: 'LEARNER' },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === 'competency_analyses') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      maybeSingle: vi.fn().mockResolvedValue({
                        data: {
                          id: analysisId,
                          learning_pathway: [
                            { stepNumber: 1, is_completed: true },
                            { stepNumber: 2, is_completed: false }, // Chưa xong
                          ],
                        },
                        error: null,
                      }),
                    }),
                  }),
                }),
              }),
            };
          }
          if (table === 'credentials') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockResolvedValue({ data: [], error: null }),
                  }),
                }),
              }),
            };
          }
          return { select: vi.fn().mockReturnThis() };
        }),
      } as any);

      const res = await getMyCredentials();
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.points).toBe(550);
      expect(data.requiredPoints).toBe(500);
      expect(data.isRoadmapCompleted).toBe(false);
      expect(data.isUnlocked).toBe(false);
      expect(data.masterCredential).toBeNull();
    });

    it('khóa chứng chỉ (isUnlocked = false) khi hoàn thành 100% lộ trình nhưng CHƯA đủ 500 điểm', async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId } }, error: null }),
        },
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'profiles') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: userId, full_name: 'Nguyen Van A', points: 350, role: 'LEARNER' },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === 'competency_analyses') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      maybeSingle: vi.fn().mockResolvedValue({
                        data: {
                          id: analysisId,
                          learning_pathway: [
                            { stepNumber: 1, is_completed: true },
                            { stepNumber: 2, is_completed: true },
                          ],
                        },
                        error: null,
                      }),
                    }),
                  }),
                }),
              }),
            };
          }
          if (table === 'credentials') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockResolvedValue({ data: [], error: null }),
                  }),
                }),
              }),
            };
          }
          return { select: vi.fn().mockReturnThis() };
        }),
      } as any);

      const res = await getMyCredentials();
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.points).toBe(350);
      expect(data.requiredPoints).toBe(500);
      expect(data.pointsNeeded).toBe(150);
      expect(data.isRoadmapCompleted).toBe(true);
      expect(data.isUnlocked).toBe(false);
      expect(data.masterCredential).toBeNull();
    });

    it('mở khóa và tự động cấp chứng chỉ khi thỏa mãn ĐỒNG THỜI: >= 500 PTS và 100% Lộ trình', async () => {
      const mockCreatedCredential = {
        id: credentialId,
        credential_code: 'NX-2026-MASTER-A1B2C3',
        candidate_name: 'Nguyen Van A',
        assessment_title: 'Chứng Nhận Năng Lực Số Toàn Diện (NEXA Master Certificate)',
        score_percentage: 100,
        total_score: 520,
        max_score: 500,
        competency_level: 'Level 4: Highly Advanced',
        content_sha256: 'a'.repeat(64),
        pdf_sha256: 'b'.repeat(64),
        qr_data: 'data:image/png;base64,mockqr',
        issued_at: new Date().toISOString(),
      };

      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId } }, error: null }),
        },
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'profiles') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: userId, full_name: 'Nguyen Van A', points: 520, role: 'LEARNER' },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === 'competency_analyses') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      maybeSingle: vi.fn().mockResolvedValue({
                        data: {
                          id: analysisId,
                          learning_pathway: [
                            { stepNumber: 1, is_completed: true },
                            { stepNumber: 2, is_completed: true },
                          ],
                        },
                        error: null,
                      }),
                    }),
                  }),
                }),
              }),
            };
          }
          if (table === 'credentials') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockResolvedValue({ data: [], error: null }),
                  }),
                }),
              }),
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: mockCreatedCredential,
                    error: null,
                  }),
                }),
              }),
            };
          }
          return { select: vi.fn().mockReturnThis() };
        }),
      } as any);

      const res = await getMyCredentials();
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.points).toBe(520);
      expect(data.requiredPoints).toBe(500);
      expect(data.isRoadmapCompleted).toBe(true);
      expect(data.isUnlocked).toBe(true);
      expect(data.masterCredential).not.toBeNull();
      expect(data.masterCredential.credential_code).toBe('NX-2026-MASTER-A1B2C3');
    });

    it('tải file PDF chứng chỉ số qua API và kèm chữ ký Content-SHA256, PDF-SHA256', async () => {
      vi.mocked(createClient).mockResolvedValue({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: credentialId,
                  credential_code: 'NX-2026-MASTER-A1B2C3',
                  candidate_name: 'Nguyen Van A',
                  assessment_title: 'NEXA Master Certificate',
                  score_percentage: 100,
                  total_score: 520,
                  max_score: 500,
                  competency_level: 'Level 4: Highly Advanced',
                  issued_at: '2026-03-01T00:00:00Z',
                  is_revoked: false,
                },
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const req = new NextRequest(`http://localhost:3000/api/credentials/${credentialId}/pdf`);
      const res = await getCredentialPdf(req, { params: Promise.resolve({ id: credentialId }) });

      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toBe('application/pdf');
      expect(res.headers.get('x-content-sha256')).toBe('a'.repeat(64));
      expect(res.headers.get('x-pdf-sha256')).toBe('b'.repeat(64));
    });

    it('từ chối 410 khi chứng chỉ đã bị thu hồi (Revoked)', async () => {
      vi.mocked(createClient).mockResolvedValue({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: credentialId,
                  credential_code: 'NX-2026-MASTER-REVOKED',
                  candidate_name: 'Nguyen Van A',
                  is_revoked: true,
                  revoked_reason: 'Gian lận thi cử',
                },
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const req = new NextRequest(`http://localhost:3000/api/credentials/${credentialId}/pdf`);
      const res = await getCredentialPdf(req, { params: Promise.resolve({ id: credentialId }) });

      expect(res.status).toBe(410);
      const data = await res.json();
      expect(data.error).toContain('Gian lận thi cử');
    });
  });
});
