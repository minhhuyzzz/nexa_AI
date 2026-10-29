import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const onboardingSchema = z.object({
  role: z
    .enum(['LEARNER', 'EVALUATOR', 'USER'], {
      errorMap: () => ({ message: 'Vai trò chỉ được chọn LEARNER, EVALUATOR hoặc USER' }),
    })
    .optional()
    .default('LEARNER'),
  nickname: z
    .string()
    .trim()
    .min(2, 'Biệt danh phải có ít nhất 2 ký tự')
    .max(30, 'Biệt danh tối đa 30 ký tự'),
  orgCode: z.string().trim().optional().or(z.literal('')),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập để hoàn tất hồ sơ' }, { status: 401 });
    }

    const body = await request.json();
    const validated = onboardingSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const { role, nickname, orgCode } = validated.data;

    // 1. Fetch current profile
    const { data: profile, error: profileFetchError } = await supabase
      .from('profiles')
      .select('id, role, nickname, is_onboarded, plan_tier')
      .eq('id', user.id)
      .single();

    if (profileFetchError || !profile) {
      return NextResponse.json({ error: 'Không tìm thấy thông tin tài khoản' }, { status: 404 });
    }

    // Nếu đã hoàn tất thiết lập trước đó, bảo vệ quy tắc vai trò cố định
    if (profile.is_onboarded === true) {
      return NextResponse.json({
        success: true,
        message: 'Tài khoản đã hoàn tất thiết lập từ trước',
        redirectUrl: '/dashboard',
      });
    }

    // 2. Validate mã trường / B2B organization nếu người dùng có nhập
    let linkedOrgId: string | null = null;
    let targetPlanTier = profile.plan_tier || 'FREE';

    if (orgCode && orgCode.trim()) {
      const cleanCode = orgCode.trim().toUpperCase();
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('id, name, status, code')
        .ilike('code', cleanCode)
        .eq('status', 'ACTIVE')
        .maybeSingle();

      if (orgError || !orgData) {
        return NextResponse.json(
          { error: `Mã đơn vị "${cleanCode}" không tồn tại hoặc chưa được kích hoạt.` },
          { status: 400 }
        );
      }

      linkedOrgId = orgData.id;
      targetPlanTier = 'ENTERPRISE';
    }

    // 3. Kiểm tra trùng biệt danh (nếu người dùng thay đổi biệt danh so với gợi ý tự động)
    const cleanNickname = nickname.trim();
    if (cleanNickname.toLowerCase() !== (profile.nickname || '').toLowerCase()) {
      const { data: isAvailable, error: checkError } = await supabase.rpc(
        'is_nickname_available',
        { p_nickname: cleanNickname }
      );

      if (checkError) {
        console.error('Error checking nickname availability:', checkError.message);
      } else if (isAvailable === false) {
        return NextResponse.json(
          { error: 'Biệt danh này đã có người sử dụng. Vui lòng chọn biệt danh khác.' },
          { status: 409 }
        );
      }
    }

    // 4. Cập nhật hồ sơ với vai trò, biệt danh và plan_tier
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        role,
        nickname: cleanNickname,
        plan_tier: targetPlanTier,
        is_onboarded: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      if (updateError.code === '23505') {
        return NextResponse.json(
          { error: 'Biệt danh này đã có người sử dụng. Vui lòng chọn biệt danh khác.' },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    // 5. Gắn người dùng vào tổ chức nếu có orgCode hợp lệ
    if (linkedOrgId) {
      await supabase
        .from('user_organizations')
        .upsert(
          {
            user_id: user.id,
            organization_id: linkedOrgId,
            org_role: 'MEMBER',
            status: 'ACTIVE',
          },
          { onConflict: 'user_id,organization_id' }
        );
    }

    // 6. Nếu chọn Người đánh giá (EVALUATOR), khởi tạo bản ghi evaluator_profiles
    if (role === 'EVALUATOR') {
      await supabase
        .from('evaluator_profiles')
        .upsert({ user_id: user.id, status: 'PENDING' });
    }

    const redirectUrl = '/dashboard';

    return NextResponse.json({
      success: true,
      message: linkedOrgId ? 'Thiết lập tài khoản và kết nối đơn vị thành công' : 'Thiết lập tài khoản thành công',
      redirectUrl,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
