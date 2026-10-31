/**
 * Utilities for CSV parsing and downloading standardized assessment item templates.
 * Fully supports Vietnamese UTF-8 without garbled characters.
 * Standardized on 5 DigComp Competency Domains (1..5).
 * Zero external dependencies.
 */

export interface RubricCriterion {
  name: string;
  weight: number;
}

export interface ParsedItemRow {
  skill_code?: string;
  domain?: number;
  domains?: number[];
  type?: string;
  prompt: string;
  scenario_context?: string;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  correct_answer?: string;
  explanation?: string;
  submission_type?: 'FILE' | 'LINK' | 'BOTH';
  rubric_criteria?: RubricCriterion[];
  rubric_guide?: string;
  structured_rubric?: any;
  points?: number;
  is_multi_competency?: boolean;
  target_competencies?: string[];
  lineNumber?: number;
}

export interface ParseResult {
  items: ParsedItemRow[];
  errors: string[];
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

export function splitCSVLines(cleanText: string): string[] {
  // Strip BOM if present
  let text = cleanText;
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1);
  }

  const lines: string[] = [];
  let currentLine = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      insideQuotes = !insideQuotes;
      currentLine += char;
    } else if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (char === '\r' && text[i + 1] === '\n') {
        i++;
      }
      if (currentLine.trim()) lines.push(currentLine);
      currentLine = '';
    } else {
      currentLine += char;
    }
  }
  if (currentLine.trim()) lines.push(currentLine);
  return lines;
}

export function parseDomainString(rawDomain: string): { domains: number[]; error?: string } {
  if (!rawDomain || !rawDomain.trim()) {
    return { domains: [1] }; // Mặc định Miền 1 nếu không chỉ định
  }
  const clean = rawDomain.replace(/[\[\]]/g, '').trim();
  const parts = clean.split(/[,;\+]/).map((p) => p.trim()).filter(Boolean);
  const domains: number[] = [];

  for (const part of parts) {
    // Nhận diện số 1..5 hoặc dạng 1.1 / Miền 1
    const match = part.match(/\b([1-5])(\.\d+)?\b/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!domains.includes(num)) domains.push(num);
    } else {
      const parsedNum = parseInt(part, 10);
      if (parsedNum >= 1 && parsedNum <= 5) {
        if (!domains.includes(parsedNum)) domains.push(parsedNum);
      } else {
        return { domains: [], error: `Miền năng lực '${part}' không hợp lệ (chỉ chấp nhận các số từ 1 đến 5).` };
      }
    }
  }

  if (domains.length === 0) {
    return { domains: [], error: `Không nhận diện được miền năng lực hợp lệ từ '${rawDomain}'.` };
  }
  return { domains };
}

/**
 * 1. Parse tệp Trắc nghiệm khách quan (MCQ)
 */
export function parseMCQCSV(csvText: string): ParseResult {
  const lines = splitCSVLines(csvText);
  const errors: string[] = [];
  const items: ParsedItemRow[] = [];

  if (lines.length < 2) {
    return { items: [], errors: ['Tệp CSV không có dữ liệu hoặc thiếu dòng tiêu đề.'] };
  }

  const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());
  const hasOptions = headers.includes('option_a') || headers.includes('lựa chọn a') || headers.includes('a');
  if (!hasOptions) {
    return {
      items: [],
      errors: ['Tệp không đúng định dạng Trắc nghiệm (MCQ). Không tìm thấy các cột lựa chọn (option_a, option_b...).'],
    };
  }

  for (let l = 1; l < lines.length; l++) {
    const values = parseCSVLine(lines[l]);
    const raw: Record<string, string> = {};
    headers.forEach((h, idx) => {
      raw[h] = values[idx] || '';
    });

    const prompt = (raw['prompt'] || raw['câu hỏi'] || raw['nội dung'] || '').trim();
    if (!prompt) {
      errors.push(`Dòng ${l + 1}: Nội dung câu hỏi (prompt) không được để trống.`);
      continue;
    }

    const rawDomain = raw['domain'] || raw['miền'] || raw['skill_code'] || '1';
    const domainResult = parseDomainString(rawDomain);
    if (domainResult.error) {
      errors.push(`Dòng ${l + 1}: ${domainResult.error}`);
      continue;
    }

    const optA = (raw['option_a'] || raw['lựa chọn a'] || raw['a'] || '').trim();
    const optB = (raw['option_b'] || raw['lựa chọn b'] || raw['b'] || '').trim();
    const optC = (raw['option_c'] || raw['lựa chọn c'] || raw['c'] || '').trim();
    const optD = (raw['option_d'] || raw['lựa chọn d'] || raw['d'] || '').trim();

    if (!optA || !optB) {
      errors.push(`Dòng ${l + 1}: Câu hỏi trắc nghiệm phải có ít nhất Lựa chọn A và Lựa chọn B.`);
      continue;
    }

    const correctAns = (raw['correct_answer'] || raw['đáp án'] || raw['dap_an'] || 'A').trim().toUpperCase();
    if (!['A', 'B', 'C', 'D'].includes(correctAns)) {
      errors.push(`Dòng ${l + 1}: Đáp án đúng '${correctAns}' không hợp lệ. Chỉ chấp nhận A, B, C hoặc D.`);
      continue;
    }

    const points = Number(raw['points'] || raw['điểm'] || 10) || 10;
    const explanation = (raw['explanation'] || raw['giải thích'] || '').trim();

    items.push({
      lineNumber: l + 1,
      type: 'MCQ',
      domain: domainResult.domains[0],
      domains: domainResult.domains,
      skill_code: `${domainResult.domains[0]}.1`,
      target_competencies: domainResult.domains.map((d) => `${d}.1`),
      is_multi_competency: domainResult.domains.length > 1,
      prompt,
      option_a: optA,
      option_b: optB,
      option_c: optC,
      option_d: optD,
      correct_answer: correctAns,
      explanation,
      points,
    });
  }

  return { items, errors };
}

