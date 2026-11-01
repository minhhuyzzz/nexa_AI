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
});
