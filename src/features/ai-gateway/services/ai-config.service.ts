import fs from 'fs';
import path from 'path';

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

  public static getConfig(): AIGatewaySettings {
    try {
      if (fs.existsSync(CONFIG_FILE_PATH)) {
        const raw = fs.readFileSync(CONFIG_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        if (!parsed.apiKey && process.env.GEMINI_API_KEY) {
          parsed.apiKey = process.env.GEMINI_API_KEY;
        }
        return parsed;
      }
    } catch (err) {
      console.error('Error reading AI config file, using defaults:', err);
    }
    return this.getDefaultConfig();
  }

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
