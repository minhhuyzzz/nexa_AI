import { AIProviderAdapter } from './ai-adapter.interface';
import { GeminiAdapter } from './gemini.adapter';

export function getAIAdapter(provider: string = 'GOOGLE_GEMINI'): AIProviderAdapter {
  const normalized = (provider || 'GOOGLE_GEMINI').toUpperCase();
  switch (normalized) {
    case 'GOOGLE_GEMINI':
      return new GeminiAdapter();
    case 'ANTHROPIC_CLAUDE':
      throw new Error(
        'Nhà cung cấp Anthropic Claude hiện chưa được cấu hình adapter chính thức. Vui lòng chọn Google Gemini trong cấu hình AI Gateway.'
      );
    case 'OPENAI':
      throw new Error(
        'Nhà cung cấp OpenAI hiện chưa được cấu hình adapter chính thức. Vui lòng chọn Google Gemini trong cấu hình AI Gateway.'
      );
    default:
      throw new Error(
        `Nhà cung cấp AI "${provider}" không được hỗ trợ. Hệ thống hiện chỉ hỗ trợ GOOGLE_GEMINI.`
      );
  }
}

export * from './ai-adapter.interface';
export * from './gemini.adapter';
