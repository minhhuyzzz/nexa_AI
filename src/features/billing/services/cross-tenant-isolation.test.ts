import { describe, it, expect, vi } from 'vitest';
import { QuotaEnforcementService } from './quota-enforcement.service';

describe('Cross-Tenant Security & Workspace Isolation', () => {
  it('ngăn chặn tạo đề thi nếu tổ chức bị vô hiệu hóa (is_active = false)', async () => {
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({ data: { plan_tier: 'ENTERPRISE' }, error: null }),
              }),
            }),
          };
        }
        if (table === 'organizations') {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({
                  data: { is_active: false, quota_assessments: 500 },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      }),
    } as any;

    const result = await QuotaEnforcementService.checkAssessmentCreationQuota(
      mockSupabase,
      'user-1',
      'org-suspended'
    );

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('tạm ngưng hoạt động');
  });

  it('cách ly hạn mức tổ chức với hạn mức cá nhân của thành viên', async () => {
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({ data: { plan_tier: 'FREE' }, error: null }),
              }),
            }),
          };
        }
        if (table === 'organizations') {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({
                  data: { is_active: true, quota_assessments: 200 },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'assessments') {
          return {
            select: () => ({
              eq: async () => ({ count: 15, error: null }),
            }),
          };
        }
        return {};
      }),
    } as any;

    // Dù người dùng là gói FREE cá nhân, khi tạo trong Organization thì dùng hạn mức Enterprise của Org (200 đề)
    const orgResult = await QuotaEnforcementService.checkAssessmentCreationQuota(
      mockSupabase,
      'user-free',
      'org-active'
    );

    expect(orgResult.allowed).toBe(true);
    expect(orgResult.maxLimit).toBe(200);
    expect(orgResult.currentUsage).toBe(15);
  });
});
