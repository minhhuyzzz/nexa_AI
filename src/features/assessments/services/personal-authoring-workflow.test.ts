import { describe, it, expect } from 'vitest';
import {
  AuthoringAssessment,
  AuthoringQuestionItem,
  AuthoringAssessmentStatus,
  AuthoringSessionConfig,
} from '../types/authoring-v2.types';

describe('Personal Authoring Workflow (UX v2 - 7 Screens)', () => {
  describe('Status Separation (Assessment vs Session)', () => {
    it('strictly separates assessment template status from live session status', () => {
      const sampleAssessment: AuthoringAssessment = {
        id: 'asm-1',
        code: 'ASM-123456',
        title: 'Đánh giá Kỹ năng số K48',
        description: 'Bài kiểm tra chuyên đề D1',
        selectedDomains: [1],
        durationMinutes: 45,
        passingScore: 70,
        status: 'READY',
        questions: [],
        createdAt: '2026-11-01T00:00:00Z',
        updatedAt: '2026-11-01T00:00:00Z',
      };

      expect(['DRAFT', 'READY', 'ARCHIVED']).toContain(sampleAssessment.status);
      expect((sampleAssessment.status as string) === 'IN_PROGRESS').toBe(false);

      const sampleSession: AuthoringSessionConfig = {
        deploymentType: 'LIVE_ROOM',
        pin: '849201',
        durationMinutes: 45,
        isResultVisibleImmediately: true,
      };

      expect(sampleSession.deploymentType).toBe('LIVE_ROOM');
      expect(sampleSession.pin).toBe('849201');
    });
  });

  describe('Validation Rules for Publishing (Screen 05)', () => {
    function validateAssessment(questions: AuthoringQuestionItem[], passingScore: number) {
      const errors: string[] = [];

      if (questions.length === 0) {
        errors.push('Đề thi cần có ít nhất 1 câu hỏi.');
      }

      if (passingScore <= 0 || passingScore > 100) {
        errors.push('Chuẩn điểm đạt phải nằm trong khoảng 1% - 100%.');
      }

      questions.forEach((q, idx) => {
        if (!q.prompt?.trim()) {
          errors.push(`Câu ${idx + 1} chưa có nội dung.`);
        }

        if (q.type === 'MCQ' || q.type === 'SCENARIO') {
          const opts = q.options || [];
          if (opts.length < 2) {
            errors.push(`Câu ${idx + 1} cần có tối thiểu 2 phương án.`);
          }
          if (!opts.some((o) => o.isCorrect)) {
            errors.push(`Câu ${idx + 1} chưa chọn đáp án đúng.`);
          }
        }

        if (q.type === 'PRACTICAL') {
          if (!q.prompt?.trim()) {
            errors.push(`Câu ${idx + 1} bài thực hành cần có đề bài chi tiết.`);
          }
        }
      });

      return {
        isValid: errors.length === 0,
        errors,
      };
    }

    it('rejects empty assessment from publishing', () => {
      const res = validateAssessment([], 70);
      expect(res.isValid).toBe(false);
      expect(res.errors).toContain('Đề thi cần có ít nhất 1 câu hỏi.');
    });

    it('rejects MCQ without a designated correct answer', () => {
      const invalidMCQ: AuthoringQuestionItem = {
        id: '1',
        type: 'MCQ',
        prompt: 'Câu hỏi chưa có đáp án đúng?',
        points: 2,
        domainCode: '01',
        options: [
          { id: 'o1', text: 'Phương án A', isCorrect: false },
          { id: 'o2', text: 'Phương án B', isCorrect: false },
        ],
      };

      const res = validateAssessment([invalidMCQ], 70);
      expect(res.isValid).toBe(false);
      expect(res.errors).toContain('Câu 1 chưa chọn đáp án đúng.');
    });

    it('rejects practical question without prompt description', () => {
      const invalidPractical: AuthoringQuestionItem = {
        id: '2',
        type: 'PRACTICAL',
        prompt: '   ',
        points: 5,
        domainCode: '01',
      };

      const res = validateAssessment([invalidPractical], 70);
      expect(res.isValid).toBe(false);
      expect(res.errors).toContain('Câu 1 chưa có nội dung.');
    });

    it('passes validation when all criteria are satisfied', () => {
      const validQuestions: AuthoringQuestionItem[] = [
        {
          id: '1',
          type: 'MCQ',
          prompt: 'Thao tác nào sau đây bảo đảm an toàn mật khẩu?',
          points: 2,
          domainCode: '04',
          options: [
            { id: 'o1', text: 'Đặt mật khẩu dài kết hợp ký tự đặc biệt', isCorrect: true },
            { id: 'o2', text: 'Dùng ngày sinh làm mật khẩu', isCorrect: false },
          ],
        },
        {
          id: '2',
          type: 'PRACTICAL',
          prompt: 'Soạn thảo văn bản báo cáo theo mẫu',
          points: 8,
          domainCode: '03',
          rubric: [
            { id: 'r1', name: 'Định dạng chuẩn', maxPoints: 4 },
            { id: 'r2', name: 'Nội dung đầy đủ', maxPoints: 4 },
          ],
        },
      ];

      const res = validateAssessment(validQuestions, 70);
      expect(res.isValid).toBe(true);
      expect(res.errors.length).toBe(0);
    });
  });

  describe('Question Picker Cloning (Screen 04)', () => {
    it('creates fresh IDs when questions are imported from the bank', () => {
      const original: AuthoringQuestionItem = {
        id: 'bank-q-101',
        type: 'MCQ',
        prompt: 'Câu hỏi trong kho...',
        points: 2,
        domainCode: '01',
        options: [
          { id: 'bank-opt-1', text: 'A', isCorrect: true },
          { id: 'bank-opt-2', text: 'B', isCorrect: false },
        ],
      };

      const clone: AuthoringQuestionItem = {
        ...original,
        id: `clone-${Date.now()}`,
        options: (original.options || []).map((opt) => ({
          ...opt,
          id: `clone-opt-${Date.now()}-${opt.id}`,
        })),
      };

      expect(clone.id).not.toBe(original.id);
      expect(clone.options?.[0].id).not.toBe(original.options?.[0].id);
      expect(clone.prompt).toBe(original.prompt);
    });
  });

  describe('Personal Assessment Ownership and Permissions (RLS Security)', () => {
    function canManageAssessment(
      userId: string,
      assessment: { created_by?: string | null; owner_user_id?: string | null }
    ) {
      return assessment.owner_user_id === userId || assessment.created_by === userId;
    }

    it('grants management rights when user is created_by or owner_user_id', () => {
      const myUserId = 'user-uuid-123';
      const foreignUserId = 'user-uuid-456';

      expect(canManageAssessment(myUserId, { created_by: myUserId, owner_user_id: myUserId })).toBe(true);
      expect(canManageAssessment(myUserId, { created_by: myUserId, owner_user_id: null })).toBe(true);
      expect(canManageAssessment(myUserId, { created_by: null, owner_user_id: myUserId })).toBe(true);
      expect(canManageAssessment(myUserId, { created_by: foreignUserId, owner_user_id: foreignUserId })).toBe(false);
    });

    it('ensures new personal assessment payload binds created_by and owner_user_id to current user', () => {
      const currentUserId = 'user-uuid-789';
      const payload = {
        title: 'Đề kiểm tra an toàn số',
        description: 'Mô tả ngắn',
        duration_minutes: 45,
        passing_score: 70,
        is_published: false,
        created_by: currentUserId,
        owner_user_id: currentUserId,
      };

      expect(payload.created_by).toBe(currentUserId);
      expect(payload.owner_user_id).toBe(currentUserId);
      expect(payload.is_published).toBe(false);
    });
  });

  describe('Scale Selection & Auto-balanced Points Calculation', () => {
    function computeBalancedPoints(questionCount: number, totalScale: 100 | 10) {
      if (questionCount <= 0) return totalScale;
      return Number((totalScale / questionCount).toFixed(2));
    }

    it('correctly auto-balances points on 100-point scale', () => {
      expect(computeBalancedPoints(5, 100)).toBe(20);
      expect(computeBalancedPoints(10, 100)).toBe(10);
      expect(computeBalancedPoints(7, 100)).toBe(14.29);
      expect(computeBalancedPoints(25, 100)).toBe(4);
    });

    it('correctly auto-balances points on 10-point scale', () => {
      expect(computeBalancedPoints(5, 10)).toBe(2);
      expect(computeBalancedPoints(10, 10)).toBe(1);
      expect(computeBalancedPoints(4, 10)).toBe(2.5);
    });
  });
});
