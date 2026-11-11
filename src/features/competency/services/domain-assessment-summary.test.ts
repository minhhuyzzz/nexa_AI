import { describe, it, expect, vi } from 'vitest';
import { DomainAssessmentSummaryService } from './domain-assessment-summary.service';

describe('DomainAssessmentSummaryService - Baseline Decoupling', () => {
  it('excludes intake baseline assessment from accumulated mastery radar while populating baseline starting point', async () => {
    const mockSupabase: any = {
      from: vi.fn((table: string) => {
        if (table === 'assessment_submissions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({
                    data: [
                      {
                        id: 'sub_baseline_01',
                        assessment_id: 'a0000000-0000-0000-0000-000000000001',
                        total_score: 5,
                        max_score: 25,
                        percentage: 20,
                        is_passed: false,
                        submitted_at: '2026-11-09T10:00:00Z',
                      },
                    ],
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'assessments') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: 'a0000000-0000-0000-0000-000000000001',
                    title: 'Khảo sát Năng lực số Ban đầu',
                    is_system_baseline: true,
                    system_code: 'BASELINE_DIGCOMP',
                  },
                ],
              }),
            }),
          };
        }
        if (table === 'submission_answers') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: 'ans_1',
                    score_awarded: 1,
                    assessment_items: { points: 1, competencies: { competency_domains: { domain_index: 1 } } },
                  },
                ],
              }),
            }),
          };
        }
        if (table === 'competency_evidence') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [] }),
            }),
          };
        }
        if (table === 'learner_competency_snapshots') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: {
                        domain_scores: { '01': 20, '02': 20, '03': 0, '04': 20, '05': 40 },
                        overall_score: 20,
                        created_at: '2026-11-09T10:00:00Z',
                      },
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'user_learning_progress') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: [] }),
              }),
            }),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
        };
      }),
    };

    const summary = await DomainAssessmentSummaryService.getUserCompetencySummary(mockSupabase, 'user_test_baseline');

    // 1. Learner has completed intake assessment, establishing profile
    expect(summary.hasTakenAssessment).toBe(true);

    // 2. Main Radar (accumulated mastery) MUST start cleanly at 0% (Khởi đầu), NOT 20% or 40%!
    summary.radarData.forEach((dom) => {
      expect(dom.score).toBe(0);
      expect(dom.level).toBe('Khởi đầu');
      expect(dom.hasData).toBe(true);
    });

    // 3. Baseline starting point preserves diagnostic T0 scores
    expect(summary.baselineRadarData).toBeDefined();
    const bD1 = summary.baselineRadarData?.find((d) => d.code === 'D1');
    const bD5 = summary.baselineRadarData?.find((d) => d.code === 'D5');
    const bD3 = summary.baselineRadarData?.find((d) => d.code === 'D3');
    expect(bD1?.score).toBe(20);
    expect(bD5?.score).toBe(40);
    expect(bD3?.score).toBe(0);

    // 4. Overall accumulated score is 0% (Khởi đầu)
    expect(summary.overallScore).toBe(0);
    expect(summary.overallLevel).toBe('Khởi đầu');
  });

  it('accumulates pathway mastery when user completes modules', async () => {
    const mockSupabase: any = {
      from: vi.fn((table: string) => {
        if (table === 'assessment_submissions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({
                    data: [
                      {
                        id: 'sub_baseline_01',
                        assessment_id: 'a0000000-0000-0000-0000-000000000001',
                        total_score: 5,
                        max_score: 25,
                        percentage: 20,
                        is_passed: false,
                        submitted_at: '2026-11-09T10:00:00Z',
                      },
                    ],
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'assessments') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: 'a0000000-0000-0000-0000-000000000001',
                    is_system_baseline: true,
                  },
                ],
              }),
            }),
          };
        }
        if (table === 'submission_answers') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: [] }),
            }),
          };
        }
        if (table === 'competency_evidence') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [] }),
            }),
          };
        }
        if (table === 'learner_competency_snapshots') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({ data: null }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'user_learning_progress') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                // D3 has completed 2 modules (out of 4) -> 50%
                eq: vi.fn().mockResolvedValue({
                  data: [
                    { module_id: 'm1', is_completed: true, learning_modules: { domain_code: 'D3' } },
                    { module_id: 'm2', is_completed: true, learning_modules: { domain_code: 'D3' } },
                  ],
                }),
              }),
            }),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
        };
      }),
    };

    const summary = await DomainAssessmentSummaryService.getUserCompetencySummary(mockSupabase, 'user_pathway');
    const d3 = summary.radarData.find((d) => d.code === 'D3');
    expect(d3?.score).toBe(50);
    expect(d3?.level).toBe('Đang bồi dưỡng');
    expect(d3?.status).toBe('DEVELOPING');

    const otherDomains = summary.radarData.filter((d) => d.code !== 'D3');
    otherDomains.forEach((d) => {
      expect(d.score).toBe(0);
      expect(d.level).toBe('Khởi đầu');
    });
  });

  it('counts only legitimately passed assessments (>= 70% or is_passed=true) in totalAssessmentsCompleted', async () => {
    const mockSupabase: any = {
      from: vi.fn((table: string) => {
        if (table === 'assessment_submissions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({
                    data: [
                      // Sub 1: Failed intake survey (20%) -> DO NOT COUNT in completed standard
                      {
                        id: 'sub_failed_1',
                        assessment_id: 'a0000000-0000-0000-0000-000000000001',
                        total_score: 5,
                        max_score: 25,
                        percentage: 20,
                        is_passed: false,
                        submitted_at: '2026-11-09T10:00:00Z',
                      },
                      // Sub 2: Failed practice exam (55%) -> DO NOT COUNT
                      {
                        id: 'sub_failed_2',
                        assessment_id: 'a0000000-0000-0000-0000-000000000002',
                        total_score: 11,
                        max_score: 20,
                        percentage: 55,
                        is_passed: false,
                        submitted_at: '2026-11-09T11:00:00Z',
                      },
                      // Sub 3: Passed standardized exam (85%) -> MUST COUNT (1)
                      {
                        id: 'sub_passed_3',
                        assessment_id: 'a0000000-0000-0000-0000-000000000003',
                        total_score: 17,
                        max_score: 20,
                        percentage: 85,
                        is_passed: true,
                        submitted_at: '2026-11-09T12:00:00Z',
                      },
                    ],
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'assessments') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [
                  { id: 'a0000000-0000-0000-0000-000000000001', is_system_baseline: true },
                  { id: 'a0000000-0000-0000-0000-000000000002', is_system_baseline: false },
                  { id: 'a0000000-0000-0000-0000-000000000003', is_system_baseline: false },
                ],
              }),
            }),
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({ data: [] }),
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: null }),
                }),
              }),
              eq: vi.fn().mockResolvedValue({ data: [] }),
            }),
          }),
        };
      }),
    };

    const summary = await DomainAssessmentSummaryService.getUserCompetencySummary(mockSupabase, 'user_standard_check');
    expect(summary.hasTakenAssessment).toBe(true);
    // MUST ONLY BE 1, NOT 3!
    expect(summary.totalAssessmentsCompleted).toBe(1);
  });
});
