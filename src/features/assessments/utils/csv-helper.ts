/**
 * Utilities for CSV parsing and downloading standardized assessment item templates.
 * Fully supports Vietnamese UTF-8 without garbled characters.
 * Zero external dependencies.
 */

export interface ParsedItemRow {
  skill_code?: string;
  type?: string;
  prompt: string;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  correct_answer?: string;
  explanation?: string;
  rubric_guide?: string;
  points?: number;
  is_multi_competency?: boolean;
  target_competencies?: string[];
}

export function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur.trim());
  return result;
}

export function parseCSV(csvText: string): ParsedItemRow[] {
  // Strip BOM if present
  let cleanText = csvText;
  if (cleanText.charCodeAt(0) === 0xfeff) {
    cleanText = cleanText.slice(1);
  }

  const lines: string[] = [];
  let currentLine = '';
  let insideQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    if (char === '"') {
      insideQuotes = !insideQuotes;
      currentLine += char;
    } else if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (char === '\r' && cleanText[i + 1] === '\n') {
        i++;
      }
      if (currentLine.trim()) lines.push(currentLine);
      currentLine = '';
    } else {
      currentLine += char;
    }
  }
  if (currentLine.trim()) lines.push(currentLine);

  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());
  const rows: ParsedItemRow[] = [];

  for (let l = 1; l < lines.length; l++) {
    const values = parseCSVLine(lines[l]);
    const raw: Record<string, string> = {};
    headers.forEach((h, idx) => {
      raw[h] = values[idx] || '';
    });

    const prompt = raw['prompt'] || raw['nội dung'] || raw['câu hỏi'] || '';
    if (!prompt.trim()) continue;

    const skill_code = raw['skill_code'] || raw['kỹ năng'] || raw['skill'] || '1.1';
    const type = raw['type'] || raw['loại'] || 'MCQ';
    const rawTarget = raw['target_competencies'] || raw['kỹ năng mục tiêu'] || '';
    const target_competencies = rawTarget
      ? rawTarget.split(',').map((s) => s.trim()).filter(Boolean)
      : [skill_code];

    const is_multi_competency = target_competencies.length > 1;

    rows.push({
      skill_code: skill_code.trim(),
      type: type.trim().toUpperCase(),
      prompt: prompt.trim(),
      option_a: raw['option_a'] || raw['lựa chọn a'] || raw['a'] || '',
      option_b: raw['option_b'] || raw['lựa chọn b'] || raw['b'] || '',
      option_c: raw['option_c'] || raw['lựa chọn c'] || raw['c'] || '',
      option_d: raw['option_d'] || raw['lựa chọn d'] || raw['d'] || '',
      correct_answer: raw['correct_answer'] || raw['đáp án'] || raw['dap_an'] || 'A',
      explanation: raw['explanation'] || raw['giải thích'] || '',
      rubric_guide: raw['rubric_guide'] || raw['hướng dẫn chấm'] || '',
      points: Number(raw['points'] || raw['điểm'] || 10) || 10,
      is_multi_competency,
      target_competencies,
    });
  }

  return rows;
}

export function downloadCSVTemplate() {
  const headers = [
    'skill_code',
    'type',
    'prompt',
    'option_a',
    'option_b',
    'option_c',
    'option_d',
    'correct_answer',
    'explanation',
    'rubric_guide',
    'points',
    'target_competencies',
  ];

  const sampleRows = [
    [
      '1.1',
      'MCQ',
      'Công cụ tìm kiếm nào cho phép lọc kết quả theo giấy phép Creative Commons?',
      'Google Tìm kiếm Nâng cao',
      'Wikipedia Reader',
      'Bing Translator',
      'Adobe Acrobat Reader',
      'A',
      'Google Advanced Search có bộ lọc Usage Rights hỗ trợ Creative Commons.',
      '',
      '10',
      '1.1',
    ],
    [
      '2.1',
      'SCENARIO',
      'Trong buổi làm việc nhóm từ xa, hai thành viên tranh cãi dữ dội về việc chỉnh sửa một tài liệu dùng chung. Bạn sẽ đề xuất giải pháp nào?',
      'Tự ý xóa bản nháp của người kia để dập tắt xung đột',
      'Tổ chức họp ngắn, kiểm tra Lịch sử phiên bản (Version History) để thống nhất giải pháp',
      'Rời nhóm và báo cáo quản trị viên ngay lập tức',
      'Không can thiệp, để hai bạn tự tranh luận',
      'B',
      'Sử dụng công cụ lịch sử phiên bản và đối thoại trực tuyến giúp giải quyết minh bạch và tôn trọng.',
      '',
      '15',
      '2.1, 2.4',
    ],
    [
      '3.2',
      'PRACTICAL',
      'Hãy thiết kế một bản tóm tắt hoặc infographic ngắn (3 trang/slide) về nguyên tắc bảo mật thông tin khi làm việc từ xa. Nộp liên kết sản phẩm (Canva/Docs/Drive) và tải tệp đính kèm kèm mô tả giải pháp.',
      '',
      '',
      '',
      '',
      '',
      '',
      'Tiêu chí chấm: 1. Đúng trọng tâm bảo mật dữ liệu (40%); 2. Trực quan dễ hiểu (30%); 3. Thuyết minh rõ ràng (30%).',
      '20',
      '3.2, 4.1',
    ],
  ];

  const csvRows = [
    headers.join(','),
    ...sampleRows.map((row) =>
      row
        .map((cell) => {
          if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
            return `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        })
        .join(',')
    ),
  ];

  const csvContent = '\uFEFF' + csvRows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'nexa_assessment_items_template.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
