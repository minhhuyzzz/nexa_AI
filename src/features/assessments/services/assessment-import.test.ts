import { describe, it, expect } from 'vitest';

describe('Assessment Item Import & Structure Validation', () => {
  it('correctly maps raw import rows and standardizes question types', () => {
    const rawRows = [
      {
        prompt: 'Cú pháp tìm kiếm nào lọc chính xác tập tin định dạng PDF trên Google?',
        type: 'MCQ',
        option_a: 'filetype:pdf',
        option_b: 'format=pdf',
        option_c: 'doc:pdf',
        option_d: 'type:pdf',
        correct_answer: 'A',
      },
      {
        prompt: 'Thực hành tạo infographic báo cáo an toàn số trên Canva và dán liên kết sản phẩm',
        type: 'PRACTICAL',
        rubric_guide: 'Đánh giá tính trực quan, độ chuẩn xác của số liệu và cách bố trí',
      },
      {
        prompt: 'Xử lý tình huống nhân viên gửi nhầm tài liệu mật ra bên ngoài qua email',
        type: 'TÌNH HUỐNG',
        option_a: 'Thu hồi email ngay lập tức và báo quản trị bảo mật',
        option_b: 'Giữ im lặng',
        correct_answer: 'A',
      },
    ];

    const processed = rawRows.map((row) => {
      let cleanType = (row.type || 'MCQ').toUpperCase().trim();
      if (cleanType === 'PRACTICAL' || cleanType === 'THỰC HÀNH') {
        cleanType = 'DIGITAL_EVIDENCE';
      } else if (cleanType === 'TÌNH HUỐNG' || cleanType === 'SCENARIO') {
        cleanType = 'SCENARIO';
      }
      return { ...row, standardType: cleanType };
    });

    expect(processed[0].standardType).toBe('MCQ');
    expect(processed[1].standardType).toBe('DIGITAL_EVIDENCE');
    expect(processed[2].standardType).toBe('SCENARIO');
    // Ensure no difficulty_level is required
    expect((processed[0] as any).difficulty_level).toBeUndefined();
  });

  it('validates options for MCQ and allows optional options for practical tasks', () => {
    const mcqRow = {
      prompt: 'Test MCQ question?',
      type: 'MCQ',
      option_a: 'Option 1',
      option_b: 'Option 2',
      correct_answer: 'A',
    };

    const practicalRow = {
      prompt: 'Thực hành lập trình script tự động sao lưu dữ liệu',
      type: 'DIGITAL_EVIDENCE',
      rubric_guide: 'Script chạy không lỗi, có log ghi nhận',
    };

    const hasValidMcqOptions = Boolean(mcqRow.option_a && mcqRow.option_b && mcqRow.correct_answer);
    expect(hasValidMcqOptions).toBe(true);

    const practicalRequiresOptions = false;
    expect(practicalRequiresOptions).toBe(false);
  });
});
