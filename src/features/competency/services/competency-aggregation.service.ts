import { SupabaseClient } from '@supabase/supabase-js';

export interface SkillScore {
  id: string;
  skillCode: string;
  title: string;
  score: number | null; // null = Insufficient data
  evidenceCount: number;
  hasData: boolean;
}

export interface DomainScore {
  domainId: string;
  domainCode: string;
  domainTitle: string;
  domainIndex: number;
  score: number | null; // null = Insufficient data (not 0%!)
  hasData: boolean;
  status: 'MASTERED' | 'PROFICIENT' | 'DEVELOPING' | 'INSUFFICIENT_DATA';
  level: string;
  assessedSkillsCount: number;
  totalSkillsCount: number;
  skills: SkillScore[];
}

export interface LongitudinalRadarResult {
  overallScore: number | null;
  overallStatus: 'ASSESSED' | 'INSUFFICIENT_DATA';
  assessedDomainsCount: number;
  totalDomainsCount: number;
  domains: DomainScore[];
  totalEvidenceCount: number;
  baselineSnapshot?: {
    overallScore: number;
    createdAt: string;
  } | null;
}

export class CompetencyAggregationService {
  /**
   * Aggregates longitudinal 5-domain DigComp competency scores from real evidence.
   * If a domain or skill has no evidence, score is explicitly null (Chưa đủ dữ liệu)
   * instead of setting it to 0% or hallucinating fake scores.
   */
  static async calculateLearnerRadar(
    supabase: SupabaseClient,
    userId: string
  ): Promise<LongitudinalRadarResult> {
    // 1. Fetch all domains and competencies
    const { data: domainsData } = await supabase
      .from('competency_domains')
      .select(`
        id,
        code,
        title,
        domain_index,
        competencies (
          id,
          skill_code,
          title
        )
      `)
      .order('domain_index', { ascending: true });

    // 2. Fetch all competency evidence for this user
    const { data: evidenceData } = await supabase
      .from('competency_evidence')
      .select('competency_id, score, weight')
      .eq('user_id', userId);

    const evidenceMap = new Map<string, { totalWeightedScore: number; totalWeight: number; count: number }>();

    (evidenceData || []).forEach((ev) => {
      const existing = evidenceMap.get(ev.competency_id) || { totalWeightedScore: 0, totalWeight: 0, count: 0 };
      const w = Number(ev.weight) || 1.0;
      const s = Number(ev.score) || 0;
      evidenceMap.set(ev.competency_id, {
        totalWeightedScore: existing.totalWeightedScore + s * w,
        totalWeight: existing.totalWeight + w,
        count: existing.count + 1,
      });
    });

    // If no direct evidence rows exist, check answers from submissions to build initial evidence
    if (evidenceMap.size === 0) {
      const { data: submissions } = await supabase
        .from('assessment_submissions')
        .select(`
          id,
          submission_answers (
            score_awarded,
            assessment_items (
              points,
              competency_id
            )
          )
        `)
        .eq('user_id', userId)
        .in('status', ['SUBMITTED', 'EVALUATED']);

      (submissions || []).forEach((sub) => {
        (sub.submission_answers || []).forEach((ans: any) => {
          const compId = ans.assessment_items?.competency_id;
          const maxPts = Number(ans.assessment_items?.points) || 10;
          const awarded = Number(ans.score_awarded) || 0;
          if (compId && maxPts > 0) {
            const percentage = (awarded / maxPts) * 100;
            const existing = evidenceMap.get(compId) || { totalWeightedScore: 0, totalWeight: 0, count: 0 };
            evidenceMap.set(compId, {
              totalWeightedScore: existing.totalWeightedScore + percentage,
              totalWeight: existing.totalWeight + 1,
              count: existing.count + 1,
            });
          }
        });
      });
    }

    // 3. Aggregate scores per competency and domain
    const domains: DomainScore[] = [];
    let domainScoreSum = 0;
    let assessedDomainsCount = 0;
    let totalEvidenceCount = 0;

    (domainsData || []).forEach((dom: any, idx: number) => {
      const skills: SkillScore[] = [];
      let domainWeightedSum = 0;
      let domainSkillsWithData = 0;

      (dom.competencies || []).forEach((comp: any) => {
        const ev = evidenceMap.get(comp.id);
        if (ev && ev.totalWeight > 0) {
          const skillAvg = Math.round(ev.totalWeightedScore / ev.totalWeight);
          skills.push({
            id: comp.id,
            skillCode: comp.skill_code,
            title: comp.title,
            score: skillAvg,
            evidenceCount: ev.count,
            hasData: true,
          });
          domainWeightedSum += skillAvg;
          domainSkillsWithData++;
          totalEvidenceCount += ev.count;
        } else {
          skills.push({
            id: comp.id,
            skillCode: comp.skill_code,
            title: comp.title,
            score: null, // "Chưa đủ dữ liệu"
            evidenceCount: 0,
            hasData: false,
          });
        }
      });

      // Domain score
      let domainScore: number | null = null;
      let status: DomainScore['status'] = 'INSUFFICIENT_DATA';
      let level = 'Chưa đủ dữ liệu';

      if (domainSkillsWithData > 0) {
        domainScore = Math.round(domainWeightedSum / domainSkillsWithData);
        assessedDomainsCount++;
        domainScoreSum += domainScore;

        if (domainScore >= 85) {
          status = 'MASTERED';
          level = 'Rất nâng cao (Level 4)';
        } else if (domainScore >= 70) {
          status = 'PROFICIENT';
          level = 'Nâng cao - Đạt chuẩn (Level 3)';
        } else if (domainScore >= 55) {
          status = 'DEVELOPING';
          level = 'Trung cấp (Level 2)';
        } else {
          status = 'DEVELOPING';
          level = 'Cơ bản (Level 1)';
        }
      }

      domains.push({
        domainId: dom.id,
        domainCode: dom.code || `0${idx + 1}`,
        domainTitle: dom.title,
        domainIndex: dom.domain_index || idx + 1,
        score: domainScore,
        hasData: domainSkillsWithData > 0,
        status,
        level,
        assessedSkillsCount: domainSkillsWithData,
        totalSkillsCount: skills.length,
        skills,
      });
    });

    // Overall Score
    const overallScore =
      assessedDomainsCount > 0 ? Math.round(domainScoreSum / assessedDomainsCount) : null;

    // 4. Fetch baseline snapshot if available
    const { data: baseline } = await supabase
      .from('learner_competency_snapshots')
      .select('overall_score, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    return {
      overallScore,
      overallStatus: overallScore !== null ? 'ASSESSED' : 'INSUFFICIENT_DATA',
      assessedDomainsCount,
      totalDomainsCount: domains.length,
      domains,
      totalEvidenceCount,
      baselineSnapshot: baseline
        ? {
            overallScore: Number(baseline.overall_score),
            createdAt: baseline.created_at,
          }
        : null,
    };
  }
}
