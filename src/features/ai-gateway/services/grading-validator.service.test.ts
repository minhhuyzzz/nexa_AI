import { describe, it, expect } from 'vitest';
import { GradingValidatorService } from './grading-validator.service';
import { RubricDef, RubricGradingOutput } from '../types/grading.types';

describe('GradingValidatorService (MOD-03 / Task 3.2)', () => {
  const sampleRubric: RubricDef = {
    title: 'Rubric Đánh Giá Thực Hành',
    criteria: [
      {
        id: 'crit-1',
        name: 'Độ chính xác nội dung',
        weightPercent: 50,
        maxPoints: 5,
        levels: [
          { levelName: 'Xuất sắc', scorePercent: 100, description: 'Đầy đủ chính xác' },
          { levelName: 'Đạt', scorePercent: 60, description: 'Khá đầy đủ' },
          { levelName: 'Chưa đạt', scorePercent: 0, description: 'Sai lệch hoàn toàn' },
        ],
      },
      {
        id: 'crit-2',
        name: 'Trình bày và lập luận',
        weightPercent: 50,
        maxPoints: 5,
        levels: [
          { levelName: 'Tốt', scorePercent: 80, description: 'Lập luận rõ ràng' },
          { levelName: 'Trung bình', scorePercent: 40, description: 'Lập luận sơ sài' },
        ],
      },
    ],
  };

  const sampleRawOutput: RubricGradingOutput = {
    totalScore: 99, // Intentional fake number from model
    maxScore: 10,
    confidenceScore: 90,
    confidenceFlag: 'GREEN',
    evidenceQuote: 'Các chính sách bảo mật thông tin cần tuân thủ Nghị định 13/2023.',
    strengths: 'Hiểu rõ quy chuẩn bảo vệ dữ liệu',
    weaknesses: 'Cần bổ sung biện pháp kỹ thuật',
    feedback: 'Bài làm tốt',
    criterionScores: [
      {
        criterionId: 'crit-1',
        criterionName: 'Độ chính xác nội dung',
        selectedLevel: 'Đạt',
        score: 4.8, // Model guessed 4.8, but 60% of 5 is exactly 3.0
        maxPoints: 5,
        justification: 'Bài viết đạt mức Khá đầy đủ',
        evidenceQuote: 'Nghị định 13/2023',
      },
      {
        criterionId: 'crit-2',
        criterionName: 'Trình bày và lập luận',
        selectedLevel: 'Tốt',
        score: 5.0, // Model guessed 5.0, but 80% of 5 is exactly 4.0
        maxPoints: 5,
        justification: 'Lập luận rõ ràng',
        evidenceQuote: 'Chính sách bảo mật',
      },
    ],
  };

  const studentResponse =
    'Để đảm bảo an toàn thông tin số, các chính sách bảo mật thông tin cần tuân thủ Nghị định 13/2023 của Chính phủ về bảo vệ dữ liệu cá nhân.';

  it('should recalculate criterion scores deterministically based on level percentage', () => {
    const result = GradingValidatorService.validateAndRecalculateScores(
      sampleRawOutput,
      sampleRubric,
      studentResponse
    );

    expect(result.recalculated).toBe(true);
    // Criterion 1: 60% of 5 = 3.0
    expect(result.criterionScores[0].score).toBe(3.0);
    // Criterion 2: 80% of 5 = 4.0
    expect(result.criterionScores[1].score).toBe(4.0);
    // Total: 3.0 + 4.0 = 7.0 (model's raw 99 was corrected!)
    expect(result.totalScore).toBe(7.0);
    expect(result.maxScore).toBe(10);
  });

  it('should verify genuine quotes as VALID_CITATION', () => {
    const verify = GradingValidatorService.verifyEvidenceQuote(
      studentResponse,
      'các chính sách bảo mật thông tin cần tuân thủ Nghị định 13/2023'
    );
    expect(verify.citationStatus).toBe('VALID_CITATION');
    expect(verify.validCitation).toBe(true);
  });

  it('should flag hallucinated quotes as INVALID_CITATION and downgrade confidence', () => {
    const fakeQuote = 'Thí sinh đã xây dựng hệ thống tường lửa bằng mã hóa lượng tử siêu cấp.';
    const verify = GradingValidatorService.verifyEvidenceQuote(studentResponse, fakeQuote);
    expect(verify.citationStatus).toBe('INVALID_CITATION');
    expect(verify.validCitation).toBe(false);

    const result = GradingValidatorService.validateAndRecalculateScores(
      { ...sampleRawOutput, evidenceQuote: fakeQuote },
      sampleRubric,
      studentResponse
    );

    expect(result.citationStatus).toBe('INVALID_CITATION');
    expect(result.confidenceFlag).toBe('AMBER');
    expect(result.confidenceScore).toBeLessThanOrEqual(65);
  });
});
