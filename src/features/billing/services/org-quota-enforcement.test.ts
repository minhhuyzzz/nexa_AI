import { describe, it, expect, vi } from 'vitest';
import { QuotaEnforcementService } from './quota-enforcement.service';

describe('OrgQuotaEnforcementService', () => {
  it('should return active contract entitlement with remaining credits calculation', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            contract_number: 'HD-FPT-2026-001',
            max_seats: 200,
            max_assessments: 1000,
            ai_credits_granted: 5000,
            ai_credits_used: 1200,
            starts_at: '2026-01-01T00:00:00Z',
            expires_at: '2026-12-31T23:59:59Z',
            is_active: true,
          },
          error: null,
        }),
      }),
    };

    const res = await QuotaEnforcementService.getOrgEntitlements(
      mockSupabase as any,
      'org-111'
    );

    expect(res.contractNumber).toBe('HD-FPT-2026-001');
    expect(res.maxSeats).toBe(200);
    expect(res.maxAssessments).toBe(1000);
    expect(res.aiCreditsGranted).toBe(5000);
    expect(res.aiCreditsUsed).toBe(1200);
    expect(res.remainingCredits).toBe(3800);
    expect(res.isActive).toBe(true);
  });

  it('should allow AI action when organization has sufficient credits', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            contract_number: 'HD-TEST-1',
            max_seats: 50,
            max_assessments: 500,
            ai_credits_granted: 100,
            ai_credits_used: 40,
            is_active: true,
          },
          error: null,
        }),
      }),
    };

    const check = await QuotaEnforcementService.checkOrgAICreditsQuota(
      mockSupabase as any,
      'org-111',
      10
    );

    expect(check.allowed).toBe(true);
    expect(check.remainingCredits).toBe(60);
    expect(check.reason).toBeUndefined();
  });

  it('should block AI action and provide clear reason when organization runs out of credits', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            contract_number: 'HD-TEST-2',
            max_seats: 50,
            max_assessments: 500,
            ai_credits_granted: 100,
            ai_credits_used: 95,
            is_active: true,
          },
          error: null,
        }),
      }),
    };

    const check = await QuotaEnforcementService.checkOrgAICreditsQuota(
      mockSupabase as any,
      'org-111',
      10
    );

    expect(check.allowed).toBe(false);
    expect(check.remainingCredits).toBe(5);
    expect(check.reason).toContain('Hạn mức AI Credits của tổ chức không đủ');
  });

  it('should block AI action if contract is suspended or inactive', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            contract_number: 'HD-TEST-3',
            max_seats: 50,
            max_assessments: 500,
            ai_credits_granted: 1000,
            ai_credits_used: 0,
            is_active: false,
          },
          error: null,
        }),
      }),
    };

    const check = await QuotaEnforcementService.checkOrgAICreditsQuota(
      mockSupabase as any,
      'org-111',
      5
    );

    expect(check.allowed).toBe(false);
    expect(check.reason).toContain('Hợp đồng tổ chức đang bị tạm ngưng');
  });

  describe('reserveCredits and settleOrReleaseCredits (MOD-02 / AI-07 / AI-12)', () => {
    it('should successfully reserve credits for Organization and return reservation details', async () => {
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({ data: 95, error: null }),
        from: vi.fn(),
      };

      const res = await QuotaEnforcementService.reserveCredits(
        mockSupabase as any,
        { isOrg: true, organizationId: 'org-123', userId: 'user-456' },
        5,
        'req-id-100'
      );

      expect(res.success).toBe(true);
      expect(res.reservationId).toBe('req-id-100');
      expect(res.payerType).toBe('ORG');
      expect(res.amount).toBe(5);
      expect(res.remainingCredits).toBe(95);
    });

    it('should fail reservation and fail-closed when organization has insufficient credits', async () => {
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({ data: null, error: { message: 'Hạn mức AI Credits của tổ chức không đủ' } }),
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { ai_credits_granted: 100, ai_credits_used: 98, is_active: true, expires_at: '2028-01-01' },
            error: null,
          }),
        }),
      };

      const res = await QuotaEnforcementService.reserveCredits(
        mockSupabase as any,
        { isOrg: true, organizationId: 'org-123', userId: 'user-456' },
        5
      );

      expect(res.success).toBe(false);
      expect(res.error).toContain('Hạn mức AI Credits của tổ chức không đủ');
    });

    it('should release (refund) credits if AI task fails', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: 'ent-1', ai_credits_granted: 100, ai_credits_used: 10, is_active: true },
            error: null,
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }),
      };

      const reservation = {
        success: true,
        reservationId: 'req-1',
        payerType: 'ORG' as const,
        payerId: 'org-123',
        amount: 5,
      };

      const settleRes = await QuotaEnforcementService.settleOrReleaseCredits(
        mockSupabase as any,
        reservation,
        'RELEASE'
      );

      expect(settleRes.success).toBe(true);
      expect(settleRes.action).toBe('RELEASED');
      expect(settleRes.refundedAmount).toBe(5);
    });
  });
});