/**
 * 2. Parse tệp Tình huống thực tế (SCENARIO)
 */
export function parseScenarioCSV(csvText: string): ParseResult {
  const lines = splitCSVLines(csvText);
  const errors: string[] = [];
  const items: ParsedItemRow[] = [];

  if (lines.length < 2) {
    return { items: [], errors: ['Tệp CSV không có dữ liệu hoặc thiếu dòng tiêu đề.'] };
  }

  const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());
  const hasOptions = headers.includes('option_a') || headers.includes('lựa chọn a') || headers.includes('a');
  if (!hasOptions) {
    return {
      items: [],
      errors: ['Tệp không đúng định dạng Tình huống (SCENARIO). Không tìm thấy các cột phương án xử lý (option_a, option_b...).'],
    };
  }

  for (let l = 1; l < lines.length; l++) {
    const values = parseCSVLine(lines[l]);
    const raw: Record<string, string> = {};
    headers.forEach((h, idx) => {
      raw[h] = values[idx] || '';
    });

    const prompt = (raw['prompt'] || raw['câu hỏi'] || raw['yêu cầu'] || '').trim();
    if (!prompt) {
      errors.push(`Dòng ${l + 1}: Câu hỏi tình huống không được để trống.`);
      continue;
    }

    const rawDomain = raw['domain'] || raw['miền'] || raw['skill_code'] || '2';
    const domainResult = parseDomainString(rawDomain);
    if (domainResult.error) {
      errors.push(`Dòng ${l + 1}: ${domainResult.error}`);
      continue;
    }

    const context = (raw['scenario_context'] || raw['bối cảnh'] || raw['tình huống'] || '').trim();
    const optA = (raw['option_a'] || raw['phương án a'] || raw['a'] || '').trim();
    const optB = (raw['option_b'] || raw['phương án b'] || raw['b'] || '').trim();
    const optC = (raw['option_c'] || raw['phương án c'] || raw['c'] || '').trim();
    const optD = (raw['option_d'] || raw['phương án d'] || raw['d'] || '').trim();

    if (!optA || !optB) {
      errors.push(`Dòng ${l + 1}: Tình huống phải có ít nhất Phương án A và Phương án B.`);
      continue;
    }

    const correctAns = (raw['correct_answer'] || raw['đáp án'] || raw['dap_an'] || 'B').trim().toUpperCase();
    if (!['A', 'B', 'C', 'D'].includes(correctAns)) {
      errors.push(`Dòng ${l + 1}: Đáp án tối ưu '${correctAns}' không hợp lệ. Chỉ chấp nhận A, B, C hoặc D.`);
      continue;
    }

    const points = Number(raw['points'] || raw['điểm'] || 15) || 15;
    const explanation = (raw['explanation'] || raw['giải thích'] || '').trim();

    items.push({
      lineNumber: l + 1,
      type: 'SCENARIO',
      domain: domainResult.domains[0],
      domains: domainResult.domains,
      skill_code: `${domainResult.domains[0]}.1`,
      target_competencies: domainResult.domains.map((d) => `${d}.1`),
      is_multi_competency: domainResult.domains.length > 1,
      scenario_context: context,
      prompt,
      option_a: optA,
      option_b: optB,
      option_c: optC,
      option_d: optD,
      correct_answer: correctAns,
      explanation,
      points,
    });
  }

  return { items, errors };
}

