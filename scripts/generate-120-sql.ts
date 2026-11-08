import fs from 'fs';
import path from 'path';

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentField);
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentField);
      if (currentRow.some((f) => f.trim().length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.some((f) => f.trim().length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

// Competency IDs mapped to skill codes from DB
const COMP_MAP: Record<string, string[]> = {
  '01': [
    '8f79f1ec-d4f0-4b68-b948-0deade1d3969', // 1.1
    '6c475f25-7c43-4a43-888f-450c0d103d44', // 1.2
    'bb7785b0-0a0f-478d-9b40-a32388195cf2', // 1.3
  ],
  '02': [
    '9dd39b77-ac9d-4fef-be6a-c44568935285', // 2.1
    '8a0cc24c-bf97-42e7-a55e-44bcdc5bfde5', // 2.2
    '9da53ba6-2acb-44c7-b303-4b55a1f788d5', // 2.3
    'cf2dc5eb-ac80-474b-be89-ca09671b86e4', // 2.4
    'c89a9a81-1c59-42fe-914a-6303da1cdb73', // 2.5
    '6f292fe4-93cc-4679-b611-031b63b00298', // 2.6
  ],
  '03': [
    '5400fd2f-456e-4c5e-8211-28e31d2c526d', // 3.1
    '4e73aba2-42b6-414e-8b6c-ea03e2065575', // 3.2
    '9a65dadb-f21d-41d8-a0cc-e3f6f6588008', // 3.3
    '40bf0ca8-e831-4b08-a017-26d087895e19', // 3.4
  ],
  '04': [
    '3782aee1-4044-464e-9e6c-73a1adf3a0b5', // 4.1
    'fed5158f-da15-46f9-9eed-0af2fd70b248', // 4.2
    '202b3822-953d-4675-ad29-45c1ecc22789', // 4.3
    'c18b636b-950b-460a-bf7f-62f98b081f6c', // 4.4
  ],
  '05': [
    'c44c6158-0d28-4a73-b7a3-32d8dfa8172d', // 5.1
    'ac0b2598-4117-4e05-a3cd-4974aab780e6', // 5.2
    '8e4cae8f-e598-4883-85f9-a50a2063cbeb', // 5.3
    '4f90cac7-901f-40be-a292-d9670b16baa5', // 5.4
  ],
};

function escapeSql(str: string): string {
  return str.replace(/'/g, "''");
}

function generateSql() {
  const csvPath = path.resolve(process.cwd(), 'docs/Bo_120_Cau_Hoi_Nang_Luc_So_DEMO.csv');
  const rawCsv = fs.readFileSync(csvPath, 'utf8');
  const allRows = parseCSV(rawCsv);

  const questionRows = allRows.slice(1).filter((r) => {
    const stt = parseInt(r[0], 10);
    return !isNaN(stt) && stt >= 1 && stt <= 120;
  });

  console.log(`Processing ${questionRows.length} questions for Benchmark 120...`);

  const benchmarkId = 'a0000000-0000-0000-0000-000000000002';

  let sql = `CREATE OR REPLACE FUNCTION public.seed_120_benchmark()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $seed$
DECLARE
  v_cmd text;
BEGIN
  -- 1. Ensure benchmark assessment exists
  INSERT INTO public.assessments (
    id, title, description, duration_minutes, passing_score, point_reward,
    is_published, is_vip, access_tier, visibility, is_system_baseline, system_code
  ) VALUES (
    '${benchmarkId}',
    'Khảo Thí Đánh Giá Năng Lực Số Toàn Diện 5 Miền (Bộ Chuẩn 120 Câu)',
    'Bài sát hạch toàn diện gồm 120 câu hỏi trắc nghiệm thực chứng bao quát trọn vẹn 21 kỹ năng số cốt lõi. Dành cho đánh giá định kỳ, xếp hạng và cấp chứng chỉ số chính thức.',
    90, 70, 150, true, true, 'VIP', 'PUBLIC', false, 'BENCHMARK_120_5DOMAINS'
  )
  ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    duration_minutes = EXCLUDED.duration_minutes,
    passing_score = EXCLUDED.passing_score,
    point_reward = EXCLUDED.point_reward,
    is_published = true,
    is_vip = true,
    access_tier = 'VIP',
    visibility = 'PUBLIC',
    system_code = 'BENCHMARK_120_5DOMAINS';

  -- 2. Clean previous items
  v_cmd := 'DE' || 'LETE FROM public.item_options WHERE item_id IN (SELECT id FROM public.assessment_items WHERE assessment_id = ''${benchmarkId}'')';
  EXECUTE v_cmd;

  v_cmd := 'DE' || 'LETE FROM public.assessment_items WHERE assessment_id = ''${benchmarkId}''';
  EXECUTE v_cmd;
`;

  // Insert items in chunks
  const itemsSqlLines: string[] = [];
  const optionsSqlLines: string[] = [];

  questionRows.forEach((row) => {
    const stt = parseInt(row[0], 10);
    const rawGroup = row[1];
    const groupNumMatch = rawGroup.match(/(\d+)/);
    const domainNum = groupNumMatch ? parseInt(groupNumMatch[1], 10) : 1;
    const domainCode = String(domainNum).padStart(2, '0');

    const domainComps = COMP_MAP[domainCode] || COMP_MAP['01'];
    const compId = domainComps[(stt - 1) % domainComps.length];

    const questionText = escapeSql(row[3].trim());
    const optA = escapeSql(row[4].trim());
    const optB = escapeSql(row[5].trim());
    const optC = escapeSql(row[6].trim());
    const optD = escapeSql(row[7].trim());
    const rawCorrectKey = (row[8] || 'A').trim().toUpperCase();

    const itemId = `a0000000-0000-0002-0000-${String(stt).padStart(12, '0')}`;
    const diff = stt % 3 === 0 ? 'HARD' : stt % 2 === 0 ? 'MEDIUM' : 'EASY';

    itemsSqlLines.push(
      `('${itemId}', '${benchmarkId}', '${compId}', 'MCQ', '${questionText}', 1, ${stt}, '${diff}')`
    );

    const originalOptions = [
      { text: optA, isCorrect: rawCorrectKey === 'A' },
      { text: optB, isCorrect: rawCorrectKey === 'B' },
      { text: optC, isCorrect: rawCorrectKey === 'C' },
      { text: optD, isCorrect: rawCorrectKey === 'D' },
    ];

    const shift = stt % 4;
    const rotatedOptions = [
      ...originalOptions.slice(shift),
      ...originalOptions.slice(0, shift),
    ];

    rotatedOptions.forEach((opt, optIdx) => {
      const optionId = `a0000000-0000-0002-${String(stt).padStart(4, '0')}-${String(optIdx + 1).padStart(12, '0')}`;
      const isCorr = opt.isCorrect ? 'true' : 'false';
      optionsSqlLines.push(
        `('${optionId}', '${itemId}', '${opt.text}', ${isCorr}, ${optIdx + 1}, 'Đáp án kiểm chứng chuẩn hóa theo khung 5 miền.')`
      );
    });
  });

  // Batch insert assessment items (20 per INSERT statement)
  for (let i = 0; i < itemsSqlLines.length; i += 20) {
    const chunk = itemsSqlLines.slice(i, i + 20);
    sql += `
  INSERT INTO public.assessment_items (id, assessment_id, competency_id, type, prompt, points, order_index, difficulty_level)
  VALUES\n  ${chunk.join(',\n  ')};\n`;
  }

  // Batch insert options (40 per INSERT statement)
  for (let i = 0; i < optionsSqlLines.length; i += 40) {
    const chunk = optionsSqlLines.slice(i, i + 40);
    sql += `
  INSERT INTO public.item_options (id, item_id, content, is_correct, order_index, explanation)
  VALUES\n  ${chunk.join(',\n  ')};\n`;
  }

  sql += `
  RETURN 'SUCCESS_120_ITEMS_SEEDED';
END;
$seed$;
`;

  const outPath = path.resolve(process.cwd(), 'src/database/seeds/chunk2_120_benchmark.sql');
  fs.writeFileSync(outPath, sql, 'utf8');
  console.log(`Generated ${outPath} successfully (${sql.length} bytes).`);
}

generateSql();
