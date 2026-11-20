import type { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';

export interface AIFlowConfig {
  enabled: boolean;
  model: string;
  name: string;
  description: string;
}

export interface AIGatewaySettings {
  provider: 'GOOGLE_GEMINI' | 'ANTHROPIC_CLAUDE' | 'OPENAI' | 'DEEPSEEK' | 'ON_PREMISE' | 'OPENROUTER';
  apiKey: string;
  defaultModel: string;
  endpointUrl?: string;
  costBudgetMonthlyUsd?: number;
  flows: {
    rubricGrading: AIFlowConfig;
    competencyAnalysis: AIFlowConfig;
  };
  routingRules?: {
    quickGradingProvider?: string;
    rubricGradingProvider?: string;
    competencyAnalysisProvider?: string;
  };
  updatedAt: string;
}

const SETTINGS_KEY = 'ai_gateway_settings';
export const AI_CONFIG_CACHE_TTL_MS = 60 * 1000; // 60-second TTL

interface CacheEntry {
  config: AIGatewaySettings;
  cachedAt: number;
}

let inMemoryCache: CacheEntry | null = null;

function getFallbackApiKey(): string {
  return (
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    ''
  );
}

export class AIConfigService {
  /**
   * Cấu hình mặc định khi cơ sở dữ liệu chưa có cấu hình.
   * Tự động fallback sang process.env.GOOGLE_GENERATIVE_AI_API_KEY hoặc GEMINI_API_KEY.
   */
  public static getDefaultConfig(): AIGatewaySettings {
    const fallbackApiKey = getFallbackApiKey();
    const defaultModel = process.env.GEMINI_MODEL || 'gemini-3.5-flash';

    return {
      provider: 'GOOGLE_GEMINI',
      apiKey: fallbackApiKey,
      defaultModel,
      costBudgetMonthlyUsd: 200,
      flows: {
        rubricGrading: {
          enabled: true,
          model: defaultModel,
          name: 'Chấm Rubric & Đánh giá Minh chứng',
          description: 'Thẩm định câu trả lời tự luận và tệp minh chứng thực hành theo chuẩn Rubric 100%.',
        },
        competencyAnalysis: {
          enabled: true,
          model: defaultModel,
          name: 'Phân tích Năng lực & Đề xuất Lộ trình',
          description: 'Phân tích điểm mạnh, điểm yếu và tự động sinh lộ trình 4 bước bù đắp khoảng trống.',
        },
      },
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Đọc cấu hình AI Gateway không đồng bộ từ bảng platform_settings trong DB (key: 'ai_gateway_settings').
   * Cache in-memory với TTL 60 giây để tránh flood database đồng thời cho phép cập nhật trực tiếp từ Admin UI.
   * Fallback an toàn về process.env.GOOGLE_GENERATIVE_AI_API_KEY nếu platform_settings chưa có bản ghi hoặc chưa cấu hình API key.
   */
  public static async getConfigAsync(supabaseClient?: SupabaseClient): Promise<AIGatewaySettings> {
    const now = Date.now();
    if (inMemoryCache && now - inMemoryCache.cachedAt < AI_CONFIG_CACHE_TTL_MS) {
      return inMemoryCache.config;
    }

    try {
      const client = supabaseClient || createAdminClient();
      const { data, error } = await client
        .from('platform_settings')
        .select('value')
        .eq('key', SETTINGS_KEY)
        .maybeSingle();

      if (!error && data?.value) {
        const raw = data.value as Partial<AIGatewaySettings>;
        const defaults = this.getDefaultConfig();
        const fallbackApiKey = getFallbackApiKey();

        const config: AIGatewaySettings = {
          ...defaults,
          ...raw,
          // Đảm bảo luôn có API key an toàn từ DB hoặc fallback biến môi trường
          apiKey: (raw.apiKey && raw.apiKey.trim()) ? raw.apiKey.trim() : fallbackApiKey,
          defaultModel: raw.defaultModel || defaults.defaultModel,
          flows: {
            rubricGrading: {
              ...defaults.flows.rubricGrading,
              ...(raw.flows?.rubricGrading || {}),
            },
            competencyAnalysis: {
              ...defaults.flows.competencyAnalysis,
              ...(raw.flows?.competencyAnalysis || {}),
            },
          },
          updatedAt: raw.updatedAt || new Date().toISOString(),
        };

        if (config.apiKey) {
          process.env.GEMINI_API_KEY = config.apiKey;
          process.env.GOOGLE_GENERATIVE_AI_API_KEY = config.apiKey;
        }
        if (config.defaultModel) {
          process.env.GEMINI_MODEL = config.defaultModel;
        }

        inMemoryCache = {
          config,
          cachedAt: now,
        };
        return config;
      }
    } catch (err) {
      console.warn('Cannot fetch AI config from database platform_settings, falling back to defaults/env:', err);
    }

    // Fallback to default config with env var
    const fallback = this.getDefaultConfig();
    inMemoryCache = {
      config: fallback,
      cachedAt: now,
    };
    return fallback;
  }

  /**
   * Đọc cấu hình đồng bộ (từ in-memory cache nếu còn hạn hoặc fallback defaults).
   */
  public static getConfig(): AIGatewaySettings {
    const now = Date.now();
    if (inMemoryCache && now - inMemoryCache.cachedAt < AI_CONFIG_CACHE_TTL_MS) {
      return inMemoryCache.config;
    }

    const fallback = this.getDefaultConfig();
    inMemoryCache = {
      config: fallback,
      cachedAt: now,
    };
    return fallback;
  }

  /**
   * Lưu cấu hình AI Gateway bền vững vào database (bảng platform_settings, key: 'ai_gateway_settings').
   * Cập nhật ngay lập tức in-memory cache với TTL 60s và đồng bộ process.env.
   */
  public static async saveConfigAsync(
    newConfig: Partial<AIGatewaySettings>,
    userId?: string,
    supabaseClient?: SupabaseClient
  ): Promise<AIGatewaySettings> {
    const current = await this.getConfigAsync(supabaseClient);
    const updated: AIGatewaySettings = {
      ...current,
      ...newConfig,
      flows: {
        ...current.flows,
        ...(newConfig.flows || {}),
      },
      updatedAt: new Date().toISOString(),
    };

    const client = supabaseClient || createAdminClient();
    const { error } = await client.from('platform_settings').upsert({
      key: SETTINGS_KEY,
      value: updated,
      description: 'Cấu hình cổng AI Gateway, nhà cung cấp và model định tuyến',
      updated_by: userId || null,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Failed to save AI config to platform_settings in database:', error);
      throw new Error('Lỗi lưu cấu hình vào cơ sở dữ liệu: ' + error.message);
    }

    // Cập nhật ngay cache in-memory
    inMemoryCache = {
      config: updated,
      cachedAt: Date.now(),
    };

    if (updated.apiKey) {
      process.env.GEMINI_API_KEY = updated.apiKey;
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = updated.apiKey;
    }
    if (updated.defaultModel) {
      process.env.GEMINI_MODEL = updated.defaultModel;
    }

    return updated;
  }

  /**
   * Lưu cấu hình đồng bộ cục bộ (dành cho unit tests / local cache update).
   */
  public static saveConfig(newConfig: Partial<AIGatewaySettings>): AIGatewaySettings {
    const current = this.getConfig();
    const updated: AIGatewaySettings = {
      ...current,
      ...newConfig,
      flows: {
        ...current.flows,
        ...(newConfig.flows || {}),
      },
      updatedAt: new Date().toISOString(),
    };

    inMemoryCache = {
      config: updated,
      cachedAt: Date.now(),
    };

    if (updated.apiKey) {
      process.env.GEMINI_API_KEY = updated.apiKey;
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = updated.apiKey;
    }
    if (updated.defaultModel) {
      process.env.GEMINI_MODEL = updated.defaultModel;
    }

    return updated;
  }

  /**
   * Xóa cache in-memory (dùng cho testing hoặc cưỡng chế tải lại ngay từ database).
   */
  public static clearCache(): void {
    inMemoryCache = null;
  }

  /**
   * Kiểm tra xem cache in-memory có đang hợp lệ (chưa hết hạn TTL 60s) hay không.
   */
  public static isCacheValid(): boolean {
    if (!inMemoryCache) return false;
    return Date.now() - inMemoryCache.cachedAt < AI_CONFIG_CACHE_TTL_MS;
  }

  /**
   * Trả về thời gian sống còn lại của cache tính bằng mili-giây (0 nếu đã hết hạn hoặc chưa có).
   */
  public static getRemainingCacheTtlMs(): number {
    if (!inMemoryCache) return 0;
    const remaining = AI_CONFIG_CACHE_TTL_MS - (Date.now() - inMemoryCache.cachedAt);
    return Math.max(0, remaining);
  }
}
