import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const checkAnswerSchema = z.object({
  moduleId: z.string().uuid('Mã học phần không hợp lệ'),
  itemId: z.string().uuid('Mã câu hỏi không hợp lệ'),
  optionId: z.string().uuid('Mã phương án không hợp lệ'),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // 1. Authenticate candidate
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Yêu cầu đăng nhập để kiểm tra câu trả lời' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = checkAnswerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const { itemId, optionId } = parsed.data;

    // 2. Fetch options for the item
    const { data: options, error: optionsError } = await adminSupabase
      .from('item_options')
      .select('id, content, is_correct, explanation')
      .eq('item_id', itemId);

    if (optionsError || !options || options.length === 0) {
      return NextResponse.json(
        { error: 'Không tìm thấy phương án của câu hỏi này' },
        { status: 404 }
      );
    }

    const chosenOption = options.find((opt) => opt.id === optionId);
    const correctOption = options.find((opt) => opt.is_correct === true);

    const isCorrect = Boolean(chosenOption && chosenOption.is_correct);
    const explanation =
      chosenOption?.explanation ||
      correctOption?.explanation ||
      (isCorrect
        ? 'Phương án hoàn toàn chính xác theo chuẩn năng lực số.'
        : 'Phương án chưa đáp ứng đúng tiêu chuẩn kỹ năng số của câu hỏi.');

    return NextResponse.json({
      success: true,
      isCorrect,
      correctOptionId: correctOption?.id || null,
      explanation,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
