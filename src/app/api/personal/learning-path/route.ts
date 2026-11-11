import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { DomainAssessmentSummaryService } from '@/features/competency/services/domain-assessment-summary.service';

export const dynamic = 'force-dynamic';

const updateStepSchema = z.object({
  analysisId: z.string().uuid('Mã phân tích (analysisId) không hợp lệ'),
  stepNumber: z.number().int().min(1).max(20),
  completed: z.boolean().default(true),
});

interface PathwayStepItem {
  stepNumber: number;
  title: string;
  targetSkill?: string;
  durationHours?: number | string;
  duration?: string;
  objective: string;
  actionText?: string;
  moduleId?: string;
  is_completed?: boolean;
  completed_at?: string | null;
  [key: string]: unknown;
}

function normalizeDomainCode(code: string | null | undefined): string {
  if (!code) return '01';
  const match = String(code).match(/(\d+)/);
  return match ? match[1].padStart(2, '0') : '01';
}

export async function GET() {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    // 2. Fetch latest AI analysis with 4-step pathway
    const { data: latestAnalysis } = await adminSupabase
      .from('competency_analyses')
      .select('id, submission_id, overall_level, radar_data, skill_gaps, strengths, weaknesses, pedagogical_feedback, learning_pathway, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // 3. Fetch module progress
    const { data: progressList } = await adminSupabase
      .from('user_learning_progress')
      .select('module_id, is_completed, completed_at, points_awarded')
      .eq('user_id', user.id);

    // 4. Fetch user profile for subscription plan / role
    let isProUser = false;
    try {
      const profTable = adminSupabase?.from?.('profiles');
      if (profTable && typeof profTable.select === 'function') {
        const { data: profile } = await profTable
          .select('subscription_tier, role, admin_role')
          .eq('id', user.id)
          .maybeSingle();

        isProUser =
          profile?.subscription_tier === 'PRO' ||
          profile?.subscription_tier === 'ENTERPRISE' ||
          profile?.role === 'ADMIN' ||
          Boolean(profile?.admin_role);
      }
    } catch {
      // Graceful fallback for test mocks
    }

    // 5. Fetch latest competency snapshot to detect weakest domain
    let unlockedFreeDomain: string | null = null;
    let weakestScore = 999;
    let domainScores: Record<string, number | null> | null = null;
    let latestSnapshot: any = null;
    let hasTakenAssessment = false;

    try {
      const snapTable = adminSupabase?.from?.('learner_competency_snapshots');
      if (snapTable && typeof snapTable.select === 'function') {
        const { data } = await snapTable
          .select('domain_scores, overall_score, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        latestSnapshot = data;
        if (data?.domain_scores) {
          domainScores = data.domain_scores as Record<string, number | null>;
          ['01', '02', '03', '04', '05'].forEach((code) => {
            const numKey = parseInt(code, 10);
            const score = domainScores![code] ?? domainScores![`D${numKey}`] ?? domainScores![String(numKey)];
            if (score !== null && score !== undefined && score < weakestScore) {
              weakestScore = score;
              unlockedFreeDomain = code;
            }
          });
          if (unlockedFreeDomain) {
            hasTakenAssessment = true;
          }
        }
      }
    } catch {
      // Graceful fallback for test mocks
    }

    // Fallback: If snapshot is missing or unreadable due to RLS, compute from assessment_submissions
    if (!hasTakenAssessment) {
      try {
        const queryClient = (supabase && typeof supabase.from === 'function') ? supabase : adminSupabase;
        const testSelect = queryClient?.from?.('assessment_submissions');
        if (testSelect && typeof testSelect.select === 'function') {
          const summary = await DomainAssessmentSummaryService.getUserCompetencySummary(queryClient, user.id);
          if (summary.hasTakenAssessment) {
            hasTakenAssessment = true;
            domainScores = domainScores || {};
            let lowest = 999;
            let lowestCode = '01';
            const diagnosticSource = summary.baselineRadarData || summary.radarData;
            diagnosticSource.forEach((d) => {
              const norm = normalizeDomainCode(d.code);
              domainScores![norm] = d.score;
              domainScores![d.code] = d.score;
              if (d.score !== null && d.score < lowest) {
                lowest = d.score;
                lowestCode = norm;
              }
            });
            unlockedFreeDomain = lowestCode;
          }
        }
      } catch (sumErr) {
        console.warn('Fallback DomainAssessmentSummaryService error:', sumErr);
      }
    }

    if (unlockedFreeDomain) {
      unlockedFreeDomain = normalizeDomainCode(unlockedFreeDomain);
    }

    // 6. Fetch published modules and map freemium lock state
    const { data: rawModules } = await adminSupabase
      .from('learning_modules')
      .select('*')
      .eq('is_published', true)
      .order('order_index', { ascending: true });

    const modules = (rawModules || []).map((m: any) => {
      const match = String(m.domain_code || '').match(/(\d+)/);
      const rawDomain = match ? match[1].padStart(2, '0') : '01';
      const isDomainUnlocked = isProUser || (unlockedFreeDomain !== null && rawDomain === unlockedFreeDomain);
      return {
        ...m,
        domain_code: rawDomain,
        is_locked: !isDomainUnlocked,
      };
    });

    return NextResponse.json({
      success: true,
      analysis: latestAnalysis || null,
      progress: progressList || [],
      modules,
      unlockedFreeDomain: hasTakenAssessment ? unlockedFreeDomain : null,
      isProUser,
      domainScores,
      hasTakenAssessment,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 });
    }

    const body = await request.json();
    const validated = updateStepSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const { analysisId, stepNumber, completed } = validated.data;

    // 2. Load the target analysis record
    const { data: analysis, error: fetchErr } = await adminSupabase
      .from('competency_analyses')
      .select('id, user_id, learning_pathway')
      .eq('id', analysisId)
      .maybeSingle();

    if (fetchErr || !analysis) {
      return NextResponse.json({ error: 'Không tìm thấy lộ trình học tập tương ứng' }, { status: 404 });
    }

    if (analysis.user_id !== user.id) {
      return NextResponse.json({ error: 'Bạn không có quyền chỉnh sửa lộ trình này' }, { status: 403 });
    }

    // 3. Update the matching step in learning_pathway JSON
    const pathway = (analysis.learning_pathway as PathwayStepItem[]) || [];
    let updated = false;

    const newPathway = pathway.map((step) => {
      if (step.stepNumber === stepNumber) {
        updated = true;
        return {
          ...step,
          is_completed: completed,
          completed_at: completed ? new Date().toISOString() : null,
        };
      }
      return step;
    });

    if (!updated) {
      // Step number might not exist in array yet, add or adjust
      return NextResponse.json({ error: `Không tìm thấy bước số ${stepNumber} trong lộ trình` }, { status: 404 });
    }

    const { error: updateErr } = await adminSupabase
      .from('competency_analyses')
      .update({
        learning_pathway: newPathway,
      })
      .eq('id', analysisId);

    if (updateErr) {
      return NextResponse.json({ error: 'Không thể cập nhật tiến độ lộ trình' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: completed ? 'Đã hoàn thành bước học' : 'Đã bỏ đánh dấu hoàn thành',
      learningPathway: newPathway,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
