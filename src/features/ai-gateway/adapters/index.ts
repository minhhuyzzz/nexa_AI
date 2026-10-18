import { AIProviderAdapter } from './ai-adapter.interface';
import { GeminiAdapter } from './gemini.adapter';

export function getAIAdapter(provider: string = 'GOOGLE_GEMINI'): AIProviderAdapter {
  switch (provider) {
    case 'GOOGLE_GEMINI':
    default:
      return new GeminiAdapter();
  }
}

export * from './ai-adapter.interface';
export * from './gemini.adapter';
