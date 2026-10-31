import { NextResponse } from 'next/server';
import { GeminiAdapter } from '@/features/ai-gateway/adapters/gemini.adapter';
import { createClient } from '@/lib/supabase/server';
import { isSuperadminEmail } from '@/lib/auth/superadmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;

  // Determine if caller is Platform Admin (only admins can view technical model metadata)
  let isAdmin = false;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user && isSuperadminEmail(user.email)) {
      isAdmin = true;
    } else if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.role === 'ADMIN' || profile?.role === 'SUPERADMIN') {
        isAdmin = true;
      }
    }
  } catch {
    // Treat as non-admin client
  }

  if (!apiKey) {
    if (isAdmin) {
      return NextResponse.json({
        connected: false,
        provider: 'Google Gemini',
        model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
        error: 'Chưa cấu hình GEMINI_API_KEY trong môi trường',
        latencyMs: null,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      connected: false,
      status: 'UNAVAILABLE',
      message: 'Hệ thống AI đang bảo trì hoặc chưa sẵn sàng.',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const adapter = new GeminiAdapter();
    const result = await adapter.ping();

    if (isAdmin) {
      return NextResponse.json({
        connected: true,
        provider: 'Google Gemini',
        model: result.model,
        latencyMs: result.latencyMs,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      connected: true,
      status: 'READY',
      message: 'Hệ thống AI sẵn sàng đánh giá và phân tích năng lực.',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Lỗi kết nối Gemini API';
    const isHighDemand =
      errorMessage.includes('503') ||
      errorMessage.includes('high demand') ||
      errorMessage.includes('UNAVAILABLE');

    if (isAdmin) {
      return NextResponse.json(
        {
          connected: false,
          isHighDemand,
          provider: 'Google Gemini',
          model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
          error: isHighDemand
            ? 'Gemini API phản hồi 503 (Dịch vụ đang quá tải/High Demand). Vui lòng thử lại sau.'
            : errorMessage,
          latencyMs: null,
          timestamp: new Date().toISOString(),
        },
        { status: isHighDemand ? 503 : 500 }
      );
    }

    return NextResponse.json(
      {
        connected: false,
        status: 'UNAVAILABLE',
        message: 'Dịch vụ AI tạm thời gián đoạn. Vui lòng thử lại sau ít phút.',
        timestamp: new Date().toISOString(),
      },
      { status: isHighDemand ? 503 : 500 }
    );
  }
}
