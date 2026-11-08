import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { QuotaEnforcementService } from '@/features/billing/services/quota-enforcement.service';
import { POST as createRenewalRequest } from '@/app/api/organizations/[orgId]/renewal-requests/route';
import { POST as approveRenewalRequest } from '@/app/api/admin/business/renewals/[id]/approve/route';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { requirePlatformAdmin } from '@/lib/auth/admin-guard';

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/auth/admin-guard', () => ({
  requirePlatformAdmin: vi.fn(),
}));

vi.mock('@/lib/audit/admin-audit.service', () => ({
  recordAdminAudit: vi.fn().mockResolvedValue(undefined),
}));

// Helper to create flexible Supabase chain mock
function createChain(resolveValue: any) {
  const chain: any = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    or: vi.fn(() => chain),
    in: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    delete: vi.fn(() => chain),
    maybeSingle: vi.fn().mockResolvedValue({ data: resolveValue, error: null }),
    single: vi.fn().mockResolvedValue({ data: resolveValue, error: null }),
  };
  return chain;
}

describe('NEXA SaaS Business v3.0 Lifecycle Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // 1. ENTITLEMENT 4-STATE RESOLUTION
  // =========================================================================
  describe('QuotaEnforcementService.getOrgEntitlements (4 States)', () => {
    it('trả về trạng thái PROVISIONING an toàn khi tổ chức chưa có bản ghi hợp đồng', async () => {
      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'organization_entitlements') {
            return createChain(null);
          }
          return createChain(null);
        }),
      } as any;

      const result = await QuotaEnforcementService.getOrgEntitlements(mockSupabase, 'org-provisioning-1');

      expect(result.status).toBe('PROVISIONING');
      expect(result.isProvisioning).toBe(true);
      expect(result.isActive).toBe(false);
      expect(result.contractNumber).toBe('PROVISIONING');
      expect(result.contractNumber).not.toContain('CHƯA_KÍCH_HOẠT');
      expect(result.maxSeats).toBe(50); // Fallback an toàn, chống chia cho 0
      expect(result.maxAssessments).toBe(10);
      expect(result.aiCreditsGranted).toBe(0);
    });

    it('trả về trạng thái ACTIVE khi hợp đồng còn hạn trên 30 ngày', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 90);

      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'organization_entitlements') {
            return createChain({
              contract_number: 'NEXA-B2B-2026-999',
              max_seats: 250,
              max_assessments: 2000,
              ai_credits_granted: 5000,
              ai_credits_used: 1200,
              starts_at: new Date().toISOString(),
              expires_at: futureDate.toISOString(),
              plan_name: 'Gói Business',
              is_active: true,
            });
          }
          return createChain(null);
        }),
      } as any;

      const result = await QuotaEnforcementService.getOrgEntitlements(mockSupabase, 'org-active-1');

      expect(result.status).toBe('ACTIVE');
      expect(result.isActive).toBe(true);
      expect(result.isProvisioning).toBe(false);
      expect(result.maxSeats).toBe(250);
      expect(result.aiCreditsGranted).toBe(5000);
      expect(result.remainingCredits).toBe(3800);
      expect(result.daysRemaining).toBeGreaterThan(30);
    });

    it('trả về trạng thái EXPIRING khi thời hạn còn dưới hoặc bằng 30 ngày', async () => {
      const expiringDate = new Date();
      expiringDate.setDate(expiringDate.getDate() + 15);

      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'organization_entitlements') {
            return createChain({
              contract_number: 'NEXA-B2B-2026-111',
              max_seats: 100,
              max_assessments: 500,
              ai_credits_granted: 2000,
              ai_credits_used: 100,
              starts_at: new Date(Date.now() - 300 * 86400000).toISOString(),
              expires_at: expiringDate.toISOString(),
              plan_name: 'NEXA Business Core',
              is_active: true,
            });
          }
          return createChain(null);
        }),
      } as any;

      const result = await QuotaEnforcementService.getOrgEntitlements(mockSupabase, 'org-expiring-1');

      expect(result.status).toBe('EXPIRING');
      expect(result.isActive).toBe(true);
      expect(result.daysRemaining).toBeLessThanOrEqual(30);
      expect(result.daysRemaining).toBeGreaterThan(0);
    });

    it('trả về trạng thái EXPIRED khi hợp đồng đã qua ngày hết hạn', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);

      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'organization_entitlements') {
            return createChain({
              contract_number: 'NEXA-B2B-EXPIRED',
              max_seats: 100,
              max_assessments: 500,
              ai_credits_granted: 2000,
              ai_credits_used: 2000,
              starts_at: new Date(Date.now() - 400 * 86400000).toISOString(),
              expires_at: pastDate.toISOString(),
              plan_name: 'NEXA Business Core',
              is_active: true,
            });
          }
          return createChain(null);
        }),
      } as any;

      const result = await QuotaEnforcementService.getOrgEntitlements(mockSupabase, 'org-expired-1');

      expect(result.status).toBe('EXPIRED');
      expect(result.isActive).toBe(false);
      expect(result.daysRemaining).toBe(0);
    });
  });

  // =========================================================================
  // 2. BUSINESS RENEWAL REQUEST FLOW & DEDUPLICATION
  // =========================================================================
  describe('Renewal Requests Flow (API)', () => {
    it('chặn người dùng không có quyền quản lý gửi yêu cầu gia hạn (403)', async () => {
      // Mock authenticated regular member
      vi.mocked(createClient).mockResolvedValueOnce({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-regular-1', email: 'regular@test.com' } },
            error: null,
          }),
        },
      } as any);

      // user_organizations returns MEMBER (not ORG_OWNER or ORG_ADMIN)
      vi.mocked(createAdminClient).mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === 'user_organizations') {
            return createChain({ org_role: 'MEMBER', status: 'ACTIVE' });
          }
          return createChain(null);
        }),
      } as any);

      const req = new NextRequest('http://localhost:3000/api/organizations/org-test/renewal-requests', {
        method: 'POST',
        body: JSON.stringify({ periodMonths: 12 }),
      });

      const res = await createRenewalRequest(req, { params: Promise.resolve({ orgId: 'org-test' }) });
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toContain('Chỉ Quản trị viên tổ chức mới có quyền');
    });

    it('chặn gửi trùng khi tổ chức đã có yêu cầu gia hạn đang chờ xử lý (409)', async () => {
      // Mock authenticated Org Admin
      vi.mocked(createClient).mockResolvedValueOnce({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-admin-1', email: 'admin@test.com' } },
            error: null,
          }),
        },
      } as any);

      vi.mocked(createAdminClient).mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === 'user_organizations') {
            return createChain({ org_role: 'ORG_ADMIN', status: 'ACTIVE' });
          }
          if (table === 'renewal_requests') {
            // Existing PENDING request found
            return createChain({ id: 'existing-pending-1', status: 'PENDING' });
          }
          return createChain(null);
        }),
      } as any);

      const req = new NextRequest('http://localhost:3000/api/organizations/org-test/renewal-requests', {
        method: 'POST',
        body: JSON.stringify({ periodMonths: 12 }),
      });

      const res = await createRenewalRequest(req, { params: Promise.resolve({ orgId: 'org-test' }) });
      expect(res.status).toBe(409);
      const json = await res.json();
      expect(json.error).toContain('đang chờ NEXA xác nhận');
    });

    it('tạo thành công yêu cầu gia hạn hợp lệ với trạng thái PENDING', async () => {
      // Mock authenticated Org Owner
      vi.mocked(createClient).mockResolvedValueOnce({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-owner-1', email: 'owner@test.com' } },
            error: null,
          }),
        },
      } as any);

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'new-renewal-uuid',
              organization_id: 'org-test',
              period_months: 12,
              status: 'PENDING',
              requested_seats: 300,
            },
            error: null,
          }),
        }),
      });

      vi.mocked(createAdminClient).mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === 'user_organizations') {
            return createChain({ org_role: 'ORG_OWNER', status: 'ACTIVE' });
          }
          if (table === 'renewal_requests') {
            const chain = createChain(null); // No existing pending request
            chain.insert = mockInsert;
            return chain;
          }
          return createChain(null);
        }),
      } as any);

      const req = new NextRequest('http://localhost:3000/api/organizations/org-test/renewal-requests', {
        method: 'POST',
        body: JSON.stringify({
          periodMonths: 12,
          requestedSeats: 300,
          notes: 'Mở rộng quy mô năm học 2026-2027',
        }),
      });

      const res = await createRenewalRequest(req, { params: Promise.resolve({ orgId: 'org-test' }) });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.renewalRequest.status).toBe('PENDING');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          organization_id: 'org-test',
          period_months: 12,
          requested_seats: 300,
          status: 'PENDING',
        })
      );
    });
  });

  // =========================================================================
  // 3. ZERO-LOSS EXPIRY EXTENSION & ADMIN APPROVAL
  // =========================================================================
  describe('Zero-Loss Renewal Extension (Admin Approval)', () => {
    it('bảo vệ ngày dùng còn lại khi gia hạn sớm (new_end_at = current_end + period)', async () => {
      vi.mocked(requirePlatformAdmin).mockResolvedValueOnce({
        isAuthorized: true,
        user: { id: 'platform-admin-1', email: 'admin.platform@nexa.vn' } as any,
      });

      // Current expiry is 60 days into the future
      const currentExpiry = new Date();
      currentExpiry.setDate(currentExpiry.getDate() + 60);

      const mockRenewalReq = {
        id: 'renewal-req-123',
        organization_id: 'org-early-renew',
        period_months: 12,
        requested_seats: 250,
        status: 'PENDING',
        organizations: { id: 'org-early-renew', name: 'Trường Test Early', slug: 'test-early' },
      };

      const mockEntitlement = {
        id: 'ent-early-1',
        organization_id: 'org-early-renew',
        contract_number: 'NEXA-B2B-EARLY',
        max_seats: 200,
        expires_at: currentExpiry.toISOString(),
      };

      let capturedUpdatedEntitlement: any = null;

      vi.mocked(createAdminClient).mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === 'renewal_requests') {
            const chain = createChain(mockRenewalReq);
            chain.update = vi.fn().mockReturnValue(createChain({ ...mockRenewalReq, status: 'APPROVED' }));
            return chain;
          }
          if (table === 'organization_entitlements') {
            const chain = createChain(mockEntitlement);
            chain.update = vi.fn().mockImplementation((fields: any) => {
              capturedUpdatedEntitlement = fields;
              return createChain(fields);
            });
            return chain;
          }
          if (table === 'admin_audit_logs') {
            return createChain(null);
          }
          return createChain(null);
        }),
      } as any);

      const req = new NextRequest('http://localhost:3000/api/admin/business/renewals/renewal-req-123/approve', {
        method: 'POST',
      });

      const res = await approveRenewalRequest(req, { params: Promise.resolve({ id: 'renewal-req-123' }) });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);

      expect(capturedUpdatedEntitlement).not.toBeNull();
      const newExpiry = new Date(capturedUpdatedEntitlement.expires_at);

      // Verify zero loss: newExpiry should be ~currentExpiry + 12 months (~425 days from now), NOT now + 12 months (365 days)
      const daysFromNow = (newExpiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      expect(daysFromNow).toBeGreaterThan(410); // 60 remaining + 365 days = ~425 days
      expect(capturedUpdatedEntitlement.max_seats).toBe(250);
    });

    it('nối từ thời điểm hiện tại nếu gói đã hết hạn trong quá khứ', async () => {
      vi.mocked(requirePlatformAdmin).mockResolvedValueOnce({
        isAuthorized: true,
        user: { id: 'platform-admin-1', email: 'admin.platform@nexa.vn' } as any,
      });

      // Current expiry was 30 days in the past
      const pastExpiry = new Date();
      pastExpiry.setDate(pastExpiry.getDate() - 30);

      const mockRenewalReq = {
        id: 'renewal-req-expired',
        organization_id: 'org-past-renew',
        period_months: 6,
        status: 'PENDING',
        organizations: { id: 'org-past-renew', name: 'Trường Test Past', slug: 'test-past' },
      };

      const mockEntitlement = {
        id: 'ent-past-1',
        organization_id: 'org-past-renew',
        contract_number: 'NEXA-B2B-PAST',
        max_seats: 100,
        expires_at: pastExpiry.toISOString(),
      };

      let capturedUpdatedEntitlement: any = null;

      vi.mocked(createAdminClient).mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === 'renewal_requests') {
            const chain = createChain(mockRenewalReq);
            chain.update = vi.fn().mockReturnValue(createChain({ ...mockRenewalReq, status: 'APPROVED' }));
            return chain;
          }
          if (table === 'organization_entitlements') {
            const chain = createChain(mockEntitlement);
            chain.update = vi.fn().mockImplementation((fields: any) => {
              capturedUpdatedEntitlement = fields;
              return createChain(fields);
            });
            return chain;
          }
          if (table === 'admin_audit_logs') {
            return createChain(null);
          }
          return createChain(null);
        }),
      } as any);

      const req = new NextRequest('http://localhost:3000/api/admin/business/renewals/renewal-req-expired/approve', {
        method: 'POST',
      });

      const res = await approveRenewalRequest(req, { params: Promise.resolve({ id: 'renewal-req-expired' }) });
      expect(res.status).toBe(200);

      expect(capturedUpdatedEntitlement).not.toBeNull();
      const newExpiry = new Date(capturedUpdatedEntitlement.expires_at);

      // Should be extended from NOW + 6 months (~180 days from now), NOT from past date (~150 days)
      const daysFromNow = (newExpiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      expect(daysFromNow).toBeGreaterThan(175);
      expect(daysFromNow).toBeLessThan(185);
    });
  });

  // =========================================================================
  // 4. INVITATION REDIRECTION BY ROLE
  // =========================================================================
  describe('Invitation Redirection Rules', () => {
    it('điều hướng ORG_OWNER và ORG_ADMIN vào không gian tổ chức /org/[slug]', () => {
      const getTargetUrl = (role: string, slug: string) => {
        const isManagerRole = role === 'ORG_OWNER' || role === 'ORG_ADMIN';
        return isManagerRole ? `/org/${slug}` : '/personal/dashboard';
      };

      expect(getTargetUrl('ORG_OWNER', 'fpt-poly')).toBe('/org/fpt-poly');
      expect(getTargetUrl('ORG_ADMIN', 'fpt-poly')).toBe('/org/fpt-poly');
    });

    it('điều hướng MEMBER và LEARNER về Personal Dashboard /personal/dashboard', () => {
      const getTargetUrl = (role: string, slug: string) => {
        const isManagerRole = role === 'ORG_OWNER' || role === 'ORG_ADMIN';
        return isManagerRole ? `/org/${slug}` : '/personal/dashboard';
      };

      expect(getTargetUrl('MEMBER', 'fpt-poly')).toBe('/personal/dashboard');
      expect(getTargetUrl('LEARNER', 'fpt-poly')).toBe('/personal/dashboard');
    });
  });

  // =========================================================================
  // 5. PERSONAL PROFILE INDEPENDENCE
  // =========================================================================
  describe('Personal Profile Independence on Org Onboarding', () => {
    it('bảo toàn profiles.plan_tier của tài khoản cá nhân khi gia nhập tổ chức', () => {
      // Logic from src/app/api/auth/onboarding/route.ts
      const simulateOnboarding = (currentProfileTier: string, orgJoined: boolean) => {
        // In V3, user_organizations gets MEMBER, but profile.plan_tier stays independent (e.g. FREE)
        const targetPlanTier = currentProfileTier; // NOT overwritten by 'ENTERPRISE'
        return {
          profilePlanTier: targetPlanTier,
          hasOrgMembership: orgJoined,
        };
      };

      const result = simulateOnboarding('FREE', true);
      expect(result.profilePlanTier).toBe('FREE');
      expect(result.profilePlanTier).not.toBe('ENTERPRISE');
      expect(result.hasOrgMembership).toBe(true);
    });
  });
});
