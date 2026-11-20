import { AIProviderAdapter, TokenUsage } from './ai-adapter.interface';
import { GeminiAdapter } from './gemini.adapter';

export type SupportedAIProvider = 'GOOGLE_GEMINI';
export type UnsupportedAIProvider =
  | 'ANTHROPIC_CLAUDE'
  | 'OPENAI'
  | 'DEEPSEEK'
  | 'OPENROUTER'
  | 'ON_PREMISE';

export type AIProvider = SupportedAIProvider | UnsupportedAIProvider;

export interface StructuredTokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export type AITaskType =
  | 'RUBRIC_GRADING'
  | 'COMPETENCY_ANALYSIS'
  | 'ORG_INSIGHT'
  | 'AUTHORING_ASSIST'
  | 'EXPLAIN_QUESTION';

export interface RouteTaskOptions {
  taskType?: AITaskType | string;
  provider?: string;
  customModel?: string;
}

/**
 * Lấy AI Provider Adapter tương ứng.
 * Khóa chặt các provider chưa có adapter chính thức (ANTHROPIC_CLAUDE, OPENAI, DEEPSEEK, OPENROUTER, ON_PREMISE),
 * chỉ hỗ trợ duy nhất Google Gemini với thông báo hướng dẫn rõ ràng (P0-03).
 */
export function getAIAdapter(provider: string = 'GOOGLE_GEMINI', customModel?: string): AIProviderAdapter {
  const normalized = (provider || 'GOOGLE_GEMINI').toUpperCase();
  switch (normalized) {
    case 'GOOGLE_GEMINI':
    case 'GEMINI':
      return new GeminiAdapter(customModel);
    case 'ANTHROPIC_CLAUDE':
    case 'CLAUDE':
      throw new Error(
        'Nhà cung cấp Anthropic Claude hiện chưa được cấu hình adapter chính thức. Vui lòng chọn Google Gemini trong cấu hình AI Gateway.'
      );
    case 'OPENAI':
      throw new Error(
        'Nhà cung cấp OpenAI hiện chưa được cấu hình adapter chính thức. Vui lòng chọn Google Gemini trong cấu hình AI Gateway.'
      );
    case 'DEEPSEEK':
      throw new Error(
        'Nhà cung cấp AI "DEEPSEEK" không được hỗ trợ. Hệ thống hiện chỉ hỗ trợ GOOGLE_GEMINI. Vui lòng chọn Google Gemini trong cấu hình AI Gateway.'
      );
    case 'OPENROUTER':
      throw new Error(
        'Nhà cung cấp AI "OPENROUTER" không được hỗ trợ. Hệ thống hiện chỉ hỗ trợ GOOGLE_GEMINI. Vui lòng chọn Google Gemini trong cấu hình AI Gateway.'
      );
    case 'ON_PREMISE':
      throw new Error(
        'Nhà cung cấp AI "ON_PREMISE" không được hỗ trợ. Hệ thống hiện chỉ hỗ trợ GOOGLE_GEMINI. Vui lòng chọn Google Gemini trong cấu hình AI Gateway.'
      );
    default:
      throw new Error(
        `Nhà cung cấp AI "${provider}" không được hỗ trợ. Hệ thống hiện chỉ hỗ trợ GOOGLE_GEMINI.`
      );
  }
}

/**
 * Định tuyến tác vụ AI qua Adapter phù hợp.
 * Hiện tại toàn bộ tác vụ (RUBRIC_GRADING, COMPETENCY_ANALYSIS, v.v.) đều được định tuyến
 * qua Google Gemini Adapter theo chuẩn Production Readiness v1.1.
 */
export function routeAITask(options?: RouteTaskOptions): AIProviderAdapter {
  const requestedProvider = options?.provider || 'GOOGLE_GEMINI';
  return getAIAdapter(requestedProvider, options?.customModel);
}

/**
 * Trích xuất hoặc tính toán cấu trúc sử dụng token có cấu trúc chuẩn xác
 * (promptTokens, completionTokens, totalTokens) phục vụ tính cước và đối soát Credits.
 */
export function extractTokenUsage(
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  } | null,
  fallbackPrompt?: string,
  fallbackResponse?: string
): StructuredTokenUsage {
  const promptTokens =
    usageMetadata?.promptTokenCount ??
    (fallbackPrompt ? Math.max(1, Math.round(fallbackPrompt.length / 4)) : 0);
  const completionTokens =
    usageMetadata?.candidatesTokenCount ??
    (fallbackResponse ? Math.max(1, Math.round(fallbackResponse.length / 4)) : 0);
  const totalTokens =
    usageMetadata?.totalTokenCount ?? (promptTokens + completionTokens);

  return {
    promptTokens,
    completionTokens,
    totalTokens,
  };
}

export * from './ai-adapter.interface';
export * from './gemini.adapter';
export type { TokenUsage };
