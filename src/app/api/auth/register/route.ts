import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Vui lòng nhập tên người dùng muốn hiển thị'),
  username: z
    .string()
    .min(3, 'Tên tài khoản phải có ít nhất 3 ký tự')
    .max(24, 'Tên tài khoản tối đa 24 ký tự')
    .regex(/^[a-z0-9_]+$/, 'Tên tài khoản chỉ được chứa chữ thường không dấu, số và dấu gạch dưới (_)'),
  email: z.string().email('Địa chỉ email không hợp lệ'),
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

    const { fullName, username, email, password, confirmPassword, role } = validated.data;

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Mật khẩu xác nhận không khớp' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim().toLowerCase();
    const supabase = await createClient();

    // Call stored procedure to register new user securely
    const { data: userId, error: rpcError } = await supabase.rpc('register_new_user', {
      p_email: cleanEmail,
      p_username: cleanUsername,
      p_full_name: fullName.trim(),
      p_password: password,
      p_role: role,
    });

    if (rpcError) {
      const msg = rpcError.message || '';
      if (msg.includes('email') || msg.includes('địa chỉ')) {
        return NextResponse.json(
          { error: 'Địa chỉ email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác.' },
          { status: 400 }
        );
      }
      if (msg.includes('tài khoản') || msg.includes('username')) {
        return NextResponse.json(
          { error: 'Tên tài khoản này đã có người đăng ký. Vui lòng chọn tên khác.' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: rpcError.message || 'Đăng ký tài khoản không thành công' },
        { status: 400 }
      );
    }

    // Automatically sign in the new user to issue session cookies
    await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    const redirectUrl = role === 'LEARNER' ? '/learner/dashboard' : '/evaluator/dashboard';

    return NextResponse.json({
      success: true,
      message: 'Đăng ký tài khoản thành công',
      userId,
      redirectUrl,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
