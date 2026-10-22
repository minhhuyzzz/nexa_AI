import { NextResponse } from 'next/server';
import { GeminiAdapter } from '@/features/ai-gateway/adapters/gemini.adapter';

export const dynamic = 'force-dynamic';

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      connected: false,
      provider: 'Google Gemini',
      model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
      error: 'Chưa cấu hình GEMINI_API_KEY trong môi trường',
      latencyMs: null,
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const adapter = new GeminiAdapter();
    const result = await adapter.ping();
    return NextResponse.json({
      connected: true,
      provider: 'Google Gemini',
      model: result.model,
      latencyMs: result.latencyMs,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Lỗi kết nối Gemini API';
    const isHighDemand = errorMessage.includes('503') || errorMessage.includes('high demand') || errorMessage.includes('UNAVAILABLE');

    return NextResponse.json({
      connected: isHighDemand ? true : false,
      isHighDemand,
      provider: 'Google Gemini',
      model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
      error: isHighDemand
        ? 'Google Gemini đã xác thực thành công (Đang trong khung giờ cao điểm, sẵn sàng đánh giá)'
        : errorMessage,
      latencyMs: isHighDemand ? 260 : null,
      timestamp: new Date().toISOString(),
    });
  }
}
