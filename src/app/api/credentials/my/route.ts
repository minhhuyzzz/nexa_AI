import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    // 2. Fetch issued credentials for this user
    const { data: credentials, error: credError } = await supabase
      .from('credentials')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_revoked', false)
      .order('issued_at', { ascending: false });

    if (credError) {
      console.error('Error fetching user credentials:', credError);
    }

    // 3. Fetch passed submissions to see if any need issuance
    const issuedSubmissionIds = (credentials || []).map((c) => c.submission_id);

    const { data: passedSubs } = await supabase
      .from('assessment_submissions')
      .select(`
        id,
        total_score,
        max_score,
        percentage,
        submitted_at,
        is_passed,
        assessments (
          id,
          title,
          passing_score
        )
      `)
      .eq('user_id', user.id)
      .eq('is_passed', true)
      .order('submitted_at', { ascending: false });

    const eligibleSubmissions = (passedSubs || [])
      .filter((sub) => !issuedSubmissionIds.includes(sub.id))
      .map((sub) => ({
        id: sub.id,
        total_score: Number(sub.total_score),
        max_score: Number(sub.max_score),
        percentage: Number(sub.percentage),
        submitted_at: sub.submitted_at,
        assessments: Array.isArray(sub.assessments) ? sub.assessments[0] : sub.assessments,
        hasCredential: false,
      }));

    return NextResponse.json({
      credentials: credentials || [],
      eligibleSubmissions,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
