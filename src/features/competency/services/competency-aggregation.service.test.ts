import { describe, it, expect, vi } from 'vitest';
import { CompetencyAggregationService } from './competency-aggregation.service';

describe('CompetencyAggregationService', () => {
  it('correctly handles unassessed user with null scores and INSUFFICIENT_DATA status', async () => {
    const mockSupabase: any = {
      from: vi.fn((table: string) => {
        if (table === 'competency_domains') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [
                  { id: 'd1', code: 'D1', title: 'Thông tin & Dữ liệu', domain_index: 1, competencies: [{ id: 'c1', skill_code: '1.1', title: 'Duyệt tìm' }] },
                  { id: 'd2', code: 'D2', title: 'Giao tiếp & Hợp tác', domain_index: 2, competencies: [{ id: 'c2', skill_code: '2.1', title: 'Tương tác' }] },
                  { id: 'd3', code: 'D3', title: 'Sáng tạo Nội dung số', domain_index: 3, competencies: [{ id: 'c3', skill_code: '3.1', title: 'Phát triển nội dung' }] },
                  { id: 'd4', code: 'D4', title: 'An toàn & Bảo mật', domain_index: 4, competencies: [{ id: 'c4', skill_code: '4.1', title: 'Bảo vệ thiết bị' }] },
                  { id: 'd5', code: 'D5', title: 'Giải quyết Vấn đề', domain_index: 5, competencies: [{ id: 'c5', skill_code: '5.1', title: 'Giải quyết kỹ thuật' }] },
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
        if (table === 'assessment_submissions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({ data: [] }),
                eq: vi.fn().mockResolvedValue({ data: [] }),
              }),
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
        return {
          select: vi.fn().mockReturnThis(),
        };
      }),
    };

    const result = await CompetencyAggregationService.calculateLearnerRadar(mockSupabase, 'user_123');

    expect(result.overallScore).toBeNull();
    expect(result.overallStatus).toBe('INSUFFICIENT_DATA');
    expect(result.assessedDomainsCount).toBe(0);
    expect(result.totalDomainsCount).toBe(5);
    expect(result.domains).toHaveLength(5);

    // Each domain must have score null (NOT 0!)
    result.domains.forEach((dom) => {
      expect(dom.score).toBeNull();
      expect(dom.status).toBe('INSUFFICIENT_DATA');
      expect(dom.level).toBe('Chưa đủ dữ liệu');
      expect(dom.hasData).toBe(false);
    });
  });

  it('correctly calculates score when evidence is present for some domains and leaves others null', async () => {
    const mockSupabase: any = {
      from: vi.fn((table: string) => {
        if (table === 'competency_domains') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [
                  { id: 'd1', code: 'D1', title: 'Thông tin & Dữ liệu', domain_index: 1, competencies: [{ id: 'c1', skill_code: '1.1', title: 'Duyệt tìm' }] },
                  { id: 'd2', code: 'D2', title: 'Giao tiếp & Hợp tác', domain_index: 2, competencies: [{ id: 'c2', skill_code: '2.1', title: 'Tương tác' }] },
                  { id: 'd3', code: 'D3', title: 'Sáng tạo Nội dung số', domain_index: 3, competencies: [{ id: 'c3', skill_code: '3.1', title: 'Phát triển nội dung' }] },
                  { id: 'd4', code: 'D4', title: 'An toàn & Bảo mật', domain_index: 4, competencies: [{ id: 'c4', skill_code: '4.1', title: 'Bảo vệ thiết bị' }] },
                  { id: 'd5', code: 'D5', title: 'Giải quyết Vấn đề', domain_index: 5, competencies: [{ id: 'c5', skill_code: '5.1', title: 'Giải quyết kỹ thuật' }] },
                ],
              }),
            }),
          };
        }
        if (table === 'competency_evidence') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [
                  { competency_id: 'c1', score: 80, weight: 1.0 }, // D1 has score 80
                ],
              }),
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
        return {
          select: vi.fn().mockReturnThis(),
        };
      }),
    };

    const result = await CompetencyAggregationService.calculateLearnerRadar(mockSupabase, 'user_123');

    expect(result.overallScore).toBe(80);
    expect(result.overallStatus).toBe('ASSESSED');
    expect(result.assessedDomainsCount).toBe(1);
    expect(result.totalDomainsCount).toBe(5);

    // D1 has score 80
    const d1 = result.domains.find((d) => d.domainCode === 'D1');
    expect(d1?.score).toBe(80);
    expect(d1?.status).toBe('PROFICIENT');
    expect(d1?.hasData).toBe(true);

    // D2..D5 have score null
    const unassessed = result.domains.filter((d) => d.domainCode !== 'D1');
    expect(unassessed).toHaveLength(4);
    unassessed.forEach((dom) => {
      expect(dom.score).toBeNull();
      expect(dom.status).toBe('INSUFFICIENT_DATA');
      expect(dom.hasData).toBe(false);
    });
  });
});
