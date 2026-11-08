import fs from 'fs';
import path from 'path';

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
  options: Array<{ content: string; is_correct: boolean }>,
  seed: number
) {
  const arr = [...options];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(((seed * 9301 + 49297) % 233280) / 233280 * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.map((opt, idx) => ({ ...opt, order_index: idx + 1 }));
}

function escapeSql(str: string): string {
  return str.replace(/'/g, "''");
}

function generateSQL() {
  console.log('Generating SQL from CSV...');

  const domainCompPool: Record<number, string[]> = {
    1: ['1.1', '1.2', '1.3'],
    2: ['2.1', '2.2', '2.4', '2.5', '2.6'],
    3: ['3.1', '3.2', '3.3', '3.4'],
    4: ['4.1', '4.2', '4.3', '4.4'],
    5: ['5.1', '5.2', '5.3', '5.4'],
  };

  const csvPath = path.resolve(process.cwd(), 'docs', 'Bo_120_Cau_Hoi_Nang_Luc_So_DEMO.csv');
  const csvRaw = fs.readFileSync(csvPath, 'utf-8');
  const rows = parseCSV(csvRaw);
  const dataRows = rows.slice(1).filter((r) => r.length >= 8 && r[3] && r[3].length > 3);

  console.log(`Parsed ${dataRows.length} valid question rows.`);

  const parsedQuestions = dataRows.map((r) => {
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

    return {
      stt,
      groupNum,
      groupName,
      prompt,
      options: rawOptions,
      skillCode,
    };
  });

  const BASELINE_ID = 'a0000000-0000-0000-0000-000000000001';
  const BENCHMARK_ID = 'a0000000-0000-0000-0000-000000000002';

  let sql = `-- ==============================================================================
-- NEXA SEED 08: 120 REAL QUESTIONS, BASELINE 25-Q EXAM, AND 5 LEARNING PATHS
-- ==============================================================================

DO $$
DECLARE
    v_framework_id UUID;
    v_item_id UUID;
BEGIN
    SELECT id INTO v_framework_id FROM public.assessment_frameworks WHERE code = 'NEXA_CORE_FRAMEWORK_V1' LIMIT 1;
    IF v_framework_id IS NULL THEN
        SELECT id INTO v_framework_id FROM public.assessment_frameworks LIMIT 1;
    END IF;

    -- 1. BASELINE ASSESSMENT (25 Selected Questions)
    INSERT INTO public.assessments (
        id, title, description, framework_id, duration_minutes, passing_score, point_reward,
        is_published, visibility, access_tier, is_system_baseline, system_code
    ) VALUES (
        '${BASELINE_ID}',
        'Đánh Giá Năng Lực Số Chuẩn 5 Miền (Khảo Thí Đầu Vào)',
        'Bài khảo thí chẩn đoán năng lực số ban đầu gồm 25 câu hỏi trắc nghiệm chuẩn hóa chọn lọc bao quát trọn vẹn 5 miền năng lực số. Hoàn thành để tự động xác lập Hồ sơ năng lực và kích hoạt lộ trình học tập cá nhân hóa.',
        v_framework_id, 25, 70.00, 50, TRUE, 'PUBLIC', 'FREE', TRUE, 'BASELINE_5DOMAINS'
    ) ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        is_published = TRUE,
        visibility = 'PUBLIC',
        access_tier = 'FREE',
        is_system_baseline = TRUE,
        system_code = 'BASELINE_5DOMAINS';

    DELETE FROM public.assessment_items WHERE assessment_id = '${BASELINE_ID}';

`;

  // Pick exactly 5 questions per domain for baseline:
  const baselineSttList = [1, 4, 12, 22, 35, 41, 45, 47, 51, 58, 61, 65, 71, 75, 78, 81, 85, 89, 93, 97, 101, 105, 110, 115, 120];
  const baselineQuestions = baselineSttList
    .map((stt) => parsedQuestions.find((q) => q.stt === stt))
    .filter(Boolean);

  baselineQuestions.forEach((q, idx) => {
    const diff = idx % 3 === 0 ? 'INTERMEDIATE' : 'FOUNDATION';
    sql += `    -- Baseline Question ${idx + 1} (Domain ${q!.groupNum}, Skill ${q!.skillCode})
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        '${BASELINE_ID}',
        (SELECT id FROM public.competencies WHERE skill_code = '${q!.skillCode}' LIMIT 1),
        'MCQ',
        '${escapeSql(q!.prompt)}',
        4.00,
        ${idx + 1},
        '${diff}'
    ) RETURNING id INTO v_item_id;

`;

    const shuffled = shuffleOptions(q!.options, q!.stt * 7 + idx);
    sql += `    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES\n`;
    sql += shuffled
      .map(
        (opt) =>
          `        (v_item_id, '${escapeSql(opt.content)}', ${opt.is_correct ? 'TRUE' : 'FALSE'}, ${opt.order_index})`
      )
      .join(',\n');
    sql += `;\n\n`;
  });

  // BENCHMARK ASSESSMENT 120 QUESTIONS
  sql += `    -- 2. BENCHMARK ASSESSMENT (120 Questions)
    INSERT INTO public.assessments (
        id, title, description, framework_id, duration_minutes, passing_score, point_reward,
        is_published, visibility, access_tier, is_system_baseline, system_code
    ) VALUES (
        '${BENCHMARK_ID}',
        'Khảo Thí Đánh Giá Năng Lực Số Toàn Diện 5 Miền (Bộ Chuẩn 120 Câu)',
        'Bộ đề đánh giá toàn diện 120 câu hỏi trắc nghiệm bao quát trọn vẹn 21 kỹ năng số theo 5 miền năng lực số. Phục vụ đánh giá chuyên sâu và xếp hạng năng lực.',
        v_framework_id, 90, 70.00, 150, TRUE, 'PUBLIC', 'FREE', FALSE, 'BENCHMARK_120_5DOMAINS'
    ) ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        is_published = TRUE,
        visibility = 'PUBLIC',
        access_tier = 'FREE',
        is_system_baseline = FALSE,
        system_code = 'BENCHMARK_120_5DOMAINS';

    DELETE FROM public.assessment_items WHERE assessment_id = '${BENCHMARK_ID}';

`;

  parsedQuestions.forEach((q, idx) => {
    const diff = idx % 4 === 0 ? 'ADVANCED' : idx % 2 === 0 ? 'INTERMEDIATE' : 'FOUNDATION';
    sql += `    -- Benchmark Question ${idx + 1} (Domain ${q.groupNum}, Skill ${q.skillCode})
    INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
    VALUES (
        gen_random_uuid(),
        '${BENCHMARK_ID}',
        (SELECT id FROM public.competencies WHERE skill_code = '${q.skillCode}' LIMIT 1),
        'MCQ',
        '${escapeSql(q.prompt)}',
        1.00,
        ${idx + 1},
        '${diff}'
    ) RETURNING id INTO v_item_id;

`;

    const shuffled = shuffleOptions(q.options, q.stt * 13 + idx);
    sql += `    INSERT INTO public.item_options (item_id, content, is_correct, order_index) VALUES\n`;
    sql += shuffled
      .map(
        (opt) =>
          `        (v_item_id, '${escapeSql(opt.content)}', ${opt.is_correct ? 'TRUE' : 'FALSE'}, ${opt.order_index})`
      )
      .join(',\n');
    sql += `;\n\n`;
  });

  sql += `END $$;\n`;

  const outSqlPath = path.resolve(process.cwd(), 'src', 'database', 'seeds', '08_real_120_questions.sql');
  fs.writeFileSync(outSqlPath, sql, 'utf-8');
  console.log(`Generated ${outSqlPath} successfully! File size: ${(sql.length / 1024).toFixed(1)} KB`);
}

generateSQL();
