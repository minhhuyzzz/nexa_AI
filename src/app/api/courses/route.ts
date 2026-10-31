import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain'); // e.g. 'D1', 'D2'

    const supabase = await createClient();

    let query = supabase
      .from('course_catalog')
      .select('id, title, provider, official_url, domain_codes, level, language, format, duration, price_type, review_status, short_description, learning_outcomes')
      .eq('review_status', 'APPROVED');

    if (domain) {
      query = query.contains('domain_codes', [domain]);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      source: 'database',
      courses: data || [],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi tải danh mục khóa học';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
