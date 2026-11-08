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
    expect(summary.priorityGapDomain).toBeNull();

    // Each domain must be null, strictly differentiating "no data" from "score 0"
    summary.domains.forEach((d) => {
      expect(d.score).toBeNull();
      expect(d.testedCount).toBe(0);
      expect(d.coverageRate).toBeNull();
    });

    expect(summary.fiveDomainCoverageRate).toBeNull();
    expect(summary.coverageWarningDomain).toBeNull();
    expect(summary.suggestedActions).toHaveLength(0);
  });

  it('tổ chức có thành viên nhưng chưa có bài nộp (uniqueUsersWithEvidence = 0) không tạo cảnh báo độ phủ ảo', () => {
    const mockClasses = [
      { id: 'c1', name: 'Lớp 1', member_user_ids: ['u1', 'u2', 'u3', 'u4', 'u5'] },
    ];
    const summary = OrgCompetencyAnalyticsService.aggregateOrgCompetency([], mockClasses, []);

    expect(summary.totalScopeUsers).toBe(5);
    expect(summary.uniqueUsersWithEvidence).toBe(0);
    expect(summary.fiveDomainCoverageRate).toBeNull();
    expect(summary.coverageWarningDomain).toBeNull();
    expect(summary.suggestedActions).toHaveLength(0);
  });

  it('lọc khoảng ngày tùy chỉnh (timeRange = custom) chính xác', () => {
    const submissions = [
      { id: 'sub-1', created_at: '2026-03-05T10:00:00Z', status: 'EVALUATED' },
      { id: 'sub-2', created_at: '2026-03-20T15:00:00Z', status: 'EVALUATED' },
      { id: 'sub-3', created_at: '2026-04-02T08:00:00Z', status: 'EVALUATED' },
    ];

    const filtered = OrgCompetencyAnalyticsService.filterSubmissions(submissions, [], {
      timeRange: 'custom',
      startDate: '2026-03-10',
      endDate: '2026-03-25',
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('sub-2');
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

    // Priority gap domain should be D5 (lowest score: 47.5)
    expect(summary.priorityGapDomain).toEqual({
      domainCode: 'D5',
      name: 'Giải quyết Vấn đề',
      score: 47.5,
    });
  });

  it('lọc dữ liệu chính xác theo campaignId và classId', () => {
    const submissions = [
      { id: 'sub-1', campaign_id: 'cmp-1', user_id: 'u-1', status: 'EVALUATED', percentage: 80, is_passed: true },
      { id: 'sub-2', campaign_id: 'cmp-2', user_id: 'u-2', status: 'EVALUATED', percentage: 70, is_passed: true },
      { id: 'sub-3', campaign_id: 'cmp-1', user_id: 'u-3', status: 'EVALUATED', percentage: 90, is_passed: true },
    ];
    const classes = [
      { id: 'cls-1', name: 'Lớp 10A1', member_user_ids: ['u-1'] },
      { id: 'cls-2', name: 'Lớp 10A2', member_user_ids: ['u-2', 'u-3'] },
    ];

    // Filter by campaign
    const cmp1Filtered = OrgCompetencyAnalyticsService.filterSubmissions(submissions, classes, {
      campaignId: 'cmp-1',
    });
    expect(cmp1Filtered).toHaveLength(2);
    expect(cmp1Filtered.map((s) => s.id)).toEqual(['sub-1', 'sub-3']);

    // Filter by class
    const cls2Filtered = OrgCompetencyAnalyticsService.filterSubmissions(submissions, classes, {
      classId: 'cls-2',
    });
    expect(cls2Filtered).toHaveLength(2);
    expect(cls2Filtered.map((s) => s.id)).toEqual(['sub-2', 'sub-3']);

    // Combined filter
    const combined = OrgCompetencyAnalyticsService.filterSubmissions(submissions, classes, {
      campaignId: 'cmp-1',
      classId: 'cls-2',
    });
    expect(combined).toHaveLength(1);
    expect(combined[0].id).toBe('sub-3');
  });

  it('tổng hợp theo Đơn vị (Unit Aggregation) chính xác và xử lý lớp chưa có bài nộp', () => {
    const submissions = [
      {
        id: 'sub-1',
        user_id: 'u-1',
        status: 'EVALUATED',
        percentage: 85,
        is_passed: true,
        domain_scores: { D1: 90, D2: 80, D3: 85, D4: 85, D5: 85 },
      },
      {
        id: 'sub-2',
        user_id: 'u-2',
        status: 'EVALUATED',
        percentage: 55,
        is_passed: false,
        domain_scores: { D1: 50, D2: 60, D3: 50, D4: 60, D5: 55 },
      },
    ];

    const classes = [
      { id: 'cls-1', name: 'Lớp 10A1', member_count: 30, member_user_ids: ['u-1'] },
      { id: 'cls-2', name: 'Lớp 10A2', member_count: 28, member_user_ids: ['u-2'] },
      { id: 'cls-3', name: 'Lớp 10A3', member_count: 25, member_user_ids: ['u-3'] }, // No submissions
    ];

    const unitMetrics = OrgCompetencyAnalyticsService.aggregateByUnit(submissions, classes);
    expect(unitMetrics).toHaveLength(3);

    // Lớp 10A1
    expect(unitMetrics[0].className).toBe('Lớp 10A1');
    expect(unitMetrics[0].evaluatedCount).toBe(1);
    expect(unitMetrics[0].averageScore).toBe(85);
    expect(unitMetrics[0].passRate).toBe(100);
    expect(unitMetrics[0].gapDomainCodes).toEqual([]);

    // Lớp 10A2
    expect(unitMetrics[1].className).toBe('Lớp 10A2');
    expect(unitMetrics[1].evaluatedCount).toBe(1);
    expect(unitMetrics[1].averageScore).toBe(55);
    expect(unitMetrics[1].passRate).toBe(0);
    expect(unitMetrics[1].gapDomainCodes).toEqual(['D1', 'D3', 'D5']);

    // Lớp 10A3 (Trống)
    expect(unitMetrics[2].className).toBe('Lớp 10A3');
    expect(unitMetrics[2].evaluatedCount).toBe(0);
    expect(unitMetrics[2].averageScore).toBeNull();
    expect(unitMetrics[2].passRate).toBeNull();
  });

  it('tạo chuỗi thời gian xu hướng trung thực: bỏ qua các kỳ không có bài nộp duyệt (không vẽ 0% giả)', () => {
    const campaigns = [
      {
        id: 'cmp-1',
        title: 'Khảo sát Đầu năm 2026',
        status: 'COMPLETED',
        starts_at: '2026-01-10T00:00:00Z',
        ends_at: '2026-01-20T00:00:00Z',
      },
      {
        id: 'cmp-2',
        title: 'Đợt 2 (Không có bài thi)',
        status: 'COMPLETED',
        starts_at: '2026-03-01T00:00:00Z',
        ends_at: '2026-03-10T00:00:00Z',
      },
      {
        id: 'cmp-3',
        title: 'Khảo sát Giữa kỳ 2026',
        status: 'ACTIVE',
        starts_at: '2026-05-15T00:00:00Z',
        ends_at: '2026-05-25T00:00:00Z',
      },
    ];

    const submissions = [
      {
        id: 'sub-1',
        campaign_id: 'cmp-1',
        status: 'EVALUATED',
        percentage: 72,
        is_passed: true,
        domain_scores: { D1: 75, D2: 70, D3: 70, D4: 75, D5: 70 },
      },
      {
        id: 'sub-2',
        campaign_id: 'cmp-3',
        status: 'EVALUATED',
        percentage: 84,
        is_passed: true,
        domain_scores: { D1: 85, D2: 80, D3: 85, D4: 85, D5: 85 },
      },
    ];

    const trend = OrgCompetencyAnalyticsService.aggregateTimeSeriesTrend(submissions, campaigns);

    // Only cmp-1 and cmp-3 should be in trend, cmp-2 is completely omitted
    expect(trend).toHaveLength(2);
    expect(trend[0].key).toBe('cmp-1');
    expect(trend[0].averageScore).toBe(72);
    expect(trend[1].key).toBe('cmp-3');
    expect(trend[1].averageScore).toBe(84);
  });
});
