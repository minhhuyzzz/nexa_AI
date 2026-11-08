import { NextResponse } from 'next/server';
import { getOrgAuthContext } from '@/lib/auth/org-guard';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id: sourceAssessmentId } = await params;
    const authContext = await getOrgAuthContext(slug);

    if (!authContext || !authContext.isAuthorized) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập hoặc không đủ quyền' }, { status: 401 });
    }

    const { organization: org, user, role, isSuperadmin } = authContext;
    const canManage = isSuperadmin || role === 'ORG_OWNER' || role === 'ORG_ADMIN' || role === 'ASSESSOR';

    if (!canManage) {
      return NextResponse.json({ error: 'Bạn không có quyền sao chép đề khảo thí này' }, { status: 403 });
    }

    const supabase = await createClient();
    const adminSupabase = createAdminClient();
    const db = process.env.SUPABASE_SERVICE_ROLE_KEY ? adminSupabase : supabase;

    // 1. Fetch source assessment
    const { data: source, error: sourceError } = await db
      .from('assessments')
      .select('*')
      .eq('id', sourceAssessmentId)
      .maybeSingle();

    if (sourceError || !source) {
      return NextResponse.json({ error: 'Không tìm thấy đề khảo thí nguồn' }, { status: 404 });
    }

    // 2. Fetch all items and their options from source assessment
    const { data: sourceItems, error: itemsError } = await db
      .from('assessment_items')
      .select('*, item_options(*)')
      .eq('assessment_id', sourceAssessmentId)
      .order('order_index', { ascending: true });

    if (itemsError) {
      console.error('Error fetching source assessment items:', itemsError);
    }

    // 3. Create cloned assessment
    const clonedTitle = `${source.title} (Bản sao)`;
    const { data: newAssessment, error: insertError } = await db
      .from('assessments')
      .insert({
        title: clonedTitle,
        description: source.description || '',
        duration_minutes: source.duration_minutes || 45,
        passing_score: source.passing_score || 70,
        point_reward: source.point_reward || 50,
        is_published: false, // Bắt đầu ở trạng thái Bản nháp
        organization_id: org.id,
        created_by: user.id,
        owner_user_id: user.id,
        visibility: 'ORGANIZATION',
      })
      .select()
      .single();

    if (insertError || !newAssessment) {
      console.error('Error inserting cloned assessment:', insertError);
      return NextResponse.json(
        { error: insertError?.message || 'Không thể tạo bản sao đề khảo thí' },
        { status: 500 }
      );
    }

    // 4. Clone items and options
    if (sourceItems && sourceItems.length > 0) {
      for (const item of sourceItems) {
        const { id: oldItemId, assessment_id, item_options, created_at, ...itemData } = item;
        const { data: newItem, error: newItemError } = await db
          .from('assessment_items')
          .insert({
            ...itemData,
            assessment_id: newAssessment.id,
          })
          .select()
          .single();

        if (!newItemError && newItem && item_options && item_options.length > 0) {
          const newOptions = item_options.map((opt: any) => {
            const { id: oldOptId, item_id, ...optData } = opt;
            return {
              ...optData,
              item_id: newItem.id,
            };
          });

          await db.from('item_options').insert(newOptions);
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Đã sao chép đề khảo thí thành công',
        assessment: newAssessment,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
