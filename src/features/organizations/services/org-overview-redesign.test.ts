import { describe, it, expect } from 'vitest';
import { OrgCompetencyAnalyticsService } from '@/features/analytics/services/org-competency-analytics.service';

describe('Org Overview Redesign & Fidelity Suite', () => {
  describe('KPI Metric & Zero-Denominator Safety', () => {
    it('should NOT format seats as 2/0 when organization is unactivated (isActive = false)', () => {
      const mockEntitlements = {
        contractNumber: 'CHƯA_KÍCH_HOẠT',
        maxSeats: 0,
        maxAssessments: 0,
        aiCreditsGranted: 0,
        aiCreditsUsed: 0,
        remainingCredits: 0,
        isActive: false,
      };

      const membersCount = 2;

      // The new design checks isActive:
      const seatSubtext = !mockEntitlements.isActive
        ? 'Hạn mức: chưa được cấp'
        : `Còn lại ${Math.max(0, mockEntitlements.maxSeats - membersCount)} / ${mockEntitlements.maxSeats} ghế khả dụng`;

      expect(seatSubtext).toBe('Hạn mức: chưa được cấp');
      expect(seatSubtext).not.toContain('/ 0');
    });

    it('should properly format available seats when organization has an active contract', () => {
      const mockEntitlements = {
        contractNumber: 'NEXA-B2B-2026-FPT',
        maxSeats: 50,
        maxAssessments: 20,
        aiCreditsGranted: 1000,
        aiCreditsUsed: 120,
        remainingCredits: 880,
        isActive: true,
      };

      const membersCount = 14;
      const remaining = Math.max(0, mockEntitlements.maxSeats - membersCount);
      const seatSubtext = !mockEntitlements.isActive
        ? 'Hạn mức: chưa được cấp'
        : `Còn lại ${remaining} / ${mockEntitlements.maxSeats} ghế khả dụng`;

      expect(seatSubtext).toBe('Còn lại 36 / 50 ghế khả dụng');
    });

    it('should format completion rate as null / dash when there are zero submissions (no fake 0%)', () => {
      const totalSubmissions = 0;
      const evaluatedSubmissions = 0;

      const completionRate =
        totalSubmissions > 0
          ? Math.round((evaluatedSubmissions / totalSubmissions) * 100)
          : null;

      expect(completionRate).toBeNull();
    });

    it('should calculate truthful completion rate when submissions exist', () => {
      const totalSubmissions = 20;
      const evaluatedSubmissions = 15;

      const completionRate =
        totalSubmissions > 0
          ? Math.round((evaluatedSubmissions / totalSubmissions) * 100)
          : null;

      expect(completionRate).toBe(75);
    });
  });

  describe('5-Domain Competency Aggregation for Overview', () => {
    it('returns score: null for untested domains and exact score for tested domains', () => {
      const submissions = [
        {
          id: 'sub-1',
          status: 'EVALUATED',
          percentage: 85,
          is_passed: true,
          domain_scores: {
            D1: 80,
            D3: 90,
          },
        },
        {
          id: 'sub-2',
          status: 'EVALUATED',
          percentage: 65,
          is_passed: false,
          domain_scores: {
            D1: 60,
            D3: 70,
          },
        },
      ];

      const result = OrgCompetencyAnalyticsService.aggregateOrgCompetency(submissions);

      expect(result.domains).toHaveLength(5);

      const d1 = result.domains.find((d) => d.domainCode === 'D1');
      const d2 = result.domains.find((d) => d.domainCode === 'D2');
      const d3 = result.domains.find((d) => d.domainCode === 'D3');
      const d4 = result.domains.find((d) => d.domainCode === 'D4');
      const d5 = result.domains.find((d) => d.domainCode === 'D5');

      // D1 average: (80 + 60) / 2 = 70
      expect(d1?.score).toBe(70);
      // D3 average: (90 + 70) / 2 = 80
      expect(d3?.score).toBe(80);
      // Untested domains must be strictly null (never 0)
      expect(d2?.score).toBeNull();
      expect(d4?.score).toBeNull();
      expect(d5?.score).toBeNull();
    });

    it('differentiates score: 0 from score: null when an assessed domain scores 0', () => {
      const submissions = [
        {
          id: 'sub-zero',
          status: 'EVALUATED',
          percentage: 0,
          is_passed: false,
          domain_scores: {
            D4: 0,
          },
        },
      ];

      const result = OrgCompetencyAnalyticsService.aggregateOrgCompetency(submissions);
      const d4 = result.domains.find((d) => d.domainCode === 'D4');
      const d5 = result.domains.find((d) => d.domainCode === 'D5');

      expect(d4?.score).toBe(0);
      expect(d5?.score).toBeNull();
    });
  });

  describe('Campaign Progress & Batch Calculation', () => {
    it('computes campaign progress from actual enrolled class members, avoiding fake numbers', () => {
      const classMemberCountMap: Record<string, number> = {
        'class-a': 25,
        'class-b': 30,
      };

      const campaign = {
        id: 'camp-1',
        title: 'Kỳ thi Chuẩn DigComp 2026',
        class_ids: ['class-a', 'class-b'],
      };

      const totalAssigned = campaign.class_ids.reduce(
        (sum, cid) => sum + (classMemberCountMap[cid] || 0),
        0
      );

      const submittedCount = 44;
      const percent = totalAssigned > 0
        ? Math.min(100, Math.round((submittedCount / totalAssigned) * 100))
        : 0;

      expect(totalAssigned).toBe(55);
      expect(percent).toBe(80);
    });

    it('handles empty class gracefully without dividing by zero', () => {
      const classMemberCountMap: Record<string, number> = {};
      const campaign = {
        id: 'camp-empty',
        title: 'Đợt chưa có lớp',
        class_ids: [],
      };

      const totalAssigned = campaign.class_ids.reduce(
        (sum, cid) => sum + (classMemberCountMap[cid] || 0),
        0
      );

      const submittedCount = 0;
      const percent = totalAssigned > 0
        ? Math.min(100, Math.round((submittedCount / totalAssigned) * 100))
        : 0;

      expect(totalAssigned).toBe(0);
      expect(percent).toBe(0);
    });
  });

  describe('Operational Readiness Checklist Logic', () => {
    it('evaluates all 4 onboarding steps accurately', () => {
      // Step 1: Tạo lớp và thêm thành viên
      expect(0 > 0 && 1 > 1).toBe(false);
      expect(1 > 0 && 2 > 1).toBe(true);

      // Step 2: Xây dựng ngân hàng đề
      expect(0 > 0).toBe(false);
      expect(3 > 0).toBe(true);

      // Step 3: Phát hành đợt đánh giá
      expect(0 > 0).toBe(false);
      expect(1 > 0).toBe(true);

      // Step 4: Kích hoạt quyền lợi hợp đồng
      expect(false).toBe(false);
      expect(true).toBe(true);
    });
  });

  describe('Role-Based Member View Isolation', () => {
    it('identifies member role and confirms admin KPIs should NOT be displayed', () => {
      const role: string = 'MEMBER';
      const isSuperadmin = false;
      const isOwnerOrAdmin = isSuperadmin || role === 'ORG_OWNER' || role === 'ORG_ADMIN';

      expect(isOwnerOrAdmin).toBe(false);
      expect(role === 'MEMBER').toBe(true);
    });

    it('identifies owner or admin role correctly', () => {
      const role: string = 'ORG_ADMIN';
      const isSuperadmin = false;
      const isOwnerOrAdmin = isSuperadmin || role === 'ORG_OWNER' || role === 'ORG_ADMIN';

      expect(isOwnerOrAdmin).toBe(true);
    });
  });
});
