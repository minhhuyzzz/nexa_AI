import {
  DomainMetric,
  OrgAnalyticsSummary,
  PriorityGapDomain,
  BestDomainMetric,
  CoverageWarningMetric,
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
    name: 'Sáng tạo nội dung số',
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
   * Lọc bài nộp theo thời gian (tháng/năm), đợt thi, lớp học và nguồn dữ liệu.
   * SaaS phục vụ đa dạng trường học và doanh nghiệp -> Lọc thời gian theo tháng/năm tự nhiên.
   */
  static filterSubmissions(
    submissions: RawAnalyticsSubmission[],
    classes: RawClassInfo[] = [],
    filters?: OrgAnalyticsFilters
  ): RawAnalyticsSubmission[] {
    if (!filters) {
      return submissions;
    }

    let filtered = submissions;

    // 1. Lọc theo nguồn dữ liệu
    if (filters.dataSource === 'standard_assessment') {
      filtered = filtered.filter((s) => s.assessment_id && !s.campaign_id);
    } else if (filters.dataSource === 'campaigns') {
      filtered = filtered.filter((s) => Boolean(s.campaign_id));
    }

    // 2. Lọc theo chiến dịch/đợt thi
    if (filters.campaignId && filters.campaignId !== 'all') {
      filtered = filtered.filter((s) => s.campaign_id === filters.campaignId);
    }

    // 3. Lọc theo lớp/đơn vị
    if (filters.classId && filters.classId !== 'all') {
      const targetClass = classes.find((c) => c.id === filters.classId);
      const memberUserIds = new Set(targetClass?.member_user_ids || []);
      filtered = filtered.filter((s) => s.user_id && memberUserIds.has(s.user_id));
    }

    // 4. Lọc theo thời gian (Tháng / Quý / Năm hoặc Tùy chỉnh Từ ngày - Đến ngày)
    if (filters.timeRange === 'custom') {
      if (filters.startDate || filters.endDate) {
        filtered = filtered.filter((s) => {
          const subDateStr = s.evaluated_at || s.created_at;
          if (!subDateStr) return false;
          const subDate = new Date(subDateStr);
          if (isNaN(subDate.getTime())) return false;

          if (filters.startDate) {
            const start = new Date(filters.startDate);
            start.setHours(0, 0, 0, 0);
            if (subDate < start) return false;
          }
          if (filters.endDate) {
            const end = new Date(filters.endDate);
            end.setHours(23, 59, 59, 999);
            if (subDate > end) return false;
          }
          return true;
        });
      }
    } else if (filters.timeRange && filters.timeRange !== 'all') {
      const now = new Date();
      filtered = filtered.filter((s) => {
        const subDate = new Date(s.evaluated_at || s.created_at || '');
        if (isNaN(subDate.getTime())) return true;

        if (filters.timeRange === 'last_month') {
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return subDate >= thirtyDaysAgo;
        }
        if (filters.timeRange === 'last_quarter') {
          const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          return subDate >= ninetyDaysAgo;
        }
        if (filters.timeRange === '2026') {
          return subDate.getFullYear() === 2026;
        }
        if (filters.timeRange === '2025') {
          return subDate.getFullYear() === 2025;
        }
        return true;
      });
    }

    return filtered;
  }

  /**
   * Tổng hợp toàn diện Báo cáo Năng lực Số của Tổ chức theo 5 miền.
   * Đảm bảo tính toán trên dữ liệu thật, không tạo số liệu mẫu hardcode.
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

    // Tổng số thành viên trong phạm vi xem xét (totalScopeUsers)
    let totalScopeUsers = 0;
    if (filters?.classId && filters.classId !== 'all') {
      const targetClass = classes.find((c) => c.id === filters.classId);
      totalScopeUsers = targetClass?.member_count || targetClass?.member_user_ids?.length || 0;
    } else {
      const allUniqueMembers = new Set(classes.flatMap((c) => c.member_user_ids || []));
      totalScopeUsers = allUniqueMembers.size;
    }

    // 1. KPI 1: Người có bằng chứng đánh giá (Distinct Users)
    const distinctEvaluatedUsers = new Set(
      evaluatedSubs.map((s) => s.user_id).filter(Boolean) as string[]
    );
    const uniqueUsersWithEvidence = distinctEvaluatedUsers.size;

    // 2. Map từng user với các miền năng lực đã có bằng chứng
    const userDomainScoresMap = new Map<string, Map<string, number>>();
    evaluatedSubs.forEach((sub) => {
      if (!sub.user_id || !sub.domain_scores) return;
      if (!userDomainScoresMap.has(sub.user_id)) {
        userDomainScoresMap.set(sub.user_id, new Map());
      }
      const uMap = userDomainScoresMap.get(sub.user_id)!;
      Object.entries(sub.domain_scores).forEach(([dCode, score]) => {
        if (typeof score === 'number') {
          // Lưu điểm cao nhất/mới nhất của user trên miền này
          const curr = uMap.get(dCode);
          if (curr === undefined || score > curr) {
            uMap.set(dCode, score);
          }
        }
      });
    });

    // KPI 2: Độ phủ 5 miền (Người có đủ bằng chứng cả 5 miền D1..D5)
    let fiveDomainEligibleCount = 0;
    userDomainScoresMap.forEach((uDomains) => {
      const hasAll5 = CANONICAL_DOMAINS.every((d) => uDomains.has(d.domainCode));
      if (hasAll5) {
        fiveDomainEligibleCount++;
      }
    });

    // Nếu totalScopeUsers chưa có trong DB (tổ chức mới), lấy mẫu số là uniqueUsersWithEvidence
    const effectiveScope = Math.max(totalScopeUsers, uniqueUsersWithEvidence);
    const fiveDomainCoverageRate =
      uniqueUsersWithEvidence > 0 && effectiveScope > 0
        ? Math.round((fiveDomainEligibleCount / effectiveScope) * 1000) / 10
        : null;

    // KPI 3: Điểm năng lực trung bình toàn tổ chức
    let overallAverageScore: number | null = null;
    if (evaluatedCount > 0) {
      const sumPercentage = evaluatedSubs.reduce((acc, curr) => acc + (curr.percentage || 0), 0);
      overallAverageScore = Math.round((sumPercentage / evaluatedCount) * 10) / 10;
    }

    // KPI 4: Tỷ lệ đạt chuẩn
    let overallPassRate = 0;
    if (evaluatedCount > 0) {
      const passedSubs = evaluatedSubs.filter((s) => s.is_passed === true);
      overallPassRate = Math.round((passedSubs.length / evaluatedCount) * 1000) / 10;
    }

    // KPI 5: Trạng thái vận hành — Bài chờ chấm & Bài chờ công bố
    let pendingGradingCount = 0;
    let pendingPublishCount = 0;

    activeSubmissions.forEach((s) => {
      if (s.status === 'SUBMITTED') {
        pendingGradingCount++;
      } else if (s.status === 'EVALUATED' && s.results_published === false) {
        pendingPublishCount++;
      }
    });
    const pendingTotalCount = pendingGradingCount + pendingPublishCount;

    // 3. Phân tích 5 miền năng lực số (D1..D5)
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
      const coverageRate =
        uniqueUsersWithEvidence > 0 && effectiveScope > 0
          ? Math.round((domainTested / effectiveScope) * 1000) / 10
          : null;

      return {
        ...d,
        score: domainScore,
        testedCount: domainTested,
        coverageRate,
        passedCount: domainPassed,
        passRate,
      };
    });

    const evaluatedDomains = domains.filter((d) => d.score !== null);
    const hasSufficientDataForRadar = evaluatedDomains.length === 5;
    const gapDomainCodes = domains
      .filter((d) => d.score !== null && d.score < 60)
      .map((d) => d.domainCode);

    // 4. Insight Panel: Miền mạnh nhất, Miền cần bồi dưỡng, Cảnh báo độ phủ
    let bestDomain: BestDomainMetric | null = null;
    let priorityGapDomain: PriorityGapDomain | null = null;
    let coverageWarningDomain: CoverageWarningMetric | null = null;
    const suggestedActions: string[] = [];

    if (evaluatedDomains.length > 0) {
      const sortedByScore = [...evaluatedDomains].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
      const highest = sortedByScore[0];
      const lowest = sortedByScore[sortedByScore.length - 1];

      if (highest && highest.score !== null) {
        bestDomain = {
          domainCode: highest.domainCode,
          name: highest.name,
          score: highest.score,
          coverageRate: highest.coverageRate,
        };
      }

      if (lowest && lowest.score !== null && lowest.score < 75) {
        priorityGapDomain = {
          domainCode: lowest.domainCode,
          name: lowest.name,
          score: lowest.score,
        };
        suggestedActions.push(`Tăng cường hoạt động bồi dưỡng chuyên đề ${lowest.domainCode} — ${lowest.name}.`);
      }
    }

    // Cảnh báo nếu có miền có độ phủ < 90% (chỉ kích hoạt khi tổ chức đã có dữ liệu làm bài)
    if (evaluatedCount > 0) {
      const lowCoverage = domains.find(
        (d) => d.coverageRate !== null && d.coverageRate < 90
      );
      if (lowCoverage && lowCoverage.coverageRate !== null) {
        coverageWarningDomain = {
          domainCode: lowCoverage.domainCode,
          name: lowCoverage.name,
          coverageRate: lowCoverage.coverageRate,
        };
        const missingCount = effectiveScope - lowCoverage.testedCount;
        if (missingCount > 0) {
          suggestedActions.push(`Bổ sung bài đánh giá chuẩn cho nhóm chưa đủ dữ liệu (${missingCount} người).`);
        }
      }
    }

    if (suggestedActions.length === 0 && evaluatedDomains.length > 0) {
      suggestedActions.push('Duy trì tiến độ đánh giá định kỳ và nhân rộng các phương pháp giảng dạy tốt.');
    }

    // 5. Bảng so sánh kết quả lớp/đơn vị (Heatmap D1..D5)
    const units = this.aggregateByUnit(activeSubmissions, classes);

    // 6. Danh mục đợt khảo thí
    const campaignMetrics = this.aggregateByCampaign(submissions, campaigns);

    // 7. Chuỗi thời gian tiến bộ (Line Chart)
    const trend = this.aggregateTimeSeriesTrend(submissions, campaigns);
    const hasEnoughTrendData = trend.length >= 2;

    return {
      uniqueUsersWithEvidence,
      uniqueUsersChange: null, // Sẽ có khi có dữ liệu 2 mốc thời gian hoàn chỉnh
      fiveDomainCoverageRate,
      fiveDomainEligibleCount,
      totalScopeUsers: effectiveScope,
      overallAverageScore,
      averageScoreChange: null,
      overallPassRate,
      passRateChange: null,
      pendingTotalCount,
      pendingGradingCount,
      pendingPublishCount,
      domains,
      hasSufficientDataForRadar,
      gapDomainCodes,
      bestDomain,
      priorityGapDomain,
      coverageWarningDomain,
      suggestedActions,
      units,
      campaigns: campaignMetrics,
      trend,
      hasEnoughTrendData,
      totalSubmissions,
      evaluatedSubmissions: evaluatedCount,
    };
  }

  /**
   * Tính toán chỉ số Heatmap D1..D5 và mức độ ưu tiên hỗ trợ cho từng Lớp/Đơn vị.
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

      // Điểm từng miền D1..D5
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

      // Phân loại nhãn ưu tiên hỗ trợ theo chuẩn thiết kế
      let supportPriority: 'maintain' | 'gap_d5' | 'gap_multi' | 'high_priority' = 'maintain';
      let supportPriorityLabel = 'Duy trì & nhân rộng';

      if (averageScore !== null && averageScore < 70) {
        supportPriority = 'high_priority';
        supportPriorityLabel = 'Ưu tiên hỗ trợ';
      } else if (gapDomainCodes.length > 1) {
        supportPriority = 'gap_multi';
        supportPriorityLabel = `Bồi dưỡng ${gapDomainCodes.slice(0, 2).join(', ')}`;
      } else if (gapDomainCodes.length === 1) {
        supportPriority = 'gap_d5';
        supportPriorityLabel = `Bồi dưỡng ${gapDomainCodes[0]}`;
      } else if (averageScore !== null && averageScore >= 80) {
        supportPriority = 'maintain';
        supportPriorityLabel = 'Duy trì & nhân rộng';
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
        supportPriority,
        supportPriorityLabel,
      };
    });
  }

  /**
   * Tổng hợp chỉ số theo Đợt khảo thí.
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
   * Tạo chuỗi thời gian tiến bộ (Line Chart) theo Đợt khảo thí (nếu có) hoặc mốc thời gian (Tháng/Năm).
   * Bỏ qua các kỳ/tháng không có bài nộp được duyệt (không vẽ 0% giả).
   */
  static aggregateTimeSeriesTrend(
    submissions: RawAnalyticsSubmission[],
    campaigns: RawCampaignInfo[] = []
  ): TimeSeriesTrendPoint[] {
    const evaluatedSubs = submissions.filter((s) => s.status === 'EVALUATED');
    if (evaluatedSubs.length === 0) return [];

    // Nếu có danh sách chiến dịch / đợt thi, gom theo campaign (theo chuẩn kiểm thử & đợt khảo thí)
    if (campaigns && campaigns.length > 0) {
      const sortedCampaigns = [...campaigns].sort((a, b) => {
        const timeA = new Date(a.starts_at || 0).getTime();
        const timeB = new Date(b.starts_at || 0).getTime();
        return timeA - timeB;
      });

      const trendPoints: TimeSeriesTrendPoint[] = [];

      for (const cmp of sortedCampaigns) {
        const cmpSubs = evaluatedSubs.filter((s) => s.campaign_id === cmp.id);
        if (cmpSubs.length === 0) continue; // Bỏ qua đợt thi không có bài được duyệt (DEC-01)

        const sum = cmpSubs.reduce((acc, curr) => acc + (curr.percentage || 0), 0);
        const averageScore = Math.round((sum / cmpSubs.length) * 10) / 10;

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
          timestamp: cmp.starts_at || cmp.ends_at || '',
          evaluatedCount: cmpSubs.length,
          averageScore,
          domainScores,
        });
      }

      return trendPoints;
    }

    // Nếu không có campaign (đánh giá thường xuyên / continuous), gom theo Tháng/Năm (YYYY-MM)
    const monthBuckets = new Map<string, RawAnalyticsSubmission[]>();

    evaluatedSubs.forEach((sub) => {
      const dateStr = sub.evaluated_at || sub.created_at;
      if (!dateStr) return;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthBuckets.has(key)) {
        monthBuckets.set(key, []);
      }
      monthBuckets.get(key)!.push(sub);
    });

    const sortedKeys = Array.from(monthBuckets.keys()).sort();
    const trendPoints: TimeSeriesTrendPoint[] = [];

    sortedKeys.forEach((key) => {
      const subs = monthBuckets.get(key)!;
      if (subs.length === 0) return;

      const [year, month] = key.split('-');
      const label = `Tháng ${parseInt(month, 10)}/${year}`;

      const sum = subs.reduce((acc, curr) => acc + (curr.percentage || 0), 0);
      const averageScore = Math.round((sum / subs.length) * 10) / 10;

      const domainScores: Record<string, number | null> = {};
      for (const d of CANONICAL_DOMAINS) {
        let dSum = 0;
        let dCount = 0;
        for (const sub of subs) {
          if (sub.domain_scores && typeof sub.domain_scores[d.domainCode] === 'number') {
            dSum += sub.domain_scores[d.domainCode];
            dCount++;
          }
        }
        domainScores[d.domainCode] =
          dCount > 0 ? Math.round((dSum / dCount) * 10) / 10 : null;
      }

      trendPoints.push({
        key,
        periodLabel: label,
        timestamp: `${key}-01`,
        evaluatedCount: subs.length,
        averageScore,
        domainScores,
      });
    });

    return trendPoints;
  }
}
