import { describe, it, expect, vi } from 'vitest';
import { getAIAdapter } from './index';

vi.mock('./gemini.adapter', () => {
  return {
    GeminiAdapter: class {
      providerName = 'GOOGLE_GEMINI';
      defaultModel = 'gemini-3.5-flash';
    },
  };
});

describe('getAIAdapter Whitelist Validation (MOD-02 / AI-01)', () => {
  it('should instantiate GeminiAdapter when provider is GOOGLE_GEMINI', () => {
    const adapter = getAIAdapter('GOOGLE_GEMINI');
    expect(adapter).toBeDefined();
    expect(adapter.providerName).toBe('GOOGLE_GEMINI');
  });

  it('should fail-closed with clear error when requesting ANTHROPIC_CLAUDE', () => {
    expect(() => getAIAdapter('ANTHROPIC_CLAUDE')).toThrowError(
      /Anthropic Claude hiện chưa được cấu hình adapter chính thức/
    );
  });

  it('should fail-closed with clear error when requesting OPENAI', () => {
    expect(() => getAIAdapter('OPENAI')).toThrowError(
      /OpenAI hiện chưa được cấu hình adapter chính thức/
    );
  });

  it('should reject unknown providers', () => {
    expect(() => getAIAdapter('DEEPSEEK')).toThrowError(
      /không được hỗ trợ/
    );
  });
});
