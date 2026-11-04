import { describe, it, expect, vi } from 'vitest';
import { QuotaEnforcementService } from './quota-enforcement.service';

describe('QuotaEnforcementService', () => {
  it('định nghĩa đúng hạn mức của các hạng gói FREE, PRO, ENTERPRISE', () => {
    expect(QuotaEnforcementService.TIER_LIMITS.FREE.maxAssessments).toBe(15);
    expect(QuotaEnforcementService.TIER_LIMITS.FREE.maxClasses).toBe(10);
    expect(QuotaEnforcementService.TIER_LIMITS.FREE.maxLiveRooms).toBe(3);

    expect(QuotaEnforcementService.TIER_LIMITS.PRO.maxAssessments).toBeGreaterThan(1000);
    expect(QuotaEnforcementService.TIER_LIMITS.PRO.maxClasses).toBeGreaterThan(1000);
    expect(QuotaEnforcementService.TIER_LIMITS.PRO.maxLiveRooms).toBe(20);

    expect(QuotaEnforcementService.TIER_LIMITS.ENTERPRISE.maxAssessments).toBeGreaterThan(100);
  });

  it('cho phép tạo đề thi nếu số lượng hiện tại nhỏ hơn hạn mức gói', async () => {
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({ data: { plan_tier: 'FREE' }, error: null }),
                maybeSingle: async () => ({ data: { plan_tier: 'FREE' }, error: null }),
              }),
            }),
          };
        }
        if (table === 'assessments') {
          return {
            select: () => ({
              or: async () => ({ count: 2, error: null }),
            }),
          };
        }
        return {};
      }),
    } as any;

    const result = await QuotaEnforcementService.checkAssessmentCreationQuota(
      mockSupabase,
      'user-123'
    );

    expect(result.allowed).toBe(true);
    expect(result.currentUsage).toBe(2);
    expect(result.maxLimit).toBe(15);
    expect(result.planTier).toBe('FREE');
    expect(result.reason).toBeUndefined();
  });

  it('từ chối tạo đề thi nếu người dùng Free đã đạt giới hạn 15 đề', async () => {
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({ data: { plan_tier: 'FREE' }, error: null }),
                maybeSingle: async () => ({ data: { plan_tier: 'FREE' }, error: null }),
              }),
            }),
          };
        }
        if (table === 'assessments') {
          return {
            select: () => ({
              or: async () => ({ count: 15, error: null }),
            }),
          };
        }
        return {};
      }),
    } as any;

    const result = await QuotaEnforcementService.checkAssessmentCreationQuota(
      mockSupabase,
      'user-123'
    );

    expect(result.allowed).toBe(false);
    expect(result.currentUsage).toBe(15);
    expect(result.maxLimit).toBe(15);
    expect(result.reason).toContain('hết hạn mức 15 đề thi');
  });

  it('kiểm tra số dư credits cho tác vụ AI chính xác', async () => {
    const mockSupabase = {
      from: vi.fn(() => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: { credits: 5, plan_tier: 'FREE' }, error: null }),
          }),
        }),
      })),
    } as any;

    const result = await QuotaEnforcementService.checkAICreditsQuota(
      mockSupabase,
      'user-123',
      10
    );

    expect(result.allowed).toBe(false);
    expect(result.remainingCredits).toBe(5);
    expect(result.requiredCredits).toBe(10);
    expect(result.reason).toContain('không đủ');
  });
});
