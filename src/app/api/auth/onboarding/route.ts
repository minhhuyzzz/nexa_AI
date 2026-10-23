import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const onboardingSchema = z.object({
  role: z.enum(['LEARNER', 'EVALUATOR'], {
    errorMap: () => ({ message: 'Vai trò chỉ được chọn Người học (LEARNER) hoặc Người đánh giá (EVALUATOR)' }),
  }),
  nickname: z
    .string()
    .trim()
    .min(2, 'Biệt danh phải có ít nhất 2 ký tự')
    .max(30, 'Biệt danh tối đa 30 ký tự'),
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

    const { role, nickname } = validated.data;

    // 1. Fetch current profile
    const { data: profile, error: profileFetchError } = await supabase
      .from('profiles')
      .select('id, role, nickname, is_onboarded')
      .eq('id', user.id)
      .single();

    if (profileFetchError || !profile) {
      return NextResponse.json({ error: 'Không tìm thấy thông tin tài khoản' }, { status: 404 });
    }

    // Nếu đã hoàn tất thiết lập trước đó, bảo vệ quy tắc vai trò cố định
    if (profile.is_onboarded === true) {
      const redirectUrl = profile.role === 'EVALUATOR' ? '/evaluator/dashboard' : '/learner/dashboard';
      return NextResponse.json({
        success: true,
        message: 'Tài khoản đã hoàn tất thiết lập từ trước',
        redirectUrl,
      });
    }

    // 2. Kiểm tra trùng biệt danh (nếu người dùng thay đổi biệt danh so với gợi ý tự động)
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

    // 3. Cập nhật hồ sơ với vai trò và biệt danh được chọn
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        role,
        nickname: cleanNickname,
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

    // 4. Nếu chọn Người đánh giá (EVALUATOR), khởi tạo bản ghi evaluator_profiles
    if (role === 'EVALUATOR') {
      await supabase
        .from('evaluator_profiles')
        .upsert({ user_id: user.id, status: 'PENDING' });
    }

    const redirectUrl = role === 'EVALUATOR' ? '/evaluator/dashboard' : '/learner/dashboard';

    return NextResponse.json({
      success: true,
      message: 'Thiết lập tài khoản thành công',
      redirectUrl,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
