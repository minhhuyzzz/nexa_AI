import { describe, it, expect } from 'vitest';

export function calculateScoreOn10(totalScore: number, maxScore: number): number {
  if (maxScore <= 0) return 0;
  return Math.round((totalScore / maxScore) * 100) / 10;
}

export function evaluatePassingStatus(scoreOn10: number): boolean {
  return scoreOn10 >= 7.0;
}

export function calculatePointsAwarded(isPassed: boolean, hasPassedBefore: boolean): number {
  if (!isPassed) return 0;
  if (hasPassedBefore) return 0; // Anti-farming
  return 10; // +10 points for passing standard
}

export interface DomainAggInput {
  index: number;
  earned: number;
  max: number;
}

export function computeDomainRadarPercentages(domains: DomainAggInput[]): { index: number; score: number; isGap: boolean }[] {
  return domains.map((d) => {
    const score = d.max > 0 ? Math.round((d.earned / d.max) * 100) : 70;
    return {
      index: d.index,
      score,
      isGap: score < 70,
    };
  });
}

describe('NEXA Standard Scoring & Radar Aggregation Engine', () => {
  describe('Thang điểm 10 (0.0 - 10.0)', () => {
    it('chuyển đổi chính xác điểm số theo thang điểm 10 làm tròn 1 chữ số thập phân', () => {
      expect(calculateScoreOn10(8, 10)).toBe(8.0);
      expect(calculateScoreOn10(7, 10)).toBe(7.0);
      expect(calculateScoreOn10(14, 20)).toBe(7.0);
      expect(calculateScoreOn10(17, 20)).toBe(8.5);
      expect(calculateScoreOn10(0, 10)).toBe(0.0);
      expect(calculateScoreOn10(10, 10)).toBe(10.0);
    });

    it('xác định chuẩn đạt chính xác tại ngưỡng >= 7.0 / 10.0', () => {
      expect(evaluatePassingStatus(7.0)).toBe(true);
      expect(evaluatePassingStatus(8.5)).toBe(true);
      expect(evaluatePassingStatus(10.0)).toBe(true);
      expect(evaluatePassingStatus(6.9)).toBe(false);
      expect(evaluatePassingStatus(5.5)).toBe(false);
      expect(evaluatePassingStatus(0.0)).toBe(false);
    });
  });

  describe('Cơ chế thưởng điểm tích lũy hồ sơ (Points) & Chống farm', () => {
    it('thưởng +10 điểm tích lũy khi bài thi đạt chuẩn lần đầu', () => {
      const isPassed = true;
      const hasPassedBefore = false;
      expect(calculatePointsAwarded(isPassed, hasPassedBefore)).toBe(10);
    });

    it('không cộng điểm lặp khi học viên đã từng đạt bài thi này trước đó (Anti-farming)', () => {
      const isPassed = true;
      const hasPassedBefore = true;
      expect(calculatePointsAwarded(isPassed, hasPassedBefore)).toBe(0);
    });

    it('không cộng điểm khi bài thi chưa đạt chuẩn (< 7.0 điểm)', () => {
      const isPassed = false;
      const hasPassedBefore = false;
      expect(calculatePointsAwarded(isPassed, hasPassedBefore)).toBe(0);
    });
  });

  describe('Cơ chế gom điểm Biểu đồ Mạng nhện 5 miền (Process Aggregation)', () => {
    it('tính toán chính xác phần trăm 5 miền và nhận diện khoảng trống năng lực (< 70%)', () => {
      const mockDomains: DomainAggInput[] = [
        { index: 1, earned: 18, max: 20 }, // 90%
        { index: 2, earned: 15, max: 20 }, // 75%
        { index: 3, earned: 11, max: 20 }, // 55% -> Gap
        { index: 4, earned: 19, max: 20 }, // 95%
        { index: 5, earned: 14, max: 20 }, // 70%
      ];

      const results = computeDomainRadarPercentages(mockDomains);

      expect(results[0]).toEqual({ index: 1, score: 90, isGap: false });
      expect(results[1]).toEqual({ index: 2, score: 75, isGap: false });
      expect(results[2]).toEqual({ index: 3, score: 55, isGap: true });
      expect(results[3]).toEqual({ index: 4, score: 95, isGap: false });
      expect(results[4]).toEqual({ index: 5, score: 70, isGap: false });
    });
  });
});
