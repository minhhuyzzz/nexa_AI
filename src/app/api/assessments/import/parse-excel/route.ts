import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parseMCQExcelBuffer } from '@/features/assessments/utils/excel-mcq-helper';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập để sử dụng tính năng này' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Vui lòng chọn tệp Excel (.xlsx) để nạp' }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      return NextResponse.json(
        { error: 'Định dạng không được hỗ trợ. Vui lòng tải lên tệp Excel có đuôi .xlsx' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const result = await parseMCQExcelBuffer(arrayBuffer);

    if (result.questions.length === 0) {
      return NextResponse.json(
        {
          error: result.errors[0] || 'Không tìm thấy câu hỏi trắc nghiệm hợp lệ nào trong tệp',
          errors: result.errors,
          totalRows: result.totalRows,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      questions: result.questions,
      errors: result.errors,
      totalRows: result.totalRows,
      validCount: result.questions.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Lỗi khi đọc tệp Excel';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