/**
 * 3. Parse tệp Bài tập thực hành & Tiêu chí Rubric phẳng (PRACTICAL)
 */
export function parsePracticalCSV(csvText: string): ParseResult {
  const lines = splitCSVLines(csvText);
  const errors: string[] = [];
  const items: ParsedItemRow[] = [];

  if (lines.length < 2) {
    return { items: [], errors: ['Tệp CSV không có dữ liệu hoặc thiếu dòng tiêu đề.'] };
  }

  const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());

  // Kiểm tra nếu nạp nhầm file MCQ sang Practical
  if (headers.includes('correct_answer') && headers.includes('option_c') && !headers.includes('submission_type') && !headers.includes('criterion_1_name')) {
    return {
      items: [],
      errors: ['Tệp tải lên có vẻ là file Trắc nghiệm (MCQ). Vui lòng chọn đúng tab mẫu Thực hành.'],
    };
  }

  for (let l = 1; l < lines.length; l++) {
    const values = parseCSVLine(lines[l]);
    const raw: Record<string, string> = {};
    headers.forEach((h, idx) => {
      raw[h] = values[idx] || '';
    });

    const prompt = (raw['prompt'] || raw['đề bài'] || raw['nội dung'] || '').trim();
    if (!prompt) {
      errors.push(`Dòng ${l + 1}: Đề bài thực hành (prompt) không được để trống.`);
      continue;
    }

    const rawDomain = raw['domain'] || raw['miền'] || raw['skill_code'] || '3';
    const domainResult = parseDomainString(rawDomain);
    if (domainResult.error) {
      errors.push(`Dòng ${l + 1}: ${domainResult.error}`);
      continue;
    }

    // Submission type (FILE / LINK / BOTH)
    let subType: 'FILE' | 'LINK' | 'BOTH' = 'BOTH';
    const rawSub = (raw['submission_type'] || raw['hình thức nộp'] || '').toUpperCase();
    if (rawSub.includes('FILE') || rawSub.includes('TỆP')) subType = 'FILE';
    else if (rawSub.includes('LINK') || rawSub.includes('LIÊN KẾT')) subType = 'LINK';

    // Parse flat rubric criteria
    const criteria: RubricCriterion[] = [];
    for (let c = 1; c <= 5; c++) {
      const name = (raw[`criterion_${c}_name`] || raw[`tiêu chí ${c}`] || '').trim();
      const weight = Number(raw[`criterion_${c}_weight`] || raw[`tỷ trọng ${c}`] || 0);
      if (name) {
        criteria.push({ name, weight: weight || 25 });
      }
    }

    // Fallback nếu có cột rubric_guide tổng hợp
    let rubricGuide = (raw['rubric_guide'] || raw['hướng dẫn chấm'] || '').trim();
    if (!rubricGuide && criteria.length > 0) {
      rubricGuide = criteria.map((c, i) => `${i + 1}. ${c.name} (${c.weight}%)`).join('; ');
    } else if (!rubricGuide) {
      rubricGuide = 'Tiêu chí chấm: 1. Đúng yêu cầu sản phẩm (50%); 2. Kỹ năng thực hành số & Thuyết minh (50%).';
    }

    const points = Number(raw['points'] || raw['điểm'] || 20) || 20;

    items.push({
      lineNumber: l + 1,
      type: 'PRACTICAL',
      domain: domainResult.domains[0],
      domains: domainResult.domains,
      skill_code: `${domainResult.domains[0]}.1`,
      target_competencies: domainResult.domains.map((d) => `${d}.1`),
      is_multi_competency: domainResult.domains.length > 1,
      prompt,
      submission_type: subType,
      rubric_criteria: criteria,
      rubric_guide: rubricGuide,
      points,
    });
  }

  return { items, errors };
}

/**
 * Hàm phân tích chung (tự động nhận diện loại câu hỏi hoặc hỗ trợ tệp hỗn hợp / legacy)
 */
