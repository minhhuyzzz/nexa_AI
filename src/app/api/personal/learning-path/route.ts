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

const DOMAIN_STATION_TOTALS: Record<string, number> = {
  '01': 12,
  '02': 24,
  '03': 16,
  '04': 16,
  '05': 16,
  D1: 12,
  D2: 24,
  D3: 16,
  D4: 16,
  D5: 16,
};

let cachedLearningModules: any[] | null = null;
let cachedModulesTime = 0;

export async function GET(request: Request): Promise<NextResponse>;
export async function GET(): Promise<NextResponse>;
export async function GET(request?: Request): Promise<NextResponse> {
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

    // Optional query param / header from client storage for 1:1 synchronization
    let clientUnlockedDomain: string | null = null;
    if (request && typeof request.url === 'string') {
      try {
        const urlObj = new URL(request.url);
        clientUnlockedDomain = urlObj.searchParams.get('clientUnlockedDomain');
      } catch {}
    }

    // 2. Fetch parallel data for lightning-fast performance (<200ms)
    const analysisPromise = (async () => {
      try {
        const tbl = adminSupabase?.from?.('competency_analyses');
        if (tbl && typeof tbl.select === 'function') {
          return await tbl
            .select('id, submission_id, overall_level, radar_data, skill_gaps, strengths, weaknesses, pedagogical_feedback, learning_pathway, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
        }
      } catch {}
      return { data: null };
    })();

    const progressPromise = (async () => {
      try {
        const tbl = adminSupabase?.from?.('user_learning_progress');
        if (tbl && typeof tbl.select === 'function') {
          return await tbl
            .select('module_id, is_completed, completed_at, points_awarded')
            .eq('user_id', user.id);
        }
      } catch {}
      return { data: [] };
    })();

    const profilePromise = (async () => {
      try {
        const profTable = adminSupabase?.from?.('profiles');
        if (profTable && typeof profTable.select === 'function') {
          return await profTable
            .select('subscription_tier, role, admin_role')
            .eq('id', user.id)
            .maybeSingle();
        }
      } catch {}
      return { data: null };
    })();

    const snapshotPromise = (async () => {
      try {
        const snapTable = adminSupabase?.from?.('learner_competency_snapshots');
        if (snapTable && typeof snapTable.select === 'function') {
          return await snapTable
            .select('domain_scores, overall_score, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
        }
      } catch {}
      return { data: null };
    })();

    const rawModulesPromise = (async () => {
      try {
        const now = Date.now();
        if (process.env.NODE_ENV !== 'test' && cachedLearningModules && now - cachedModulesTime < 60_000) {
          return { data: cachedLearningModules };
        }
        const tbl = adminSupabase?.from?.('learning_modules');
        if (tbl && typeof tbl.select === 'function') {
          const res = await tbl
            .select(`
              *,
              assessments (
                id,
                title,
                passing_score,
                duration_minutes,
                point_reward,
                security_settings
              )
            `)
            .eq('is_published', true)
            .order('order_index', { ascending: true });
          if (res?.data && res.data.length > 0) {
            cachedLearningModules = res.data;
            cachedModulesTime = now;
          }
          return res;
        }
      } catch {}
      return { data: [] };
    })();

    const submissionsPromise = (async () => {
      try {
        const tbl = adminSupabase?.from?.('assessment_submissions');
        if (tbl && typeof tbl.select === 'function') {
          return await tbl
            .select('id, assessment_id, total_score, percentage, is_passed, status, submitted_at')
            .eq('user_id', user.id)
            .order('submitted_at', { ascending: false });
        }
      } catch {}
      return { data: [] };
    })();

    const [
      analysisRes,
      progressRes,
      profileRes,
      snapshotRes,
      rawModulesRes,
      submissionsRes,
    ] = await Promise.all([
      analysisPromise,
      progressPromise,
      profilePromise,
      snapshotPromise,
      rawModulesPromise,
      submissionsPromise,
    ]);

    const latestAnalysis = analysisRes?.data || null;
    const progressList = progressRes?.data || [];
    const profile = profileRes?.data || null;
    const latestSnapshot = snapshotRes?.data || null;
    const rawModules = rawModulesRes?.data || [];
    const userSubmissions = (submissionsRes?.data as any[]) || [];

    const isProUser =
      profile?.subscription_tier === 'PRO' ||
      profile?.subscription_tier === 'ENTERPRISE' ||
      profile?.role === 'ADMIN' ||
      Boolean(profile?.admin_role);

    // 3. Detect weakest domain & freemium unlocked status
    let unlockedFreeDomain: string | null = null;
    let weakestScore = 999;
    let domainScores: Record<string, number | null> | null = null;
    let hasTakenAssessment = userSubmissions.length > 0;

    if (latestSnapshot?.domain_scores) {
      domainScores = latestSnapshot.domain_scores as Record<string, number | null>;
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

    // Fast check radar_data from latestAnalysis if domain_scores was not in snapshot
    if (!domainScores && latestAnalysis?.radar_data && typeof latestAnalysis.radar_data === 'object') {
      const radar = latestAnalysis.radar_data as Record<string, any>;
      domainScores = {};
      ['01', '02', '03', '04', '05'].forEach((code) => {
        const num = parseInt(code, 10);
        const s = radar[code] ?? radar[`D${num}`] ?? radar[String(num)];
        if (s !== undefined && s !== null) {
          const numS = Number(s);
          domainScores![code] = numS;
          domainScores![`D${num}`] = numS;
          if (numS < weakestScore) {
            weakestScore = numS;
            unlockedFreeDomain = code;
          }
        }
      });
      if (unlockedFreeDomain) {
        hasTakenAssessment = true;
      }
    }

    // Check if learning pathway specifies target domain (AI recommendation alignment)
    if (latestAnalysis?.learning_pathway && Array.isArray(latestAnalysis.learning_pathway) && latestAnalysis.learning_pathway.length > 0) {
      const firstStep = latestAnalysis.learning_pathway[0];
      const targetStr = String(firstStep?.targetSkill || firstStep?.title || '');
      const match = targetStr.match(/(\d+)/);
      if (match) {
        const pathwayCode = match[1].padStart(2, '0');
        // If snapshot domain scores are tied for lowest (e.g. both 0), align with AI pathway
        if (domainScores && domainScores[pathwayCode] !== undefined && domainScores[pathwayCode] === weakestScore) {
          unlockedFreeDomain = pathwayCode;
        } else if (!unlockedFreeDomain) {
          unlockedFreeDomain = pathwayCode;
        }
      }
    }

    // Client explicitly saved choice alignment
    if (clientUnlockedDomain) {
      const normClient = normalizeDomainCode(clientUnlockedDomain);
      if (['01', '02', '03', '04', '05'].includes(normClient)) {
        unlockedFreeDomain = normClient;
      }
    }

    // Fallback ONLY IF user has taken assessment but domain scores are still missing
    if (hasTakenAssessment && !domainScores) {
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
            if (!unlockedFreeDomain) {
              unlockedFreeDomain = lowestCode;
            }
          }
        }
      } catch (sumErr) {
        console.warn('Fallback DomainAssessmentSummaryService error:', sumErr);
      }
    }

    if (unlockedFreeDomain) {
      unlockedFreeDomain = normalizeDomainCode(unlockedFreeDomain);
    }

    // 4. Map user submissions in memory (zero extra database network queries)
    const recentSubmissionsMap: Record<string, any> = {};
    (userSubmissions || []).forEach((sub: any) => {
      if (sub.assessment_id && !recentSubmissionsMap[sub.assessment_id]) {
        recentSubmissionsMap[sub.assessment_id] = sub;
      }
    });

    const progressMap = new Map((progressList || []).map((p: any) => [p.module_id, p]));

    const modules = (rawModules || []).map((m: any) => {
      const match = String(m.domain_code || '').match(/(\d+)/);
      const rawDomain = match ? match[1].padStart(2, '0') : '01';
      const isDomainUnlocked = isProUser || (unlockedFreeDomain !== null && rawDomain === unlockedFreeDomain);
      const prog = progressMap.get(m.id);
      const lastSub = m.assessment_id ? recentSubmissionsMap[m.assessment_id] : null;

      const cooldownMinutes = typeof (m.assessments?.security_settings as any)?.cooldownMinutes === 'number'
        ? Number((m.assessments?.security_settings as any).cooldownMinutes)
        : 15;

      let cooldownUntil: string | null = null;
      let isOnCooldown = false;
      if (cooldownMinutes > 0 && lastSub && !lastSub.is_passed && lastSub.submitted_at) {
        const lastTime = new Date(lastSub.submitted_at).getTime();
        const cooldownMs = cooldownMinutes * 60 * 1000;
        const diff = Date.now() - lastTime;
        if (diff < cooldownMs) {
          isOnCooldown = true;
          cooldownUntil = new Date(lastTime + cooldownMs).toISOString();
        }
      }

      return {
        ...m,
        domain_code: rawDomain,
        is_locked: !isDomainUnlocked,
        is_completed: Boolean(prog?.is_completed || lastSub?.is_passed),
        last_score: lastSub?.total_score ?? null,
        last_percentage: lastSub?.percentage ?? null,
        is_on_cooldown: isOnCooldown,
        cooldown_until: cooldownUntil,
        assessment: m.assessments || null,
      };
    });

    // 5. Compute track learning progress for all 5 domains (stations completed / total stations)
    const domainProgress: Record<string, { completed: number; total: number; percent: number }> = {};
    ['01', '02', '03', '04', '05'].forEach((code) => {
      const num = parseInt(code, 10);
      const dKey = `D${num}`;
      const totalStations = DOMAIN_STATION_TOTALS[code] || 16;
      const completedModules = modules.filter((m: any) => m.domain_code === code && m.is_completed).length;
      const percent = Math.min(100, Math.round((completedModules / totalStations) * 100));

      const info = {
        completed: completedModules,
        total: totalStations,
        percent,
      };
      domainProgress[code] = info;
      domainProgress[dKey] = info;
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
      domainProgress,
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
