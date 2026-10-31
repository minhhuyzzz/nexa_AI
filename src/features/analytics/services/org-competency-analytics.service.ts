export interface DomainMetric {
  domainId: string;
  domainCode: string;
  name: string;
  score: number | null; // null represents NO DATA, 0 represents actual evaluated zero score
  testedCount: number;
  passedCount: number;
}

export interface OrgAnalyticsSummary {
  totalSubmissions: number;
  evaluatedSubmissions: number;
  overallAverageScore: number | null;
  overallPassRate: number; // 0 - 100
  domains: DomainMetric[];
  hasSufficientDataForRadar: boolean;
  gapDomainCodes: string[]; // Domains with evaluated average < 60%
}

const CANONICAL_DOMAINS = [
  { domainId: 'dom-1', domainCode: 'D1', name: 'Thông tin & Dữ liệu' },
  { domainId: 'dom-2', domainCode: 'D2', name: 'Giao tiếp & Hợp tác' },
  { domainId: 'dom-3', domainCode: 'D3', name: 'Sáng tạo Nội dung số' },
  { domainId: 'dom-4', domainCode: 'D4', name: 'An toàn & Bảo mật' },
  { domainId: 'dom-5', domainCode: 'D5', name: 'Giải quyết Vấn đề' },
];

export class OrgCompetencyAnalyticsService {
  /**
   * Aggregates organization-wide competency scores strictly across 5 domains.
   * Differentiates null (no submissions yet) from 0.0 (tested with 0 score).
   */
  static aggregateOrgCompetency(
    submissions: Array<{
      id: string;
      status: string;
      percentage?: number | null;
      is_passed?: boolean | null;
      domain_scores?: Record<string, number> | null;
    }>
  ): OrgAnalyticsSummary {
    const evaluatedSubs = submissions.filter((s) => s.status === 'EVALUATED');
    const totalSubmissions = submissions.length;
    const evaluatedCount = evaluatedSubs.length;

    if (evaluatedCount === 0) {
      return {
        totalSubmissions,
        evaluatedSubmissions: 0,
        overallAverageScore: null,
        overallPassRate: 0,
        domains: CANONICAL_DOMAINS.map((d) => ({
          ...d,
          score: null,
          testedCount: 0,
          passedCount: 0,
        })),
        hasSufficientDataForRadar: false,
        gapDomainCodes: [],
      };
    }

    const passedSubs = evaluatedSubs.filter((s) => s.is_passed === true);
    const overallPassRate = Math.round((passedSubs.length / evaluatedCount) * 100);

    const sumPercentage = evaluatedSubs.reduce((acc, curr) => acc + (curr.percentage || 0), 0);
    const overallAverageScore = Math.round((sumPercentage / evaluatedCount) * 10) / 10;

    // Aggregate by 5 domains
    const domains: DomainMetric[] = CANONICAL_DOMAINS.map((d) => {
      let domainSum = 0;
      let domainTested = 0;
      let domainPassed = 0;

      for (const sub of evaluatedSubs) {
        if (sub.domain_scores && typeof sub.domain_scores[d.domainCode] === 'number') {
          const score = sub.domain_scores[d.domainCode];
          domainSum += score;
          domainTested++;
          if (score >= 70) domainPassed++;
        }
      }

      // Strictly truthful: If a domain was not tested, return null (never interpolate from overall assessment average)
      const domainScore =
        domainTested > 0 ? Math.round((domainSum / domainTested) * 10) / 10 : null;

      return {
        ...d,
        score: domainScore,
        testedCount: domainTested,
        passedCount: domainPassed,
      };
    });

    const evaluatedDomains = domains.filter((d) => d.score !== null);
    const hasSufficientDataForRadar = evaluatedDomains.length === 5;
    const gapDomainCodes = domains
      .filter((d) => d.score !== null && d.score < 60)
      .map((d) => d.domainCode);

    return {
      totalSubmissions,
      evaluatedSubmissions: evaluatedCount,
      overallAverageScore,
      overallPassRate,
      domains,
      hasSufficientDataForRadar,
      gapDomainCodes,
    };
  }
}
