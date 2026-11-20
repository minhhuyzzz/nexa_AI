import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { NextResponse, type NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/auth/admin-guard', () => ({
  requirePlatformAdmin: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/audit/admin-audit.service', () => ({
  recordAdminAudit: vi.fn().mockResolvedValue({}),
}));

import { requirePlatformAdmin } from '@/lib/auth/admin-guard';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { GET as getBillingPreview } from '@/app/api/billing/preview/route';
import { POST as confirmTrial } from '@/app/api/billing/confirm-trial/route';
import { POST as cancelAutoRenew } from '@/app/api/billing/cancel-auto-renew/route';
import { GET as getAdminPlans, PATCH as patchAdminPlans } from '@/app/api/admin/plans/route';
import { PATCH as patchAdminUsers } from '@/app/api/admin/users/route';

describe('Feature: Free Trial 30 Days & Admin Plans/Users Real Connection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // SUITE 1: Migration 55 & Database Schema Invariants
  // ==========================================================================
  describe('Migration 55: Subscriptions & Standardized Service Plans Schema', () => {
    const migrationPath = path.resolve(
      __dirname,
      '../../src/database/migrations/55_subscriptions_and_standardized_service_plans.sql'
    );
    const rollbackPath = path.resolve(
      __dirname,
      '../../src/database/migrations/55_rollback_subscriptions_and_service_plans.sql'
    );

    it('migration file 55 and rollback 55 should exist', () => {
      expect(fs.existsSync(migrationPath)).toBe(true);
      expect(fs.existsSync(rollbackPath)).toBe(true);
    });

    it('migration 55 should add columns to service_plans and create subscriptions table', () => {
      const sql = fs.readFileSync(migrationPath, 'utf8');
      expect(sql).toContain('ADD COLUMN IF NOT EXISTS badge');
      expect(sql).toContain('ADD COLUMN IF NOT EXISTS trial_days');
      expect(sql).toContain('ADD COLUMN IF NOT EXISTS annual_price_vnd');
      expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.subscriptions');
      expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.user_trial_history');
      expect(sql).toContain('TRIALING');
      expect(sql).toContain('STANDARD');
      expect(sql).toContain('BASIC');
      expect(sql).toContain('ADVANCED');
      expect(sql).toContain('ENTERPRISE');
    });

    it('rollback 55 should drop subscriptions and user_trial_history', () => {
      const sql = fs.readFileSync(rollbackPath, 'utf8');
      expect(sql).toContain('DROP TABLE IF EXISTS public.user_trial_history');
      expect(sql).toContain('DROP TABLE IF EXISTS public.subscriptions');
    });
  });

  // ==========================================================================
  // SUITE 1B: Migration 56: Cleanup Legacy Plans & Canonicalize 4 Plans
  // ==========================================================================
  describe('Migration 56: Cleanup Legacy Plans and Canonicalize 4 Plans', () => {
    const migration56Path = path.resolve(
      __dirname,
      '../../src/database/migrations/56_cleanup_legacy_plans_and_canonicalize_4_plans.sql'
    );
    const rollback56Path = path.resolve(
      __dirname,
      '../../src/database/migrations/56_rollback_cleanup_legacy_plans.sql'
    );

    it('migration 56 and rollback 56 should exist', () => {
      expect(fs.existsSync(migration56Path)).toBe(true);
      expect(fs.existsSync(rollback56Path)).toBe(true);
    });

    it('migration 56 should deactivate legacy evaluator and learner plans', () => {
      const sql = fs.readFileSync(migration56Path, 'utf8');
      expect(sql).toContain('EVALUATOR_FREE');
      expect(sql).toContain('EVALUATOR_PLUS');
      expect(sql).toContain('EVALUATOR_PRO');
      expect(sql).toContain('is_active = FALSE');
      expect(sql).toContain('is_active = TRUE');
      expect(sql).toContain('BASIC');
      expect(sql).toContain('STANDARD');
      expect(sql).toContain('ADVANCED');
      expect(sql).toContain('ENTERPRISE');
    });
  });

  // ==========================================================================
  // SUITE 2: Billing Preview (/api/billing/preview)
  // ==========================================================================
  describe('Billing Preview Route (/api/billing/preview)', () => {
    it('trả về isTrialEligible = true và amount = 0 cho Gói Tiêu Chuẩn khi người dùng chưa từng dùng thử', async () => {
      const mockUser = { id: 'user-trial-1', email: 'learner@test.com' };
      const mockAdminSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'service_plans') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: 'plan-std',
                  code: 'STANDARD',
                  name: 'Gói Tiêu Chuẩn',
                  description: 'Mở khóa trọn vẹn các miền bồi dưỡng',
                  price_vnd: 49000,
                  annual_price_vnd: 468000,
                  trial_days: 30,
                  badge: 'PHỔ BIẾN NHẤT',
                  credits_included: 100,
                  features: ['Tính năng 1', 'Tính năng 2'],
                },
                error: null,
              }),
            };
          }
          if (table === 'user_trial_history') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              in: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            };
          }
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }),
      };

      const mockUserSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
        },
      };

      vi.mocked(createAdminClient).mockReturnValue(mockAdminSupabase as any);
      vi.mocked(createClient).mockResolvedValue(mockUserSupabase as any);

      const req = new Request('http://localhost:3000/api/billing/preview?plan=STANDARD&cycle=monthly');
      const res = await getBillingPreview(req as unknown as NextRequest);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.plan.code).toBe('STANDARD');
      expect(json.plan.isTrialEligible).toBe(true);
      expect(json.plan.amount).toBe(0);
      expect(json.plan.trialDiscount).toBe(49000);
      expect(json.plan.trialDays).toBe(30);
    });

    it('không áp dụng dùng thử khi chu kỳ chọn là YEARLY', async () => {
      const mockUser = { id: 'user-trial-1', email: 'learner@test.com' };
      const mockAdminSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'service_plans') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: 'plan-std',
                  code: 'STANDARD',
                  name: 'Gói Tiêu Chuẩn',
                  description: 'Mở khóa trọn vẹn các miền bồi dưỡng',
                  price_vnd: 49000,
                  annual_price_vnd: 468000,
                  trial_days: 30,
                  badge: 'PHỔ BIẾN NHẤT',
                  credits_included: 100,
                  features: [],
                },
                error: null,
              }),
            };
          }
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }),
      };

      const mockUserSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
        },
      };

      vi.mocked(createAdminClient).mockReturnValue(mockAdminSupabase as any);
      vi.mocked(createClient).mockResolvedValue(mockUserSupabase as any);

      const req = new Request('http://localhost:3000/api/billing/preview?plan=STANDARD&cycle=yearly');
      const res = await getBillingPreview(req as unknown as NextRequest);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.plan.isTrialEligible).toBe(false);
      expect(json.plan.amount).toBe(468000);
    });
  });

  // ==========================================================================
  // SUITE 3: Confirm Trial 30 Days (/api/billing/confirm-trial)
  // ==========================================================================
  describe('Confirm Trial Route (/api/billing/confirm-trial)', () => {
    it('chặn 401 khi người dùng chưa đăng nhập', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error('Unauthorized') }),
        },
      };
      vi.mocked(createClient).mockResolvedValueOnce(mockSupabase as any);

      const req = {
        json: async () => ({ planCode: 'STANDARD' }),
      } as unknown as NextRequest;

      const res = await confirmTrial(req);
      expect(res.status).toBe(401);
    });

    it('kích hoạt dùng thử thành công: tạo subscription TRIALING, cấp 100 AI credits và lưu transaction 0đ', async () => {
      const mockUser = { id: 'user-trial-new', email: 'new@test.com' };
      const mockAdmin = {
        from: vi.fn((table: string) => {
          if (table === 'service_plans') {
            return {
              select: vi.fn().mockReturnThis(),
              in: vi.fn().mockReturnThis(),
              order: vi.fn().mockReturnThis(),
              limit: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: 'plan-std-id',
                  code: 'STANDARD',
                  name: 'Gói Tiêu Chuẩn',
                  price_vnd: 49000,
                  trial_days: 30,
                  credits_included: 100,
                },
                error: null,
              }),
            };
          }
          if (table === 'user_trial_history') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              insert: vi.fn().mockResolvedValue({ error: null }),
            };
          }
          if (table === 'subscriptions') {
            return {
              insert: vi.fn().mockReturnThis(),
              select: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'sub-new-123',
                  user_id: mockUser.id,
                  plan_code: 'STANDARD',
                  status: 'TRIALING',
                  is_trial: true,
                  auto_renew: true,
                  expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
                },
                error: null,
              }),
              upsert: vi.fn().mockResolvedValue({ error: null }),
            };
          }
          if (table === 'profiles') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({ data: { credits: 10 }, error: null }),
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null }),
              }),
            };
          }
          if (table === 'payment_transactions') {
            return {
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: { id: 'tx-1' }, error: null }),
                }),
              }),
            };
          }
          if (table === 'ai_credit_ledgers') {
            return {
              insert: vi.fn().mockResolvedValue({ error: null }),
            };
          }
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            insert: vi.fn().mockResolvedValue({ error: null }),
            update: vi.fn().mockResolvedValue({ error: null }),
            upsert: vi.fn().mockResolvedValue({ error: null }),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }),
      };

      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
        },
      };

      vi.mocked(createClient).mockResolvedValueOnce(mockSupabase as any);
      vi.mocked(createAdminClient).mockReturnValue(mockAdmin as any);

      const req = {
        json: async () => ({ planCode: 'STANDARD' }),
      } as unknown as NextRequest;

      const res = await confirmTrial(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.subscription.status).toBe('TRIALING');
      expect(json.subscription.planCode).toBe('STANDARD');
      expect(json.subscription.creditsIncluded).toBe(100);
    });

    it('chặn lạm dụng 400 khi người dùng đã từng dùng thử gói Tiêu Chuẩn', async () => {
      const mockUser = { id: 'user-trial-abuser', email: 'abuser@test.com' };
      const mockAdmin = {
        from: vi.fn((table: string) => {
          if (table === 'user_trial_history') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: 'trial-hist-1', user_id: mockUser.id, plan_code: 'STANDARD' },
                error: null,
              }),
            };
          }
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }),
      };

      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
        },
      };

      vi.mocked(createClient).mockResolvedValueOnce(mockSupabase as any);
      vi.mocked(createAdminClient).mockReturnValue(mockAdmin as any);

      const req = {
        json: async () => ({ planCode: 'STANDARD' }),
      } as unknown as NextRequest;

      const res = await confirmTrial(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.error).toContain('đã từng kích hoạt 30 ngày dùng thử');
    });
  });

  // ==========================================================================
  // SUITE 4: Cancel Auto Renew (/api/billing/cancel-auto-renew)
  // ==========================================================================
  describe('Cancel Auto-Renew Route (/api/billing/cancel-auto-renew)', () => {
    it('cho phép hủy gia hạn tự động và cập nhật auto_renew = false trong subscriptions', async () => {
      const mockUser = { id: 'user-cancel-renew', email: 'cancel@test.com' };
      const updateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: 'sub-1', auto_renew: false },
              error: null,
            }),
          }),
        }),
      });

      const mockAdmin = {
        from: vi.fn((table: string) => {
          if (table === 'subscriptions') {
            return {
              update: updateMock,
            };
          }
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
          };
        }),
      };

      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
        },
      };

      vi.mocked(createClient).mockResolvedValueOnce(mockSupabase as any);
      vi.mocked(createAdminClient).mockReturnValue(mockAdmin as any);

      const req = {} as unknown as NextRequest;
      const res = await cancelAutoRenew(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          auto_renew: false,
        })
      );
    });
  });

  // ==========================================================================
  // SUITE 5: Admin Plans Real CRUD (/api/admin/plans)
  // ==========================================================================
  describe('Admin Plans Route (/api/admin/plans)', () => {
    it('chặn 403 khi không phải Platform Admin', async () => {
      vi.mocked(requirePlatformAdmin).mockResolvedValueOnce({
        isAuthorized: false,
        errorResponse: NextResponse.json({ error: 'Chỉ Platform Admin mới có quyền' }, { status: 403 }),
      });

      const res = await getAdminPlans();
      expect(res.status).toBe(403);
    });

    it('Admin GET /api/admin/plans chỉ trả về 4 gói canonical và loại bỏ các gói legacy', async () => {
      vi.mocked(requirePlatformAdmin).mockResolvedValueOnce({
        isAuthorized: true,
        user: { id: 'admin-1', email: 'admin@nexa.edu.vn' } as any,
      });

      const inMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockReturnThis();
      const orderMock = vi.fn().mockResolvedValue({
        data: [
          { id: '1', code: 'BASIC', name: 'Gói Cơ Bản', is_active: true },
          { id: '2', code: 'STANDARD', name: 'Gói Tiêu Chuẩn', is_active: true },
          { id: '3', code: 'ADVANCED', name: 'Gói Nâng Cao', is_active: true },
          { id: '4', code: 'ENTERPRISE', name: 'Gói Tổ Chức', is_active: true },
        ],
        error: null,
      });

      const mockAdmin = {
        from: vi.fn(() => ({
          select: vi.fn().mockReturnValue({
            in: inMock.mockReturnValue({
              eq: eqMock.mockReturnValue({
                order: orderMock,
              }),
            }),
          }),
        })),
      };

      vi.mocked(createAdminClient).mockReturnValue(mockAdmin as any);

      const res = await getAdminPlans();
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.plans).toHaveLength(4);
      expect(inMock).toHaveBeenCalledWith('code', ['BASIC', 'STANDARD', 'ADVANCED', 'ENTERPRISE']);
    });

    it('Admin PATCH lưu cấu hình giá và hạn mức vào service_plans thành công', async () => {
      vi.mocked(requirePlatformAdmin).mockResolvedValueOnce({
        isAuthorized: true,
        user: { id: 'admin-1', email: 'admin@nexa.edu.vn' } as any,
      });

      const updateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'plan-std-id',
                code: 'STANDARD',
                name: 'Gói Tiêu Chuẩn',
                price_vnd: 49000,
                annual_price_vnd: 468000,
                trial_days: 30,
                badge: 'PHỔ BIẾN NHẤT',
                credits_included: 120,
                max_classes: 15,
                max_class_members: 120,
              },
              error: null,
            }),
          }),
        }),
      });

      const mockAdmin = {
        from: vi.fn((table: string) => {
          if (table === 'service_plans') {
            return {
              update: updateMock,
            };
          }
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
          };
        }),
      };

      vi.mocked(createAdminClient).mockReturnValue(mockAdmin as any);

      const req = {
        json: async () => ({
          id: 'plan-std-id',
          priceVnd: 49000,
          annualPriceVnd: 468000,
          trialDays: 30,
          badge: 'PHỔ BIẾN NHẤT',
          creditsIncluded: 120,
          maxClasses: 15,
          maxClassMembers: 120,
        }),
      } as unknown as NextRequest;

      const res = await patchAdminPlans(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.plan.credits_included).toBe(120);
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          credits_included: 120,
          trial_days: 30,
          badge: 'PHỔ BIẾN NHẤT',
        })
      );
    });
  });

  // ==========================================================================
  // SUITE 6: Admin Users Real Plan Grant (/api/admin/users)
  // ==========================================================================
  describe('Admin Users Route (/api/admin/users)', () => {
    it('Admin đổi gói người dùng sang ADVANCED tự động cấp bù 500 AI credits và 30 ngày thời hạn', async () => {
      vi.mocked(requirePlatformAdmin).mockResolvedValueOnce({
        isAuthorized: true,
        user: { id: 'admin-1', email: 'admin@nexa.edu.vn' } as any,
      });

      const upsertSubMock = vi.fn().mockResolvedValue({ error: null });
      const insertLedgerMock = vi.fn().mockResolvedValue({ error: null });

      const mockAdmin = {
        from: vi.fn((table: string) => {
          if (table === 'profiles') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'target-user-1',
                  email: 'target@test.com',
                  role: 'LEARNER',
                  plan_tier: 'BASIC',
                  credits: 10,
                },
                error: null,
              }),
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: {
                        id: 'target-user-1',
                        email: 'target@test.com',
                        role: 'LEARNER',
                        plan_tier: 'ADVANCED',
                        credits: 510,
                        updated_at: new Date().toISOString(),
                      },
                      error: null,
                    }),
                  }),
                }),
              }),
            };
          }
          if (table === 'service_plans') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  code: 'ADVANCED',
                  name: 'Gói Nâng Cao',
                  credits_included: 500,
                },
                error: null,
              }),
            };
          }
          if (table === 'subscriptions') {
            return {
              upsert: upsertSubMock,
            };
          }
          if (table === 'ai_credit_ledgers') {
            return {
              insert: insertLedgerMock,
            };
          }
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            insert: vi.fn().mockResolvedValue({ error: null }),
            upsert: vi.fn().mockResolvedValue({ error: null }),
          };
        }),
      };

      vi.mocked(createAdminClient).mockReturnValue(mockAdmin as any);

      const req = {
        json: async () => ({
          userId: 'target-user-1',
          planTier: 'ADVANCED',
        }),
      } as unknown as NextRequest;

      const res = await patchAdminUsers(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(upsertSubMock).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'target-user-1',
          plan_code: 'ADVANCED',
          status: 'ACTIVE',
        }),
        expect.anything()
      );
      expect(insertLedgerMock).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'target-user-1',
          amount: 500,
          action: 'ADMIN_GRANT',
          reason: 'Admin gán gói dịch vụ ADVANCED',
        })
      );
    });
  });
});
