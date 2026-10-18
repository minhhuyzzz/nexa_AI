import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // 1. Fetch active default framework
    const { data: framework, error: fwError } = await supabase
      .from('assessment_frameworks')
      .select('id, code, title, version, description, status')
      .eq('status', 'ACTIVE')
      .eq('is_default', true)
      .single();

    if (fwError || !framework) {
      return NextResponse.json(
        { error: 'Không tìm thấy khung năng lực chuẩn kích hoạt' },
        { status: 404 }
      );
    }

    // 2. Fetch competency domains with their competencies
    const { data: domains, error: domError } = await supabase
      .from('competency_domains')
      .select(`
        id,
        domain_index,
        code,
        title,
        description,
        weight_percent,
        competencies (
          id,
          skill_code,
          title,
          description,
          behavioral_indicators,
          target_level,
          display_order
        )
      `)
      .eq('framework_id', framework.id)
      .order('domain_index', { ascending: true });

    if (domError) {
      return NextResponse.json(
        { error: 'Lỗi khi tải miền năng lực và kỹ năng', details: domError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      framework,
      domains: domains || [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Lỗi máy chủ nội bộ';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
