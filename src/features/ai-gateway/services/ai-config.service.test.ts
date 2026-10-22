import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { AIConfigService } from './ai-config.service';

const CONFIG_FILE_PATH = path.join(process.cwd(), 'src/features/ai-gateway/config.json');

describe('AIConfigService', () => {
  let originalFileContent: string | null = null;
  const originalApiKey = process.env.GEMINI_API_KEY;
  const originalModel = process.env.GEMINI_MODEL;

  beforeEach(() => {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      originalFileContent = fs.readFileSync(CONFIG_FILE_PATH, 'utf-8');
    } else {
      originalFileContent = null;
    }
  });

  afterEach(() => {
    if (originalFileContent !== null) {
      fs.writeFileSync(CONFIG_FILE_PATH, originalFileContent, 'utf-8');
    } else if (fs.existsSync(CONFIG_FILE_PATH)) {
      fs.unlinkSync(CONFIG_FILE_PATH);
    }

    if (originalApiKey !== undefined) {
      process.env.GEMINI_API_KEY = originalApiKey;
    } else {
      delete process.env.GEMINI_API_KEY;
    }

    if (originalModel !== undefined) {
      process.env.GEMINI_MODEL = originalModel;
    } else {
      delete process.env.GEMINI_MODEL;
    }
  });

  it('should return default config if config file does not exist', () => {
    const config = AIConfigService.getDefaultConfig();
    expect(config.provider).toBe('GOOGLE_GEMINI');
    expect(config.flows.rubricGrading.enabled).toBe(true);
    expect(config.flows.competencyAnalysis.enabled).toBe(true);
  });

  it('should save config and update process.env in-memory immediately', () => {
    const testKey = 'test-gemini-key-12345';
    const testModel = 'gemini-3.8-flash';

    const saved = AIConfigService.saveConfig({
      apiKey: testKey,
      defaultModel: testModel,
    });

    expect(saved.apiKey).toBe(testKey);
    expect(saved.defaultModel).toBe(testModel);
    expect(process.env.GEMINI_API_KEY).toBe(testKey);
    expect(process.env.GEMINI_MODEL).toBe(testModel);

    const retrieved = AIConfigService.getConfig();
    expect(retrieved.apiKey).toBe(testKey);
    expect(retrieved.defaultModel).toBe(testModel);
  });

  it('should allow toggling individual AI flows', () => {
    AIConfigService.saveConfig({
      flows: {
        rubricGrading: {
          enabled: false,
          model: 'gemini-3.5-flash',
          name: 'Chấm Rubric & Đánh giá Minh chứng',
          description: 'Thẩm định câu trả lời tự luận',
        },
        competencyAnalysis: {
          enabled: true,
          model: 'gemini-3.8-flash',
          name: 'Phân tích Năng lực & Đề xuất Lộ trình',
          description: 'Phân tích điểm mạnh, điểm yếu',
        },
      },
    });

    const retrieved = AIConfigService.getConfig();
    expect(retrieved.flows.rubricGrading.enabled).toBe(false);
    expect(retrieved.flows.competencyAnalysis.enabled).toBe(true);
  });
});
