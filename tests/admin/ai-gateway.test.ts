import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST, PUT } from '@/app/api/admin/ai-gateway/route';
import { NextResponse, type NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/auth/admin-guard', () => ({
  requirePlatformAdmin: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

vi.mock('@/lib/audit/admin-audit.service', () => ({
  recordAdminAudit: vi.fn().mockResolvedValue({}),
}));

import { requirePlatformAdmin } from '@/lib/auth/admin-guard';
import { createAdminClient } from '@/lib/supabase/admin';
import { AIConfigService } from '@/features/ai-gateway/services/ai-config.service';

describe('Admin AI Gateway Route & Calibration Suite (/api/admin/ai-gateway)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    AIConfigService.clearCache();
  });

  describe('Authorization & Security Guards', () => {
    it('chặn 401 khi người dùng chưa đăng nhập gọi GET', async () => {
      vi.mocked(requirePlatformAdmin).mockResolvedValueOnce({
        isAuthorized: false,
        errorResponse: NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 }),
      });

      const req = new Request('http://localhost:3000/api/admin/ai-gateway?period=7d');
      const res = await GET(req as unknown as NextRequest);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toContain('Yêu cầu đăng nhập');
    });

    it('chặn 403 khi người dùng không phải Platform Admin gọi POST/PUT', async () => {
      vi.mocked(requirePlatformAdmin).mockResolvedValueOnce({
        isAuthorized: false,
        errorResponse: NextResponse.json(
          { error: 'Bạn không có quyền truy cập vào cổng quản trị Platform Admin' },
          { status: 403 }
        ),
      });

      const req = {
        json: async () => ({ provider: 'GOOGLE_GEMINI', defaultModel: 'gemini-2.5-flash' }),
      } as unknown as NextRequest;

      const res = await POST(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toContain('không có quyền truy cập');
    });
  });

  describe('GET /api/admin/ai-gateway', () => {
    it('trả về cấu hình gateway, số liệu telemetry, calibration summary và task policies', async () => {
      vi.mocked(requirePlatformAdmin).mockResolvedValueOnce({
        isAuthorized: true,
        user: { id: 'admin-uuid', email: 'admin@nexa.ai' } as any,
      });

      const mockUsageEvents = [
        {
          id: 'ev-1',
          feature: 'RUBRIC_GRADING',
          model: 'gemini-2.5-flash',
          prompt_tokens: 1500,
          completion_tokens: 300,
          latency_ms: 1200,
          cost_estimated: 0.002,
          status: 'SUCCESS',
          organization_id: 'org-uuid-1',
          created_at: new Date().toISOString(),
        },
        {
          id: 'ev-2',
          feature: 'COMPETENCY_ANALYSIS',
          model: 'gemini-2.5-flash',
          prompt_tokens: 2000,
          completion_tokens: 500,
          latency_ms: 1800,
          cost_estimated: 0.003,
          status: 'SUCCESS',
          organization_id: null,
          created_at: new Date().toISOString(),
        },
      ];

      const mockCalibrationLogs = [
        {
          id: 'calib-1',
          evaluation_id: 'eval-1',
          submission_id: 'sub-1',
          org_id: 'org-1',
          assessor_id: 'assessor-1',
          ai_score: 80,
          human_score: 85,
          score_delta: 5,
          task_type: 'RUBRIC_GRADING',
          created_at: new Date().toISOString(),
        },
        {
          id: 'calib-2',
          evaluation_id: 'eval-2',
          submission_id: 'sub-2',
          org_id: 'org-1',
          assessor_id: 'assessor-1',
          ai_score: 90,
          human_score: 90,
          score_delta: 0,
          task_type: 'RUBRIC_GRADING',
          created_at: new Date().toISOString(),
        },
      ];

      const mockTaskPolicies = [
        {
          task_type: 'RUBRIC_GRADING',
          is_enabled: true,
          supported_provider: 'GOOGLE_GEMINI',
          model_name: 'gemini-2.5-flash',
          price_credits: 1,
          timeout_ms: 25000,
          require_human_review: true,
        },
      ];

      const mockCreditReservations = [
        { status: 'SETTLED', credits: 1 },
        { status: 'RELEASED', credits: 1 },
      ];

      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'ai_usage_events') {
            return {
              select: vi.fn().mockReturnThis(),
              order: vi.fn().mockReturnThis(),
              gte: vi.fn().mockReturnThis(),
              limit: vi.fn().mockReturnThis(),
              is: vi.fn().mockReturnThis(),
              not: vi.fn().mockReturnThis(),
              then: (resolve: any) => resolve({ data: mockUsageEvents, error: null }),
            };
          }
          if (table === 'ai_calibration_logs') {
            return {
              select: vi.fn().mockReturnThis(),
              order: vi.fn().mockReturnThis(),
              limit: vi.fn().mockResolvedValue({ data: mockCalibrationLogs, error: null }),
            };
          }
          if (table === 'ai_task_policies') {
            return {
              select: vi.fn().mockReturnThis(),
              order: vi.fn().mockResolvedValue({ data: mockTaskPolicies, error: null }),
            };
          }
          if (table === 'ai_credit_reservations') {
            return {
              select: vi.fn().mockReturnThis(),
              limit: vi.fn().mockResolvedValue({ data: mockCreditReservations, error: null }),
            };
          }
          if (table === 'platform_settings') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  value: {
                    provider: 'GOOGLE_GEMINI',
                    defaultModel: 'gemini-2.5-flash',
                    costBudgetMonthlyUsd: 250,
                  },
                },
                error: null,
              }),
            };
          }
          return {
            select: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          };
        }),
      };

      vi.mocked(createAdminClient).mockReturnValue(mockSupabase as any);

      const req = new Request('http://localhost:3000/api/admin/ai-gateway?period=7d&flow=all');
      const res = await GET(req as unknown as NextRequest);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.config.provider).toBe('GOOGLE_GEMINI');
      expect(json.config.defaultModel).toBe('gemini-2.5-flash');
      expect(json.config.costBudgetMonthlyUsd).toBe(250);

      // Verify stats
      expect(json.stats.totalRequests).toBe(2);
      expect(json.stats.totalTokens).toBe(4300);

      // Verify calibration summary
      expect(json.calibrationSummary.totalLogs).toBe(2);
      expect(json.calibrationSummary.exactMatchCount).toBe(1);
      expect(json.calibrationSummary.highAgreementCount).toBe(1);
      expect(json.calibrationSummary.meanScoreDelta).toBe(2.5);

      // Verify task policies & credit usage
      expect(json.taskPolicies).toHaveLength(1);
      expect(json.creditUsageSummary.totalReservations).toBe(2);
      expect(json.creditUsageSummary.totalSettled).toBe(1);
      expect(json.creditUsageSummary.totalReleased).toBe(1);
    });
  });

  describe('POST & PUT /api/admin/ai-gateway', () => {
    it('cập nhật thành công cấu hình và xóa cache AIConfigService', async () => {
      vi.mocked(requirePlatformAdmin).mockResolvedValue({
        isAuthorized: true,
        user: { id: 'admin-uuid', email: 'admin@nexa.ai' } as any,
      });

      const upsertMock = vi.fn().mockResolvedValue({ error: null });
      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'platform_settings') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              upsert: upsertMock,
            };
          }
          return {};
        }),
      };
      vi.mocked(createAdminClient).mockReturnValue(mockSupabase as any);

      const clearCacheSpy = vi.spyOn(AIConfigService, 'clearCache');

      const updatePayload = {
        provider: 'GOOGLE_GEMINI',
        defaultModel: 'gemini-3.5-flash',
        costBudgetMonthlyUsd: 500,
        endpointUrl: '',
      };

      const reqPost = {
        json: async () => updatePayload,
      } as unknown as NextRequest;

      const resPost = await POST(reqPost);
      expect(resPost.status).toBe(200);
      const jsonPost = await resPost.json();
      expect(jsonPost.success).toBe(true);
      expect(jsonPost.config.defaultModel).toBe('gemini-3.5-flash');
      expect(jsonPost.config.costBudgetMonthlyUsd).toBe(500);

      // Check clearCache was called
      expect(clearCacheSpy).toHaveBeenCalled();

      // PUT should have the same effect
      const reqPut = {
        json: async () => updatePayload,
      } as unknown as NextRequest;

      const resPut = await PUT(reqPut);
      expect(resPut.status).toBe(200);
      const jsonPut = await resPut.json();
      expect(jsonPut.success).toBe(true);
    });

    it('từ chối 400 nếu payload không hợp lệ', async () => {
      vi.mocked(requirePlatformAdmin).mockResolvedValue({
        isAuthorized: true,
        user: { id: 'admin-uuid', email: 'admin@nexa.ai' } as any,
      });

      const req = {
        json: async () => ({ provider: 'INVALID_PROVIDER' }),
      } as unknown as NextRequest;

      const res = await POST(req);
      expect(res.status).toBe(400);
    });
  });
});
