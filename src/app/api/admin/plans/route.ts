import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { requirePlatformAdmin } from '@/lib/auth/admin-guard';

const planSchema = z.object({
  id: z.string().uuid().optional(),
  code: z.string().min(2),
  roleTarget: z.enum(['LEARNER', 'EVALUATOR', 'ORGANIZATION']).default('EVALUATOR'),
  name: z.string().min(2),
  description: z.string().optional().default(''),
  priceVnd: z.number().min(0),
  creditsIncluded: z.number().min(0),
  maxMembers: z.number().min(1).default(1),
  features: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

const CANONICAL_PLAN_CODES = ['BASIC', 'STANDARD', 'ADVANCED', 'ENTERPRISE'];

const CANONICAL_PLANS_SEED = [
  {
    code: 'BASIC',
    role_target: 'LEARNER',
    name: 'Gói Cơ Bản',
    badge: 'TRẢI NGHIỆM',
    description: 'Khảo sát năng lực số cơ bản và lưu trữ hồ sơ cá nhân.',
    price_vnd: 0,
    annual_price_vnd: 0,
    yearly_monthly_equivalent: 0,
    trial_days: 0,
    credits_included: 10,
    max_classes: 2,
    max_class_members: 30,
    max_live_participants: 30,
    unlock_advanced_exams: false,
    sha256_certificate: true,
    export_csv_excel: false,
    features: [
      'Khảo sát các miền năng lực số chuẩn hóa',
      'Lưu trữ hồ sơ năng lực số cá nhân',
      'Cấp chứng chỉ số khi hoàn thành bài thi',
      'Tối đa 2 nhóm lớp (30 học viên/nhóm)',
      'Mở phòng thi trực tiếp mã PIN (30 thí sinh)',
      '10 AI credits / tháng',
    ],
    is_active: true,
    sort_order: 1,
  },
  {
    code: 'STANDARD',
    role_target: 'LEARNER',
    name: 'Gói Tiêu Chuẩn',
    badge: 'PHỔ BIẾN NHẤT',
    description: 'Mở khóa trọn vẹn các miền bồi dưỡng và cấp chứng chỉ số.',
    price_vnd: 49000,
    annual_price_vnd: 468000,
    yearly_monthly_equivalent: 39000,
    trial_days: 30,
    credits_included: 100,
    max_classes: 10,
    max_class_members: 100,
    max_live_participants: 100,
    unlock_advanced_exams: true,
    sha256_certificate: true,
    export_csv_excel: false,
    features: [
      'Toàn bộ quyền lợi gói Cơ Bản',
      'Tặng 30 ngày dùng thử 0đ tháng đầu tiên',
      'Mở trọn vẹn các miền năng lực số và học liệu bồi dưỡng',
      'Lộ trình học tập cá nhân hóa',
      'Tối đa 10 nhóm lớp (100 học viên/nhóm)',
      'Mở phòng thi trực tiếp mã PIN (100 thí sinh)',
      '100 AI credits / tháng',
    ],
    is_active: true,
    sort_order: 2,
  },
  {
    code: 'ADVANCED',
    role_target: 'LEARNER',
    name: 'Gói Nâng Cao',
    badge: 'TOÀN DIỆN',
    description: 'Dành cho cá nhân bồi dưỡng chuyên sâu và tổ chức thi trực tiếp.',
    price_vnd: 149000,
    annual_price_vnd: 1428000,
    yearly_monthly_equivalent: 119000,
    trial_days: 0,
    credits_included: 500,
    max_classes: 9999,
    max_class_members: 500,
    max_live_participants: 500,
    unlock_advanced_exams: true,
    sha256_certificate: true,
    export_csv_excel: true,
    features: [
      'Toàn bộ quyền lợi gói Tiêu Chuẩn',
      'Không giới hạn nhóm lớp (500 học viên/nhóm)',
      'Mở phòng thi trực tiếp mã PIN (500 thí sinh)',
      '500 AI credits / tháng',
      'Xuất bảng điểm Excel, CSV và dữ liệu nghiên cứu',
    ],
    is_active: true,
    sort_order: 3,
  },
  {
    code: 'ENTERPRISE',
    role_target: 'ORGANIZATION',
    name: 'Gói Tổ Chức',
    badge: 'TRƯỜNG HỌC VÀ DOANH NGHIỆP',
    description: 'Khảo thí diện rộng toàn trường, hội đồng chấm tập trung và chứng nhận đơn vị.',
    price_vnd: 0,
    annual_price_vnd: 0,
    yearly_monthly_equivalent: 0,
    trial_days: 0,
    credits_included: 10000,
    max_classes: 99999,
    max_class_members: 50000,
    max_live_participants: 50000,
    unlock_advanced_exams: true,
    sha256_certificate: true,
    export_csv_excel: true,
    features: [
      'Khảo thí diện rộng theo đợt cho đơn vị (Campaigns)',
      'Báo cáo và thống kê năng lực số cấp tổ chức',
      'Cấp chứng chỉ số gắn tên và logo đơn vị',
      'Hợp đồng dịch vụ, hóa đơn VAT và cam kết hỗ trợ',
    ],
    is_active: true,
    sort_order: 4,
  },
];

export async function GET() {
  try {
    const auth = await requirePlatformAdmin();
    if (!auth.isAuthorized) {
      return auth.errorResponse!;
    }

    const adminSupabase = createAdminClient();

    // Khóa chặt chỉ trả về đúng 4 gói chuẩn hóa của toàn hệ sinh thái NEXA
    const { data: plans, error } = await adminSupabase
      .from('service_plans')
      .select('*')
      .in('code', CANONICAL_PLAN_CODES)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Nếu CSDL chưa có đủ 4 gói canonical, tự động khởi tạo và trả về dữ liệu chuẩn
    if (!plans || plans.length === 0) {
      for (const seed of CANONICAL_PLANS_SEED) {
        await adminSupabase.from('service_plans').upsert(seed, { onConflict: 'code' });
      }
      return NextResponse.json({ success: true, plans: CANONICAL_PLANS_SEED });
    }

    return NextResponse.json({ success: true, plans });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePlatformAdmin();
    if (!auth.isAuthorized) {
      return auth.errorResponse!;
    }

    const adminSupabase = createAdminClient();

    const body = await request.json();
    const validation = planSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Dữ liệu không hợp lệ', details: validation.error.format() }, { status: 400 });
    }

    const { code, roleTarget, name, description, priceVnd, creditsIncluded, maxMembers, features, isActive } = validation.data;

    const { data: plan, error } = await adminSupabase
      .from('service_plans')
      .insert({
        code,
        role_target: roleTarget,
        name,
        description,
        price_vnd: priceVnd,
        credits_included: creditsIncluded,
        max_members: maxMembers,
        features,
        is_active: isActive,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, plan });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requirePlatformAdmin();
    if (!auth.isAuthorized) {
      return auth.errorResponse!;
    }

    const adminSupabase = createAdminClient();

    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: 'Thiếu id gói dịch vụ' }, { status: 400 });
    }

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (body.name !== undefined) updateData.name = body.name;
    if (body.badge !== undefined) updateData.badge = body.badge;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.priceVnd !== undefined) updateData.price_vnd = body.priceVnd;
    if (body.annualPriceVnd !== undefined) updateData.annual_price_vnd = body.annualPriceVnd;
    if (body.yearlyMonthlyEquivalent !== undefined) updateData.yearly_monthly_equivalent = body.yearlyMonthlyEquivalent;
    if (body.trialDays !== undefined) updateData.trial_days = body.trialDays;
    if (body.creditsIncluded !== undefined) updateData.credits_included = body.creditsIncluded;
    if (body.maxMembers !== undefined) updateData.max_members = body.maxMembers;
    if (body.maxClasses !== undefined) updateData.max_classes = body.maxClasses;
    if (body.maxClassMembers !== undefined) updateData.max_class_members = body.maxClassMembers;
    if (body.maxLiveParticipants !== undefined) updateData.max_live_participants = body.maxLiveParticipants;
    if (body.unlockAdvancedExams !== undefined) updateData.unlock_advanced_exams = body.unlockAdvancedExams;
    if (body.sha256Certificate !== undefined) updateData.sha256_certificate = body.sha256Certificate;
    if (body.exportCsvExcel !== undefined) updateData.export_csv_excel = body.exportCsvExcel;
    if (body.features !== undefined) updateData.features = body.features;
    if (body.isActive !== undefined) updateData.is_active = body.isActive;

    const { data: plan, error } = await adminSupabase
      .from('service_plans')
      .update(updateData)
      .eq('id', body.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, plan });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