export function parseCSV(csvText: string): ParsedItemRow[] {
  const lines = splitCSVLines(csvText);
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

    const rawDomain = raw['domain'] || raw['miền'] || raw['skill_code'] || '1';
    const domainResult = parseDomainString(rawDomain);
    const validDomains = domainResult.domains.length > 0 ? domainResult.domains : [1];

    const type = (raw['type'] || raw['loại'] || (raw['option_a'] ? 'MCQ' : 'PRACTICAL')).trim().toUpperCase();
    const isPractical = type.includes('PRACTICAL') || type.includes('EVIDENCE');

    const optA = raw['option_a'] || raw['lựa chọn a'] || raw['a'] || '';
    const optB = raw['option_b'] || raw['lựa chọn b'] || raw['b'] || '';
    const optC = raw['option_c'] || raw['lựa chọn c'] || raw['c'] || '';
    const optD = raw['option_d'] || raw['lựa chọn d'] || raw['d'] || '';
    const correctAns = raw['correct_answer'] || raw['đáp án'] || raw['dap_an'] || (isPractical ? '' : 'A');

    const rawTarget = raw['target_competencies'] || raw['kỹ năng mục tiêu'] || '';
    const target_competencies = rawTarget
      ? rawTarget.split(',').map((s) => s.trim()).filter(Boolean)
      : validDomains.map((d) => `${d}.1`);

    rows.push({
      lineNumber: l + 1,
      domain: validDomains[0],
      domains: validDomains,
      skill_code: `${validDomains[0]}.1`,
      type: isPractical ? 'PRACTICAL' : type === 'SCENARIO' ? 'SCENARIO' : 'MCQ',
      prompt: prompt.trim(),
      scenario_context: raw['scenario_context'] || raw['bối cảnh'] || '',
      option_a: optA,
      option_b: optB,
      option_c: optC,
      option_d: optD,
      correct_answer: correctAns,
      explanation: raw['explanation'] || raw['giải thích'] || '',
      rubric_guide: raw['rubric_guide'] || raw['hướng dẫn chấm'] || '',
      points: Number(raw['points'] || raw['điểm'] || 10) || 10,
      is_multi_competency: validDomains.length > 1 || target_competencies.length > 1,
      target_competencies,
    });
  }

  return rows;
}

// -------------------------------------------------------------
// DOWNLOAD TEMPLATE FUNCTIONS
// -------------------------------------------------------------

