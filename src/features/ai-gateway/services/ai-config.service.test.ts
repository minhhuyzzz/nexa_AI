import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AIConfigService, AI_CONFIG_CACHE_TTL_MS } from './ai-config.service';
import type { SupabaseClient } from '@supabase/supabase-js';

describe('AIConfigService (Gateway Config & 60s Cache)', () => {
  const originalGeminiKey = process.env.GEMINI_API_KEY;
  const originalGoogleGenAiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  const originalModel = process.env.GEMINI_MODEL;

  beforeEach(() => {
    AIConfigService.clearCache();
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    delete process.env.GEMINI_MODEL;
  });

  afterEach(() => {
    AIConfigService.clearCache();
    if (originalGeminiKey !== undefined) {
      process.env.GEMINI_API_KEY = originalGeminiKey;
    } else {
      delete process.env.GEMINI_API_KEY;
    }
    if (originalGoogleGenAiKey !== undefined) {
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = originalGoogleGenAiKey;
    } else {
      delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    }
    if (originalModel !== undefined) {
      process.env.GEMINI_MODEL = originalModel;
    } else {
      delete process.env.GEMINI_MODEL;
    }
  });

  it('should return default config with GOOGLE_GEMINI provider and enabled flows', () => {
    const config = AIConfigService.getDefaultConfig();
    expect(config.provider).toBe('GOOGLE_GEMINI');
    expect(config.flows.rubricGrading.enabled).toBe(true);
    expect(config.flows.competencyAnalysis.enabled).toBe(true);
    expect(config.defaultModel).toBe('gemini-3.5-flash');
  });

  it('should fallback safely to process.env.GOOGLE_GENERATIVE_AI_API_KEY when platform_settings is unconfigured', () => {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'google-genai-fallback-key-999';

    const config = AIConfigService.getDefaultConfig();
    expect(config.apiKey).toBe('google-genai-fallback-key-999');

    const syncConfig = AIConfigService.getConfig();
    expect(syncConfig.apiKey).toBe('google-genai-fallback-key-999');
  });

  it('should fallback to GEMINI_API_KEY if GOOGLE_GENERATIVE_AI_API_KEY is not set', () => {
    process.env.GEMINI_API_KEY = 'gemini-env-key-123';

    const config = AIConfigService.getDefaultConfig();
    expect(config.apiKey).toBe('gemini-env-key-123');
  });

  it('should fetch from platform_settings table with key "ai_gateway_settings" and cache for 60 seconds', async () => {
    const mockDbSettings = {
      provider: 'GOOGLE_GEMINI',
      apiKey: 'db-gemini-key-777',
      defaultModel: 'gemini-3.5-flash',
      costBudgetMonthlyUsd: 300,
      flows: {
        rubricGrading: {
          enabled: true,
          model: 'gemini-3.5-flash',
          name: 'Chấm Rubric',
          description: 'Mô tả',
        },
        competencyAnalysis: {
          enabled: false,
          model: 'gemini-3.5-flash',
          name: 'Phân tích',
          description: 'Mô tả',
        },
      },
      updatedAt: '2026-11-20T00:00:00.000Z',
    };

    let selectCallCount = 0;
    const mockClient = {
      from: vi.fn((table: string) => {
        expect(table).toBe('platform_settings');
        return {
          select: vi.fn(() => ({
            eq: vi.fn((col: string, val: string) => {
              expect(col).toBe('key');
              expect(val).toBe('ai_gateway_settings');
              selectCallCount++;
              return {
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { value: mockDbSettings },
                  error: null,
                }),
              };
            }),
          })),
        };
      }),
    } as unknown as SupabaseClient;

    // First call -> fetches from DB
    const firstCall = await AIConfigService.getConfigAsync(mockClient);
    expect(selectCallCount).toBe(1);
    expect(firstCall.apiKey).toBe('db-gemini-key-777');
    expect(firstCall.costBudgetMonthlyUsd).toBe(300);
    expect(firstCall.flows.competencyAnalysis.enabled).toBe(false);
    expect(AIConfigService.isCacheValid()).toBe(true);
    expect(AIConfigService.getRemainingCacheTtlMs()).toBeGreaterThan(0);
    expect(AIConfigService.getRemainingCacheTtlMs()).toBeLessThanOrEqual(AI_CONFIG_CACHE_TTL_MS);

    // Second call within TTL -> returns cached config without hitting DB
    const secondCall = await AIConfigService.getConfigAsync(mockClient);
    expect(selectCallCount).toBe(1); // Call count still 1!
    expect(secondCall.apiKey).toBe('db-gemini-key-777');

    // Synchronous getConfig also uses the valid cache
    const syncCall = AIConfigService.getConfig();
    expect(syncCall.apiKey).toBe('db-gemini-key-777');

    // After clearCache, next call queries DB again
    AIConfigService.clearCache();
    expect(AIConfigService.isCacheValid()).toBe(false);
    const thirdCall = await AIConfigService.getConfigAsync(mockClient);
    expect(selectCallCount).toBe(2);
    expect(thirdCall.apiKey).toBe('db-gemini-key-777');
  });

  it('should fallback to env apiKey if DB record has empty apiKey', async () => {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'fallback-key-when-db-empty';

    const mockDbSettingsWithoutKey = {
      provider: 'GOOGLE_GEMINI',
      apiKey: '',
      defaultModel: 'gemini-3.5-flash',
    };

    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { value: mockDbSettingsWithoutKey },
              error: null,
            }),
          }),
        }),
      }),
    } as unknown as SupabaseClient;

    const config = await AIConfigService.getConfigAsync(mockClient);
    expect(config.apiKey).toBe('fallback-key-when-db-empty');
  });

  it('should fallback safely to default config when DB query errors', async () => {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'env-safety-key';

    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Network connection error' },
            }),
          }),
        }),
      }),
    } as unknown as SupabaseClient;

    const config = await AIConfigService.getConfigAsync(mockClient);
    expect(config.provider).toBe('GOOGLE_GEMINI');
    expect(config.apiKey).toBe('env-safety-key');
  });

  it('should save config asynchronously to platform_settings and refresh in-memory cache', async () => {
    let upsertPayload: Record<string, unknown> | null = null;
    const mockClient = {
      from: vi.fn((table: string) => {
        expect(table).toBe('platform_settings');
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
          upsert: vi.fn((payload: Record<string, unknown>) => {
            upsertPayload = payload;
            return Promise.resolve({ error: null });
          }),
        };
      }),
    } as unknown as SupabaseClient;

    const updated = await AIConfigService.saveConfigAsync(
      {
        apiKey: 'saved-key-via-admin',
        defaultModel: 'gemini-3.8-flash',
      },
      'admin-user-uuid',
      mockClient
    );

    expect(updated.apiKey).toBe('saved-key-via-admin');
    expect(updated.defaultModel).toBe('gemini-3.8-flash');
    expect(process.env.GEMINI_API_KEY).toBe('saved-key-via-admin');
    expect(process.env.GOOGLE_GENERATIVE_AI_API_KEY).toBe('saved-key-via-admin');
    expect(process.env.GEMINI_MODEL).toBe('gemini-3.8-flash');

    expect(upsertPayload).not.toBeNull();
    expect((upsertPayload as unknown as Record<string, unknown>).key).toBe('ai_gateway_settings');
    expect((upsertPayload as unknown as Record<string, unknown>).updated_by).toBe('admin-user-uuid');

    // In-memory cache is immediately warm with updated values
    expect(AIConfigService.isCacheValid()).toBe(true);
    const cached = AIConfigService.getConfig();
    expect(cached.apiKey).toBe('saved-key-via-admin');
  });

  it('should allow toggling individual flows synchronously and preserve existing config', () => {
    AIConfigService.saveConfig({
      flows: {
        rubricGrading: {
          enabled: false,
          model: 'gemini-3.5-flash',
          name: 'Chấm Rubric',
          description: 'Mô tả',
        },
        competencyAnalysis: {
          enabled: true,
          model: 'gemini-3.8-flash',
          name: 'Phân tích Năng lực',
          description: 'Mô tả',
        },
      },
    });

    const retrieved = AIConfigService.getConfig();
    expect(retrieved.flows.rubricGrading.enabled).toBe(false);
    expect(retrieved.flows.competencyAnalysis.enabled).toBe(true);
    expect(retrieved.flows.competencyAnalysis.model).toBe('gemini-3.8-flash');
  });
});
