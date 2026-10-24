import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const adminSupabase = createAdminClient();
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 });
    }

    const { data: events, error } = await adminSupabase
      .from('ai_usage_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const allEvents = events || [];
    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;
    let totalLatencyMs = 0;
    let totalCostUsd = 0;
    const modelCounts: Record<string, number> = {};
    const featureCounts: Record<string, number> = {};

    allEvents.forEach((ev: any) => {
      totalPromptTokens += ev.prompt_tokens || 0;
      totalCompletionTokens += ev.completion_tokens || 0;
      totalLatencyMs += ev.latency_ms || 0;
      totalCostUsd += Number(ev.cost_estimated || 0);

      const m = ev.model || 'gemini-2.5-flash';
      modelCounts[m] = (modelCounts[m] || 0) + 1;

      const f = ev.feature || 'unknown';
      featureCounts[f] = (featureCounts[f] || 0) + 1;
    });

    const avgLatency = allEvents.length > 0 ? Math.round(totalLatencyMs / allEvents.length) : 0;
    const estimatedCostVnd = Math.round(totalCostUsd * 25400);

    return NextResponse.json({
      success: true,
      stats: {
        totalRequests: allEvents.length,
        totalPromptTokens,
        totalCompletionTokens,
        totalTokens: totalPromptTokens + totalCompletionTokens,
        avgLatencyMs: avgLatency,
        totalCostUsd: Number(totalCostUsd.toFixed(4)),
        totalCostVnd: estimatedCostVnd,
        models: modelCounts,
        features: featureCounts,
      },
      recentEvents: allEvents.slice(0, 25),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
