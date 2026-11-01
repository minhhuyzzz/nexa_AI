import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  saveQuestionBankItem,
  batchImportQuestionBankItems,
  normalizeDifficulty,
  normalizeQuestionType,
} from './question-bank-write.service';

const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockSelect = vi.fn();

const mockSupabase = {
  from: vi.fn((table: string) => {
    if (table === 'question_bank_items') {
      return {
        insert: mockInsert,
        update: mockUpdate,
        select: mockSelect,
      };
    }
    if (table === 'question_bank_options') {
      return {
        insert: mockInsert,
        delete: mockDelete,
      };
    }
    return { insert: vi.fn(), select: vi.fn() };
  }),
} as any;

describe('Phase 2 Question Bank: QB-01, QB-02, QB-03', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Normalization Helpers', () => {
    it('chuẩn hóa độ khó 4 bậc DigComp chính xác', () => {
      expect(normalizeDifficulty('BEGINNER')).toBe('FOUNDATION');
      expect(normalizeDifficulty('INTERMEDIATE')).toBe('INTERMEDIATE');
      expect(normalizeDifficulty('ADVANCED')).toBe('ADVANCED');
      expect(normalizeDifficulty('EXPERT')).toBe('HIGHLY_SPECIALIZED');
      expect(normalizeDifficulty(null)).toBe('INTERMEDIATE');
    });

    it('chuẩn hóa loại câu hỏi chính xác', () => {
      expect(normalizeQuestionType('MCQ')).toBe('MCQ');
      expect(normalizeQuestionType('PRACTICAL_FILE')).toBe('PRACTICE_FILE');
      expect(normalizeQuestionType('DIGITAL_LINK')).toBe('PRACTICE_URL');
      expect(normalizeQuestionType('SCENARIO')).toBe('SCENARIO');
    });
  });

  describe('QB-01: Tạo câu hỏi MCQ lưu đúng bảng items và options', () => {
    it('lưu thành công câu hỏi trắc nghiệm và danh sách đáp án con', async () => {
      mockInsert.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          single: vi.fn().mockResolvedValueOnce({
            data: { id: 'item-mcq-1', code: 'QB-MCQ-01' },
            error: null,
          }),
        }),
      });

      mockInsert.mockResolvedValueOnce({ error: null });

      const result = await saveQuestionBankItem(mockSupabase, {
        prompt: 'Đâu là cách an toàn nhất để bảo vệ mật khẩu số?',
        type: 'MCQ',
        difficulty_level: 'BEGINNER', // should normalize to FOUNDATION
        options: [
          { content: 'Sử dụng xác thực 2 yếu tố (2FA)', is_correct: true },
          { content: 'Lưu mật khẩu vào file text trên màn hình', is_correct: false },
        ],
        owner_user_id: 'user-creator-1',
      });

      expect(result.success).toBe(true);
      expect(result.itemId).toBe('item-mcq-1');
      expect(mockInsert).toHaveBeenCalledTimes(2); // 1 for item, 1 for options
    });
  });

  describe('QB-02: Kiểm tra tính hợp lệ & RLS logic', () => {
    it('từ chối khi câu hỏi MCQ không có phương án đúng nào', async () => {
      await expect(
        saveQuestionBankItem(mockSupabase, {
          prompt: 'Câu hỏi không có đáp án đúng?',
          type: 'MCQ',
          difficulty_level: 'INTERMEDIATE',
          options: [
            { content: 'Phương án A', is_correct: false },
            { content: 'Phương án B', is_correct: false },
          ],
        })
      ).rejects.toThrow('ít nhất một đáp án đúng');
    });

    it('từ chối khi nội dung câu hỏi để trống', async () => {
      await expect(
        saveQuestionBankItem(mockSupabase, {
          prompt: '   ',
          type: 'SCENARIO',
          difficulty_level: 'ADVANCED',
        })
      ).rejects.toThrow('không được để trống');
    });
  });

  describe('QB-03: Nhập hàng loạt có kiểm soát lỗi chi tiết từng dòng', () => {
    it('nhập 3 câu có 1 câu lỗi -> 2 câu lưu thành công, 1 câu báo lỗi chi tiết', async () => {
      // Item 1 succeeds
      mockInsert.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          single: vi.fn().mockResolvedValueOnce({
            data: { id: 'item-1' },
            error: null,
          }),
        }),
      });
      mockInsert.mockResolvedValueOnce({ error: null }); // options

      // Item 3 succeeds
      mockInsert.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          single: vi.fn().mockResolvedValueOnce({
            data: { id: 'item-3' },
            error: null,
          }),
        }),
      });

      const itemsToImport = [
        {
          prompt: 'Câu hỏi số 1 hợp lệ',
          type: 'MCQ',
          difficulty_level: 'FOUNDATION',
          options: [
            { content: 'Đáp án A đúng', is_correct: true },
            { content: 'Đáp án B sai', is_correct: false },
          ],
        },
        {
          prompt: 'Câu hỏi số 2 bị lỗi (MCQ thiếu đáp án đúng)',
          type: 'MCQ',
          difficulty_level: 'INTERMEDIATE',
          options: [
            { content: 'A sai', is_correct: false },
            { content: 'B sai', is_correct: false },
          ],
        },
        {
          prompt: 'Câu hỏi số 3 tình huống hợp lệ',
          type: 'SCENARIO',
          difficulty_level: 'ADVANCED',
          rubric_definition: { maxPoints: 20 },
        },
      ];

      const res = await batchImportQuestionBankItems(mockSupabase, itemsToImport);
      expect(res.total).toBe(3);
      expect(res.successCount).toBe(2);
      expect(res.failedCount).toBe(1);
      expect(res.errors[0]?.index).toBe(2);
      expect(res.errors[0]?.error).toContain('ít nhất một đáp án đúng');
    });
  });
});
