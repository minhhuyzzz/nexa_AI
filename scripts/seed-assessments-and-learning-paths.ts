import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// 1. Read environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars: Record<string, string> = {};
envContent.split('\n').forEach((line) => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    envVars[match[1]] = value.trim();
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL || 'https://rfbudggycfhbzgxhytlo.supabase.co';
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('Missing Supabase Key in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// CSV parser supporting quoted cells and commas
function parseCSV(text: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let currentField = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      row.push(currentField.trim());
      if (row.some((cell) => cell.length > 0)) {
        lines.push(row);
      }
      row = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || row.length > 0) {
    row.push(currentField.trim());
    if (row.some((cell) => cell.length > 0)) {
      lines.push(row);
    }
  }

  return lines;
}

// Pseudo-random deterministic shuffle to distribute correct options across A, B, C, D
function shuffleOptions(
  options: Array<{ content: string; is_correct: boolean; explanation?: string }>,
  seed: number
) {
  const arr = [...options];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(((seed * 9301 + 49297) % 233280) / 233280 * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.map((opt, idx) => ({ ...opt, order_index: idx + 1 }));
}

async function runSeed() {
  console.log('=== NEXA AI SEED: 120 REAL QUESTIONS & CANONICAL ASSESSMENTS ===\n');

  // 1. Fetch Framework and Competencies
  const { data: frameworks } = await supabase.from('assessment_frameworks').select('id, code').limit(1);
  const frameworkId = frameworks?.[0]?.id || null;

  const { data: domains } = await supabase
    .from('competency_domains')
    .select('id, code, title, domain_index')
    .order('domain_index', { ascending: true });

  const { data: competencies } = await supabase
    .from('competencies')
    .select('id, skill_code, title, domain_id')
    .order('skill_code', { ascending: true });

  if (!domains || !competencies) {
    throw new Error('Failed to load domains or competencies from database.');
  }

  console.log(`Loaded ${domains.length} domains and ${competencies.length} competencies from database.`);

  const compMap: Record<string, string> = {};
  competencies.forEach((c) => {
    compMap[c.skill_code] = c.id;
  });

  // Competency pool per domain
  const domainCompPool: Record<number, string[]> = {
    1: ['1.1', '1.2', '1.3'],
    2: ['2.1', '2.2', '2.4', '2.5', '2.6'],
    3: ['3.1', '3.2', '3.3', '3.4'],
    4: ['4.1', '4.2', '4.3', '4.4'],
    5: ['5.1', '5.2', '5.3', '5.4'],
  };

  // 2. Read and Parse CSV
  const csvPath = path.resolve(process.cwd(), 'docs', 'Bo_120_Cau_Hoi_Nang_Luc_So_DEMO.csv');
  const csvRaw = fs.readFileSync(csvPath, 'utf-8');
  const rows = parseCSV(csvRaw);
  const dataRows = rows.slice(1).filter((r) => r.length >= 8 && r[3] && r[3].length > 3);

  console.log(`Parsed ${dataRows.length} valid question rows from CSV.`);

  interface ParsedQ {
    stt: number;
    groupNum: number;
    groupName: string;
    prompt: string;
    options: Array<{ content: string; is_correct: boolean }>;
    skillCode: string;
    competencyId: string;
  }

  const parsedQuestions: ParsedQ[] = dataRows.map((r) => {
    const stt = parseInt(r[0], 10);
    const groupMatch = r[1].match(/\d+/);
    const groupNum = groupMatch ? parseInt(groupMatch[0], 10) : 1;
    const groupName = r[2];
    const prompt = r[3];
    const optA = r[4];
    const optB = r[5];
    const optC = r[6];
    const optD = r[7];

    const rawOptions = [
      { content: optA, is_correct: true },
      { content: optB, is_correct: false },
      { content: optC, is_correct: false },
      { content: optD, is_correct: false },
    ];

    const pool = domainCompPool[groupNum] || ['1.1'];
    const skillCode = pool[stt % pool.length];
    const competencyId = compMap[skillCode] || compMap['1.1'];

    return {
      stt,
      groupNum,
      groupName,
      prompt,
      options: rawOptions,
      skillCode,
      competencyId,
    };
  });

  // 3. Setup Assessment 1: Baseline Assessment (25 Selected Questions)
  const BASELINE_ID = 'a0000000-0000-0000-0000-000000000001';
  console.log(`\nSetting up Baseline Assessment: ${BASELINE_ID}...`);

  const { error: upsertBaseErr } = await supabase.from('assessments').upsert(
    {
      id: BASELINE_ID,
      title: 'Đánh Giá Năng Lực Số Chuẩn 5 Miền (Khảo Thí Đầu Vào)',
      description:
        'Bài khảo thí chẩn đoán năng lực số ban đầu gồm 25 câu hỏi trắc nghiệm chuẩn hóa chọn lọc bao quát trọn vẹn 5 miền năng lực số. Hoàn thành để tự động xác lập Hồ sơ năng lực và kích hoạt lộ trình học tập cá nhân hóa.',
      framework_id: frameworkId,
      duration_minutes: 25,
      passing_score: 70,
      point_reward: 50,
      is_published: true,
      visibility: 'PUBLIC',
      access_tier: 'FREE',
      is_system_baseline: true,
      system_code: 'BASELINE_5DOMAINS',
      organization_id: null,
      owner_user_id: null,
    },
    { onConflict: 'id' }
  );

  if (upsertBaseErr) {
    console.error('Error upserting baseline assessment:', upsertBaseErr.message);
  } else {
    console.log('Upserted Baseline Assessment header successfully.');
  }

  // Clear existing items of baseline
  await supabase.from('assessment_items').delete().eq('assessment_id', BASELINE_ID);

  // Pick exactly 5 questions per domain for baseline:
  // D1: [1, 4, 12, 22, 35]
  // D2: [41, 45, 47, 51, 58]
  // D3: [61, 65, 71, 75, 78]
  // D4: [81, 85, 89, 93, 97]
  // D5: [101, 105, 110, 115, 120]
  const baselineSttList = [1, 4, 12, 22, 35, 41, 45, 47, 51, 58, 61, 65, 71, 75, 78, 81, 85, 89, 93, 97, 101, 105, 110, 115, 120];
  const baselineQuestions = baselineSttList
    .map((stt) => parsedQuestions.find((q) => q.stt === stt))
    .filter(Boolean) as ParsedQ[];

  console.log(`Inserting ${baselineQuestions.length} items for Baseline Assessment...`);

  for (let idx = 0; idx < baselineQuestions.length; idx++) {
    const q = baselineQuestions[idx];
    const { data: itemData, error: itemErr } = await supabase
      .from('assessment_items')
      .insert({
        assessment_id: BASELINE_ID,
        competency_id: q.competencyId,
        type: 'MCQ',
        prompt: q.prompt,
        points: 4, // 25 questions * 4 = 100 points
        order_index: idx + 1,
        difficulty_level: idx % 3 === 0 ? 'INTERMEDIATE' : 'FOUNDATION',
      })
      .select('id')
      .single();

    if (itemErr || !itemData) {
      console.error(`Failed to insert item ${idx + 1}:`, itemErr?.message);
      continue;
    }

    // Shuffle options so correct answer is not always A
    const shuffled = shuffleOptions(q.options, q.stt * 7 + idx);
    const optionsToInsert = shuffled.map((opt) => ({
      item_id: itemData.id,
      content: opt.content,
      is_correct: opt.is_correct,
      order_index: opt.order_index,
    }));

    const { error: optErr } = await supabase.from('item_options').insert(optionsToInsert);
    if (optErr) console.error(`Error inserting options for item ${idx + 1}:`, optErr.message);
  }

  console.log('Inserted 25 Baseline items with randomized option orders.');

  // 4. Setup Assessment 2: Full Benchmark 120 Questions
  const BENCHMARK_ID = 'a0000000-0000-0000-0000-000000000002';
  console.log(`\nSetting up Full Benchmark Assessment (120 Questions): ${BENCHMARK_ID}...`);

  const { error: upsertBenchErr } = await supabase.from('assessments').upsert(
    {
      id: BENCHMARK_ID,
      title: 'Khảo Thí Đánh Giá Năng Lực Số Toàn Diện 5 Miền (Bộ Chuẩn 120 Câu)',
      description:
        'Bộ đề đánh giá toàn diện 120 câu hỏi trắc nghiệm bao quát trọn vẹn 21 kỹ năng số theo 5 miền năng lực số. Phục vụ đánh giá chuyên sâu và xếp hạng năng lực.',
      framework_id: frameworkId,
      duration_minutes: 90,
      passing_score: 70,
      point_reward: 150,
      is_published: true,
      visibility: 'PUBLIC',
      access_tier: 'FREE',
      is_system_baseline: false,
      system_code: 'BENCHMARK_120_5DOMAINS',
      organization_id: null,
      owner_user_id: null,
    },
    { onConflict: 'id' }
  );

  if (upsertBenchErr) {
    console.error('Error upserting benchmark assessment:', upsertBenchErr.message);
  } else {
    console.log('Upserted Benchmark Assessment header successfully.');
  }

  // Clear existing items of benchmark
  await supabase.from('assessment_items').delete().eq('assessment_id', BENCHMARK_ID);

  console.log(`Inserting ${parsedQuestions.length} items for Full Benchmark Assessment...`);

  // Insert in batches of 10 for speed
  for (let idx = 0; idx < parsedQuestions.length; idx++) {
    const q = parsedQuestions[idx];
    const { data: itemData, error: itemErr } = await supabase
      .from('assessment_items')
      .insert({
        assessment_id: BENCHMARK_ID,
        competency_id: q.competencyId,
        type: 'MCQ',
        prompt: q.prompt,
        points: 1, // 120 total points
        order_index: idx + 1,
        difficulty_level: idx % 4 === 0 ? 'ADVANCED' : idx % 2 === 0 ? 'INTERMEDIATE' : 'FOUNDATION',
      })
      .select('id')
      .single();

    if (itemErr || !itemData) {
      console.error(`Failed to insert benchmark item ${idx + 1}:`, itemErr?.message);
      continue;
    }

    const shuffled = shuffleOptions(q.options, q.stt * 13 + idx);
    const optionsToInsert = shuffled.map((opt) => ({
      item_id: itemData.id,
      content: opt.content,
      is_correct: opt.is_correct,
      order_index: opt.order_index,
    }));

    await supabase.from('item_options').insert(optionsToInsert);
  }

  console.log('Inserted all 120 Benchmark items with randomized option orders.');

  // 5. Seed Standard 5 Learning Paths and Modules
  console.log('\nSeeding 5 Standard Learning Paths and Modules...');

  const pathDefs = [
    {
      code: 'D1',
      title: 'Chặng 1: Thông tin & Dữ liệu số',
      slug: 'thong-tin-va-du-lieu-so',
      description: 'Làm chủ kỹ năng tìm kiếm nâng cao, nhận diện tin giả và quản trị dữ liệu an toàn.',
      domain_codes: ['D1'],
      order_index: 1,
      point_reward: 100,
      modules: [
        {
          skill_code: '1.1',
          title: 'Kỹ thuật tìm kiếm dữ liệu học thuật & toán tử nâng cao',
          description: 'Sử dụng toán tử Google, tìm kiếm filetype:pdf, site:gov.vn và truy vấn tài liệu tin cậy.',
          duration_minutes: 20,
          point_reward: 25,
          content: '### Kỹ thuật tìm kiếm dữ liệu học thuật\n\nKhi tìm kiếm tài liệu trên môi trường số, việc dùng đúng toán tử giúp tiết kiệm 80% thời gian:\n\n1. `filetype:pdf`: Giới hạn định dạng tệp tin tài liệu.\n2. `"cụm từ chính xác"`: Đặt trong dấu ngoặc kép để tìm nguyên văn.\n3. `site:.edu.vn`: Chỉ tìm trong các cổng giáo dục chính thống.\n4. Dấu trừ `-`: Loại bỏ từ khóa gây nhiễu.',
        },
        {
          skill_code: '1.2',
          title: 'Phương pháp kiểm chứng nguồn tin & phát hiện tin giả (Fact-Checking)',
          description: 'Quy trình 4 bước kiểm tra tác giả, thời điểm, bằng chứng xác thực và tìm kiếm ngược hình ảnh.',
          duration_minutes: 25,
          point_reward: 30,
          content: '### Quy trình Fact-Checking 4 bước\n\n1. **Kiểm tra nguồn phát hành**: Nguồn tin có phải cơ quan chuyên môn chính thức hay tài khoản ẩn danh?\n2. **Kiểm tra thời điểm**: Tin tức cũ hay mới? Có bị cắt ghép theo sự kiện khác?\n3. **Tìm kiếm ngược hình ảnh**: Sử dụng Google Images / TinEye để xác định ảnh gốc chụp ở đâu, khi nào.\n4. **Đối chiếu đa nguồn**: Kiểm tra xem ít nhất 2 cơ quan báo chí chính thống có đưa tin không.',
        },
        {
          skill_code: '1.3',
          title: 'Tổ chức thư mục, đặt tên tệp và sao lưu dữ liệu đám mây an toàn',
          description: 'Quy chuẩn đặt tên file khoa học, phân loại cây thư mục và quy tắc sao lưu dự phòng 3-2-1.',
          duration_minutes: 20,
          point_reward: 25,
          content: '### Quy tắc đặt tên tệp và sao lưu 3-2-1\n\n* **Quy chuẩn đặt tên**: `[DuAn]_[ChuDe]_[YYYYMMDD]_[PhienBan]`.\n* **Quy tắc 3-2-1**: Có ít nhất 3 bản sao dữ liệu, lưu trên 2 loại phương tiện khác nhau, và 1 bản lưu trữ đám mây ngoài văn phòng.',
        },
      ],
    },
    {
      code: 'D2',
      title: 'Chặng 2: Giao tiếp & Cộng tác trong môi trường số',
      slug: 'giao-tiep-va-cong-tac-so',
      description: 'Giao tiếp số chuyên nghiệp, văn hóa Netiquette và phối hợp làm việc nhóm trực tuyến hiệu quả.',
      domain_codes: ['D2'],
      order_index: 2,
      point_reward: 100,
      modules: [
        {
          skill_code: '2.1',
          title: 'Quy chuẩn viết Email học thuật và công vụ chuyên nghiệp',
          description: 'Cấu trúc tiêu đề, lời chào, nội dung súc tích, chữ ký email và tệp đính kèm chuẩn mực.',
          duration_minutes: 20,
          point_reward: 25,
          content: '### Chuẩn mực Email công vụ\n\n* **Tiêu đề**: Phải ngắn gọn, chứa mã môn/dự án và nội dung chính (ví dụ: `[NEXA] Báo cáo tiến độ Tuần 4 - Nhóm 2`).\n* **Tệp đính kèm**: Luôn đặt tên file rõ ràng trước khi gửi, tránh tên file vô nghĩa như `file_moi.docx`.',
        },
        {
          skill_code: '2.4',
          title: 'Cộng tác soạn thảo tài liệu nhóm thời gian thực (Docs/Sheets)',
          description: 'Sử dụng chế độ Suggestion, gắn tag @mention, phân quyền View/Comment/Edit chuẩn xác.',
          duration_minutes: 25,
          point_reward: 30,
          content: '### Kỹ năng cộng tác tài liệu số\n\n* Dùng chế độ **Suggesting (Đề xuất)** thay vì xóa thẳng nội dung của đồng nghiệp.\n* Gắn thẻ `@email` để giao nhiệm vụ cụ thể trực tiếp trong comment.\n* Thiết lập quyền truy cập tối thiểu cần thiết: Chỉ cấp quyền `Edit` cho người tham gia soạn thảo.',
        },
        {
          skill_code: '2.5',
          title: 'Chuẩn mực ứng xử mạng (Netiquette) & Quản lý dấu vết số',
          description: 'Giao tiếp lịch sự, bảo vệ danh tính cá nhân và xây dựng hình ảnh số uy tín.',
          duration_minutes: 20,
          point_reward: 25,
          content: '### Netiquette & Dấu vết số\n\n* Không viết in hoa toàn bộ nội dung (tương đương hành vi quát tháo trên môi trường số).\n* Mọi phát ngôn trên mạng đều để lại dấu vết số (Digital Footprint) lâu dài.',
        },
      ],
    },
    {
      code: 'D3',
      title: 'Chặng 3: Sáng tạo Nội dung số & Trí tuệ Nhân tạo',
      slug: 'sang-tao-noi-dung-so-va-ai',
      description: 'Phát triển nội dung đa phương tiện, cộng tác cùng AI tạo sinh và đạo đức bản quyền số.',
      domain_codes: ['D3'],
      order_index: 3,
      point_reward: 100,
      modules: [
        {
          skill_code: '3.1',
          title: 'Thiết kế ấn phẩm truyền thông & bài thuyết trình tương tác',
          description: 'Nguyên lý bố cục thị giác, độ tương phản màu sắc và xuất bản đa định dạng số.',
          duration_minutes: 25,
          point_reward: 30,
          content: '### Nguyên tắc thiết kế nội dung số\n\n* **Độ tương phản**: Đảm bảo chữ nổi bật trên nền, đạt chuẩn tiếp cận WCAG AA.\n* **Khoảng trắng**: Giữ không gian thoáng đãng để người đọc tiếp nhận thông tin dễ dàng.',
        },
        {
          skill_code: '3.2',
          title: 'Kỹ thuật Prompting & Phối hợp hiệu quả cùng AI tạo sinh',
          description: 'Cấu trúc Prompt chuẩn: Vai trò + Bối cảnh + Nhiệm vụ + Định dạng đầu ra mong muốn.',
          duration_minutes: 30,
          point_reward: 35,
          content: '### Cấu trúc Prompting 4 thành phần\n\n1. **Role (Vai trò)**: Đóng vai chuyên gia trong lĩnh vực.\n2. **Context (Bối cảnh)**: Mục tiêu và đối tượng tiếp nhận.\n3. **Task (Nhiệm vụ)**: Mô tả hành động cụ thể.\n4. **Format (Định dạng)**: Bảng biểu, gạch đầu dòng, độ dài cụ thể.',
        },
        {
          skill_code: '3.3',
          title: 'Bản quyền số, giấy phép Creative Commons & Đạo đức AI',
          description: 'Hiểu các loại giấy phép CC-BY, trích dẫn nguồn hợp lệ và chống đạo văn số.',
          duration_minutes: 20,
          point_reward: 25,
          content: '### Bản quyền & Giấy phép số\n\n* Luôn kiểm tra giấy phép trước khi tải và tái sử dụng hình ảnh/tài liệu.\n* Trích dẫn nguồn đầy đủ theo chuẩn APA hoặc đường link chính thống.',
        },
      ],
    },
    {
      code: 'D4',
      title: 'Chặng 4: An toàn số & Bảo vệ dữ liệu cá nhân',
      slug: 'an-toan-so-va-bao-ve-du-lieu',
      description: 'Bảo mật tài khoản, xác thực 2 lớp, phòng ngừa lừa đảo mạng và bảo vệ sức khỏe tâm lý số.',
      domain_codes: ['D4'],
      order_index: 4,
      point_reward: 100,
      modules: [
        {
          skill_code: '4.1',
          title: 'Thiết lập mật khẩu mạnh & Kích hoạt xác thực 2 bước (2FA)',
          description: 'Sử dụng ứng dụng Authenticator, khóa bảo mật FIDO2 và quản lý mật khẩu an toàn.',
          duration_minutes: 20,
          point_reward: 25,
          content: '### Bảo mật tài khoản số\n\n* Mật khẩu tối thiểu 12 ký tự gồm chữ hoa, chữ thường, số và ký tự đặc biệt.\n* Kích hoạt xác thực 2 lớp (2FA) bằng Google Authenticator hoặc Microsoft Authenticator.',
        },
        {
          skill_code: '4.2',
          title: 'Nhận diện bẫy lừa đảo trực tuyến (Phishing, Spoofing)',
          description: 'Phát hiện đường link độc hại, email mạo danh ngân hàng và bảo vệ thông tin nhạy cảm.',
          duration_minutes: 25,
          point_reward: 30,
          content: '### Dấu hiệu lừa đảo Phishing\n\n* Tiêu đề đe dọa khóa tài khoản khẩn cấp trong 24 giờ.\n* Đường dẫn giả mạo sai khác 1 vài ký tự (ví dụ `vietcom-bank.xyz`).\n* Yêu cầu cung cấp mã OTP hoặc mật khẩu - ngân hàng không bao giờ yêu cầu điều này.',
        },
        {
          skill_code: '4.3',
          title: 'Công thái học số & Cân bằng thời gian tiếp xúc màn hình',
          description: 'Quy tắc 20-20-20, bảo vệ thị lực và thói quen giải độc số (Digital Detox).',
          duration_minutes: 20,
          point_reward: 25,
          content: '### Sức khỏe trong môi trường số\n\n* **Quy tắc 20-20-20**: Cứ 20 phút nhìn màn hình, nhìn xa 20 feet (6 mét) trong 20 giây.\n* Điều chỉnh độ cao màn hình ngang tầm mắt để bảo vệ cột sống cổ.',
        },
      ],
    },
    {
      code: 'D5',
      title: 'Chặng 5: Giải quyết vấn đề trong môi trường số',
      slug: 'giai-quyet-van-de-so',
      description: 'Chẩn đoán và khắc phục sự cố máy tính, lựa chọn công cụ số thông minh và học tập liên tục.',
      domain_codes: ['D5'],
      order_index: 5,
      point_reward: 100,
      modules: [
        {
          skill_code: '5.1',
          title: 'Quy trình xử lý sự cố kỹ thuật cơ bản (Troubleshooting)',
          description: 'Khắc phục lỗi mạng Wi-Fi, xung đột phần mềm, đầy bộ nhớ và giải phóng tài nguyên.',
          duration_minutes: 25,
          point_reward: 30,
          content: '### Quy trình Troubleshooting 4 bước\n\n1. Xác định triệu chứng lỗi và thông báo mã lỗi.\n2. Thử giải pháp đơn giản nhất (khởi động lại máy/bộ định tuyến).\n3. Kiểm tra kết nối mạng và nhật ký sự kiện.\n4. Tra cứu thông báo lỗi trên diễn đàn hỗ trợ chính thức.',
        },
        {
          skill_code: '5.2',
          title: 'Phương pháp đánh giá và lựa chọn giải pháp phần mềm tối ưu',
          description: 'So sánh tính năng, chi phí, độ bảo mật và khả năng tương thích của các công cụ số.',
          duration_minutes: 25,
          point_reward: 30,
          content: '### Tiêu chí chọn công cụ số\n\n* Đáp ứng đúng nhu cầu cốt lõi hay thừa thãi tính năng?\n* Dữ liệu có dễ dàng xuất khẩu (Export) khi cần chuyển đổi không?\n* Chính sách quyền riêng tư và bảo mật dữ liệu.',
        },
        {
          skill_code: '5.4',
          title: 'Tự đánh giá khoảng trống năng lực số & Xây dựng kế hoạch bồi dưỡng',
          description: 'Đọc báo cáo phân tích năng lực, xác định mục tiêu và duy trì lộ trình tự học suốt đời.',
          duration_minutes: 20,
          point_reward: 25,
          content: '### Học tập số suốt đời\n\n* Khảo thí định kỳ mỗi 3-6 tháng để theo dõi biểu đồ tiến bộ.\n* Tập trung khắc phục trước những miền năng lực còn điểm thấp.',
        },
      ],
    },
  ];

  for (const p of pathDefs) {
    const { data: pathData, error: pathErr } = await supabase
      .from('learning_paths')
      .upsert(
        {
          title: p.title,
          slug: p.slug,
          description: p.description,
          domain_codes: p.domain_codes,
          order_index: p.order_index,
          point_reward: p.point_reward,
          access_tier: 'FREE',
          is_published: true,
        },
        { onConflict: 'slug' }
      )
      .select('id')
      .single();

    if (pathErr || !pathData) {
      console.error(`Error upserting path ${p.code}:`, pathErr?.message);
      continue;
    }

    const pathId = pathData.id;

    // Clear existing modules for this path
    await supabase.from('learning_modules').delete().eq('path_id', pathId);

    for (let mIdx = 0; mIdx < p.modules.length; mIdx++) {
      const m = p.modules[mIdx];
      const compId = compMap[m.skill_code] || null;

      const { error: modErr } = await supabase.from('learning_modules').insert({
        path_id: pathId,
        competency_id: compId,
        domain_code: p.code,
        skill_code: m.skill_code,
        title: m.title,
        description: m.description,
        duration_minutes: m.duration_minutes,
        point_reward: m.point_reward,
        content_markdown: m.content,
        is_published: true,
        order_index: mIdx + 1,
        access_tier: 'FREE',
      });

      if (modErr) {
        console.error(`Error inserting module ${m.skill_code}:`, modErr.message);
      }
    }

    console.log(`Seeded path ${p.code} (${p.title}) with ${p.modules.length} modules.`);
  }

  console.log('\n=== SEED COMPLETED SUCCESSFULLY! ===');
}

runSeed().catch((err) => {
  console.error('Fatal error during seed:', err);
  process.exit(1);
});
