import {
  DomainMetric,
  OrgAnalyticsSummary,
  PriorityGapDomain,
  UnitCompetencyMetric,
  CampaignCompetencyMetric,
  TimeSeriesTrendPoint,
  OrgAnalyticsFilters,
  RawAnalyticsSubmission,
  RawClassInfo,
  RawCampaignInfo,
} from '../types/org-analytics.types';

export * from '../types/org-analytics.types';

export const CANONICAL_DOMAINS: Array<{
  domainId: string;
  domainCode: string;
  name: string;
  description: string;
}> = [
  {
    domainId: 'dom-1',
    domainCode: 'D1',
    name: 'Thông tin & Dữ liệu',
    description:
      'Năng lực tìm kiếm, đánh giá, quản lý và tổ chức dữ liệu, thông tin và nội dung số trong môi trường học tập và làm việc.',
  },
  {
    domainId: 'dom-2',
    domainCode: 'D2',
    name: 'Giao tiếp & Hợp tác',
    description:
      'Năng lực tương tác, chia sẻ thông tin, cộng tác thông qua các công cụ số và tham gia có trách nhiệm vào các cộng đồng trực tuyến.',
  },
  {
    domainId: 'dom-3',
    domainCode: 'D3',
    name: 'Sáng tạo Nội dung số',
    description:
      'Năng lực tạo lập, biên tập nội dung số, tích hợp và tái phát triển nội dung, hiểu biết về bản quyền và cấp phép số.',
  },
  {
    domainId: 'dom-4',
    domainCode: 'D4',
    name: 'An toàn & Bảo mật',
    description:
      'Năng lực bảo vệ thiết bị, bảo mật dữ liệu cá nhân, quyền riêng tư, nhận diện rủi ro mạng và bảo vệ sức khỏe tâm lý số.',
  },
  {
    domainId: 'dom-5',
    domainCode: 'D5',
    name: 'Giải quyết Vấn đề',
    description:
      'Năng lực nhận diện nhu cầu và giải pháp công nghệ, xử lý sự cố kỹ thuật và áp dụng công nghệ số một cách sáng tạo.',
  },
];

export class OrgCompetencyAnalyticsService {
  /**
   * Filters submissions based on optional campaignId and classId.
   */
  static filterSubmissions(
    submissions: RawAnalyticsSubmission[],
    classes: RawClassInfo[] = [],
    filters?: OrgAnalyticsFilters
  ): RawAnalyticsSubmission[] {
    if (!filters || (!filters.campaignId && !filters.classId)) {
      return submissions;
    }

    let filtered = submissions;

    if (filters.campaignId) {
      filtered = filtered.filter((s) => s.campaign_id === filters.campaignId);
    }

    if (filters.classId) {
      const targetClass = classes.find((c) => c.id === filters.classId);
      const memberUserIds = new Set(targetClass?.member_user_ids || []);
      filtered = filtered.filter(
        (s) => s.user_id && memberUserIds.has(s.user_id)
      );
    }

    return filtered;
  }

