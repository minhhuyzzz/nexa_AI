import { describe, it, expect, vi } from 'vitest';
import { getAIAdapter, routeAITask, extractTokenUsage } from './index';

vi.mock('./gemini.adapter', () => {
  return {
    GeminiAdapter: class {
      providerName = 'GOOGLE_GEMINI';
      defaultModel: string;
      constructor(model?: string) {
        this.defaultModel = model || 'gemini-3.5-flash';
      }
    },
  };
});

describe('getAIAdapter & Task Routing (P0-03 / P1-Gateway)', () => {
  it('should instantiate GeminiAdapter when provider is GOOGLE_GEMINI or GEMINI', () => {
    const adapter1 = getAIAdapter('GOOGLE_GEMINI');
    expect(adapter1).toBeDefined();
    expect(adapter1.providerName).toBe('GOOGLE_GEMINI');

    const adapter2 = getAIAdapter('GEMINI');
    expect(adapter2).toBeDefined();
    expect(adapter2.providerName).toBe('GOOGLE_GEMINI');

    const defaultAdapter = getAIAdapter();
    expect(defaultAdapter.providerName).toBe('GOOGLE_GEMINI');
  });

  it('should route tasks via routeAITask directly to Google Gemini adapter', () => {
    const routed = routeAITask({ taskType: 'RUBRIC_GRADING', customModel: 'gemini-3.8-flash' });
    expect(routed).toBeDefined();
    expect(routed.providerName).toBe('GOOGLE_GEMINI');
    expect(routed.defaultModel).toBe('gemini-3.8-flash');
  });

  it('should fail-closed with clear error when requesting ANTHROPIC_CLAUDE', () => {
    expect(() => getAIAdapter('ANTHROPIC_CLAUDE')).toThrowError(
      /Anthropic Claude hiện chưa được cấu hình adapter chính thức/
    );
    expect(() => routeAITask({ provider: 'ANTHROPIC_CLAUDE' })).toThrowError(
      /Anthropic Claude hiện chưa được cấu hình adapter chính thức/
    );
  });

  it('should fail-closed with clear error when requesting OPENAI', () => {
    expect(() => getAIAdapter('OPENAI')).toThrowError(
      /OpenAI hiện chưa được cấu hình adapter chính thức/
    );
    expect(() => routeAITask({ provider: 'OPENAI' })).toThrowError(
      /OpenAI hiện chưa được cấu hình adapter chính thức/
    );
  });

  it('should reject DEEPSEEK with clear unsupport message', () => {
    expect(() => getAIAdapter('DEEPSEEK')).toThrowError(
      /không được hỗ trợ/
    );
  });

  it('should reject OPENROUTER and ON_PREMISE with clear unsupport message', () => {
    expect(() => getAIAdapter('OPENROUTER')).toThrowError(
      /không được hỗ trợ/
    );
    expect(() => getAIAdapter('ON_PREMISE')).toThrowError(
      /không được hỗ trợ/
    );
  });
});

describe('extractTokenUsage for Exact Credit Calculation', () => {
  it('should extract exact token usage from provider response usageMetadata', () => {
    const usage = extractTokenUsage({
      promptTokenCount: 520,
      candidatesTokenCount: 180,
      totalTokenCount: 700,
    });

    expect(usage.promptTokens).toBe(520);
    expect(usage.completionTokens).toBe(180);
    expect(usage.totalTokens).toBe(700);
  });

  it('should fallback to character approximation when usageMetadata is missing or partial', () => {
    const promptText = 'a'.repeat(400); // 400 chars -> ~100 tokens
    const responseText = 'b'.repeat(200); // 200 chars -> ~50 tokens

    const usage = extractTokenUsage(null, promptText, responseText);

    expect(usage.promptTokens).toBe(100);
    expect(usage.completionTokens).toBe(50);
    expect(usage.totalTokens).toBe(150);
  });

  it('should handle empty or undefined fallback texts gracefully', () => {
    const usage = extractTokenUsage(undefined, '', '');
    expect(usage.promptTokens).toBe(0);
    expect(usage.completionTokens).toBe(0);
    expect(usage.totalTokens).toBe(0);
  });
});
