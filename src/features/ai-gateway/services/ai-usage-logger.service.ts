import { SupabaseClient } from '@supabase/supabase-js';

export interface AIUsageLogEntry {
  userId?: string | null;
  organizationId?: string | null;
  feature: 'RUBRIC_GRADING' | 'COMPETENCY_ANALYSIS' | 'HEALTH_CHECK' | 'OTHER';
  provider: 'GOOGLE_GEMINI' | 'OPENAI' | 'ANTHROPIC';
  model: string;
  promptTokens?: number;
  completionTokens?: number;
  latencyMs: number;
  status: 'SUCCESS' | 'FAILED';
  errorMessage?: string | null;
}

export class AIUsageLoggerService {
  /**
   * Estimates cost in USD based on model pricing per 1M tokens.
   */
  private static calculateEstimatedCost(
    model: string,
    promptTokens: number,
    completionTokens: number
  ): number {
    // Standard Gemini Flash pricing (~$0.075 / 1M prompt, $0.30 / 1M completion)
    const promptRatePerToken = 0.075 / 1_000_000;
    const completionRatePerToken = 0.30 / 1_000_000;

    const totalCost = promptTokens * promptRatePerToken + completionTokens * completionRatePerToken;
    return Number(totalCost.toFixed(6));
  }

  /**
   * Persists an AI usage event into the public.ai_usage_events table.
   * Fails gracefully without throwing errors that would interrupt the user flow.
   */
  public static async logUsage(
    supabase: SupabaseClient,
    entry: AIUsageLogEntry
  ): Promise<void> {
    try {
      const promptTokens = entry.promptTokens || 0;
      const completionTokens = entry.completionTokens || 0;
      const totalTokens = promptTokens + completionTokens;
      const costEstimated = this.calculateEstimatedCost(
        entry.model,
        promptTokens,
        completionTokens
      );

      await supabase.from('ai_usage_events').insert({
        user_id: entry.userId || null,
        organization_id: entry.organizationId || null,
        feature: entry.feature,
        provider: entry.provider,
        model: entry.model,
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: totalTokens,
        latency_ms: entry.latencyMs,
        status: entry.status,
        error_message: entry.errorMessage || null,
        cost_estimated: costEstimated,
      });
    } catch (err) {
      console.error('Failed to log AI usage event (non-fatal):', err);
    }
  }
}
