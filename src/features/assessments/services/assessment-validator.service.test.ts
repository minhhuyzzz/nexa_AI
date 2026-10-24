import { describe, it, expect } from 'vitest';
import { AssessmentValidator, AssessmentMetadata } from './assessment-validator.service';
import { ParsedItemRow } from '../utils/csv-helper';

describe('AssessmentValidator (Pre-Publish Gate)', () => {
  const defaultMeta: AssessmentMetadata = {
    title: 'Đề Khảo Thí Năng Lực Số',
    durationMinutes: 45,
    passingScore: 60,
  };

  it('should reject assessment with 0 items', () => {
    const result = AssessmentValidator.validate(defaultMeta, []);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some((e) => e.message.includes('ít nhất 1 câu hỏi'))).toBe(true);
  });

  it('should flag error when assessment title is empty', () => {
    const meta: AssessmentMetadata = {
      title: '   ',
      durationMinutes: 45,
      passingScore: 60,
    };
    const items: ParsedItemRow[] = [
      {
        prompt: 'Tìm kiếm thông tin',
        type: 'MCQ',
        points: 10,
        option_a: 'Đáp án A',
        option_b: 'Đáp án B',
        correct_answer: 'A',
      },
    ];

    const result = AssessmentValidator.validate(meta, items);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.message.includes('Tên bài khảo thí'))).toBe(true);
  });

  it('should flag error when MCQ has no valid correct option', () => {
    const items: ParsedItemRow[] = [
      {
        prompt: 'Câu hỏi trắc nghiệm không có đáp án đúng',
        type: 'MCQ',
        points: 10,
        option_a: 'Đáp án A',
        option_b: 'Đáp án B',
        correct_answer: 'Z', // Invalid
      },
    ];

    const result = AssessmentValidator.validate(defaultMeta, items);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.message.includes('đáp án đúng hợp lệ'))).toBe(true);
  });

  it('should flag error when item points is zero or negative', () => {
    const items: ParsedItemRow[] = [
      {
        prompt: 'Câu hỏi 0 điểm',
        type: 'MCQ',
        points: 0,
        option_a: 'Đáp án A',
        option_b: 'Đáp án B',
        correct_answer: 'A',
      },
    ];

    const result = AssessmentValidator.validate(defaultMeta, items);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.message.includes('phải lớn hơn 0'))).toBe(true);
  });

  it('should pass validation for a well-formed assessment', () => {
    const items: ParsedItemRow[] = [
      {
        prompt: 'Tìm kiếm thông tin nâng cao với Google',
        type: 'MCQ',
        points: 50,
        skill_code: '1.1',
        option_a: 'Sử dụng toán tử filetype:pdf',
        option_b: 'Gõ từ khóa không dấu',
        correct_answer: 'A',
      },
      {
        prompt: 'Bảo mật mật khẩu và xác thực hai yếu tố',
        type: 'MCQ',
        points: 50,
        skill_code: '4.1',
        option_a: 'Dùng mật khẩu 123456',
        option_b: 'Kích hoạt 2FA qua ứng dụng Authenticator',
        correct_answer: 'B',
      },
    ];

    const result = AssessmentValidator.validate(defaultMeta, items);
    expect(result.isValid).toBe(true);
    expect(result.errors.length).toBe(0);
    expect(result.stats.totalPoints).toBe(100);
    expect(result.stats.totalQuestions).toBe(2);
    expect(result.stats.coveredDomains).toContain('Miền 1');
    expect(result.stats.coveredDomains).toContain('Miền 4');
  });
});
