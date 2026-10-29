import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUser } from '@/lib/auth/getEffectiveUser';
import { createAdminClient } from '@/lib/supabase/admin';

const createClassSchema = z.object({
  name: z.string().min(2, 'Tên nhóm lớp tối thiểu 2 ký tự').max(100),
  classCode: z.string().min(2).max(20).optional(),
  description: z.string().optional(),
  organizationId: z.string().uuid().optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const currentUser = await getEffectiveUser(supabase);

    if (!currentUser) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập để tạo nhóm lớp' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = createClassSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const { name, description, organizationId } = parsed.data;
    const adminSupabase = createAdminClient();

    // 1. Nếu tạo trong tổ chức, kiểm tra quyền hạn của caller trong tổ chức
    if (organizationId) {
      const isPlatformAdmin = currentUser.role === 'ADMIN';
      if (!isPlatformAdmin) {
        const { data: member } = await adminSupabase
          .from('user_organizations')
          .select('org_role, status')
          .eq('user_id', currentUser.id)
          .eq('organization_id', organizationId)
          .eq('status', 'ACTIVE')
          .single();

        if (!member || !['ORG_OWNER', 'ORG_ADMIN', 'ASSESSOR', 'EVALUATOR'].includes(member.org_role)) {
          return NextResponse.json(
            { error: 'Bạn không có quyền tạo nhóm lớp trong tổ chức này' },
            { status: 403 }
          );
        }
      }
    }

    // 2. Tạo mã nhóm nếu chưa có
    let finalCode = parsed.data.classCode?.trim().toUpperCase();
    if (!finalCode) {
      const rand = Math.floor(1000 + Math.random() * 9000);
      const prefix = organizationId ? 'ORG' : 'CLS';
      finalCode = `${prefix}-${rand}`;
    }

    // 3. Tạo bản ghi lớp học
    const { data: createdClass, error: insertErr } = await adminSupabase
      .from('evaluator_classes')
      .insert({
        name: name.trim(),
        class_code: finalCode,
        description: description?.trim() || null,
        evaluator_id: currentUser.id,
        owner_user_id: currentUser.id,
        organization_id: organizationId || null,
      })
      .select()
      .single();

    if (insertErr) {
      return NextResponse.json(
        { error: `Không thể tạo nhóm lớp: ${insertErr.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Tạo nhóm lớp thành công',
        class: createdClass,
      },
      { status: 201 }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
