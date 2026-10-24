import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CompetencyAggregationService } from '@/features/competency/services/competency-aggregation.service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    const radar = await CompetencyAggregationService.calculateLearnerRadar(supabase, user.id);

    return NextResponse.json({
      success: true,
      ...radar,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi tổng hợp hồ sơ năng lực';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
