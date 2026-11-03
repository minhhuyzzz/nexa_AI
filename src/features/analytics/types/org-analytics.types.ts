export interface DomainMetric {
  domainId: string;
  domainCode: string;
  name: string;
  description: string;
  score: number | null; // null = chưa đủ bằng chứng; 0 = đã đánh giá với điểm 0
  testedCount: number;
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
  campaignId?: string;
  classId?: string;
}

export interface PriorityGapDomain {
  domainCode: string;
  name: string;
  score: number;
}

export interface OrgAnalyticsSummary {
  totalSubmissions: number;
  evaluatedSubmissions: number;
  overallAverageScore: number | null;
  overallPassRate: number; // 0 - 100
  domains: DomainMetric[];
  hasSufficientDataForRadar: boolean;
  gapDomainCodes: string[]; // Domains with evaluated average < 60%
  priorityGapDomain: PriorityGapDomain | null; // Miền năng lực có điểm TB thấp nhất cần bồi dưỡng ưu tiên
  units: UnitCompetencyMetric[];
  campaigns: CampaignCompetencyMetric[];
  trend: TimeSeriesTrendPoint[];
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
