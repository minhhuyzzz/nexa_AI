import { SupabaseClient } from '@supabase/supabase-js';

export interface CanonicalDomain {
  domainIndex: number;
  code: string;
  name: string;
  description: string;
}

export const CANONICAL_DIGCOMP_DOMAINS: CanonicalDomain[] = [
  {
    domainIndex: 1,
    code: 'D1',
    name: 'Thông tin & Dữ liệu',
    description: 'Duyệt, tìm kiếm, lọc, đánh giá và quản lý dữ liệu, thông tin số',
  },
  {
    domainIndex: 2,
    code: 'D2',
    name: 'Giao tiếp & Hợp tác',
    description: 'Tương tác, chia sẻ thông tin, hợp tác và tham gia cộng đồng số an toàn',
  },
  {
    domainIndex: 3,
    code: 'D3',
    name: 'Sáng tạo Nội dung số',
    description: 'Phát triển, tích hợp, tái định dạng nội dung số và quản trị bản quyền',
  },
  {
    domainIndex: 4,
    code: 'D4',
    name: 'An toàn & Bảo mật',
    description: 'Bảo vệ thiết bị, dữ liệu cá nhân, quyền riêng tư và sức khỏe môi trường số',
  },
  {
    domainIndex: 5,
    code: 'D5',
    name: 'Giải quyết Vấn đề',
    description: 'Nhận diện nhu cầu công nghệ, xử lý sự cố kỹ thuật và tư duy số sáng tạo',
  },
];

export interface DomainScoreSummary {
  index: number;
  code: string;
  name: string;
  score: number | null; // null represents unassessed, 0 represents assessed with 0 score
  level: string;
  target: number;
  status: 'MASTERED' | 'PROFICIENT' | 'DEVELOPING' | 'INSUFFICIENT_DATA';
  hasData: boolean;
  evidenceCount: number;
  questionsCount: number;
}

export interface UserCompetencySummary {
  userId: string;
  hasTakenAssessment: boolean;
  totalAssessmentsCompleted: number;
  assessedDomainsCount: number;
  totalDomainsCount: number;
  overallScore: number | null;
  overallLevel: string;
  radarData: DomainScoreSummary[];
  baselineRadarData?: DomainScoreSummary[];
  gapDomainCodes: string[];
  latestSubmissionId: string | null;
  totalEvidenceCount: number;
}

interface ItemCompetencyDomainJoin {
  id?: string;
  points?: number | null;
  competencies?: {
    id?: string;
    skill_code?: string;
    competency_domains?: {
      id?: string;
      domain_index?: number | null;
      title?: string | null;
    } | null;
  } | null;
}

