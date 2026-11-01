import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUser } from '@/lib/auth/getEffectiveUser';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const currentUser = await getEffectiveUser(supabase);

    if (!currentUser) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập để tra cứu mã' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code')?.trim().toUpperCase();

    if (!code || code.length < 2) {
      return NextResponse.json({ error: 'Vui lòng cung cấp mã hợp lệ' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // 1. Tìm lớp theo mã
    const { data: cls, error: clsError } = await adminClient
      .from('evaluator_classes')
      .select(`
        id,
        name,
        class_code,
        description,
        evaluator_id,
        created_at,
        organization_id,
        profiles:evaluator_id ( id, nickname, avatar_url )
      `)
      .ilike('class_code', code)
      .is('organization_id', null) // Chỉ tra cứu trong không gian cá nhân (Personal)
      .single();

    if (clsError || !cls) {
      return NextResponse.json(
        { error: `Không tìm thấy lớp học hoặc nhóm với mã '${code}'. Vui lòng kiểm tra lại.` },
        { status: 404 }
      );
    }

    // 2. Đếm số lượng thành viên
    const { count: memberCount } = await adminClient
      .from('class_members')
      .select('id', { count: 'exact', head: true })
      .eq('class_id', cls.id);

    // 3. Kiểm tra xem người dùng hiện tại đã là thành viên hoặc người tạo chưa
    const isOwner = cls.evaluator_id === currentUser.id;

    let isMember = false;
    if (!isOwner) {
      const { data: memberRow } = await adminClient
        .from('class_members')
        .select('id')
        .eq('class_id', cls.id)
        .eq('user_id', currentUser.id)
        .single();
      isMember = Boolean(memberRow);
    }

    const evalProfile = Array.isArray(cls.profiles) ? cls.profiles[0] : cls.profiles;

    return NextResponse.json({
      success: true,
      class: {
        id: cls.id,
        name: cls.name,
        code: cls.class_code,
        description: cls.description || '',
        evaluatorName: evalProfile?.nickname || 'Người quản lý',
        evaluatorAvatar: evalProfile?.avatar_url || null,
        memberCount: memberCount ?? 0,
        createdAt: cls.created_at,
        isOwner,
        isMember,
        requiresApproval: false, // Mặc định vào ngay qua mã, có thể mở rộng
      },
    });
  } catch (err: unknown) {
    console.error('Error in GET /api/classes/preview:', err);
    return NextResponse.json({ error: 'Lỗi hệ thống khi tra cứu mã' }, { status: 500 });
  }
}
