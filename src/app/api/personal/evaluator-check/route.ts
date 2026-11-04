import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ canGrade: false });
    }

    // Check if user owns or evaluates at least one personal group (organization_id IS NULL)
    const { count, error } = await supabase
      .from('evaluator_classes')
      .select('id', { count: 'exact', head: true })
      .is('organization_id', null)
      .or(`evaluator_id.eq.${user.id},owner_user_id.eq.${user.id}`);

    if (error) {
      return NextResponse.json({ canGrade: false });
    }

    return NextResponse.json({ canGrade: Boolean(count && count > 0) });
  } catch {
    return NextResponse.json({ canGrade: false });
  }
}
