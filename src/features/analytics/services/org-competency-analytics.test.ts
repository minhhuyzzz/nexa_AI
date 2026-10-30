import { describe, it, expect } from 'vitest';
import { OrgCompetencyAnalyticsService } from './org-competency-analytics.service';

describe('Organization 5-Domain Competency Analytics (ORG-F05, DEC-01)', () => {
  it('tổ chức mới chưa có bài nộp được duyệt: điểm số là null (không phải 0) và không đủ điều kiện vẽ radar', () => {
    const summary = OrgCompetencyAnalyticsService.aggregateOrgCompetency([]);

    expect(summary.totalSubmissions).toBe(0);
    expect(summary.evaluatedSubmissions).toBe(0);
    expect(summary.overallAverageScore).toBeNull();
    expect(summary.hasSufficientDataForRadar).toBe(false);
    expect(summary.domains).toHaveLength(5);

    // Each domain must be null, strictly differentiating "no data" from "score 0"
    summary.domains.forEach((d) => {
      expect(d.score).toBeNull();
      expect(d.testedCount).toBe(0);
    });
  });

  it('bài thi chưa hoàn thành (SUBMITTED/IN_PROGRESS) không được đưa vào tính điểm trung bình', () => {
    const summary = OrgCompetencyAnalyticsService.aggregateOrgCompetency([
      { id: 'sub-1', status: 'IN_PROGRESS', percentage: 80, is_passed: true },
      { id: 'sub-2', status: 'SUBMITTED', percentage: 90, is_passed: true },
    ]);

    expect(summary.totalSubmissions).toBe(2);
    expect(summary.evaluatedSubmissions).toBe(0);
    expect(summary.overallAverageScore).toBeNull();
    expect(summary.hasSufficientDataForRadar).toBe(false);
  });

  it('tính toán chính xác điểm 5 miền và nhận diện khoảng trống năng lực < 60%', () => {
    const summary = OrgCompetencyAnalyticsService.aggregateOrgCompetency([
      {
        id: 'sub-1',
        status: 'EVALUATED',
        percentage: 75,
        is_passed: true,
        domain_scores: {
          D1: 85,
          D2: 70,
          D3: 50, // Gap (< 60)
          D4: 90,
          D5: 45, // Gap (< 60)
        },
      },
      {
        id: 'sub-2',
        status: 'EVALUATED',
        percentage: 65,
        is_passed: false,
        domain_scores: {
          D1: 75,
          D2: 60,
          D3: 55, // Gap (< 60)
          D4: 80,
          D5: 50, // Gap (< 60)
        },
      },
    ]);

    expect(summary.evaluatedSubmissions).toBe(2);
    expect(summary.overallPassRate).toBe(50); // 1 passed, 1 failed
    expect(summary.hasSufficientDataForRadar).toBe(true);

    const d1 = summary.domains.find((d) => d.domainCode === 'D1');
    expect(d1?.score).toBe(80); // (85 + 75) / 2

    const d3 = summary.domains.find((d) => d.domainCode === 'D3');
    expect(d3?.score).toBe(52.5);

    const d5 = summary.domains.find((d) => d.domainCode === 'D5');
    expect(d5?.score).toBe(47.5);

    // Gap detection: D3 and D5 are below 60%
    expect(summary.gapDomainCodes).toEqual(['D3', 'D5']);
  });
});
