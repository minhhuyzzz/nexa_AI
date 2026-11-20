import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requirePlatformAdmin } from '@/lib/auth/admin-guard';
import { recordAdminAudit } from '@/lib/audit/admin-audit.service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const bulkActionSchema = z.object({
  action: z.enum(['DELETE', 'PUBLISH', 'UNPUBLISH', 'SET_VIP']),
  ids: z.array(z.string().uuid()).min(1, 'Cần chọn ít nhất 1 bài khảo thí'),
  is_vip: z.boolean().optional(),
});

export async function POST(req: Request) {
  try {
    const auth = await requirePlatformAdmin();
    if (!auth.isAuthorized) {
      return auth.errorResponse!;
    }

    const body = await req.json();
    const parseResult = bulkActionSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { action, ids, is_vip } = parseResult.data;
    const adminSupabase = createAdminClient();

    if (action === 'DELETE') {
      let softDeletedCount = 0;
      let hardDeletedCount = 0;

      for (const id of ids) {
        // Kiểm tra bài khảo thí và lịch sử nộp bài
        const { data: existing } = await adminSupabase
          .from('assessments')
          .select('id, title, security_settings')
          .eq('id', id)
          .maybeSingle();

        if (!existing) continue;

        const { count: submissionCount } = await adminSupabase
          .from('assessment_submissions')
          .select('*', { count: 'exact', head: true })
          .eq('assessment_id', id);

        if (submissionCount && submissionCount > 0) {
          const currentSecurity =
            existing.security_settings && typeof existing.security_settings === 'object'
              ? existing.security_settings
              : {};

          await adminSupabase
            .from('assessments')
            .update({
              is_published: false,
              security_settings: {
                ...currentSecurity,
                is_archived: true,
                archived_at: new Date().toISOString(),
                archived_by: auth.user!.id,
              },
              updated_at: new Date().toISOString(),
            })
            .eq('id', id);

          softDeletedCount++;
        } else {
          await adminSupabase.from('assessments').delete().eq('id', id);
          hardDeletedCount++;
        }
      }

      await recordAdminAudit({
        actorId: auth.user!.id,
        action: 'BULK_DELETE',
        targetType: 'ASSESSMENT',
        details: {
          total: ids.length,
          hardDeletedCount,
          softDeletedCount,
          targetIds: ids,
        },
      });

      return NextResponse.json({
        success: true,
        count: ids.length,
        message: `Đã xóa thành công ${ids.length} bài khảo thí (${hardDeletedCount} xóa hoàn toàn, ${softDeletedCount} lưu trữ an toàn do có bài làm).`,
      });
    }

    if (action === 'PUBLISH' || action === 'UNPUBLISH') {
      const isPublished = action === 'PUBLISH';
      const { error } = await adminSupabase
        .from('assessments')
        .update({
          is_published: isPublished,
          updated_at: new Date().toISOString(),
        })
        .in('id', ids);

      if (error) {
        console.error('Lỗi cập nhật trạng thái phát hành hàng loạt:', error);
        return NextResponse.json({ error: 'Không thể cập nhật trạng thái hàng loạt' }, { status: 500 });
      }

      await recordAdminAudit({
        actorId: auth.user!.id,
        action: 'BULK_UPDATE_STATUS',
        targetType: 'ASSESSMENT',
        details: {
          is_published: isPublished,
          targetIds: ids,
        },
      });

      return NextResponse.json({
        success: true,
        count: ids.length,
        message: isPublished
          ? `Đã phát hành thành công ${ids.length} bài khảo thí!`
          : `Đã chuyển ${ids.length} bài khảo thí về trạng thái Nội bộ!`,
      });
    }

    if (action === 'SET_VIP') {
      const isVip = Boolean(is_vip);
      const accessTier = isVip ? 'VIP' : 'FREE';

      const { error } = await adminSupabase
        .from('assessments')
        .update({
          is_vip: isVip,
          access_tier: accessTier,
          updated_at: new Date().toISOString(),
        })
        .in('id', ids);

      if (error) {
        console.error('Lỗi cập nhật phân hạng hàng loạt:', error);
        return NextResponse.json({ error: 'Không thể cập nhật phân hạng hàng loạt' }, { status: 500 });
      }

      await recordAdminAudit({
        actorId: auth.user!.id,
        action: 'BULK_UPDATE_TIER',
        targetType: 'ASSESSMENT',
        details: {
          is_vip: isVip,
          access_tier: accessTier,
          targetIds: ids,
        },
      });

      return NextResponse.json({
        success: true,
        count: ids.length,
        message: isVip
          ? `Đã chuyển ${ids.length} bài khảo thí sang phân hạng Nâng cấp!`
          : `Đã chuyển ${ids.length} bài khảo thí sang phân hạng Miễn phí!`,
      });
    }

    return NextResponse.json({ error: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
