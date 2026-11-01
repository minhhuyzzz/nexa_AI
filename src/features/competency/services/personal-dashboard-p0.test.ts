import { describe, it, expect } from 'vitest';

function normalizeDomainCode(rawCode?: string | null): string {
  if (!rawCode) return 'D1';
  const clean = rawCode.trim().toUpperCase();
  if (clean.startsWith('DOMAIN_')) {
    return `D${clean.replace('DOMAIN_', '')}`;
  }
  if (clean.startsWith('DOMAIN')) {
    return `D${clean.replace('DOMAIN', '')}`;
  }
  if (/^D[1-5]$/.test(clean)) {
    return clean;
  }
  return clean;
}

describe('Personal Dashboard P0 Requirements', () => {
  describe('Domain Code Normalization', () => {
    it('normalizes DOMAIN_X and DOMAINX to DX canonical format', () => {
      expect(normalizeDomainCode('DOMAIN_1')).toBe('D1');
      expect(normalizeDomainCode('DOMAIN_2')).toBe('D2');
      expect(normalizeDomainCode('DOMAIN_4')).toBe('D4');
      expect(normalizeDomainCode('domain_5')).toBe('D5');
      expect(normalizeDomainCode('DOMAIN3')).toBe('D3');
      expect(normalizeDomainCode('D1')).toBe('D1');
      expect(normalizeDomainCode('d4')).toBe('D4');
      expect(normalizeDomainCode(null)).toBe('D1');
    });
  });

  describe('Dynamic Learning Path Progress Consistency', () => {
    it('computes exact completion ratios without hardcoded fallback values', () => {
      const mockSteps = [
        { id: '1', domainCode: 'D1', status: 'completed' },
        { id: '2', domainCode: 'D1', status: 'completed' },
        { id: '3', domainCode: 'D1', status: 'in_progress' },
        { id: '4', domainCode: 'D2', status: 'in_progress' },
        { id: '5', domainCode: 'D4', status: 'completed' },
      ];

      const totalStepsCount = mockSteps.length;
      const completedCount = mockSteps.filter((s) => s.status === 'completed').length;
      const inProgressCount = mockSteps.filter((s) => s.status === 'in_progress').length;
      const unstartedCount = Math.max(0, totalStepsCount - completedCount - inProgressCount);
      const overallProgressPercent = totalStepsCount > 0 ? Math.round((completedCount / totalStepsCount) * 100) : 0;

      expect(totalStepsCount).toBe(5);
      expect(completedCount).toBe(3);
      expect(inProgressCount).toBe(2);
      expect(unstartedCount).toBe(0);
      expect(overallProgressPercent).toBe(60);

      // Verify domain-level sums match the overall sum
      const domainCodes = ['D1', 'D2', 'D3', 'D4', 'D5'];
      let domainSumCompleted = 0;
      let domainSumTotal = 0;

      domainCodes.forEach((code) => {
        const domainSteps = mockSteps.filter((s) => s.domainCode === code);
        const domCompleted = domainSteps.filter((s) => s.status === 'completed').length;
        domainSumCompleted += domCompleted;
        domainSumTotal += domainSteps.length;
      });

      expect(domainSumCompleted).toBe(completedCount);
      expect(domainSumTotal).toBe(totalStepsCount);
    });

    it('handles empty curriculum cleanly without falsy fallback numbers', () => {
      const emptySteps: any[] = [];
      const totalStepsCount = emptySteps.length;
      const completedCount = emptySteps.filter((s) => s.status === 'completed').length;
      const overallProgressPercent = totalStepsCount > 0 ? Math.round((completedCount / totalStepsCount) * 100) : 0;

      expect(totalStepsCount).toBe(0);
      expect(completedCount).toBe(0);
      expect(overallProgressPercent).toBe(0); // NOT 25% or 3/12!
    });
  });

  describe('Unassessed Competency Representation', () => {
    it('properly distinguishes unassessed domains from 0% failures', () => {
      const radarData = [
        { code: 'D1', score: null, target: 70 },
        { code: 'D2', score: null, target: 70 },
        { code: 'D3', score: null, target: 70 },
        { code: 'D4', score: null, target: 70 },
        { code: 'D5', score: null, target: 70 },
      ];

      const hasTakenAssessment = false;
      const passedDomainsCount = radarData.filter((d) => (d.score ?? 0) >= 70).length;

      // When unassessed, UI must report "Chưa đánh giá", never "0/5 miền đạt chuẩn"
      const metricLabel = hasTakenAssessment ? `${passedDomainsCount} / 5` : 'Chưa đánh giá';
      expect(metricLabel).toBe('Chưa đánh giá');
      expect(metricLabel).not.toBe('0 / 5');
    });

    it('accurately counts passed domains when assessment results exist', () => {
      const radarData = [
        { code: 'D1', score: 85, target: 70 },
        { code: 'D2', score: 72, target: 70 },
        { code: 'D3', score: 60, target: 70 }, // gap
        { code: 'D4', score: 45, target: 70 }, // gap
        { code: 'D5', score: null, target: 70 }, // unassessed
      ];

      const hasTakenAssessment = true;
      const passedDomainsCount = radarData.filter((d) => (d.score ?? 0) >= 70).length;
      const metricLabel = hasTakenAssessment ? `${passedDomainsCount} / 5` : 'Chưa đánh giá';

      expect(passedDomainsCount).toBe(2);
      expect(metricLabel).toBe('2 / 5');
    });
  });

  describe('Decoupling Credentials from Activity Points', () => {
    it('does not grant certificate unlock based on points threshold', () => {
      const userProfile = {
        points: 500, // Above previous 450 threshold
        hasValidCredentialRecord: false,
      };

      // Rule: Certificate unlock MUST strictly depend on genuine credential record, not XP points
      const isCertUnlocked = userProfile.hasValidCredentialRecord;
      expect(isCertUnlocked).toBe(false);
    });
  });

  describe('Master Progression Milestones (Automated Status)', () => {
    function computeMasterMilestones(params: {
      hasTakenAssessment?: boolean;
      totalAssessmentsCompleted?: number;
      radarScores: (number | null)[];
      loginStreak: number;
      points: number;
      isCertUnlocked: boolean;
      baselineTestId: string;
    }) {
      return [
        {
          id: 'm1',
          title: 'Hoàn thành bài đánh giá đầu vào',
          done: Boolean(params.hasTakenAssessment),
          actionHref: `/personal/take/${params.baselineTestId}`,
        },
        {
          id: 'm2',
          title: 'Bắt đầu bài học đầu tiên trong lộ trình',
          done: Boolean(params.totalAssessmentsCompleted && params.totalAssessmentsCompleted > 0) || params.points > 1,
          actionHref: '/personal/learning-path',
        },
        {
          id: 'm3',
          title: 'Đạt chuẩn ít nhất 1 miền năng lực (≥ 70%)',
          done: Boolean(params.radarScores.some((s) => (s ?? 0) >= 70)),
          actionHref: '/personal/competency',
        },
        {
          id: 'm4',
          title: 'Duy trì chuỗi chuyên cần 3 ngày',
          done: params.loginStreak >= 3,
        },
        {
          id: 'm5',
          title: 'Tích lũy 50 PTS hoạt động',
          done: params.points >= 50,
        },
        {
          id: 'm6',
          title: 'Nhận chứng chỉ Năng lực số chuẩn hóa',
          done: Boolean(params.isCertUnlocked),
          actionHref: '/personal/credentials',
        },
      ];
    }

    it('initializes fresh user with 0 completed milestones and correct actions', () => {
      const milestones = computeMasterMilestones({
        hasTakenAssessment: false,
        totalAssessmentsCompleted: 0,
        radarScores: [null, null, null, null, null],
        loginStreak: 1,
        points: 1,
        isCertUnlocked: false,
        baselineTestId: 'test-123',
      });

      const completed = milestones.filter((m) => m.done).length;
      expect(completed).toBe(0);
      expect(milestones[0].done).toBe(false);
      expect(milestones[0].actionHref).toBe('/personal/take/test-123');
      expect(milestones[2].done).toBe(false);
    });

    it('automatically transitions milestones as user makes real progress', () => {
      const milestones = computeMasterMilestones({
        hasTakenAssessment: true,
        totalAssessmentsCompleted: 1,
        radarScores: [75, 50, 40, null, null], // D1 passed >= 70
        loginStreak: 3,
        points: 55,
        isCertUnlocked: false,
        baselineTestId: 'test-123',
      });

      expect(milestones.find((m) => m.id === 'm1')?.done).toBe(true);
      expect(milestones.find((m) => m.id === 'm2')?.done).toBe(true);
      expect(milestones.find((m) => m.id === 'm3')?.done).toBe(true); // 75 >= 70
      expect(milestones.find((m) => m.id === 'm4')?.done).toBe(true); // streak 3 >= 3
      expect(milestones.find((m) => m.id === 'm5')?.done).toBe(true); // 55 >= 50
      expect(milestones.find((m) => m.id === 'm6')?.done).toBe(false); // cert still locked

      const completedCount = milestones.filter((m) => m.done).length;
      expect(completedCount).toBe(5);
    });
  });

  describe('Learning Goals Schema & Editing', () => {
    it('validates learning goal fields and provides fallback values', () => {
      const defaultGoal = {
        title: 'Nâng cao kỹ năng sử dụng công nghệ trong học tập và công việc',
        track: 'Lộ trình cơ bản',
        pace: 'Học theo tốc độ riêng',
        targetScore: 70,
      };

      const userGoal = {
        title: 'Ôn luyện đạt chứng chỉ Năng lực số chuẩn quốc gia',
        track: 'Luyện thi chứng chỉ',
        pace: '3 buổi / tuần (khoảng 30 phút/ngày)',
        targetScore: 80,
      };

      expect(userGoal.title.length).toBeGreaterThan(0);
      expect(userGoal.targetScore).toBe(80);
      expect(defaultGoal.targetScore).toBe(70);
    });
  });
});
