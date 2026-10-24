import { ParsedItemRow } from '../utils/csv-helper';

export interface ValidationIssue {
  questionIndex?: number;
  questionPrompt?: string;
  type: 'ERROR' | 'WARNING';
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  stats: {
    totalQuestions: number;
    totalPoints: number;
    mcqCount: number;
    scenarioCount: number;
    evidenceCount: number;
    coveredDomains: string[];
  };
}

export interface AssessmentMetadata {
  title: string;
  durationMinutes: number;
  passingScore: number;
}

export class AssessmentValidator {
  static validate(
    metadata: AssessmentMetadata,
    questions: ParsedItemRow[]
  ): ValidationResult {
    const errors: ValidationIssue[] = [];
    const warnings: ValidationIssue[] = [];

    // 1. Assessment-level validations
    if (!metadata.title?.trim()) {
      errors.push({
        type: 'ERROR',
        message: 'Tên bài khảo thí không được để trống.',
      });
    }

    if (metadata.durationMinutes <= 0) {
      errors.push({
        type: 'ERROR',
        message: 'Thời lượng làm bài phải lớn hơn 0 phút.',
      });
    }

    if (metadata.passingScore <= 0 || metadata.passingScore > 100) {
      errors.push({
        type: 'ERROR',
        message: 'Chuẩn điểm đạt (passing score) phải nằm trong khoảng từ 1% đến 100%.',
      });
    }

    if (questions.length === 0) {
      errors.push({
        type: 'ERROR',
        message: 'Bài khảo thí phải có ít nhất 1 câu hỏi.',
      });
    }

    // 2. Question-level validations
    let totalPoints = 0;
    let mcqCount = 0;
    let scenarioCount = 0;
    let evidenceCount = 0;
    const coveredDomains = new Set<string>();

    questions.forEach((q, idx) => {
      const qNum = idx + 1;
      const pts = Number(q.points) || 0;
      totalPoints += pts;

      const cleanType = (q.type || 'MCQ').toUpperCase().trim();

      if (cleanType === 'MCQ') {
        mcqCount++;
      } else if (cleanType === 'SCENARIO') {
        scenarioCount++;
      } else {
        evidenceCount++;
      }

      // Check prompt
      if (!q.prompt?.trim() || q.prompt.trim().length < 3) {
        errors.push({
          questionIndex: qNum,
          questionPrompt: q.prompt,
          type: 'ERROR',
          message: `Câu hỏi số ${qNum}: Nội dung câu hỏi (prompt) quá ngắn hoặc đang trống.`,
        });
      }

      // Check points
      if (pts <= 0) {
        errors.push({
          questionIndex: qNum,
          questionPrompt: q.prompt,
          type: 'ERROR',
          message: `Câu hỏi số ${qNum}: Điểm số câu hỏi phải lớn hơn 0 (hiện tại: ${pts}đ).`,
        });
      }

      // Check MCQ answer options
      if (cleanType === 'MCQ') {
        const hasA = !!q.option_a?.trim();
        const hasB = !!q.option_b?.trim();
        const optionCount = [q.option_a, q.option_b, q.option_c, q.option_d].filter(
          (opt) => !!opt?.trim()
        ).length;

        if (optionCount < 2 || !hasA || !hasB) {
          errors.push({
            questionIndex: qNum,
            questionPrompt: q.prompt,
            type: 'ERROR',
            message: `Câu số ${qNum} (MCQ): Phải có tối thiểu 2 phương án lựa chọn (A và B).`,
          });
        }

        const validAnswers = ['A', 'B', 'C', 'D'];
        const correct = (q.correct_answer || '').toUpperCase().trim();
        if (!correct || !validAnswers.includes(correct)) {
          errors.push({
            questionIndex: qNum,
            questionPrompt: q.prompt,
            type: 'ERROR',
            message: `Câu số ${qNum} (MCQ): Chưa chọn đáp án đúng hợp lệ (phải là A, B, C hoặc D).`,
          });
        }
      }

      // Check Practical / Scenario Rubric guide
      if (cleanType === 'DIGITAL_EVIDENCE' || cleanType === 'PRACTICAL') {
        if (!q.rubric_guide?.trim() && (!q.rubric_criteria || q.rubric_criteria.length === 0)) {
          warnings.push({
            questionIndex: qNum,
            questionPrompt: q.prompt,
            type: 'WARNING',
            message: `Câu số ${qNum} (Thực hành): Chưa có tiêu chí chấm Rubric cụ thể. Đề xuất bổ sung để AI/Giám khảo chấm chính xác.`,
          });
        }
      }

      // Check competency mapping
      if (!q.skill_code?.trim()) {
        warnings.push({
          questionIndex: qNum,
          questionPrompt: q.prompt,
          type: 'WARNING',
          message: `Câu số ${qNum}: Chưa gắn mã kỹ năng DigComp (ví dụ: 1.1, 2.3).`,
        });
      } else {
        const domainPrefix = q.skill_code.trim().split('.')[0];
        if (domainPrefix) {
          coveredDomains.add(`Miền ${domainPrefix}`);
        }
      }
    });

    // Warning if totalPoints != 100
    if (totalPoints > 0 && totalPoints !== 100) {
      warnings.push({
        type: 'WARNING',
        message: `Tổng điểm hiện tại của đề là ${totalPoints} điểm (thông lệ chuẩn khảo thí là thang 100 điểm). Bạn có thể bấm nút "Cân bằng 100đ" để hệ thống tự chia đều.`,
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      stats: {
        totalQuestions: questions.length,
        totalPoints,
        mcqCount,
        scenarioCount,
        evidenceCount,
        coveredDomains: Array.from(coveredDomains).sort(),
      },
    };
  }
}
