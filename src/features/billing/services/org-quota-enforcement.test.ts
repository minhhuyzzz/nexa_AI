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
});
