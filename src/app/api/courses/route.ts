import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { FALLBACK_CURATED_COURSES } from '@/features/courses/data/curated-courses';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain'); // e.g. 'D1', 'D2'

    const supabase = await createClient();

    let query = supabase
      .from('course_catalog')
      .select('*')
      .eq('review_status', 'APPROVED');

    if (domain) {
      query = query.contains('domain_codes', [domain]);
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      // Fallback to in-memory curated catalog if table is not yet populated
      const filtered = domain
        ? FALLBACK_CURATED_COURSES.filter((c) => c.domain_codes.includes(domain))
        : FALLBACK_CURATED_COURSES;

      return NextResponse.json({
        success: true,
        source: 'fallback',
        courses: filtered,
      });
    }

    return NextResponse.json({
      success: true,
      source: 'database',
      courses: data,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi tải danh mục khóa học';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
