import fs from 'fs';
import path from 'path';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';

export interface AIFlowConfig {
  enabled: boolean;
  model: string;
  name: string;
  description: string;
}

export interface AIGatewaySettings {
  provider: 'GOOGLE_GEMINI' | 'ANTHROPIC_CLAUDE' | 'OPENAI';
  apiKey: string;
  defaultModel: string;
  flows: {
    rubricGrading: AIFlowConfig;
    competencyAnalysis: AIFlowConfig;
  };
  updatedAt: string;
}

const CONFIG_FILE_PATH = path.join(process.cwd(), 'src/features/ai-gateway/config.json');
const SETTINGS_KEY = 'ai_gateway_settings';

let inMemoryCache: AIGatewaySettings | null = null;

export class AIConfigService {
  public static getDefaultConfig(): AIGatewaySettings {
    return {
      provider: 'GOOGLE_GEMINI',
      apiKey: process.env.GEMINI_API_KEY || '',
      defaultModel: process.env.GEMINI_MODEL || 'gemini-3.5-flash',
      flows: {
        rubricGrading: {
          enabled: true,
          model: process.env.GEMINI_MODEL || 'gemini-3.5-flash',
          name: 'Chấm Rubric & Đánh giá Minh chứng',
          description: 'Thẩm định câu trả lời tự luận và tệp minh chứng thực hành theo chuẩn Rubric 100%.',
        },
        competencyAnalysis: {
          enabled: true,
          model: process.env.GEMINI_MODEL || 'gemini-3.5-flash',
          name: 'Phân tích Năng lực & Đề xuất Lộ trình',
          description: 'Phân tích điểm mạnh, điểm yếu và tự động sinh lộ trình 4 bước bù đắp khoảng trống.',
        },
      },
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Đọc cấu hình AI Gateway không đồng bộ từ bảng platform_settings trong DB (AI-02)
   * Đảm bảo tính bền vững khi chạy trên môi trường serverless / multi-instance.
   */
  public static async getConfigAsync(supabaseClient?: SupabaseClient): Promise<AIGatewaySettings> {
    try {
      const client = supabaseClient || createAdminClient();
      const { data, error } = await client
        .from('platform_settings')
        .select('value')
        .eq('key', SETTINGS_KEY)
        .maybeSingle();

      if (!error && data?.value) {
        const parsed = data.value as AIGatewaySettings;
        if (!parsed.apiKey && process.env.GEMINI_API_KEY) {
          parsed.apiKey = process.env.GEMINI_API_KEY;
        }
        inMemoryCache = parsed;
        return parsed;
      }
    } catch (err) {
      console.warn('Cannot fetch AI config from database, falling back to local/default:', err);
    }

    return this.getConfig();
  }

  /**
   * Đọc cấu hình đồng bộ (từ in-memory cache, file local hoặc defaults)
   */
  public static getConfig(): AIGatewaySettings {
    if (inMemoryCache) {
      return inMemoryCache;
    }

    try {
      if (fs.existsSync(CONFIG_FILE_PATH)) {
        const raw = fs.readFileSync(CONFIG_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        if (!parsed.apiKey && process.env.GEMINI_API_KEY) {
          parsed.apiKey = process.env.GEMINI_API_KEY;
        }
        inMemoryCache = parsed;
        return parsed;
      }
    } catch (err) {
      console.error('Error reading AI config file, using defaults:', err);
    }

    const defaultConfig = this.getDefaultConfig();
    inMemoryCache = defaultConfig;
    return defaultConfig;
  }

  /**
   * Lưu cấu hình AI Gateway bền vững vào database (AI-02)
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

    // Đồng bộ vào cache & file dự phòng
    inMemoryCache = updated;
    try {
      fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(updated, null, 2), 'utf-8');
    } catch {
      // Bỏ qua lỗi file khi deploy trên container read-only
    }

    if (updated.apiKey) {
      process.env.GEMINI_API_KEY = updated.apiKey;
    }
    if (updated.defaultModel) {
      process.env.GEMINI_MODEL = updated.defaultModel;
    }

    return updated;
  }

  /**
   * Lưu cấu hình đồng bộ cục bộ (tương thích ngược cho các unit tests)
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

    inMemoryCache = updated;
    try {
      fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(updated, null, 2), 'utf-8');
      if (updated.apiKey) {
        process.env.GEMINI_API_KEY = updated.apiKey;
      }
      if (updated.defaultModel) {
        process.env.GEMINI_MODEL = updated.defaultModel;
      }
    } catch (err) {
      console.error('Error saving AI config file:', err);
    }

    return updated;
  }
}
