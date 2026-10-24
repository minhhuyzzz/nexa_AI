import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const organizationId = request.nextUrl.searchParams.get('organizationId');
    const adminSupabase = createAdminClient();

    let planCode = 'EVALUATOR_FREE';
    let maxMembers = 30;
    let includedCredits = 20;
    let currentMembers = 1;
    let currentClasses = 0;
    let currentCredits = 0;
    let totalCreditsUsed = 0;

    if (organizationId && organizationId !== 'personal') {
      // Fetch organization details
      const { data: org } = await adminSupabase
        .from('organizations')
        .select('id, name, plan_tier')
        .eq('id', organizationId)
        .single();

      if (org?.plan_tier) {
        planCode = org.plan_tier;
      }

      // Count active members in organization
      const { count: memberCount } = await adminSupabase
        .from('user_organizations')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('status', 'ACTIVE');

      currentMembers = memberCount || 1;

      // Count classes in organization
      const { count: classCount } = await adminSupabase
        .from('classes')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId);

      currentClasses = classCount || 0;
    } else {
      // Personal evaluator
      const { data: profile } = await adminSupabase
        .from('profiles')
        .select('plan_tier, credits')
        .eq('id', user.id)
        .single();

      if (profile?.plan_tier) {
        planCode = profile.plan_tier;
      }
      currentCredits = profile?.credits ?? 0;

      // Count classes owned by user
      const { count: classCount } = await adminSupabase
        .from('classes')
        .select('id', { count: 'exact', head: true })
        .eq('created_by', user.id);

      currentClasses = classCount || 0;
    }

    // Look up plan definition from database
    const { data: plan } = await adminSupabase
      .from('service_plans')
      .select('*')
      .eq('code', planCode)
      .maybeSingle();

    if (plan) {
      maxMembers = plan.max_members;
      includedCredits = plan.credits_included;
    }

    // Sum credits used from ai_usage_events
    const { data: usageEvents } = await adminSupabase
      .from('ai_usage_events')
      .select('prompt_tokens, completion_tokens')
      .eq('user_id', user.id);

    if (usageEvents && usageEvents.length > 0) {
      // Approximate 1 credit per 1000 tokens
      const totalTokens = usageEvents.reduce(
        (acc: number, ev: { prompt_tokens: number | null; completion_tokens: number | null }) =>
          acc + (ev.prompt_tokens || 0) + (ev.completion_tokens || 0),
        0
      );
      totalCreditsUsed = Math.ceil(totalTokens / 1000);
    }

    return NextResponse.json({
      success: true,
      quota: {
        planCode,
        planName: plan?.name || planCode,
        members: {
          current: currentMembers,
          max: maxMembers,
        },
        classes: {
          current: currentClasses,
          max: planCode.includes('FREE') ? 1 : planCode.includes('PLUS') ? 5 : 9999,
        },
        credits: {
          available: currentCredits,
          includedMonthly: includedCredits,
          estimatedUsed: totalCreditsUsed,
        },
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
