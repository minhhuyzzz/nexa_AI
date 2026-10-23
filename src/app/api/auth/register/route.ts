import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const registerSchema = z.object({
  nickname: z
    .string()
    .trim()
    .min(2, 'Biệt danh phải có ít nhất 2 ký tự')
    .max(30, 'Biệt danh tối đa 30 ký tự'),
  email: z.string().trim().toLowerCase().email('Địa chỉ email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  confirmPassword: z.string().min(1, 'Vui lòng xác nhận lại mật khẩu'),
  role: z.enum(['LEARNER', 'EVALUATOR'], {
    errorMap: () => ({ message: 'Vai trò chỉ được chọn LEARNER hoặc EVALUATOR' }),
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

    const { nickname, email, password, confirmPassword, role } = validated.data;

    if (password !== confirmPassword) {
      return NextResponse.json({ error: 'Mật khẩu xác nhận không khớp' }, { status: 400 });
    }

    const supabase = await createClient();

    // Kiểm tra trùng biệt danh trước khi tạo tài khoản để trả lỗi rõ ràng
    const { data: isAvailable, error: nicknameCheckError } = await supabase.rpc(
      'is_nickname_available',
      { p_nickname: nickname }
    );

    if (nicknameCheckError) {
      console.error('Nickname availability check failed:', nicknameCheckError.message);
    } else if (isAvailable === false) {
      return NextResponse.json(
        { error: 'Biệt danh này đã có người sử dụng. Vui lòng chọn biệt danh khác.' },
        { status: 409 }
      );
    }

    const origin = new URL(request.url).origin;

    // Profile được tạo tự động bởi trigger public.handle_new_user()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nickname, full_name: nickname, role, is_onboarded: true },
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      if (error.message.toLowerCase().includes('already registered')) {
        return NextResponse.json(
          { error: 'Địa chỉ email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác.' },
          { status: 400 }
        );
      }
      if (error.message.includes('Database error saving new user')) {
        return NextResponse.json(
          { error: 'Không tạo được hồ sơ. Biệt danh có thể đã được sử dụng, vui lòng chọn tên khác.' },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Supabase trả user rỗng identities khi email đã tồn tại (chống dò tài khoản)
    if (data.user && (!data.user.identities || data.user.identities.length === 0)) {
      return NextResponse.json(
        { error: 'Địa chỉ email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác.' },
        { status: 400 }
      );
    }

    // Trường hợp Supabase chưa bật xác thực email: đã có session ngay
    if (data.session) {
      return NextResponse.json({
        success: true,
        requiresEmailConfirmation: false,
        redirectUrl: role === 'LEARNER' ? '/learner/dashboard' : '/evaluator/dashboard',
      });
    }

    return NextResponse.json({
      success: true,
      requiresEmailConfirmation: true,
      message: 'Đã gửi liên kết xác thực tới email của bạn.',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
