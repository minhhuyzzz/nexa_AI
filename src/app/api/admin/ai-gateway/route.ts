import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { requirePlatformAdmin } from '@/lib/auth/admin-guard';
import { AIConfigService } from '@/features/ai-gateway/services/ai-config.service';
import { recordAdminAudit } from '@/lib/audit/admin-audit.service';

export const dynamic = 'force-dynamic';

const updateAiConfigSchema = z.object({
  provider: z.enum(['GOOGLE_GEMINI', 'ANTHROPIC_CLAUDE', 'OPENAI', 'DEEPSEEK', 'ON_PREMISE', 'OPENROUTER']).default('GOOGLE_GEMINI'),
  apiKey: z.string().optional(),
  defaultModel: z.string().optional(),
  endpointUrl: z.string().optional(),
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
  monthlyBudgetUsd: z.number().positive().optional(),
  rateLimitRpm: z.number().int().positive().optional(),
  strictPiiScrub: z.boolean().optional(),
  sessionTimeoutMinutes: z.number().int().positive().optional(),
  maxLoginAttempts: z.number().int().positive().optional(),
});

export async function GET(request: NextRequest | Request) {
  try {
    const auth = await requirePlatformAdmin('OPERATE_AI');
    if (!auth.isAuthorized) {
      return auth.errorResponse!;
    }

    const adminSupabase = createAdminClient();
    const url = new URL(request.url);
    const period = url.searchParams.get('period') || '7d';
    const flow = url.searchParams.get('flow') || 'all'; // 'all' | 'personal' | 'org'

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

    // F35: Strictly isolate telemetry by dashboard flow
    if (flow === 'personal') {
      query = query.is('organization_id', null);
    } else if (flow === 'org') {
      query = query.not('organization_id', 'is', null);
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

    // AI Gateway Settings persistently from platform_settings table (AI-02 / F34)
    const currentConfig = await AIConfigService.getConfigAsync(adminSupabase);
    const maskedApiKey = currentConfig.apiKey
      ? currentConfig.apiKey.length > 8
        ? currentConfig.apiKey.slice(0, 4) + '••••••••' + currentConfig.apiKey.slice(-4)
        : '••••••••'
      : '';
    const monthlyBudgetUsd = currentConfig.costBudgetMonthlyUsd ?? 200;

    // Fetch calibration logs summary
    let calibrationSummary = {
      totalLogs: 0,
      meanScoreDelta: 0,
      exactMatchCount: 0,
      highAgreementCount: 0,
      divergentCount: 0,
      recentLogs: [] as any[],
    };

    try {
      const calibTable = adminSupabase.from('ai_calibration_logs');
      if (typeof calibTable?.select === 'function') {
        const { data: calibLogs } = await calibTable
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (calibLogs && calibLogs.length > 0) {
          let sumDelta = 0;
          let exactMatches = 0;
          let highAgreements = 0;
          let divergences = 0;

          calibLogs.forEach((log: any) => {
            const delta = Math.abs(Number(log.score_delta) || 0);
            sumDelta += delta;
            if (delta === 0) exactMatches++;
            else if (delta <= 10) highAgreements++;
            else divergences++;
          });

          calibrationSummary = {
            totalLogs: calibLogs.length,
            meanScoreDelta: Math.round((sumDelta / calibLogs.length) * 100) / 100,
            exactMatchCount: exactMatches,
            highAgreementCount: highAgreements,
            divergentCount: divergences,
            recentLogs: calibLogs.slice(0, 20),
          };
        }
      }
    } catch {
      // Non-fatal if ai_calibration_logs table is empty or query fails
    }

    // Fetch ai_task_policies and credit usage statistics
    let taskPolicies: any[] = [];
    const creditUsageSummary = {
      totalReservations: 0,
      totalSettled: 0,
      totalReleased: 0,
      totalFlagged: 0,
    };

    try {
      const taskTable = adminSupabase.from('ai_task_policies');
      if (typeof taskTable?.select === 'function') {
        const { data: policies } = await taskTable.select('*').order('task_type', { ascending: true });
        if (policies) taskPolicies = policies;
      }
    } catch {
      // Non-fatal
    }

    try {
      const resTable = adminSupabase.from('ai_credit_reservations');
      if (typeof resTable?.select === 'function') {
        const { data: reservations } = await resTable
          .select('status, credits')
          .limit(500);

        if (reservations) {
          creditUsageSummary.totalReservations = reservations.length;
          reservations.forEach((r: any) => {
            if (r.status === 'SETTLED') creditUsageSummary.totalSettled += Number(r.credits || 0);
            else if (r.status === 'RELEASED') creditUsageSummary.totalReleased += Number(r.credits || 0);
            else if (r.status === 'FLAGGED_MANUAL_REVIEW') creditUsageSummary.totalFlagged += 1;
          });
        }
      }
    } catch {
      // Non-fatal
    }

    return NextResponse.json({
      success: true,
      period,
      flow,
      sampleSize: allEvents.length,
      config: {
        provider: currentConfig.provider,
        defaultModel: currentConfig.defaultModel,
        endpointUrl: currentConfig.endpointUrl || '',
        maskedApiKey,
        apiKeyMasked: maskedApiKey,
        costBudgetMonthlyUsd: monthlyBudgetUsd,
        monthlyBudgetUsd,
        flows: currentConfig.flows,
        updatedAt: currentConfig.updatedAt,
      },
      summary: {
        totalRequests: allEvents.length,
        totalTokens: totalPromptTokens + totalCompletionTokens,
        estimatedCostUsd: Number(totalCostUsd.toFixed(4)),
        estimatedCostVnd,
        averageLatencyMs: avgLatency,
        errorRatePercent,
        budgetUsd: monthlyBudgetUsd,
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
      calibrationSummary,
      taskPolicies,
      creditUsageSummary,
      recentEvents: allEvents.slice(0, 50).map((ev: any) => ({
        ...ev,
        flow: ev.organization_id ? 'org' : 'personal',
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function handleUpdateAiConfig(request: NextRequest) {
  try {
    const auth = await requirePlatformAdmin('OPERATE_AI');
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

    const {
      provider,
      apiKey,
      defaultModel,
      endpointUrl,
      flows,
      costBudgetMonthlyUsd,
      monthlyBudgetUsd: inputMonthlyBudget,
    } = validation.data;

    // Check if new API key is provided and not masked
    const patchPayload: Record<string, any> = {
      provider,
    };

    const defaultModelFallbacks: Record<string, string> = {
      GOOGLE_GEMINI: 'gemini-2.5-flash',
      OPENAI: 'gpt-4o-mini',
      DEEPSEEK: 'deepseek-chat',
      ANTHROPIC_CLAUDE: 'claude-3-5-sonnet',
      OPENROUTER: 'deepseek/deepseek-chat',
      ON_PREMISE: 'local-model',
    };
    patchPayload.defaultModel = defaultModel?.trim() || defaultModelFallbacks[provider] || 'gemini-2.5-flash';

    if (endpointUrl !== undefined) {
      patchPayload.endpointUrl = endpointUrl.trim();
    }

    if (apiKey && !apiKey.includes('••••')) {
      patchPayload.apiKey = apiKey.trim();
    }

    const effectiveBudget = costBudgetMonthlyUsd ?? inputMonthlyBudget;
    if (effectiveBudget !== undefined) {
      patchPayload.costBudgetMonthlyUsd = effectiveBudget;
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

    // Call clearCache to ensure cache is immediately cleared across instances
    AIConfigService.clearCache();

    // Record audit log
    await recordAdminAudit({
      adminId: adminUser.id,
      adminEmail: adminUser.email,
      action: 'AI_CONFIG_UPDATED',
      targetType: 'AI_GATEWAY',
      details: {
        provider: updated.provider,
        defaultModel: updated.defaultModel,
        endpointUrl: updated.endpointUrl,
        costBudgetMonthlyUsd: updated.costBudgetMonthlyUsd,
        updatedAt: updated.updatedAt,
      },
    });

    const maskedApiKey = updated.apiKey
      ? updated.apiKey.length > 8
        ? updated.apiKey.slice(0, 4) + '••••••••' + updated.apiKey.slice(-4)
        : '••••••••'
      : '';
    const monthlyBudgetUsd = updated.costBudgetMonthlyUsd ?? 200;

    return NextResponse.json({
      success: true,
      message: 'Đã lưu cấu hình AI Gateway thành công vào cơ sở dữ liệu',
      config: {
        provider: updated.provider,
        defaultModel: updated.defaultModel,
        endpointUrl: updated.endpointUrl,
        maskedApiKey,
        apiKeyMasked: maskedApiKey,
        costBudgetMonthlyUsd: monthlyBudgetUsd,
        monthlyBudgetUsd,
        flows: updated.flows,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return handleUpdateAiConfig(request);
}

export async function PUT(request: NextRequest) {
  return handleUpdateAiConfig(request);
}
