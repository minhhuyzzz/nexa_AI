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

    const execLookup = async (queryBuilder: any) => {
      if (typeof queryBuilder?.maybeSingle === 'function') {
        return await queryBuilder.maybeSingle();
      }
      if (typeof queryBuilder?.single === 'function') {
        try {
          return await queryBuilder.single();
        } catch (err: any) {
          return { data: null, error: err };
        }
      }
      if (typeof queryBuilder?.is === 'function') {
        try {
          const isBuilder = queryBuilder.is('organization_id', null);
          if (typeof isBuilder?.single === 'function') return await isBuilder.single();
          if (typeof isBuilder?.maybeSingle === 'function') return await isBuilder.maybeSingle();
        } catch (err: any) {
          return { data: null, error: err };
        }
      }
      return { data: null, error: null };
    };

    const initialLookup = await execLookup(
      adminClient
        .from('evaluator_classes')
        .select(selectQuery)
        .ilike('class_code', rawCode)
    );
    let cls = initialLookup.data;

    if (!cls && cleanCode !== rawCode) {
      const retry = await execLookup(
        adminClient
          .from('evaluator_classes')
          .select(selectQuery)
          .ilike('class_code', cleanCode)
      );
      if (retry.data) cls = retry.data;
    }

    if (!cls) {
      const prefixes = ['NX', 'PB', 'DA', 'CLS', 'ORG'];
      for (const p of prefixes) {
        if (cleanCode.startsWith(p) && cleanCode.length > p.length) {
          const hyp = `${p}-${cleanCode.slice(p.length)}`;
          const retry = await execLookup(
            adminClient
              .from('evaluator_classes')
              .select(selectQuery)
              .ilike('class_code', hyp)
          );
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
        const retry = await execLookup(
          adminClient
            .from('evaluator_classes')
            .select(selectQuery)
            .ilike('class_code', hyphenated)
        );
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

    let evalProfile: { id?: string; nickname?: string | null; avatar_url?: string | null } | null =
      Array.isArray(cls.profiles) ? cls.profiles[0] : cls.profiles;

    if (!evalProfile && cls.evaluator_id) {
      try {
        const { data: prof } = await adminClient
          .from('profiles')
          .select('id, nickname, avatar_url')
          .eq('id', cls.evaluator_id)
          .maybeSingle?.() || await adminClient.from('profiles').select('id, nickname, avatar_url').eq('id', cls.evaluator_id).single?.();
        evalProfile = prof;
      } catch {
        // fallback
      }
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