function triggerCSVDownload(filename: string, headers: string[], rows: string[][]) {
  const csvRows = [
    headers.join(','),
    ...rows.map((row) =>
      row
        .map((cell) => {
          if (cell.includes(',') || cell.includes('"') || cell.includes('\n') || cell.includes(';')) {
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
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Tải mẫu 1: Trắc nghiệm khách quan 4 lựa chọn (MCQ)
 */
export function downloadMCQTemplate() {
  const headers = [
    'domain',
    'prompt',
    'option_a',
    'option_b',
    'option_c',
    'option_d',
    'correct_answer',
    'explanation',
    'points',
  ];

  const rows = [
    [
      '1',
      'Công cụ tìm kiếm nào cho phép lọc kết quả chính xác theo giấy phép bản quyền Creative Commons?',
      'Google Tìm kiếm Nâng cao (Advanced Search)',
      'Wikipedia Reader',
      'Bing Translator',
      'Adobe Acrobat Reader',
      'A',
      'Google Advanced Search có bộ lọc Usage Rights hỗ trợ Creative Commons.',
      '10',
    ],
    [
      '4',
      'Mật khẩu nào sau đây đáp ứng tốt nhất tiêu chuẩn bảo mật dữ liệu số cá nhân?',
      '12345678@',
      'Password2026',
      'N3x@_Secur!ty#2026',
      'qwertyuiop',
      'C',
      'Mật khẩu mạnh bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt với độ dài trên 12 ký tự.',
      '10',
    ],
    [
      '1, 2',
      'Khi thu thập thông tin và chia sẻ dữ liệu nghiên cứu cho nhóm, bước nào thể hiện trách nhiệm số cao nhất?',
      'Tải về và gửi file trực tiếp không ghi nguồn',
      'Trích dẫn đầy đủ tác giả, nguồn gốc và thiết lập quyền truy cập phù hợp',
      'Đăng công khai lên mạng xã hội kèm ảnh chụp màn hình',
      'Sao chép nội dung vào tài liệu mới và nhận là của mình',
      'B',
      'Kết hợp năng lực đánh giá dữ liệu (Miền 1) và cộng tác số có đạo đức (Miền 2).',
      '10',
    ],
  ];

  triggerCSVDownload('nexa_template_mcq.csv', headers, rows);
}

/**
 * Tải mẫu 2: Tình huống thực tế (SCENARIO)
 */
export function downloadScenarioTemplate() {
  const headers = [
    'domain',
    'scenario_context',
    'prompt',
    'option_a',
    'option_b',
    'option_c',
    'option_d',
    'correct_answer',
    'explanation',
    'points',
  ];

  const rows = [
    [
      '2',
      'Trong buổi làm việc nhóm từ xa chuẩn bị báo cáo quý, hai thành viên xảy ra bất đồng lớn về việc ai đã ghi đè làm mất đoạn phân tích số liệu trên tài liệu trực tuyến dùng chung.',
      'Với vai trò trưởng nhóm, giải pháp nào sau đây là tối ưu nhất để giải quyết xung đột và khôi phục dữ liệu?',
      'Tự ý xóa quyền truy cập của cả hai bạn để tránh tranh cãi',
      'Tổ chức họp ngắn, kiểm tra Lịch sử phiên bản (Version History) để khôi phục dữ liệu và thống nhất giải pháp',
      'Rời nhóm và báo cáo cấp trên xử lý kỷ luật',
      'Không can thiệp, yêu cầu hai bạn tự giải quyết',
      'B',
      'Sử dụng công cụ kỹ thuật số (Version History) kết hợp giao tiếp tôn trọng giúp xử lý minh bạch.',
      '15',
    ],
    [
      '4, 5',
      'Bạn nhận được email từ ngân hàng thông báo tài khoản bị khóa và yêu cầu nhấp vào liên kết đính kèm để xác thực trong vòng 15 phút, tuy nhiên địa chỉ gửi thư có đuôi lạ @support-bank-secure.xyz.',
      'Hành động đúng đắn và an toàn nhất bạn cần thực hiện là gì?',
      'Nhấp ngay vào link và nhập thông tin để tránh bị khóa tài khoản',
      'Chuyển tiếp email cho tất cả bạn bè để nhờ kiểm tra giúp',
      'Không nhấp vào link, báo cáo thư lừa đảo (phishing) và liên hệ đường dây nóng chính thức của ngân hàng để xác minh',
      'Gửi thư trả lời yêu cầu ngân hàng cung cấp mật khẩu mới',
      'C',
      'Nhận biết tấn công giả mạo (Miền 4) và đưa ra quyết định xử lý sự cố an toàn (Miền 5).',
      '15',
    ],
  ];

  triggerCSVDownload('nexa_template_scenario.csv', headers, rows);
}

/**
 * Tải mẫu 3: Bài tập thực hành & Tiêu chí Rubric phẳng (PRACTICAL)
 */
export function downloadPracticalTemplate() {
  const headers = [
    'domain',
    'prompt',
    'submission_type',
    'criterion_1_name',
    'criterion_1_weight',
    'criterion_2_name',
    'criterion_2_weight',
    'criterion_3_name',
    'criterion_3_weight',
    'points',
  ];

  const rows = [
    [
      '3',
      'Hãy thiết kế một bản tóm tắt hoặc infographic ngắn (tối đa 3 trang/slide) hướng dẫn các nguyên tắc an toàn dữ liệu số khi làm việc từ xa. Nộp tệp sản phẩm (PDF/PNG) hoặc liên kết chia sẻ (Canva/Docs/Drive) kèm đoạn tóm tắt giải trình giải pháp thiết kế.',
      'BOTH',
      'Đúng trọng tâm bảo mật dữ liệu số',
      '40',
      'Trình bày trực quan và cấu trúc rõ ràng',
      '30',
      'Thuyết minh giải pháp logic và thuyết phục',
      '30',
      '20',
    ],
    [
      '1, 3',
      'Thu thập và phân tích dữ liệu khảo sát trực tuyến về mức độ sẵn sàng số của một tổ chức. Tạo bảng tính phân tích số liệu (Google Sheets/Excel) kèm biểu đồ trực quan hóa dữ liệu và đề xuất 3 giải pháp cải thiện.',
      'BOTH',
      'Kỹ năng xử lý & làm sạch dữ liệu số',
      '40',
      'Trực quan hóa biểu đồ chính xác và thẩm mỹ',
      '30',
      'Đề xuất giải pháp có căn cứ từ dữ liệu',
      '30',
      '25',
    ],
  ];

  triggerCSVDownload('nexa_template_practical.csv', headers, rows);
}

/**
 * Backward compatibility
 */
export function downloadCSVTemplate() {
  downloadMCQTemplate();
}
