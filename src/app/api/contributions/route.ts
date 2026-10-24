import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { PointLedgerService } from '@/features/gamification/services/point-ledger.service';

const createContributionSchema = z.object({
  title: z.string().min(5, 'Tiêu đề tối thiểu 5 ký tự'),
  domain: z.string().min(1, 'Vui lòng chọn Miền năng lực'),
  questionType: z.enum(['PRACTICAL_FILE', 'SCENARIO', 'MCQ', 'DIGITAL_LINK']),
  difficulty: z.enum(['FOUNDATION', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).default('INTERMEDIATE'),
  prompt: z.string().min(10, 'Nội dung câu hỏi/tình huống tối thiểu 10 ký tự'),
  solutionNotes: z.string().optional().default(''),
  attachedFiles: z.array(z.any()).optional().default([]),
});

const reviewContributionSchema = z.object({
  id: z.string().uuid('ID đóng góp không hợp lệ'),
  status: z.enum(['APPROVED', 'NEEDS_REVISION', 'REJECTED']),
  adminFeedback: z.string().optional().default(''),
  pointsRewarded: z.number().int().min(0).default(50),
});

// GET: Fetch contributions (Admin sees all; Learner sees their own)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const adminSupabase = createAdminClient();
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'ADMIN';

    let query = adminSupabase
      .from('community_contributions')
      .select(`
        id,
        code,
        user_id,
        title,
        domain,
        question_type,
        difficulty,
        status,
        prompt,
        solution_notes,
        admin_feedback,
        points_rewarded,
        attached_files,
        created_at,
        reviewed_at,
        profiles ( email, nickname )
      `)
      .order('created_at', { ascending: false });

    // Non-admins can only see their own contributions
    if (!isAdmin) {
      query = query.eq('user_id', user.id);
    }

    const statusParam = request.nextUrl.searchParams.get('status');
    if (statusParam && statusParam !== 'all') {
      query = query.eq('status', statusParam.toUpperCase());
    }

    const { data: contributions, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      contributions: (contributions || []).map((c: any) => ({
        id: c.id,
        code: c.code,
        title: c.title,
        domain: c.domain,
        questionType: c.question_type,
        difficulty: c.difficulty,
        status: c.status.toLowerCase(),
        prompt: c.prompt,
        solutionNotes: c.solution_notes,
        adminFeedback: c.admin_feedback,
        pointsRewarded: c.points_rewarded,
        attachedFiles: c.attached_files || [],
        submittedAt: c.created_at,
        reviewedAt: c.reviewed_at,
        authorName: c.profiles?.nickname || c.profiles?.email || 'Người học',
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST: Learner submits a new community contribution
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const body = await request.json();
    const validation = createContributionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: validation.error.format() },
        { status: 400 }
      );
    }

    const { title, domain, questionType, difficulty, prompt, solutionNotes, attachedFiles } =
      validation.data;
    const adminSupabase = createAdminClient();

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const code = `CB-${randomSuffix}`;

    const { data: inserted, error: insertErr } = await adminSupabase
      .from('community_contributions')
      .insert({
        code,
        user_id: user.id,
        title,
        domain,
        question_type: questionType,
        difficulty,
        status: 'PENDING',
        prompt,
        solution_notes: solutionNotes,
        attached_files: attachedFiles,
      })
      .select('id, code, created_at')
      .single();

    if (insertErr || !inserted) {
      return NextResponse.json(
        { error: 'Lỗi lưu trữ hồ sơ đóng góp', details: insertErr?.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Đã gửi đề xuất đóng góp thành công lên hệ thống xét duyệt',
      contribution: inserted,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH: Admin reviews a contribution (Approve, Request Revision, Reject)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const adminSupabase = createAdminClient();
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Chỉ Quản trị viên mới có quyền thẩm định đề cộng đồng' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = reviewContributionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: validation.error.format() },
        { status: 400 }
      );
    }

    const { id, status, adminFeedback, pointsRewarded } = validation.data;

    // Get contribution record
    const { data: contrib, error: getErr } = await adminSupabase
      .from('community_contributions')
      .select('id, user_id, code, title, status')
      .eq('id', id)
      .single();

    if (getErr || !contrib) {
      return NextResponse.json({ error: 'Không tìm thấy hồ sơ đóng góp' }, { status: 404 });
    }

    // Update status
    const { error: updateErr } = await adminSupabase
      .from('community_contributions')
      .update({
        status,
        admin_feedback: adminFeedback,
        points_rewarded: status === 'APPROVED' ? pointsRewarded : 0,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      })
      .eq('id', id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // If approved, reward points to user via PointLedgerService
    if (status === 'APPROVED' && pointsRewarded > 0 && contrib.status !== 'APPROVED') {
      try {
        await PointLedgerService.grantPoints(adminSupabase, {
          userId: contrib.user_id,
          delta: pointsRewarded,
          eventType: 'STREAK_BONUS',
          sourceType: 'ADMIN',
          sourceId: contrib.id,
          idempotencyKey: `contrib_reward_${contrib.id}`,
          metadata: {
            reason: 'Phần thưởng duyệt đề xuất câu hỏi cộng đồng',
            code: contrib.code,
            title: contrib.title,
          },
        });
      } catch (e) {
        console.error('Failed to grant reward points for contribution', e);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Đã cập nhật trạng thái đóng góp thành: ${status}`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