  /**
   * Aggregates organization-wide competency scores strictly across 5 canonical domains.
   * Differentiates null (no submissions yet) from 0.0 (tested with 0 score).
   */
  static aggregateOrgCompetency(
    submissions: RawAnalyticsSubmission[],
    classes: RawClassInfo[] = [],
    campaigns: RawCampaignInfo[] = [],
    filters?: OrgAnalyticsFilters
  ): OrgAnalyticsSummary {
    const activeSubmissions = this.filterSubmissions(submissions, classes, filters);
    const evaluatedSubs = activeSubmissions.filter((s) => s.status === 'EVALUATED');
    const totalSubmissions = activeSubmissions.length;
    const evaluatedCount = evaluatedSubs.length;

    // 1. Overall Domains aggregation
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

      const domainScore =
        domainTested > 0 ? Math.round((domainSum / domainTested) * 10) / 10 : null;
      const passRate =
        domainTested > 0 ? Math.round((domainPassed / domainTested) * 100) : null;

      return {
        ...d,
        score: domainScore,
        testedCount: domainTested,
        passedCount: domainPassed,
        passRate,
      };
    });

    const evaluatedDomains = domains.filter((d) => d.score !== null);
    const hasSufficientDataForRadar = evaluatedDomains.length === 5;
    const gapDomainCodes = domains
      .filter((d) => d.score !== null && d.score < 60)
      .map((d) => d.domainCode);

    // Identify priority gap domain (the lowest evaluated domain that needs training focus)
    let priorityGapDomain: PriorityGapDomain | null = null;
    if (evaluatedDomains.length > 0) {
      const sortedByScore = [...evaluatedDomains].sort((a, b) => (a.score ?? 0) - (b.score ?? 0));
      const lowest = sortedByScore[0];
      if (lowest && lowest.score !== null) {
        priorityGapDomain = {
          domainCode: lowest.domainCode,
          name: lowest.name,
          score: lowest.score,
        };
      }
    }

    let overallAverageScore: number | null = null;
    let overallPassRate = 0;

    if (evaluatedCount > 0) {
      const sumPercentage = evaluatedSubs.reduce((acc, curr) => acc + (curr.percentage || 0), 0);
      overallAverageScore = Math.round((sumPercentage / evaluatedCount) * 10) / 10;
      const passedSubs = evaluatedSubs.filter((s) => s.is_passed === true);
      overallPassRate = Math.round((passedSubs.length / evaluatedCount) * 100);
    }

    // 2. Unit aggregation
    const units = this.aggregateByUnit(activeSubmissions, classes);

    // 3. Campaign aggregation
    const campaignMetrics = this.aggregateByCampaign(submissions, campaigns);

    // 4. Time series trend
    const trend = this.aggregateTimeSeriesTrend(submissions, campaigns);

    return {
      totalSubmissions,
      evaluatedSubmissions: evaluatedCount,
      overallAverageScore,
      overallPassRate,
      domains,
      hasSufficientDataForRadar,
      gapDomainCodes,
      priorityGapDomain,
      units,
      campaigns: campaignMetrics,
      trend,
    };
  }

  /**
   * Aggregates competency scores by Unit/Class.
   */
  static aggregateByUnit(
    submissions: RawAnalyticsSubmission[],
    classes: RawClassInfo[]
  ): UnitCompetencyMetric[] {
    const evaluatedSubs = submissions.filter((s) => s.status === 'EVALUATED');

    return classes.map((cls) => {
      const memberSet = new Set(cls.member_user_ids || []);
      const classAllSubs = submissions.filter(
        (s) => s.user_id && memberSet.has(s.user_id)
      );
      const classEvaluated = evaluatedSubs.filter(
        (s) => s.user_id && memberSet.has(s.user_id)
      );

      const evaluatedCount = classEvaluated.length;
      let averageScore: number | null = null;
      let passRate: number | null = null;

      if (evaluatedCount > 0) {
        const sum = classEvaluated.reduce((acc, curr) => acc + (curr.percentage || 0), 0);
        averageScore = Math.round((sum / evaluatedCount) * 10) / 10;
        const passed = classEvaluated.filter((s) => s.is_passed === true).length;
        passRate = Math.round((passed / evaluatedCount) * 100);
      }

      // Domain scores
      const domainScores: Record<string, number | null> = {};
      const gapDomainCodes: string[] = [];

      for (const d of CANONICAL_DOMAINS) {
        let dSum = 0;
        let dCount = 0;
        for (const sub of classEvaluated) {
          if (sub.domain_scores && typeof sub.domain_scores[d.domainCode] === 'number') {
            dSum += sub.domain_scores[d.domainCode];
            dCount++;
          }
        }
        if (dCount > 0) {
          const dScore = Math.round((dSum / dCount) * 10) / 10;
          domainScores[d.domainCode] = dScore;
          if (dScore < 60) {
            gapDomainCodes.push(d.domainCode);
          }
        } else {
          domainScores[d.domainCode] = null;
        }
      }

      return {
        classId: cls.id,
        className: cls.name,
        totalMembers: cls.member_count ?? memberSet.size,
        testedCount: classAllSubs.length,
        evaluatedCount,
        averageScore,
        passRate,
        domainScores,
        gapDomainCodes,
      };
    });
  }

  /**
   * Aggregates competency metrics by Campaign.
   */
  static aggregateByCampaign(
    submissions: RawAnalyticsSubmission[],
    campaigns: RawCampaignInfo[]
  ): CampaignCompetencyMetric[] {
    return campaigns.map((cmp) => {
      const cmpSubs = submissions.filter((s) => s.campaign_id === cmp.id);
      const evaluatedSubs = cmpSubs.filter((s) => s.status === 'EVALUATED');
      const evaluatedCount = evaluatedSubs.length;

      let averageScore: number | null = null;
      let passRate: number | null = null;

      if (evaluatedCount > 0) {
        const sum = evaluatedSubs.reduce((acc, curr) => acc + (curr.percentage || 0), 0);
        averageScore = Math.round((sum / evaluatedCount) * 10) / 10;
        const passed = evaluatedSubs.filter((s) => s.is_passed === true).length;
        passRate = Math.round((passed / evaluatedCount) * 100);
      }

      const domainScores: Record<string, number | null> = {};
      const gapDomainCodes: string[] = [];

      for (const d of CANONICAL_DOMAINS) {
        let dSum = 0;
        let dCount = 0;
        for (const sub of evaluatedSubs) {
          if (sub.domain_scores && typeof sub.domain_scores[d.domainCode] === 'number') {
            dSum += sub.domain_scores[d.domainCode];
            dCount++;
          }
        }
        if (dCount > 0) {
          const dScore = Math.round((dSum / dCount) * 10) / 10;
          domainScores[d.domainCode] = dScore;
          if (dScore < 60) {
            gapDomainCodes.push(d.domainCode);
          }
        } else {
          domainScores[d.domainCode] = null;
        }
      }

      return {
        campaignId: cmp.id,
        title: cmp.title,
        status: cmp.status,
        startsAt: cmp.starts_at,
        endsAt: cmp.ends_at,
        passingScore: cmp.passing_score ?? 70,
        totalSubmissions: cmpSubs.length,
        evaluatedCount,
        averageScore,
        passRate,
        domainScores,
        gapDomainCodes,
      };
    });
  }

  /**
   * Generates time-series trend points based on completed campaigns or time buckets.
   * Crucial rule: Excludes periods with zero evaluated submissions so we NEVER draw a fake drop to 0%.
   */
  static aggregateTimeSeriesTrend(
    submissions: RawAnalyticsSubmission[],
    campaigns: RawCampaignInfo[]
  ): TimeSeriesTrendPoint[] {
    const sortedCampaigns = [...campaigns].sort(
      (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
    );

    const trendPoints: TimeSeriesTrendPoint[] = [];

    for (const cmp of sortedCampaigns) {
      const cmpSubs = submissions.filter(
        (s) => s.campaign_id === cmp.id && s.status === 'EVALUATED'
      );

      // Only include campaigns with AT LEAST ONE evaluated submission (truthful reporting)
      if (cmpSubs.length === 0) continue;

      const evaluatedCount = cmpSubs.length;
      const sum = cmpSubs.reduce((acc, curr) => acc + (curr.percentage || 0), 0);
      const averageScore = Math.round((sum / evaluatedCount) * 10) / 10;

      const domainScores: Record<string, number | null> = {};
      for (const d of CANONICAL_DOMAINS) {
        let dSum = 0;
        let dCount = 0;
        for (const sub of cmpSubs) {
          if (sub.domain_scores && typeof sub.domain_scores[d.domainCode] === 'number') {
            dSum += sub.domain_scores[d.domainCode];
            dCount++;
          }
        }
        domainScores[d.domainCode] =
          dCount > 0 ? Math.round((dSum / dCount) * 10) / 10 : null;
      }

      trendPoints.push({
        key: cmp.id,
        periodLabel: cmp.title,
        timestamp: cmp.starts_at,
        evaluatedCount,
        averageScore,
        domainScores,
      });
    }

    return trendPoints;
  }
}
