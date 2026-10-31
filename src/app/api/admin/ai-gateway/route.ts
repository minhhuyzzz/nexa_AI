import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { requirePlatformAdmin } from '@/lib/auth/admin-guard';
import { AIConfigService } from '@/features/ai-gateway/services/ai-config.service';
import { recordAdminAudit } from '@/lib/audit/admin-audit.service';

export const dynamic = 'force-dynamic';

const updateAiConfigSchema = z.object({
  provider: z.enum(['GOOGLE_GEMINI', 'ANTHROPIC_CLAUDE', 'OPENAI']).default('GOOGLE_GEMINI'),
  apiKey: z.string().optional(),
  defaultModel: z.string().optional(),
  flows: z
    .object({
      rubricGrading: z
        .object({
          enabled: z.boolean().default(true),
          model: z.string().optional(),
        })
        .optional(),
      competencyAnalysis: z
        .object({
          enabled: z.boolean().default(true),
          model: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
  costBudgetMonthlyUsd: z.number().positive().optional(),
  rateLimitRpm: z.number().int().positive().optional(),
  strictPiiScrub: z.boolean().optional(),
  sessionTimeoutMinutes: z.number().int().positive().optional(),
  maxLoginAttempts: z.number().int().positive().optional(),
});

export async function GET(request: NextRequest | Request) {
  try {
    const auth = await requirePlatformAdmin();
    if (!auth.isAuthorized) {
      return auth.errorResponse!;
    }

    const adminSupabase = createAdminClient();
    const url = new URL(request.url);
    const period = url.searchParams.get('period') || '7d';

    let fromDate: string | null = null;
    const now = Date.now();
    if (period === '24h') {
      fromDate = new Date(now - 24 * 60 * 60 * 1000).toISOString();
    } else if (period === '7d') {
      fromDate = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
    } else if (period === '30d') {
      fromDate = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
    }

    let query = adminSupabase
      .from('ai_usage_events')
      .select('*')
      .order('created_at', { ascending: false });

    if (fromDate) {
      query = query.gte('created_at', fromDate);
    } else {
      query = query.limit(500);
    }

    const { data: events, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const allEvents = events || [];
    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;
    let totalLatencyMs = 0;
    let totalCostUsd = 0;
    let errorCount = 0;
    const latencies: number[] = [];
    const modelCounts: Record<string, number> = {};
    const featureCounts: Record<string, number> = {};

    allEvents.forEach((ev: any) => {
      totalPromptTokens += ev.prompt_tokens || 0;
      totalCompletionTokens += ev.completion_tokens || 0;
      const lat = Number(ev.latency_ms || 0);
      totalLatencyMs += lat;
      latencies.push(lat);
      totalCostUsd += Number(ev.cost_estimated || 0);

      if (ev.status === 'FAILED') {
        errorCount++;
      }

      const m = ev.model || 'gemini-3.5-flash';
      modelCounts[m] = (modelCounts[m] || 0) + 1;

      const f = ev.feature || 'unknown';
      featureCounts[f] = (featureCounts[f] || 0) + 1;
    });

    const avgLatency = allEvents.length > 0 ? Math.round(totalLatencyMs / allEvents.length) : 0;
    latencies.sort((a, b) => a - b);
    const p95LatencyMs =
      latencies.length > 0
        ? latencies[Math.min(Math.floor(latencies.length * 0.95), latencies.length - 1)]
        : 0;
    const errorRatePercent =
      allEvents.length > 0 ? Math.round((errorCount / allEvents.length) * 1000) / 10 : 0;
    const estimatedCostVnd = Math.round(totalCostUsd * 25400);

    // AI Gateway Settings persistently from platform_settings table (AI-02)
    const currentConfig = await AIConfigService.getConfigAsync(adminSupabase);
    const maskedApiKey = currentConfig.apiKey
      ? currentConfig.apiKey.length > 8
        ? currentConfig.apiKey.slice(0, 4) + '••••••••' + currentConfig.apiKey.slice(-4)
        : '••••••••'
      : '';

    return NextResponse.json({
      success: true,
      period,
      sampleSize: allEvents.length,
      config: {
        provider: currentConfig.provider,
        defaultModel: currentConfig.defaultModel,
        maskedApiKey,
        flows: currentConfig.flows,
        updatedAt: currentConfig.updatedAt,
      },
      stats: {
        totalRequests: allEvents.length,
        totalPromptTokens,
        totalCompletionTokens,
        totalTokens: totalPromptTokens + totalCompletionTokens,
        avgLatencyMs: avgLatency,
        p95LatencyMs,
        errorCount,
        errorRatePercent,
        totalCostUsd: Number(totalCostUsd.toFixed(4)),
        totalCostVnd: estimatedCostVnd,
        models: modelCounts,
        features: featureCounts,
      },
      recentEvents: allEvents.slice(0, 25),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePlatformAdmin();
    if (!auth.isAuthorized) {
      return auth.errorResponse!;
    }

    const adminUser = auth.user!;
    const adminSupabase = createAdminClient();
    const body = await request.json();
    const validation = updateAiConfigSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || 'Dữ liệu cấu hình không hợp lệ' },
        { status: 400 }
      );
    }

    const { provider, apiKey, defaultModel, flows } = validation.data;

    if (provider && provider !== 'GOOGLE_GEMINI') {
      return NextResponse.json(
        {
          error: `Nhà cung cấp "${provider}" hiện chưa có adapter hoạt động. Hệ thống hiện chỉ hỗ trợ và kích hoạt Google Gemini.`,
        },
        { status: 400 }
      );
    }

    // Check if new API key is provided and not masked
    const patchPayload: Record<string, any> = {
      provider,
    };

    if (defaultModel) {
      patchPayload.defaultModel = defaultModel;
    }

    if (apiKey && !apiKey.includes('••••')) {
      patchPayload.apiKey = apiKey.trim();
    }

    if (flows) {
      const current = await AIConfigService.getConfigAsync(adminSupabase);
      patchPayload.flows = {
        rubricGrading: {
          ...current.flows.rubricGrading,
          ...(flows.rubricGrading || {}),
        },
        competencyAnalysis: {
          ...current.flows.competencyAnalysis,
          ...(flows.competencyAnalysis || {}),
        },
      };
    }

    // Persist configuration in database via AIConfigService.saveConfigAsync (AI-02)
    const updated = await AIConfigService.saveConfigAsync(patchPayload, adminUser.id, adminSupabase);

    // Record audit log
    await recordAdminAudit({
      adminId: adminUser.id,
      adminEmail: adminUser.email,
      action: 'AI_CONFIG_UPDATED',
      targetType: 'AI_GATEWAY',
      details: {
        provider: updated.provider,
        defaultModel: updated.defaultModel,
        updatedAt: updated.updatedAt,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Đã lưu cấu hình AI Gateway thành công vào cơ sở dữ liệu',
      config: {
        provider: updated.provider,
        defaultModel: updated.defaultModel,
        maskedApiKey: updated.apiKey
          ? updated.apiKey.slice(0, 4) + '••••••••' + updated.apiKey.slice(-4)
          : '',
        flows: updated.flows,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
