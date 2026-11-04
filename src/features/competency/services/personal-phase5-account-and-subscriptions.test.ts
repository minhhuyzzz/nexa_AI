import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Handlers under test for Phase 5: Account & Subscriptions (UC-P01, UC-P18)
import { GET as getPersonalProfile, PATCH as updatePersonalProfile } from '@/app/api/personal/profile/route';
import { GET as getProfileStats } from '@/app/api/personal/profile-stats/route';
import { GET as getLearningGoals, PUT as updateLearningGoals } from '@/app/api/personal/goals/route';
import { GET as getPlans } from '@/app/api/plans/route';
import { POST as createBillingIntent } from '@/app/api/billing/create-intent/route';
import { GET as getBillingStatus } from '@/app/api/billing/status/route';
import { POST as mockPay } from '@/app/api/billing/mock-pay/route';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

vi.mock('@/features/billing/services/quota-enforcement.service', () => ({
  QuotaEnforcementService: {
    getUserPlanDetails: vi.fn().mockResolvedValue({ tier: 'FREE', active: true }),
  },
}));

vi.mock('@/features/billing/services/payment-verifier.service', () => ({
  PaymentVerifierService: {
    createPaymentIntent: vi.fn(),
    getTransactionStatus: vi.fn(),
    fulfillByReference: vi.fn(),
  },
}));

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { PaymentVerifierService } from '@/features/billing/services/payment-verifier.service';

