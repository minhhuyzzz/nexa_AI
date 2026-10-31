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
      .select('id, total_score, max_score, percentage, is_passed, submitted_at')
      .eq('user_id', userId)
      .in('status', ['SUBMITTED', 'EVALUATED'])
      .order('submitted_at', { ascending: false });

    const submissionList = submissions || [];
    const submissionIds = submissionList.map((s) => s.id);
    const hasTakenAssessment = submissionIds.length > 0;
    const latestSubmissionId = submissionList[0]?.id ?? null;

    // 2. Query direct competency evidence
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

    // Domain aggregators: index 1..5
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

    // Process submission answers for question-level mapping
    if (submissionIds.length > 0) {
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
        .in('submission_id', submissionIds);

      if (answers) {
        for (const ans of answers) {
          const item = ans.assessment_items as unknown as ItemCompetencyDomainJoin | null;
          const domainIndex = item?.competencies?.competency_domains?.domain_index ?? 0;
          const points = Number(item?.points || 1);
          const scoreAwarded = Number(ans.score_awarded || 0);

          if (domainIndex >= 1 && domainIndex <= 5) {
            domainAccumulators[domainIndex].earned += scoreAwarded;
            domainAccumulators[domainIndex].max += points;
            domainAccumulators[domainIndex].questionsCount += 1;
          }
        }
      }
    }

    // 3. Compute final domain summary scores
    let assessedScoreSum = 0;
    let assessedDomainsCount = 0;
    const gapDomainCodes: string[] = [];

    const radarData: DomainScoreSummary[] = CANONICAL_DIGCOMP_DOMAINS.map((domain) => {
      const acc = domainAccumulators[domain.domainIndex];
      const hasData = acc.max > 0;
      let score: number | null = null;
      let status: DomainScoreSummary['status'] = 'INSUFFICIENT_DATA';
      let level = 'Chưa đánh giá';

      if (hasData) {
        score = Math.min(100, Math.max(0, Math.round((acc.earned / acc.max) * 100)));
        assessedScoreSum += score;
        assessedDomainsCount += 1;

        if (score < 60) {
          gapDomainCodes.push(domain.code);
        }

        if (score >= 85) {
          status = 'MASTERED';
          level = 'Level 4: Rất nâng cao';
        } else if (score >= 70) {
          status = 'PROFICIENT';
          level = 'Level 3: Nâng cao (Đạt chuẩn)';
        } else if (score >= 55) {
          status = 'DEVELOPING';
          level = 'Level 2: Trung cấp';
        } else {
          status = 'DEVELOPING';
          level = 'Level 1: Cơ bản';
        }
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

    // 4. Overall score is the honest average of assessed domains only
    const overallScore = assessedDomainsCount > 0
      ? Math.round(assessedScoreSum / assessedDomainsCount)
      : null;

    let overallLevel = 'Chưa có đánh giá';
    if (overallScore !== null) {
      if (overallScore >= 85) overallLevel = 'Level 4: Rất nâng cao';
      else if (overallScore >= 70) overallLevel = 'Level 3: Nâng cao (Đạt chuẩn)';
      else if (overallScore >= 55) overallLevel = 'Level 2: Trung cấp';
      else overallLevel = 'Level 1: Cơ bản';
    }

    return {
      userId,
      hasTakenAssessment,
      totalAssessmentsCompleted: submissionList.length,
      assessedDomainsCount,
      totalDomainsCount: 5,
      overallScore,
      overallLevel,
      radarData,
      gapDomainCodes,
      latestSubmissionId,
      totalEvidenceCount,
    };
  }
}
