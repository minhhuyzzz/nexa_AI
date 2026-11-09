import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getEffectiveUser } from '@/lib/auth/getEffectiveUser';
import { z } from 'zod';

const joinClassSchema = z.object({
  classCode: z.string().min(2, 'Mã nhóm lớp không được để trống').max(30),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const currentUser = await getEffectiveUser(supabase);

    if (!currentUser) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập để tham gia nhóm lớp' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = joinClassSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const cleanCode = parsed.data.classCode.trim().toUpperCase();

    // 1. Tìm lớp học theo mã class_code
    const { data: cls, error: findErr } = await supabase
      .from('evaluator_classes')
      .select('id, name, class_code, evaluator_id, owner_user_id, organization_id')
      .ilike('class_code', cleanCode)
      .single();

    if (findErr || !cls) {
      return NextResponse.json(
        { error: `Không tìm thấy nhóm/lớp với mã '${cleanCode}'` },
        { status: 404 }
      );
    }

    // 2. Nếu người dùng chính là giảng viên tạo nhóm
    const isOwner = cls.evaluator_id === currentUser.id || cls.owner_user_id === currentUser.id;
    if (isOwner) {
      return NextResponse.json({
        success: true,
        message: 'Bạn là người tạo nhóm này',
        classId: cls.id,
        className: cls.name,
      });
    }

    // 3. Kiểm tra xem người dùng đã là thành viên chưa
    const { data: existingMember } = await supabase
      .from('class_members')
      .select('id')
      .eq('class_id', cls.id)
      .eq('user_id', currentUser.id)
      .single();

    if (existingMember) {
      return NextResponse.json({
        success: true,
        message: 'Bạn đã là thành viên của nhóm này',
        classId: cls.id,
        className: cls.name,
      });
    }

    // 4. Nếu lớp thuộc về một tổ chức (Organization), tự động liên kết thành viên tránh mồ côi vai trò
    let affiliatedOrgName: string | null = null;
    if (cls.organization_id) {
      try {
        let adminClient: any = null;
        try {
          adminClient = createAdminClient();
        } catch {
          adminClient = supabase;
        }
        const db = adminClient || supabase;

        if (typeof db.from === 'function') {
          const { data: orgData } = await db
            .from('organizations')
            .select('id, name, status, max_seats')
            .eq('id', cls.organization_id)
            .maybeSingle?.() || await db.from('organizations').select('id, name, status, max_seats').eq('id', cls.organization_id).single?.();

          if (orgData) {
            affiliatedOrgName = orgData.name;
            const uoQuery = db
              .from('user_organizations')
              .select('id, org_role, status')
              .eq('user_id', currentUser.id)
              .eq('organization_id', cls.organization_id);

            const { data: userOrg } =
              typeof uoQuery?.maybeSingle === 'function'
                ? await uoQuery.maybeSingle()
                : typeof uoQuery?.single === 'function'
                ? await uoQuery.single()
                : { data: null };

            if (!userOrg && typeof db.from('user_organizations')?.upsert === 'function') {
              await db
                .from('user_organizations')
                .upsert(
                  {
                    user_id: currentUser.id,
                    organization_id: cls.organization_id,
                    org_role: 'MEMBER',
                    status: 'ACTIVE',
                  },
                  { onConflict: 'user_id, organization_id' }
                );
            }
          }
        }
      } catch (e) {
        console.warn('Lưu ý liên kết tổ chức:', e);
      }
    }

    // 5. Thêm người dùng vào danh sách thành viên class_members
    const { error: insertErr } = await supabase
      .from('class_members')
      .insert({
        class_id: cls.id,
        user_id: currentUser.id,
      });

    if (insertErr) {
      return NextResponse.json(
        { error: `Không thể tham gia nhóm: ${insertErr.message}` },
        { status: 500 }
      );
    }

    const successMessage = affiliatedOrgName
      ? `Đã tham gia lớp học '${cls.name}' thuộc ${affiliatedOrgName}!`
      : `Đã tham gia nhóm thành công: ${cls.name}`;

    return NextResponse.json(
      {
        success: true,
        message: successMessage,
        classId: cls.id,
        className: cls.name,
      },
      { status: 201 }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
