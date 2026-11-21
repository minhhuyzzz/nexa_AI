import ExcelJS from 'exceljs';

export interface MCQExcelRow {
  stt?: number;
  prompt: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  points: number;
  explanation?: string;
  rowNumber?: number;
}

export interface ParseExcelResult {
  questions: MCQExcelRow[];
  errors: string[];
  totalRows: number;
}

/**
 * Tạo Workbook Excel mẫu trắc nghiệm chuẩn hóa 9 cột bằng ExcelJS
 */
export async function buildMCQExcelTemplate(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'NEXA AI Platform';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Cau_Hoi_Trac_Nghiem', {
    views: [{ showGridLines: true }],
  });

  // 9 Cột chuẩn hóa theo yêu cầu
  worksheet.columns = [
    { header: 'STT', key: 'stt', width: 8 },
    { header: 'Câu hỏi (*)', key: 'prompt', width: 50 },
    { header: 'Phương án A (*)', key: 'option_a', width: 30 },
    { header: 'Phương án B (*)', key: 'option_b', width: 30 },
    { header: 'Phương án C', key: 'option_c', width: 30 },
    { header: 'Phương án D', key: 'option_d', width: 30 },
    { header: 'Đáp án đúng (*)', key: 'correct_answer', width: 16 },
    { header: 'Điểm', key: 'points', width: 12 },
    { header: 'Giải thích', key: 'explanation', width: 40 },
  ];

  // Định dạng Header Cobalt (#2563EB)
  const headerRow = worksheet.getRow(1);
  headerRow.height = 30;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2563EB' },
    };
    cell.font = {
      name: 'Segoe UI',
      size: 10,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF1D4ED8' } },
      bottom: { style: 'medium', color: { argb: 'FF1D4ED8' } },
      left: { style: 'thin', color: { argb: 'FF3B82F6' } },
      right: { style: 'thin', color: { argb: 'FF3B82F6' } },
    };
  });

  // Dữ liệu mẫu thực tế, chất lượng cao
  const sampleRows = [
    {
      stt: 1,
      prompt: 'Phương thức nào sau đây giúp bảo vệ tài khoản trực tuyến hiệu quả nhất chống lại tấn công đánh cắp mật khẩu?',
      option_a: 'Chỉ sử dụng mật khẩu ngắn để dễ nhớ',
      option_b: 'Kích hoạt xác thực hai yếu tố (2FA / MFA)',
      option_c: 'Chia sẻ mật khẩu cho đồng nghiệp khi cần thiết',
      option_d: 'Dùng chung một mật khẩu cho mọi dịch vụ trực tuyến',
      correct_answer: 'B',
      points: 1,
      explanation: 'Xác thực 2 yếu tố (2FA) bổ sung lớp bảo mật thứ hai khiến kẻ tấn công không thể xâm nhập dù có mật khẩu.',
    },
    {
      stt: 2,
      prompt: 'Dấu hiệu nào sau đây cảnh báo rõ nhất một thư điện tử (email) có khả năng là lừa đảo (phishing)?',
      option_a: 'Thư gửi từ địa chỉ chính thức của cơ quan kèm chữ ký số',
      option_b: 'Thư yêu cầu cung cấp mã OTP hoặc mật khẩu ngân hàng qua đường link lạ',
      option_c: 'Thư thông báo lịch họp định kỳ từ ban quản trị',
      option_d: 'Thư xác nhận đơn hàng từ sàn thương mại điện tử bạn vừa mua',
      correct_answer: 'B',
      points: 1,
      explanation: 'Các tổ chức tài chính uy tín không bao giờ yêu cầu khách hàng gửi mã OTP hoặc mật khẩu qua email hoặc link lạ.',
    },
    {
      stt: 3,
      prompt: 'Khi làm việc với bảng tính số liệu nhạy cảm của tổ chức, hành động nào đảm bảo an toàn thông tin?',
      option_a: 'Gửi bảng tính qua nhóm chat công cộng để tiện trao đổi',
      option_b: 'Đặt quyền truy cập chỉ cho nhân sự có trách nhiệm và bật nhật ký theo dõi',
      option_c: 'Lưu tệp trên máy tính công cộng không cần đăng xuất',
      option_d: 'Chia sẻ liên kết ở chế độ công khai cho mọi người có link',
      correct_answer: 'B',
      points: 1,
      explanation: 'Phân quyền chặt chẽ theo nguyên tắc cần biết và giám sát truy cập giúp ngăn ngừa thất thoát dữ liệu nhạy cảm.',
    },
  ];

  sampleRows.forEach((row, idx) => {
    const r = worksheet.addRow(row);
    r.height = 36;
    const isZebra = idx % 2 === 1;

    r.eachCell((cell, colNumber) => {
      cell.font = { name: 'Segoe UI', size: 10 };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };

      if (isZebra) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' },
        };
      }

      // Căn lề từng cột
      if (colNumber === 1 || colNumber === 8) {
        // STT, Điểm
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else if (colNumber === 7) {
        // Đáp án đúng
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF2563EB' } };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      }
    });
  });

  // Sheet 2: Hướng dẫn ngắn gọn
  const guideSheet = workbook.addWorksheet('Huong_Dan', {
    views: [{ showGridLines: true }],
  });
  guideSheet.columns = [
    { header: 'Quy tắc nhập liệu', key: 'rule', width: 28 },
    { header: 'Chi tiết hướng dẫn', key: 'detail', width: 65 },
  ];

  const guideHeader = guideSheet.getRow(1);
  guideHeader.height = 28;
  guideHeader.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2563EB' },
    };
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
  });

  const guideData = [
    { rule: 'Định dạng tệp', detail: 'Chỉ chấp nhận tệp định dạng Excel (.xlsx).' },
    { rule: 'Cột bắt buộc (*)', detail: 'Bắt buộc có nội dung tại các cột: Câu hỏi, Phương án A, Phương án B, Đáp án đúng.' },
    { rule: 'Đáp án đúng', detail: 'Chỉ điền một chữ cái đại diện cho phương án đúng: A, B, C hoặc D (không phân biệt hoa thường).' },
    { rule: 'Cột Điểm (Tùy chọn)', detail: 'Nếu để trống hoặc không nhập số hợp lệ, hệ thống sẽ tự động gán mặc định 1 điểm cho câu hỏi.' },
    { rule: 'Cột Giải thích (Tùy chọn)', detail: 'Điền giải thích đáp án hiển thị sau khi người làm bài hoàn thành kiểm tra.' },
    { rule: 'Miền năng lực', detail: 'Đề thi đã cấu hình sẵn miền năng lực số nên từng câu không cần gán lại.' },
  ];

  guideData.forEach((item) => {
    const row = guideSheet.addRow(item);
    row.height = 24;
    row.eachCell((cell) => {
      cell.font = { name: 'Segoe UI', size: 10 };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
      cell.alignment = { vertical: 'middle', wrapText: true };
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Trích xuất chuỗi thô từ ô Excel bất kỳ (hỗ trợ RichText, số, boolean)
 */
function extractCellString(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value).trim();
  if (typeof value === 'object') {
    // RichText format trong ExcelJS: { richText: [{ text: '...' }] }
    if ('richText' in value && Array.isArray((value as any).richText)) {
      return (value as any).richText.map((t: any) => t.text || '').join('').trim();
    }
    // Formula result
    if ('result' in value && value.result !== undefined) {
      return String(value.result).trim();
    }
    if ('text' in value && typeof (value as any).text === 'string') {
      return (value as any).text.trim();
    }
  }
  return '';
}

/**
 * Đọc và chuẩn hóa dữ liệu từ tệp Excel .xlsx sang danh sách câu hỏi trắc nghiệm
 */
export async function parseMCQExcelBuffer(buffer: Buffer | ArrayBuffer): Promise<ParseExcelResult> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as any);

  // Lấy sheet đầu tiên hoặc sheet tên 'Cau_Hoi_Trac_Nghiem'
  const worksheet = workbook.getWorksheet('Cau_Hoi_Trac_Nghiem') || workbook.worksheets[0];
  if (!worksheet) {
    return {
      questions: [],
      errors: ['Tệp Excel không có bảng tính (worksheet) nào.'],
      totalRows: 0,
    };
  }

  const questions: MCQExcelRow[] = [];
  const errors: string[] = [];

  // Tìm hàng header (quét 3 dòng đầu)
  let headerRowIndex = 1;
  let colMap: Record<string, number> = {};

  for (let r = 1; r <= Math.min(5, worksheet.rowCount); r++) {
    const row = worksheet.getRow(r);
    const tempMap: Record<string, number> = {};
    row.eachCell((cell, col) => {
      const text = extractCellString(cell.value).toLowerCase();
      if (text.includes('câu hỏi') || text === 'prompt' || text.includes('noi dung')) tempMap['prompt'] = col;
      if (text.includes('phương án a') || text.includes('lựa chọn a') || text === 'option_a' || text === 'a') tempMap['a'] = col;
      if (text.includes('phương án b') || text.includes('lựa chọn b') || text === 'option_b' || text === 'b') tempMap['b'] = col;
      if (text.includes('phương án c') || text.includes('lựa chọn c') || text === 'option_c' || text === 'c') tempMap['c'] = col;
      if (text.includes('phương án d') || text.includes('lựa chọn d') || text === 'option_d' || text === 'd') tempMap['d'] = col;
      if (text.includes('đáp án') || text.includes('dap an') || text === 'correct_answer' || text === 'correct') tempMap['correct'] = col;
      if (text.includes('điểm') || text.includes('diem') || text === 'points') tempMap['points'] = col;
      if (text.includes('giải thích') || text.includes('giai thich') || text === 'explanation') tempMap['explanation'] = col;
      if (text.includes('stt') || text === 'no') tempMap['stt'] = col;
    });

    if (tempMap['prompt'] && tempMap['a'] && tempMap['b']) {
      headerRowIndex = r;
      colMap = tempMap;
      break;
    }
  }

  // Nếu không tìm thấy bằng từ khóa, fallback dùng vị trí cột chuẩn (1=STT, 2=Prompt, 3=A, 4=B, 5=C, 6=D, 7=Correct, 8=Points, 9=Explain)
  if (!colMap['prompt']) {
    colMap = {
      stt: 1,
      prompt: 2,
      a: 3,
      b: 4,
      c: 5,
      d: 6,
      correct: 7,
      points: 8,
      explanation: 9,
    };
  }

  let totalDataRows = 0;

  for (let r = headerRowIndex + 1; r <= worksheet.rowCount; r++) {
    const row = worksheet.getRow(r);
    // Kiểm tra hàng rỗng
    const promptRaw = extractCellString(row.getCell(colMap['prompt'] || 2).value);
    const optARaw = extractCellString(row.getCell(colMap['a'] || 3).value);
    const optBRaw = extractCellString(row.getCell(colMap['b'] || 4).value);

    if (!promptRaw && !optARaw && !optBRaw) {
      continue; // Bỏ qua dòng trống
    }

    totalDataRows++;

    if (!promptRaw || promptRaw.length < 3) {
      errors.push(`Dòng ${r}: Nội dung câu hỏi quá ngắn hoặc còn để trống.`);
      continue;
    }

    if (!optARaw || !optBRaw) {
      errors.push(`Dòng ${r}: Câu hỏi trắc nghiệm cần tối thiểu 2 phương án (A và B).`);
      continue;
    }

    const optCRaw = colMap['c'] ? extractCellString(row.getCell(colMap['c']).value) : '';
    const optDRaw = colMap['d'] ? extractCellString(row.getCell(colMap['d']).value) : '';

    // Xử lý đáp án đúng
    let correctRaw = colMap['correct'] ? extractCellString(row.getCell(colMap['correct']).value).toUpperCase() : 'A';
    if (!correctRaw) correctRaw = 'A';

    // Rút trích ký tự đầu nếu nhập kiểu "Đáp án A" hoặc "A."
    const match = correctRaw.match(/[A-D]/);
    const cleanCorrect = (match ? match[0] : 'A') as 'A' | 'B' | 'C' | 'D';

    // Điểm: Tùy chọn, mặc định 1 điểm nếu không có hoặc <= 0
    let points = 1;
    if (colMap['points']) {
      const pVal = extractCellString(row.getCell(colMap['points']).value);
      const parsedNum = parseFloat(pVal.replace(',', '.'));
      if (!isNaN(parsedNum) && parsedNum > 0) {
        points = parsedNum;
      }
    }

    const explanation = colMap['explanation'] ? extractCellString(row.getCell(colMap['explanation']).value) : '';

    questions.push({
      rowNumber: r,
      stt: questions.length + 1,
      prompt: promptRaw,
      option_a: optARaw,
      option_b: optBRaw,
      option_c: optCRaw,
      option_d: optDRaw,
      correct_answer: cleanCorrect,
      points,
      explanation,
    });
  }

  return {
    questions,
    errors,
    totalRows: totalDataRows,
  };
}