export class DomainAssessmentSummaryService {
  /**
   * Single source of truth for 5 DigComp domain scores across Personal Dashboard,
   * Competency Hub, and Learning Path.
   * Ensures domains without assessed items return null ("Chưa đánh giá") instead of 0%.
   */
  static async getUserCompetencySummary(
    supabase: SupabaseClient,
    userId: string
  ): Promise<UserCompetencySummary> {
    // 1. Fetch completed submissions for this learner
    const { data: submissions } = await supabase
      .from('assessment_submissions')
      .select('id, assessment_id, total_score, max_score, percentage, is_passed, submitted_at')
      .eq('user_id', userId)
      .in('status', ['SUBMITTED', 'EVALUATED'])
      .order('submitted_at', { ascending: false });

    const submissionList = submissions || [];
    const submissionIds = submissionList.map((s) => s.id);
    const hasTakenAssessment = submissionIds.length > 0;
    const latestSubmissionId = submissionList[0]?.id ?? null;

    // Identify baseline diagnostic assessments so that intake exam does NOT artificially inflate
    // the accumulated mastery radar on the main dashboard (per explicit product rule & user requirement).
    const uniqueAssessmentIds = Array.from(
      new Set(submissionList.map((s: any) => s.assessment_id).filter(Boolean))
    );
    const baselineAssessmentIdSet = new Set<string>();
    baselineAssessmentIdSet.add('a0000000-0000-0000-0000-000000000001');

    if (uniqueAssessmentIds.length > 0) {
      try {
        const { data: asmRecords } = await supabase
          .from('assessments')
          .select('id, title, is_system_baseline, system_code')
          .in('id', uniqueAssessmentIds);

        (asmRecords || []).forEach((asm: any) => {
          if (
            asm.is_system_baseline ||
            asm.system_code === 'BASELINE_DIGCOMP' ||
            asm.title?.toLowerCase().includes('đầu vào') ||
            asm.title?.toLowerCase().includes('khảo sát')
          ) {
            baselineAssessmentIdSet.add(asm.id);
          }
        });
      } catch {
        // Fallback gracefully
      }
    }

    const isBaselineSubmission = (s: any) => {
      if (!s.assessment_id) return false;
      return (
        baselineAssessmentIdSet.has(s.assessment_id) ||
        s.assessment_id === 'a0000000-0000-0000-0000-000000000001'
      );
    };

    const baselineSubmissions = submissionList.filter(isBaselineSubmission);
    const nonBaselineSubmissions = submissionList.filter((s) => !isBaselineSubmission(s));
    const nonBaselineSubmissionIds = nonBaselineSubmissions.map((s) => s.id);
    const baselineSubmissionIds = baselineSubmissions.map((s) => s.id);

    // Track baseline domain scores specifically for the baseline starting point (Layer 1 dashed line)
    const baselineDomainScores: Record<number, { earned: number; max: number }> = {
      1: { earned: 0, max: 0 },
      2: { earned: 0, max: 0 },
      3: { earned: 0, max: 0 },
      4: { earned: 0, max: 0 },
      5: { earned: 0, max: 0 },
    };

    if (baselineSubmissionIds.length > 0) {
      try {
        const { data: baselineAnswers } = await supabase
          .from('submission_answers')
          .select(`
            id,
            score_awarded,
            assessment_items (
              id,
              points,
              competencies (
                id,
                competency_domains (
                  domain_index
                )
              )
            )
          `)
          .in('submission_id', baselineSubmissionIds);

        if (baselineAnswers) {
          for (const ans of baselineAnswers) {
            if (ans.score_awarded === null || ans.score_awarded === undefined) continue;
            const item = ans.assessment_items as unknown as ItemCompetencyDomainJoin | null;
            const domainIndex = item?.competencies?.competency_domains?.domain_index ?? 0;
            const points = Number(item?.points || 1);
            const scoreAwarded = Number(ans.score_awarded);
            if (domainIndex >= 1 && domainIndex <= 5) {
              baselineDomainScores[domainIndex].earned += scoreAwarded;
              baselineDomainScores[domainIndex].max += points;
            }
          }
        }
      } catch {
        // Non-blocking
      }
    }

    // 2. Query direct competency evidence for accumulated mastery
    const { data: directEvidence } = await supabase
      .from('competency_evidence')
      .select(`
        id,
        score,
        weight,
        competencies (
          id,
          skill_code,
          competency_domains (
            domain_index
          )
        )
      `)
      .eq('user_id', userId);

    // Domain aggregators: index 1..5 for ACCUMULATED mastery (excluding baseline diagnostic exam)
    const domainAccumulators: Record<
      number,
      { earned: number; max: number; evidenceCount: number; questionsCount: number }
    > = {
      1: { earned: 0, max: 0, evidenceCount: 0, questionsCount: 0 },
      2: { earned: 0, max: 0, evidenceCount: 0, questionsCount: 0 },
      3: { earned: 0, max: 0, evidenceCount: 0, questionsCount: 0 },
      4: { earned: 0, max: 0, evidenceCount: 0, questionsCount: 0 },
      5: { earned: 0, max: 0, evidenceCount: 0, questionsCount: 0 },
    };

    let totalEvidenceCount = 0;

    // Process direct evidence first
    if (directEvidence && directEvidence.length > 0) {
      for (const ev of directEvidence) {
        // @ts-expect-error join typing
        const domainIndex = ev.competencies?.competency_domains?.domain_index;
        if (domainIndex && domainIndex >= 1 && domainIndex <= 5) {
          const w = Number(ev.weight) || 1.0;
          const s = Number(ev.score) || 0;
          domainAccumulators[domainIndex].earned += s * w;
          domainAccumulators[domainIndex].max += 100 * w;
          domainAccumulators[domainIndex].evidenceCount += 1;
          totalEvidenceCount += 1;
        }
      }
    }

    // Process post-learning course submissions ONLY (baseline diagnostic is decoupled from accumulated radar)
    if (nonBaselineSubmissionIds.length > 0) {
      const { data: answers } = await supabase
        .from('submission_answers')
        .select(`
          id,
          score_awarded,
          is_correct,
          assessment_items (
            id,
            points,
            competencies (
              id,
              skill_code,
              competency_domains (
                id,
                domain_index,
                title
              )
            )
          )
        `)
        .in('submission_id', nonBaselineSubmissionIds);

      if (answers) {
        for (const ans of answers) {
          // P0: Do not accumulate question if it is pending rubric grading (score_awarded is null/undefined)
          if (ans.score_awarded === null || ans.score_awarded === undefined) {
            continue;
          }

          const item = ans.assessment_items as unknown as ItemCompetencyDomainJoin | null;
          const domainIndex = item?.competencies?.competency_domains?.domain_index ?? 0;
          const points = Number(item?.points || 1);
          const scoreAwarded = Number(ans.score_awarded);

          if (domainIndex >= 1 && domainIndex <= 5) {
            domainAccumulators[domainIndex].earned += scoreAwarded;
            domainAccumulators[domainIndex].max += points;
            domainAccumulators[domainIndex].questionsCount += 1;
          }
        }
      }
    }

    // 3. Query baseline snapshot for comparative progression (Layer 1 of Radar)
    let baselineRadarData: DomainScoreSummary[] | undefined = undefined;
    try {
      const snapTable = supabase.from('learner_competency_snapshots');
      if (snapTable && typeof snapTable.select === 'function') {
        const { data: baseSnap } = await snapTable
          .select('domain_scores, overall_score, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (baseSnap && baseSnap.domain_scores) {
          const bScores = baseSnap.domain_scores as Record<string, number | null>;
          baselineRadarData = CANONICAL_DIGCOMP_DOMAINS.map((domain) => {
            const raw = bScores[domain.code] ?? bScores[`0${domain.domainIndex}`] ?? bScores[String(domain.domainIndex)];
            const bScore = raw !== null && raw !== undefined ? Number(raw) : null;
            return {
              index: domain.domainIndex,
              code: domain.code,
              name: domain.name,
              score: bScore,
              level: bScore !== null ? (bScore >= 70 ? 'Đạt chuẩn' : 'Khởi đầu') : 'Chưa đánh giá',
              target: 70,
              status: bScore !== null ? (bScore >= 70 ? 'PROFICIENT' : 'DEVELOPING') : 'INSUFFICIENT_DATA',
              hasData: bScore !== null,
              evidenceCount: 1,
              questionsCount: 5,
            };
          });
        }
      }
    } catch {
      // Graceful fallback
    }

    // Fallback compute baselineRadarData directly from baseline answers if snapshot was missing
    if (!baselineRadarData && baselineSubmissions.length > 0) {
      baselineRadarData = CANONICAL_DIGCOMP_DOMAINS.map((domain) => {
        const b = baselineDomainScores[domain.domainIndex];
        const bScore = b && b.max > 0 ? Math.round((b.earned / b.max) * 100) : null;
        return {
          index: domain.domainIndex,
          code: domain.code,
          name: domain.name,
          score: bScore,
          level: bScore !== null ? (bScore >= 70 ? 'Đạt chuẩn' : 'Khởi đầu') : 'Chưa đánh giá',
          target: 70,
          status: bScore !== null ? (bScore >= 70 ? 'PROFICIENT' : 'DEVELOPING') : 'INSUFFICIENT_DATA',
          hasData: bScore !== null,
          evidenceCount: 1,
          questionsCount: 5,
        };
      });
    }

    // 4. Query completed modules for progressive pathway mastery (50% pillar)
    const pathwayCompletedByDomain: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    try {
      const progTable = supabase.from('user_learning_progress');
      if (progTable && typeof progTable.select === 'function') {
        const { data: progressItems } = await progTable
          .select('module_id, is_completed, learning_modules(domain_code)')
          .eq('user_id', userId)
          .eq('is_completed', true);

        (progressItems || []).forEach((item: any) => {
          const codeStr = item.learning_modules?.domain_code;
          if (codeStr) {
            const match = String(codeStr).match(/(\d+)/);
            const dIdx = match ? parseInt(match[1], 10) : 1;
            if (dIdx >= 1 && dIdx <= 5) {
              pathwayCompletedByDomain[dIdx] = (pathwayCompletedByDomain[dIdx] || 0) + 1;
            }
          }
        });
      }
    } catch {
      // Graceful fallback
    }

    // 5. Compute progressive domain summary scores
    let assessedScoreSum = 0;
    let assessedDomainsCount = 0;
    const gapDomainCodes: string[] = [];

    // Gap domain codes are extracted from baseline diagnostic (or accumulated deficits)
    if (baselineRadarData) {
      baselineRadarData.forEach((d) => {
        if (d.score !== null && d.score < 70) {
          gapDomainCodes.push(d.code);
        }
      });
    }

    const radarData: DomainScoreSummary[] = CANONICAL_DIGCOMP_DOMAINS.map((domain) => {
      const acc = domainAccumulators[domain.domainIndex];
      const completedPathwayModules = pathwayCompletedByDomain[domain.domainIndex] || 0;
      const hasCourseAssessments = acc.max > 0;

      let score: number | null = null;
      let status: DomainScoreSummary['status'] = 'INSUFFICIENT_DATA';
      let level = 'Chưa đánh giá';
      let hasData = false;

      if (completedPathwayModules > 0 || hasCourseAssessments) {
        hasData = true;
        if (completedPathwayModules > 0 && hasCourseAssessments) {
          // Hybrid Model: 50% Pathway progress + 50% Assessment verification
          const pathwayScore = Math.min(50, Math.round((completedPathwayModules / 4) * 50));
          const rawCourseScore = Math.min(100, Math.max(0, Math.round((acc.earned / acc.max) * 100)));
          const assessScore = Math.round(rawCourseScore * 0.5);
          score = Math.min(100, pathwayScore + assessScore);
        } else if (completedPathwayModules > 0) {
          // Pathway progression only: 4 tiers (25%, 50%, 75%, 100%)
          score = Math.min(100, Math.round((completedPathwayModules / 4) * 100));
        } else {
          // Specialized post-learning course assessment only
          score = Math.min(100, Math.max(0, Math.round((acc.earned / acc.max) * 100)));
        }

        assessedScoreSum += score;
        assessedDomainsCount += 1;

        if (score >= 85) {
          status = 'MASTERED';
          level = 'Thành thạo';
        } else if (score >= 70) {
          status = 'PROFICIENT';
          level = 'Đạt chuẩn';
        } else if (score > 0) {
          status = 'DEVELOPING';
          level = 'Đang bồi dưỡng';
        } else {
          status = 'DEVELOPING';
          level = 'Khởi đầu';
        }
      } else if (hasTakenAssessment) {
        // Learner has completed intake diagnostic baseline exam.
        // Profile is established, but accumulated mastery for this domain starts cleanly at 0% (Khởi đầu).
        // Intake diagnostic does NOT count as accumulated mastery on the main dashboard radar.
        hasData = true;
        score = 0;
        status = 'DEVELOPING';
        level = 'Khởi đầu';
        assessedScoreSum += 0;
        assessedDomainsCount += 1;
      }

      return {
        index: domain.domainIndex,
        code: domain.code,
        name: domain.name,
        score,
        level,
        target: 70,
        status,
        hasData,
        evidenceCount: acc.evidenceCount,
        questionsCount: acc.questionsCount,
      };
    });

    // 6. Overall score is the honest average of assessed domains only
    const overallScore = assessedDomainsCount > 0
      ? Math.round(assessedScoreSum / assessedDomainsCount)
      : null;

    let overallLevel = 'Chưa có đánh giá';
    if (overallScore !== null) {
      if (overallScore >= 85) overallLevel = 'Thành thạo';
      else if (overallScore >= 70) overallLevel = 'Đạt chuẩn';
      else if (overallScore > 0) overallLevel = 'Đang bồi dưỡng';
      else overallLevel = 'Khởi đầu';
    }

    // 7. Số bài thi hoàn thành chỉ tính các bài nộp hợp lệ đạt chuẩn quy định (is_passed = true hoặc điểm >= 70%)
    const passedSubmissions = submissionList.filter((s: any) => {
      if (s.is_passed === true) return true;
      if (s.percentage !== null && s.percentage !== undefined) {
        return Number(s.percentage) >= 70;
      }
      if (s.max_score && Number(s.max_score) > 0 && s.total_score !== null) {
        return Math.round((Number(s.total_score) / Number(s.max_score)) * 100) >= 70;
      }
      return false;
    });

    const uniquePassedAssessmentIds = new Set(
      passedSubmissions.map((s: any) => s.assessment_id).filter(Boolean)
    );
    const totalAssessmentsCompleted = uniquePassedAssessmentIds.size > 0
      ? uniquePassedAssessmentIds.size
      : passedSubmissions.length;

    return {
      userId,
      hasTakenAssessment,
      totalAssessmentsCompleted,
      assessedDomainsCount: radarData.filter((d) => (d.score ?? 0) >= 70).length,
      totalDomainsCount: 5,
      overallScore,
      overallLevel,
      radarData,
      baselineRadarData,
      gapDomainCodes,
      latestSubmissionId,
      totalEvidenceCount,
    };
  }
}
