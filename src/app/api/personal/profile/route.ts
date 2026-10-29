import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const updateProfileSchema = z.object({
  nickname: z
    .string()
    .trim()
    .min(2, 'Biệt danh phải có ít nhất 2 ký tự')
    .max(30, 'Biệt danh tối đa 30 ký tự'),
});

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const effectiveUserId = user?.id;
    let isGoogleAuth = false;

    if (user) {
      isGoogleAuth =
        user.app_metadata?.provider === 'google' ||
        (user.identities?.some((id) => id.provider === 'google') ?? false) ||
        (user.user_metadata?.iss?.includes('google') ?? false);
    }

    if (!effectiveUserId) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, nickname, email, avatar_url, role, points, login_streak, total_login_days')
      .eq('id', effectiveUserId)
      .single();

    if (error || !profile) {
      return NextResponse.json({ error: 'Không tìm thấy thông tin hồ sơ' }, { status: 404 });
    }

    // Determine level
    const points = profile.points ?? 0;
    let levelNumber = 1;
    let levelCode = 'Level 1: Basic';
    let levelNextTarget = 150;

    if (points >= 450) {
      levelNumber = 4;
      levelCode = 'Level 4: Highly Advanced';
      levelNextTarget = 450;
    } else if (points >= 300) {
      levelNumber = 3;
      levelCode = 'Level 3: Advanced';
      levelNextTarget = 450;
    } else if (points >= 150) {
      levelNumber = 2;
      levelCode = 'Level 2: Intermediate';
      levelNextTarget = 300;
    }

    // Fetch credentials
    const { data: credentials } = await supabase
      .from('credentials')
      .select('id, credential_id, level, hash, issued_at, is_revoked')
      .eq('user_id', effectiveUserId)
      .eq('is_revoked', false)
      .order('issued_at', { ascending: false });

    return NextResponse.json({
      profile: {
        id: profile.id,
        nickname: profile.nickname,
        email: profile.email || 'learner@nexa.edu.vn',
        avatarUrl: profile.avatar_url || null,
        role: profile.role,
        isGoogleAuth,
        points,
        levelNumber,
        levelCode,
        levelNextTarget,
      },
      credentials: credentials || [],
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const effectiveUserId = user?.id;

    if (!effectiveUserId) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    const body = await request.json();
    const validated = updateProfileSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const updates: Record<string, string> = {
      updated_at: new Date().toISOString(),
    };

    updates.nickname = validated.data.nickname;

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', effectiveUserId);

    if (updateError) {
      if (updateError.code === '23505') {
        return NextResponse.json(
          { error: 'Biệt danh này đã có người sử dụng, vui lòng chọn tên khác.' },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: 'Không thể cập nhật hồ sơ' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Hồ sơ đã được cập nhật thành công',
      updates,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
