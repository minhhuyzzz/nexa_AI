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
    const rawCode = (searchParams.get('code') || '').trim().toUpperCase();
    const cleanCode = rawCode.replace(/[-\s]/g, '');

    if (!cleanCode || cleanCode.length < 2) {
      return NextResponse.json({ error: 'Vui lòng cung cấp mã hợp lệ' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // 1. Tìm lớp theo mã (resilient lookup: rawCode, cleanCode, prefixes, legacy hyphenated)
    const selectQuery = `
      id,
      name,
      class_code,
      description,
      evaluator_id,
      created_at,
      organization_id,
      organizations ( id, name, slug )
    `;

    let { data: cls } = await adminClient
      .from('evaluator_classes')
      .select(selectQuery)
      .ilike('class_code', rawCode)
      .maybeSingle();

    if (!cls && cleanCode !== rawCode) {
      const retry = await adminClient
        .from('evaluator_classes')
        .select(selectQuery)
        .ilike('class_code', cleanCode)
        .maybeSingle();
      if (retry.data) cls = retry.data;
    }

    if (!cls) {
      const prefixes = ['NX', 'PB', 'DA', 'CLS', 'ORG'];
      for (const p of prefixes) {
        if (cleanCode.startsWith(p) && cleanCode.length > p.length) {
          const hyp = `${p}-${cleanCode.slice(p.length)}`;
          const retry = await adminClient
            .from('evaluator_classes')
            .select(selectQuery)
            .ilike('class_code', hyp)
            .maybeSingle();
          if (retry.data) {
            cls = retry.data;
            break;
          }
        }
      }
    }

    if (!cls) {
      const match = cleanCode.match(/^([A-Z]+)(\d+)$/);
      if (match) {
        const hyphenated = `${match[1]}-${match[2]}`;
        const retry = await adminClient
          .from('evaluator_classes')
          .select(selectQuery)
          .ilike('class_code', hyphenated)
          .maybeSingle();
        if (retry.data) cls = retry.data;
      }
    }

    if (!cls) {
      return NextResponse.json(
        { error: `Không tìm thấy lớp học hoặc nhóm với mã '${cleanCode}'. Vui lòng kiểm tra lại.` },
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

    let evalProfile: { id: string; nickname?: string | null; avatar_url?: string | null } | null = null;
    if (cls.evaluator_id) {
      const { data: prof } = await adminClient
        .from('profiles')
        .select('id, nickname, avatar_url')
        .eq('id', cls.evaluator_id)
        .maybeSingle();
      evalProfile = prof;
    }

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
        organizationName: (cls.organizations as any)?.name || null,
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