describe('Personal User Phase 5: Account & Subscriptions (UC-P01, UC-P18)', () => {
  const userId = '11111111-2222-3333-4444-555555555555';
  const otherUserId = '99999999-8888-7777-6666-555555555555';
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
  });

  // =========================================================================
  // UC-P01: Quản lý hồ sơ cá nhân
  // =========================================================================
  describe('UC-P01: Quản lý hồ sơ cá nhân', () => {
    describe('GET /api/personal/profile', () => {
      it('chặn 401 khi chưa đăng nhập', async () => {
        vi.mocked(createClient).mockResolvedValue({
          auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
          },
        } as any);

        const res = await getPersonalProfile();
        expect(res.status).toBe(401);
      });

      it('trả về hồ sơ cá nhân với đầy đủ điểm số, cấp độ và gói dịch vụ', async () => {
        vi.mocked(createClient).mockResolvedValue({
          auth: {
            getUser: vi.fn().mockResolvedValue({
              data: {
                user: {
                  id: userId,
                  email: 'learner@nexa.edu.vn',
                  user_metadata: { full_name: 'Nguyễn Văn A' },
                  app_metadata: { provider: 'email' },
                },
              },
              error: null,
            }),
          },
          from: vi.fn((table: string) => {
            if (table === 'profiles') {
              return {
                select: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: {
                        id: userId,
                        full_name: 'Nguyễn Văn A',
                        nickname: 'VanA',
                        email: 'learner@nexa.edu.vn',
                        avatar_url: null,
                        role: 'LEARNER',
                        points: 320,
                        login_streak: 5,
                        total_login_days: 12,
                        plan_tier: 'FREE',
                        credits: 10,
                      },
                      error: null,
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

        const res = await getPersonalProfile();
        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data.profile.id).toBe(userId);
        expect(data.profile.nickname).toBe('VanA');
        expect(data.profile.points).toBe(320);
        expect(data.profile.levelNumber).toBe(3); // Points >= 300 -> Level 3
        expect(data.profile.levelCode).toContain('Level 3');
      });
    });

    describe('PATCH /api/personal/profile', () => {
      it('chặn 400 khi biệt danh không hợp lệ (< 2 ký tự)', async () => {
        vi.mocked(createClient).mockResolvedValue({
          auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId } }, error: null }),
          },
        } as any);

        const req = new NextRequest('http://localhost:3000/api/personal/profile', {
          method: 'PATCH',
          body: JSON.stringify({ nickname: 'A' }),
        });

        const res = await updatePersonalProfile(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toContain('ít nhất 2 ký tự');
      });

      it('chặn 409 khi biệt danh đã được sử dụng bởi người khác (Unique constraint 23505)', async () => {
        vi.mocked(createClient).mockResolvedValue({
          auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId } }, error: null }),
          },
          from: vi.fn().mockReturnValue({
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: { code: '23505', message: 'duplicate key' } }),
            }),
          }),
        } as any);

        const req = new NextRequest('http://localhost:3000/api/personal/profile', {
          method: 'PATCH',
          body: JSON.stringify({ nickname: 'AdminSuper' }),
        });

        const res = await updatePersonalProfile(req);
        expect(res.status).toBe(409);
        const data = await res.json();
        expect(data.error).toContain('Biệt danh này đã có người sử dụng');
      });

      it('cập nhật biệt danh thành công', async () => {
        vi.mocked(createClient).mockResolvedValue({
          auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId } }, error: null }),
          },
          from: vi.fn().mockReturnValue({
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }),
        } as any);

        const req = new NextRequest('http://localhost:3000/api/personal/profile', {
          method: 'PATCH',
          body: JSON.stringify({ nickname: 'NguyenVanAPro' }),
        });

        const res = await updatePersonalProfile(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.updates.nickname).toBe('NguyenVanAPro');
      });
    });

    describe('GET /api/personal/profile-stats', () => {
      it('ghi nhận điểm danh đăng nhập hàng ngày và tính toán chuỗi streak', async () => {
        vi.mocked(createClient).mockResolvedValue({
          auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId, email: 'learner@nexa.edu.vn' } }, error: null }),
          },
          from: vi.fn((table: string) => {
            if (table === 'profiles') {
              return {
                select: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: {
                        id: userId,
                        full_name: 'Nguyen Van A',
                        nickname: 'VanA',
                        points: 100,
                        total_login_days: 4,
                        login_streak: 4,
                        last_login_date: '2026-01-01', // Cần điểm danh ngày mới
                        role: 'LEARNER',
                        plan_tier: 'FREE',
                      },
                      error: null,
                    }),
                  }),
                }),
                update: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ error: null }),
                }),
              };
            }
            if (table === 'credentials') {
              return {
                select: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                      order: vi.fn().mockReturnValue({
                        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
                      }),
                    }),
                  }),
                }),
              };
            }
            return { select: vi.fn().mockReturnThis() };
          }),
        } as any);

        const res = await getProfileStats();
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.stats.points).toBe(101); // +1 point for new login today
        expect(data.stats.newLoginToday).toBe(true);
        expect(data.stats.level.number).toBe(1); // 101 pts -> Level 1
      });
    });

    describe('Mục tiêu học tập (GET & PUT /api/personal/goals)', () => {
      it('GET /api/personal/goals: trả về mục tiêu mặc định nếu chưa thiết lập', async () => {
        vi.mocked(createClient).mockResolvedValue({
          auth: {
            getUser: vi.fn().mockResolvedValue({
              data: { user: { id: userId, user_metadata: {} } },
              error: null,
            }),
          },
        } as any);

        const res = await getLearningGoals();
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.goal.title).toBe('Nâng cao kỹ năng sử dụng công nghệ trong học tập và công việc');
      });

      it('PUT /api/personal/goals: cập nhật thành công mục tiêu học tập', async () => {
        const mockUpdateUser = vi.fn().mockResolvedValue({ error: null });

        vi.mocked(createClient).mockResolvedValue({
          auth: {
            getUser: vi.fn().mockResolvedValue({
              data: { user: { id: userId } },
              error: null,
            }),
            updateUser: mockUpdateUser,
          },
        } as any);

        const req = new NextRequest('http://localhost:3000/api/personal/goals', {
          method: 'PUT',
          body: JSON.stringify({
            title: 'Chinh phục 500 điểm DigComp Master',
            track: 'Chuyên gia số',
            pace: '2 giờ mỗi ngày',
          }),
        });

        const res = await updateLearningGoals(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.goal.title).toBe('Chinh phục 500 điểm DigComp Master');
        expect(mockUpdateUser).toHaveBeenCalledWith({
          data: {
            learning_goal: expect.objectContaining({
              title: 'Chinh phục 500 điểm DigComp Master',
              track: 'Chuyên gia số',
            }),
          },
        });
      });
    });
  });

  // =========================================================================
  // UC-P18: Quản lý gói dịch vụ cá nhân (Billing & Subscription)
  // =========================================================================
  describe('UC-P18: Quản lý gói dịch vụ cá nhân', () => {
    describe('Bảng giá dịch vụ (GET /api/plans)', () => {
      it('trả về danh sách gói dịch vụ đang hoạt động', async () => {
        const mockPlans = [
          {
            id: 'plan-free',
            code: 'FREE',
            role_target: 'LEARNER',
            name: 'Cá nhân Miễn phí',
            description: 'Đánh giá năng lực số cơ bản',
            price_vnd: 0,
            billing_cycle: 'ONCE',
            credits_included: 0,
            max_members: 1,
            features: ['Đánh giá 5 miền', 'Lộ trình cơ bản'],
            sort_order: 1,
          },
          {
            id: 'plan-pro',
            code: 'PERSONAL_PRO',
            role_target: 'LEARNER',
            name: 'Cá nhân Pro',
            description: 'Mở khóa toàn bộ thư viện đề và cấp chứng chỉ',
            price_vnd: 99000,
            billing_cycle: 'MONTHLY',
            credits_included: 50,
            max_members: 1,
            features: ['Đề thi nâng cao', 'Chứng chỉ Master'],
            sort_order: 2,
          },
        ];

        vi.mocked(createClient).mockResolvedValue({
          from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ data: mockPlans, error: null }),
                }),
              }),
            }),
          }),
        } as any);

        const req = new NextRequest('http://localhost:3000/api/plans?role=LEARNER');
        const res = await getPlans(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.plans).toHaveLength(2);
        expect(data.plans[1].code).toBe('PERSONAL_PRO');
      });
    });

    describe('Khởi tạo thanh toán (POST /api/billing/create-intent)', () => {
      it('chặn 401 khi chưa đăng nhập', async () => {
        vi.mocked(createClient).mockResolvedValue({
          auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
          },
        } as any);

        const req = new NextRequest('http://localhost:3000/api/billing/create-intent', {
          method: 'POST',
          body: JSON.stringify({ planCode: 'PERSONAL_PRO' }),
        });

        const res = await createBillingIntent(req);
        expect(res.status).toBe(401);
      });

      it('chặn 400 khi cố thanh toán gói Doanh nghiệp/Tổ chức qua cổng cá nhân tự phục vụ (ADM-03)', async () => {
        vi.mocked(createClient).mockResolvedValue({
          auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId, email: 'learner@nexa.edu.vn' } }, error: null }),
          },
        } as any);

        const req = new NextRequest('http://localhost:3000/api/billing/create-intent', {
          method: 'POST',
          body: JSON.stringify({ planCode: 'ORG_BUSINESS_ANNUAL' }),
        });

        const res = await createBillingIntent(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toContain('không hỗ trợ thanh toán tự phục vụ qua cổng cá nhân');
      });

      it('tạo phiên thanh toán thành công cho gói cá nhân Personal Pro', async () => {
        vi.mocked(createClient).mockResolvedValue({
          auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId, email: 'learner@nexa.edu.vn' } }, error: null }),
          },
        } as any);

        const mockIntent = {
          orderCode: 123456,
          checkoutUrl: 'https://pay.payos.vn/web/123456',
          amount: 99000,
          description: 'Nang cap NEXA Personal Pro',
          status: 'PENDING',
        };

        vi.mocked(PaymentVerifierService.createPaymentIntent).mockResolvedValueOnce(mockIntent as any);

        const req = new NextRequest('http://localhost:3000/api/billing/create-intent', {
          method: 'POST',
          body: JSON.stringify({ planCode: 'PERSONAL_PRO' }),
        });

        const res = await createBillingIntent(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.intent.orderCode).toBe(123456);
        expect(data.intent.checkoutUrl).toBe('https://pay.payos.vn/web/123456');
      });
    });

    describe('Kiểm tra trạng thái đơn hàng (GET /api/billing/status)', () => {
      it('chặn 400 khi thiếu mã định danh đơn hàng', async () => {
        vi.mocked(createClient).mockResolvedValue({
          auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId } }, error: null }),
          },
        } as any);

        const req = new NextRequest('http://localhost:3000/api/billing/status');
        const res = await getBillingStatus(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toContain('Thiếu mã định danh đơn hàng');
      });

      it('trả về trạng thái giao dịch hợp lệ', async () => {
        vi.mocked(createClient).mockResolvedValue({
          auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId } }, error: null }),
          },
        } as any);

        const mockTx = {
          id: 'tx-123',
          orderCode: 123456,
          status: 'SUCCESS',
          amount: 99000,
          planCode: 'PERSONAL_PRO',
        };

        vi.mocked(PaymentVerifierService.getTransactionStatus).mockResolvedValueOnce(mockTx as any);

        const req = new NextRequest('http://localhost:3000/api/billing/status?orderCode=123456');
        const res = await getBillingStatus(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.transaction.status).toBe('SUCCESS');
      });
    });

    describe('Giả lập thanh toán môi trường thử nghiệm (POST /api/billing/mock-pay)', () => {
      it('chặn 403 khi chạy trên môi trường production', async () => {
        (process.env as any).NODE_ENV = 'production';

        const req = new NextRequest('http://localhost:3000/api/billing/mock-pay', {
          method: 'POST',
          body: JSON.stringify({ referenceCode: 'REF-123' }),
        });

        const res = await mockPay(req);
        expect(res.status).toBe(403);
        const data = await res.json();
        expect(data.error).toContain('bị vô hiệu hóa trên môi trường Production');
      });

      it('chặn 403 khi giao dịch thuộc về tài khoản khác', async () => {
        (process.env as any).NODE_ENV = 'test';

        vi.mocked(createClient).mockResolvedValue({
          auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId } }, error: null }),
          },
        } as any);

        vi.mocked(createAdminClient).mockReturnValue({
          from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'tx-other', user_id: otherUserId, amount: 99000, status: 'PENDING' },
                  error: null,
                }),
              }),
            }),
          }),
        } as any);

        const req = new NextRequest('http://localhost:3000/api/billing/mock-pay', {
          method: 'POST',
          body: JSON.stringify({ referenceCode: 'REF-OTHER' }),
        });

        const res = await mockPay(req);
        expect(res.status).toBe(403);
        const data = await res.json();
        expect(data.error).toContain('không thuộc về tài khoản hiện tại');
      });

      it('hoàn tất thanh toán và nâng cấp gói thành công trong môi trường thử nghiệm', async () => {
        (process.env as any).NODE_ENV = 'test';

        vi.mocked(createClient).mockResolvedValue({
          auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId } }, error: null }),
          },
        } as any);

        vi.mocked(createAdminClient).mockReturnValue({
          from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'tx-1', user_id: userId, amount: 99000, status: 'PENDING' },
                  error: null,
                }),
              }),
            }),
          }),
        } as any);

        vi.mocked(PaymentVerifierService.fulfillByReference).mockResolvedValueOnce({
          success: true,
          planTier: 'PRO',
          creditsAdded: 50,
        } as any);

        const req = new NextRequest('http://localhost:3000/api/billing/mock-pay', {
          method: 'POST',
          body: JSON.stringify({ referenceCode: 'REF-VALID' }),
        });

        const res = await mockPay(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.data.planTier).toBe('PRO');
      });
    });
  });
});
