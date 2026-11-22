import { describe, it, expect } from 'vitest';
import {
  PersonalSubmissionItem,
  SubmissionTabKey,
} from '@/features/classes/types/personal-submissions.types';

describe('Personal Submissions Workflow (UX v2 - 6 Screens)', () => {
  describe('Tab Filtering and Status Logic', () => {
    const mockItems: PersonalSubmissionItem[] = [
      {
        id: '1',
        assessmentId: 'asm-1',
        title: 'Phân tích dữ liệu và rút ra kết luận',
        className: 'Lớp Phân tích dữ liệu',
        classCode: 'DA-01',
        evaluatorName: 'Thầy Tuấn',
        description: 'Mô tả bài 1',
        requirements: [],
        rubric: [],
        attachments: [],
        deadlineFormatted: '12/11/2026 · 23:59',
        isOverdue: false,
        status: 'todo',
        statusLabel: 'Chưa bắt đầu',
      },
      {
        id: '2',
        assessmentId: 'asm-2',
        title: 'Thiết kế kế hoạch truyền thông số',
        className: 'Nhóm Dự án truyền thông',
        classCode: 'TT-02',
        evaluatorName: 'Cô Lan',
        description: 'Mô tả bài 2',
        requirements: [],
        rubric: [],
        attachments: [],
        deadlineFormatted: '08/11/2026 · 23:59',
        isOverdue: false,
        status: 'progress',
        statusLabel: 'Bản nháp',
      },
      {
        id: '3',
        assessmentId: 'asm-3',
        title: 'Báo cáo nghiên cứu người dùng',
        className: 'Nhóm Nghiên cứu UX',
        classCode: 'UX-03',
        evaluatorName: 'Trưởng nhóm',
        description: 'Mô tả bài 3',
        requirements: [],
        rubric: [],
        attachments: [],
        deadlineFormatted: '05/11/2026 · 23:59',
        isOverdue: false,
        status: 'wait',
        statusLabel: 'Chờ đánh giá',
      },
      {
        id: '4',
        assessmentId: 'asm-4',
        title: 'Kiểm tra kiến thức — Chương 2',
        className: 'Lớp Phân tích dữ liệu',
        classCode: 'DA-01',
        evaluatorName: 'Thầy Tuấn',
        description: 'Mô tả bài 4',
        requirements: [],
        rubric: [],
        attachments: [],
        deadlineFormatted: '29/10/2026 · 23:59',
        isOverdue: false,
        status: 'done',
        statusLabel: 'Đã chấm',
        officialScore: 8.5,
        maxScore: 10,
      },
      {
        id: '5',
        assessmentId: 'asm-5',
        title: 'Nộp lại chuyên đề An toàn số',
        className: 'Lớp Kỹ năng số K48',
        classCode: 'KNS-48',
        evaluatorName: 'Giảng viên',
        description: 'Cần bổ sung minh chứng',
        requirements: [],
        rubric: [],
        attachments: [],
        deadlineFormatted: '01/11/2026 · 23:59',
        isOverdue: true,
        status: 'resubmit',
        statusLabel: 'Yêu cầu nộp lại',
      },
    ];

    function filterByTab(items: PersonalSubmissionItem[], tab: SubmissionTabKey): PersonalSubmissionItem[] {
      if (tab === 'all') return items;
      if (tab === 'todo') {
        return items.filter(
          (i) => i.status === 'todo' || i.status === 'progress' || i.status === 'resubmit'
        );
      }
      if (tab === 'wait') {
        return items.filter((i) => i.status === 'wait');
      }
      if (tab === 'done') {
        return items.filter((i) => i.status === 'done');
      }
      return items;
    }

    it('returns all items for "all" tab', () => {
      const result = filterByTab(mockItems, 'all');
      expect(result.length).toBe(5);
    });

    it('returns todo, progress, and resubmit items for "todo" tab', () => {
      const result = filterByTab(mockItems, 'todo');
      expect(result.length).toBe(3);
      expect(result.map((r) => r.id)).toEqual(['1', '2', '5']);
    });

    it('returns only submitted items for "wait" tab', () => {
      const result = filterByTab(mockItems, 'wait');
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('3');
    });

    it('returns only graded items for "done" tab', () => {
      const result = filterByTab(mockItems, 'done');
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('4');
    });
  });

  describe('Overdue Computation', () => {
    function computeOverdue(deadline: string | null, status: string, now: Date): boolean {
      if (!deadline) return false;
      const isCompleted = status === 'done' || status === 'wait';
      const endDate = new Date(deadline);
      return endDate < now && !isCompleted;
    }

    it('marks past deadline as overdue if not yet submitted or graded', () => {
      const past = new Date(Date.now() - 3600000).toISOString();
      const now = new Date();
      expect(computeOverdue(past, 'todo', now)).toBe(true);
      expect(computeOverdue(past, 'progress', now)).toBe(true);
      expect(computeOverdue(past, 'resubmit', now)).toBe(true);
    });

    it('does not mark past deadline as overdue if already submitted or graded', () => {
      const past = new Date(Date.now() - 3600000).toISOString();
      const now = new Date();
      expect(computeOverdue(past, 'wait', now)).toBe(false);
      expect(computeOverdue(past, 'done', now)).toBe(false);
    });

    it('does not mark future deadline as overdue', () => {
      const future = new Date(Date.now() + 86400000).toISOString();
      const now = new Date();
      expect(computeOverdue(future, 'todo', now)).toBe(false);
    });
  });

  describe('Rubric and Passing Score Computation', () => {
    it('correctly calculates total score and pass/fail status against threshold', () => {
      const rubric = [
        { id: '1', name: 'Độ chính xác', maxPoints: 4, awardedPoints: 3.5 },
        { id: '2', name: 'Phương pháp', maxPoints: 3, awardedPoints: 2.5 },
        { id: '3', name: 'Trình bày', maxPoints: 3, awardedPoints: 2.5 },
      ];
      const totalAwarded = rubric.reduce((sum, r) => sum + (r.awardedPoints || 0), 0);
      const totalMax = rubric.reduce((sum, r) => sum + r.maxPoints, 0);

      expect(totalAwarded).toBe(8.5);
      expect(totalMax).toBe(10);

      const passThreshold = totalMax * 0.7; // 70% threshold
      expect(totalAwarded >= passThreshold).toBe(true);
    });
  });

  describe('Personal and Organization Assignments Mapping & Custom Title Support', () => {
    it('bảo toàn nhiệm vụ nhóm cá nhân (organization_id = null) và ưu tiên custom_title khi có', () => {
      const rawAssignments = [
        {
          id: 'asg-personal-1',
          class_id: 'class-p-1',
          assessment_id: 'asm-1',
          deadline: '2026-12-01T23:59:00Z',
          security_settings: { custom_title: 'Kiểm tra giữa kỳ - Kỹ năng số K48' },
          evaluator_classes: {
            id: 'class-p-1',
            name: 'Nhóm Luyện tập Cá nhân A',
            class_code: 'CLS1234',
            evaluator_id: 'user-1',
            organization_id: null,
            profiles: { nickname: 'Thầy Hưng' },
          },
          assessments: {
            id: 'asm-1',
            title: 'Bài đánh giá năng lực số cơ bản',
            passing_score: 70,
            assessment_items: [{ id: 'item-1', prompt: 'Câu hỏi thực hành 1' }],
          },
        },
        {
          id: 'asg-org-1',
          class_id: 'class-org-1',
          assessment_id: 'asm-2',
          deadline: '2026-12-05T23:59:00Z',
          security_settings: {},
          evaluator_classes: {
            id: 'class-org-1',
            name: 'Lớp Chuyên đề CNTT 01',
            class_code: 'ORG5678',
            evaluator_id: 'user-2',
            organization_id: 'org-abc',
            profiles: { nickname: 'Khoa CNTT' },
          },
          assessments: {
            id: 'asm-2',
            title: 'Khảo sát an toàn thông tin',
            passing_score: 70,
            assessment_items: [{ id: 'item-2', prompt: 'Câu hỏi an toàn thông tin' }],
          },
        },
      ];

      const orgMap = new Map([
        ['org-abc', { id: 'org-abc', name: 'Đại học Quốc gia', code: 'VNU', slug: 'vnu' }],
      ]);

      const mapped = rawAssignments.map((ca) => {
        const cls = ca.evaluator_classes;
        const orgInfo = cls.organization_id ? orgMap.get(cls.organization_id) : null;
        const customTitle = (ca.security_settings as any)?.custom_title;
        return {
          id: ca.id,
          title: customTitle || ca.assessments.title,
          className: cls.name,
          organizationName: orgInfo?.name || null,
          isPersonal: cls.organization_id === null,
        };
      });

      expect(mapped.length).toBe(2);
      // Personal class assignment
      expect(mapped[0].isPersonal).toBe(true);
      expect(mapped[0].title).toBe('Kiểm tra giữa kỳ - Kỹ năng số K48');
      expect(mapped[0].className).toBe('Nhóm Luyện tập Cá nhân A');
      expect(mapped[0].organizationName).toBeNull();

      // Org class assignment
      expect(mapped[1].isPersonal).toBe(false);
      expect(mapped[1].title).toBe('Khảo sát an toàn thông tin');
      expect(mapped[1].className).toBe('Lớp Chuyên đề CNTT 01');
      expect(mapped[1].organizationName).toBe('Đại học Quốc gia');
    });
  });
});
