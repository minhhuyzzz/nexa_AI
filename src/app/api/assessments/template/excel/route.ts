import { NextResponse } from 'next/server';
import { buildMCQExcelTemplate } from '@/features/assessments/utils/excel-mcq-helper';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const buffer = await buildMCQExcelTemplate();

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="Mau_Cau_Hoi_Trac_Nghiem_NEXA.xlsx"',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Lỗi khi tạo tệp mẫu Excel';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
