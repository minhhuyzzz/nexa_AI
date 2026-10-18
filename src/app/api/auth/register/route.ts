import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Họ và tên phải có ít nhất 2 ký tự'),
  email: z.string().email('Địa chỉ email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  role: z.enum(['LEARNER', 'EVALUATOR'], {
    errorMap: () => ({ message: 'Vai trò chỉ được chọn LEARNER hoặc EVALUATOR' }),
  }),
  consentNd13: z.literal(true, {
    errorMap: () => ({ message: 'Bạn bắt buộc phải đồng ý với Nghị định 13/2023/NĐ-CP' }),
  }),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = registerSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const { fullName, email, password, role } = validated.data;
    const supabase = await createClient();

    // 1. Sign up user via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
        },
      },
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message || 'Đăng ký tài khoản thất bại' },
        { status: 400 }
      );
    }

    const userId = authData.user.id;

    // 2. Insert profile record into public.profiles
    const { error: profileError } = await supabase.from('profiles').insert({
      id: userId,
      email,
      full_name: fullName,
      role,
      plan_tier: 'FREE',
      credits: 3,
      points: 0,
      rank_tier: 'NOVICE',
      avg_competency_score: 0.0,
    });

    if (profileError) {
      return NextResponse.json(
        { error: 'Lỗi khởi tạo hồ sơ người dùng: ' + profileError.message },
        { status: 500 }
      );
    }

    // 3. Log consent under ND13/2023
    await supabase.from('consent_logs').insert({
      user_id: userId,
      consent_version: 'ND13_V1',
      is_granted: true,
      user_agent: request.headers.get('user-agent') || 'unknown',
    });

    // 4. If evaluator, also create pending evaluator_profile
    if (role === 'EVALUATOR') {
      await supabase.from('evaluator_profiles').insert({
        user_id: userId,
        status: 'PENDING',
      });
    }

    const redirectUrl = role === 'LEARNER' ? '/learner/dashboard' : '/evaluator/dashboard';

    return NextResponse.json({
      success: true,
      message: 'Đăng ký tài khoản thành công',
      redirectUrl,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
