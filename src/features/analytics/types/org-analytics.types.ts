export interface DomainMetric {
  domainId: string;
  domainCode: string;
  name: string;
  description: string;
  score: number | null; // null = chưa đủ bằng chứng; 0 = đã đánh giá với điểm 0
  testedCount: number;
  coverageRate: number | null; // tỷ lệ % người có bằng chứng trên tổng số thành viên
  passedCount: number;
  passRate: number | null;
}

export interface UnitCompetencyMetric {
  classId: string;
  className: string;
  totalMembers: number;
  testedCount: number;
  evaluatedCount: number;
  averageScore: number | null;
  passRate: number | null;
  domainScores: Record<string, number | null>;
  gapDomainCodes: string[];
  supportPriority: 'maintain' | 'gap_d5' | 'gap_multi' | 'high_priority';
  supportPriorityLabel: string;
}

export interface CampaignCompetencyMetric {
  campaignId: string;
  title: string;
  status: string;
  startsAt: string;
  endsAt: string;
  passingScore: number;
  totalSubmissions: number;
  evaluatedCount: number;
  averageScore: number | null;
  passRate: number | null;
  domainScores: Record<string, number | null>;
  gapDomainCodes: string[];
}

export interface TimeSeriesTrendPoint {
  key: string;
  periodLabel: string;
  timestamp: string;
  evaluatedCount: number;
  averageScore: number | null;
  domainScores: Record<string, number | null>;
}

export interface OrgAnalyticsFilters {
  timeRange?: string; // 'all' | '2026' | '2025' | 'last_quarter' | 'last_month' | 'custom'
  startDate?: string; // 'YYYY-MM-DD'
  endDate?: string;   // 'YYYY-MM-DD'
  campaignId?: string;
  classId?: string;
  dataSource?: string; // 'all' | 'standard_assessment' | 'campaigns'
}

export interface PriorityGapDomain {
  domainCode: string;
  name: string;
  score: number;
}

export interface BestDomainMetric {
  domainCode: string;
  name: string;
  score: number;
  coverageRate: number | null;
}

export interface CoverageWarningMetric {
  domainCode: string;
  name: string;
  coverageRate: number;
}

export interface OrgAnalyticsSummary {
  // 5 KPIs cốt lõi
  uniqueUsersWithEvidence: number;
  uniqueUsersChange: number | null; // % thay đổi so với mốc trước (e.g. +12.5)
  fiveDomainCoverageRate: number | null; // Tỷ lệ phủ cả 5 miền % (e.g. 92.4)
  fiveDomainEligibleCount: number; // Số người đủ 5 miền
  totalScopeUsers: number; // Tổng số người trong phạm vi xét (e.g. 3710)
  overallAverageScore: number | null; // Điểm năng lực TB thang 100 (e.g. 76.8)
  averageScoreChange: number | null; // Thay đổi điểm so với mốc trước (e.g. +4.6)
  overallPassRate: number; // Tỷ lệ đạt chuẩn % (e.g. 81.6)
  passRateChange: number | null; // Thay đổi điểm % so với mốc trước (e.g. +6.8)
  pendingTotalCount: number; // Tổng số bài chờ xử lý (e.g. 120)
  pendingGradingCount: number; // Số bài chờ chấm rubric (e.g. 86)
  pendingPublishCount: number; // Số bài đã chấm nhưng chờ công bố (e.g. 34)

  // 5 Miền năng lực & Insight
  domains: DomainMetric[];
  hasSufficientDataForRadar: boolean;
  gapDomainCodes: string[];
  bestDomain: BestDomainMetric | null;
  priorityGapDomain: PriorityGapDomain | null;
  coverageWarningDomain: CoverageWarningMetric | null;
  suggestedActions: string[];

  // Bảng so sánh lớp & Biểu đồ tiến bộ
  units: UnitCompetencyMetric[];
  campaigns: CampaignCompetencyMetric[];
  trend: TimeSeriesTrendPoint[];
  hasEnoughTrendData: boolean;

  // Metadata bộ lọc
  totalSubmissions: number;
  evaluatedSubmissions: number;
}

export interface RawAnalyticsSubmission {
  id: string;
  campaign_id?: string | null;
  assessment_id?: string | null;
  user_id?: string | null;
  status: string;
  percentage?: number | null;
  is_passed?: boolean | null;
  total_score?: number | null;
  domain_scores?: Record<string, number> | null;
  created_at?: string;
  evaluated_at?: string | null;
  results_published?: boolean | null;
}

export interface RawClassInfo {
  id: string;
  name: string;
  member_count?: number;
  member_user_ids?: string[];
}

export interface RawCampaignInfo {
  id: string;
  title: string;
  status: string;
  starts_at: string;
  ends_at: string;
  passing_score?: number;
  class_ids?: string[];
}
