import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

// Bảng cấu hình tính năng & quyền lợi chuẩn hóa
const PLAN_FEATURES: Record<string, string[]> = {
  BASIC: [
    'Tối đa 2 nhóm lớp (30 học viên/nhóm)',
    '10 AI credits / tháng',
    'Khảo thí chuẩn hóa & mở 1 miền bồi dưỡng',
    'Lưu trữ hồ sơ năng lực số cá nhân',
  ],
  LEARNER_FREE: [
    'Tối đa 2 nhóm lớp (30 học viên/nhóm)',
    '10 AI credits / tháng',
    'Khảo thí chuẩn hóa & mở 1 miền bồi dưỡng',
    'Lưu trữ hồ sơ năng lực số cá nhân',
  ],
  STANDARD: [
    'Mở trọn vẹn các miền năng lực số & trạm bồi dưỡng',
    'Tối đa 10 nhóm lớp (100 học viên/nhóm)',
    '100 AI credits / tháng',
    'Chứng chỉ số',
    'Lộ trình học tập cá nhân hóa',
  ],
  LEARNER_PLUS: [
    'Mở trọn vẹn các miền năng lực số & trạm bồi dưỡng',
    'Tối đa 10 nhóm lớp (100 học viên/nhóm)',
    '100 AI credits / tháng',
    'Chứng chỉ số',
    'Lộ trình học tập cá nhân hóa',
  ],
  ADVANCED: [
    'Toàn bộ quyền lợi gói Tiêu Chuẩn',
    'Không giới hạn nhóm lớp (500 học viên/nhóm)',
    '500 AI credits / tháng',
    'Mở phòng thi trực tiếp mã PIN thời gian thực',
    'Xuất bảng điểm Excel, CSV & dữ liệu nghiên cứu',
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
  BASIC: 'Gói Cơ Bản',
  LEARNER_FREE: 'Gói Cơ Bản',
  STANDARD: 'Gói Tiêu Chuẩn',
  LEARNER_PLUS: 'Gói Tiêu Chuẩn',
  ADVANCED: 'Gói Nâng Cao',
  LEARNER_PRO: 'Gói Nâng Cao',
  ENTERPRISE: 'Gói Tổ Chức',
  ORG_CAMPUS: 'Gói Tổ Chức',
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

    // Kiểm tra chính sách dùng thử 0đ tháng đầu tiên cho Gói Tiêu Chuẩn
    let isTrialEligible = false;
    let trialDiscount = 0;
    const isStandardPlan = plan.code === 'STANDARD' || plan.code === 'LEARNER_PLUS' || baseMonthlyPrice === 49000;

    if (isStandardPlan && cycle === 'monthly') {
      try {
        const userSupabase = await createClient();
        const { data: { user } } = await userSupabase.auth.getUser();
        if (user) {
          const { data: trialHistory } = await supabase
            .from('user_trial_history')
            .select('id')
            .eq('user_id', user.id)
            .in('plan_code', ['STANDARD', 'LEARNER_PLUS'])
            .maybeSingle();

          if (!trialHistory) {
            isTrialEligible = true;
            trialDiscount = baseMonthlyPrice;
            amount = 0;
          }
        } else {
          // Khách vãng lai xem trước cũng hiển thị ưu đãi 0đ tháng đầu
          isTrialEligible = true;
          trialDiscount = baseMonthlyPrice;
          amount = 0;
        }
      } catch (_) {
        // Fallback: nếu lỗi kiểm tra, vẫn hiển thị ưu đãi
        isTrialEligible = true;
        trialDiscount = baseMonthlyPrice;
        amount = 0;
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
        originalAmount: baseMonthlyPrice,
        trialDiscount,
        trialDays: plan.trial_days || 30,
        isTrialEligible,
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
