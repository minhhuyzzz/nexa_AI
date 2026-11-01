import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { requirePlatformAdmin } from '@/lib/auth/admin-guard';
import { recordAdminAudit } from '@/lib/audit/admin-audit.service';

export const dynamic = 'force-dynamic';

const broadcastSchema = z.object({
  title: z.string().trim().min(3, 'Tiêu đề thông báo tối thiểu 3 ký tự').max(200),
  message: z.string().trim().min(5, 'Nội dung thông báo tối thiểu 5 ký tự'),
  category: z.enum(['SYSTEM', 'SECURITY', 'CAMPAIGN', 'ASSIGNMENT', 'GRADE']).default('SYSTEM'),
  target: z.enum(['ALL', 'PERSONAL', 'ORG']).default('ALL'),
  linkUrl: z.string().url().optional().or(z.literal('')),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePlatformAdmin('MANAGE_SETTINGS');
    if (!auth.isAuthorized) {
      return auth.errorResponse!;
    }

    const body = await request.json();
    const parsed = broadcastSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { title, message, category, target, linkUrl } = parsed.data;
    const adminSupabase = createAdminClient();

    // Determine target users
    let targetUserIds: string[] = [];

    if (target === 'ORG') {
      // Users belonging to active organizations
      const { data: orgMembers, error: orgErr } = await adminSupabase
        .from('user_organizations')
        .select('user_id')
        .eq('status', 'ACTIVE');

      if (orgErr) {
        return NextResponse.json({ error: 'Lỗi truy vấn thành viên tổ chức' }, { status: 500 });
      }
      targetUserIds = Array.from(new Set(orgMembers?.map((m) => m.user_id) || []));
    } else {
      // Query profiles for target users
      const { data: profiles, error: profErr } = await adminSupabase
        .from('profiles')
        .select('id');

      if (profErr) {
        return NextResponse.json({ error: 'Lỗi truy vấn hồ sơ người dùng' }, { status: 500 });
      }
      targetUserIds = profiles?.map((p) => p.id) || [];
    }

    if (targetUserIds.length === 0) {
      return NextResponse.json({
        success: true,
        sentCount: 0,
        message: 'Không tìm thấy người dùng phù hợp với tiêu chí phát thông báo.',
      });
    }

    // Insert notifications in batches of 200
    const batchSize = 200;
    let totalInserted = 0;

    for (let i = 0; i < targetUserIds.length; i += batchSize) {
      const batchIds = targetUserIds.slice(i, i + batchSize);
      const notifications = batchIds.map((userId) => ({
        user_id: userId,
        title,
        message,
        category,
        link_url: linkUrl || null,
        is_read: false,
      }));

      const { error: insertErr } = await adminSupabase
        .from('user_notifications')
        .insert(notifications);

      if (insertErr) {
        console.error('Batch notification insert error:', insertErr);
      } else {
        totalInserted += batchIds.length;
      }
    }

    await recordAdminAudit({
      actorId: auth.user!.id,
      action: 'BROADCAST_NOTIFICATION',
      targetType: 'SYSTEM',
      targetId: 'GLOBAL',
      newValues: {
        title,
        category,
        target,
        recipientsCount: totalInserted,
      },
    });

    return NextResponse.json({
      success: true,
      sentCount: totalInserted,
      message: `Đã phát thông báo thành công tới ${totalInserted} người dùng.`,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
