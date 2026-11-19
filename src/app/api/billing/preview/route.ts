import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Bảng cấu hình tính năng & quyền lợi chuẩn hóa
const PLAN_FEATURES: Record<string, string[]> = {
  LEARNER_FREE: [
    'Tối đa 2 nhóm lớp (30 học viên/nhóm)',
    '10 AI credits / tháng',
    'Khảo thí chuẩn hóa & mở 1 miền bồi dưỡng',
    'Lưu trữ hồ sơ năng lực số cá nhân',
  ],
  LEARNER_PLUS: [
    'Mở trọn vẹn 5 miền & 21 trạm bồi dưỡng',
    'Tối đa 10 nhóm lớp (100 học viên/nhóm)',
    '100 AI credits / tháng',
    'Chứng chỉ số có mã QR tra cứu Kiosk',
    'Lộ trình học tập cá nhân hóa',
  ],
  LEARNER_PRO: [
    'Toàn bộ quyền lợi gói Tiêu Chuẩn',
    'Không giới hạn nhóm lớp (500 học viên/nhóm)',
    '500 AI credits / tháng',
    'Mở phòng thi trực tiếp mã PIN thời gian thực',
    'Xuất bảng điểm Excel, CSV & dữ liệu nghiên cứu',
  ],
};

const PLAN_DISPLAY_NAMES: Record<string, string> = {
  LEARNER_FREE: 'Gói Khởi Động',
  LEARNER_PLUS: 'Gói Tiêu Chuẩn',
  LEARNER_PRO: 'Gói Nâng Cao',
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const planCode = searchParams.get('plan') || 'LEARNER_PLUS';
    const cycle = (searchParams.get('cycle') || 'monthly') as 'monthly' | 'yearly';

    const supabase = createAdminClient();
    const { data: plan, error } = await supabase
      .from('service_plans')
      .select('*')
      .eq('code', planCode)
      .maybeSingle();

    if (error || !plan) {
      return NextResponse.json(
        { error: `Không tìm thấy gói dịch vụ '${planCode}'` },
        { status: 404 }
      );
    }

    const baseMonthlyPrice = Number(plan.price_vnd || 0);

    let amount = baseMonthlyPrice;
    let monthlyEquivalent = baseMonthlyPrice;
    let durationDays = 30;
    let discountPercent = 0;
    let credits = Number(plan.credits_included || 0);

    if (cycle === 'yearly') {
      discountPercent = 20;
      durationDays = 365;
      credits = credits * 12;

      if (plan.code === 'LEARNER_PLUS' || baseMonthlyPrice === 49000) {
        amount = 468000;
        monthlyEquivalent = 39000;
      } else if (plan.code === 'LEARNER_PRO' || baseMonthlyPrice === 149000) {
        amount = 1428000;
        monthlyEquivalent = 119000;
      } else {
        amount = Math.round(baseMonthlyPrice * 12 * 0.8);
        monthlyEquivalent = Math.round(amount / 12);
      }
    }

    const features = PLAN_FEATURES[plan.code] || (Array.isArray(plan.features) ? plan.features : []);
    const planDisplayName = PLAN_DISPLAY_NAMES[plan.code] || plan.name;

    return NextResponse.json({
      success: true,
      plan: {
        id: plan.id,
        code: plan.code,
        name: planDisplayName,
        description: plan.description,
        baseMonthlyPrice,
        amount,
        monthlyEquivalent,
        currency: 'VND',
        billingCycle: cycle,
        durationDays,
        discountPercent,
        creditsIncluded: credits,
        features,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
