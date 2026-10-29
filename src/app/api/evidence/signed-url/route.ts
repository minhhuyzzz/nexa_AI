import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUser } from '@/lib/auth/getEffectiveUser';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

const signedUrlSchema = z.object({
  storagePath: z.string().min(1, 'Đường dẫn tệp không được rỗng'),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const currentUser = await getEffectiveUser(supabase);

    if (!currentUser) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập để truy cập tệp' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = signedUrlSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Đường dẫn tệp không hợp lệ' }, { status: 400 });
    }

    const { storagePath } = parsed.data;

    // 1. Kiểm tra an toàn đường dẫn: ngăn chặn directory traversal
    if (storagePath.includes('..') || storagePath.startsWith('/')) {
      return NextResponse.json({ error: 'Đường dẫn tệp không hợp lệ' }, { status: 400 });
    }

    // 2. Kiểm tra thẩm quyền truy cập:
    // Quyền 1: Chủ sở hữu tệp (nằm trong thư mục submissions/[userId]/...)
    const isOwner = storagePath.includes(`submissions/${currentUser.id}/`);

    // Quyền 2: Quản trị viên hệ thống
    const isAdmin = currentUser.role === 'ADMIN';

    // Quyền 3: Giảng viên / Người chấm phụ trách
    let isAuthorizedEvaluator = false;
    if (!isOwner && !isAdmin && currentUser.role === 'EVALUATOR') {
      const adminSupabase = createAdminClient();
      const { data: answer } = await adminSupabase
        .from('submission_answers')
        .select(`
          submission_id,
          assessment_submissions!inner (
            id,
            user_id,
            assessment_id,
            class_assignment_id,
            assessments ( created_by, owner_user_id )
          )
        `)
        .eq('evidence_url', storagePath)
        .limit(1)
        .maybeSingle();

      if (answer?.assessment_submissions) {
        const sub = answer.assessment_submissions as any;
        const asm = sub.assessments;
        if (asm?.created_by === currentUser.id || asm?.owner_user_id === currentUser.id) {
          isAuthorizedEvaluator = true;
        } else if (sub.class_assignment_id) {
          const { data: assign } = await adminSupabase
            .from('class_assignments')
            .select('evaluator_classes!inner(evaluator_id, owner_user_id)')
            .eq('id', sub.class_assignment_id)
            .single();

          if (
            (assign?.evaluator_classes as any)?.evaluator_id === currentUser.id ||
            (assign?.evaluator_classes as any)?.owner_user_id === currentUser.id
          ) {
            isAuthorizedEvaluator = true;
          }
        }
      }
    }

    if (!isOwner && !isAdmin && !isAuthorizedEvaluator) {
      return NextResponse.json(
        { error: 'Bạn không có quyền truy cập tệp minh chứng này' },
        { status: 403 }
      );
    }

    // 3. Khởi tạo Signed URL an toàn có hạn dùng 5 phút (300 giây)
    const adminSupabase = createAdminClient();
    const { data: signedData, error: signErr } = await adminSupabase.storage
      .from('assessment-evidence')
      .createSignedUrl(storagePath, 300);

    if (signErr || !signedData?.signedUrl) {
      return NextResponse.json(
        { error: `Không thể tạo đường dẫn bảo mật: ${signErr?.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      signedUrl: signedData.signedUrl,
      expiresInSeconds: 300,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
