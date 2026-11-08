import fs from 'fs';
import path from 'path';
import { createAdminClient } from '../src/lib/supabase/admin';

// Simple robust CSV parser for RFC 4180
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
        i++; // skip escaped quote
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

async function run() {
  const supabase = createAdminClient();
  const csvPath = path.resolve(process.cwd(), 'docs/Bo_120_Cau_Hoi_Nang_Luc_So_DEMO.csv');
  const rawCsv = fs.readFileSync(csvPath, 'utf8');
  const allRows = parseCSV(rawCsv);

  console.log(`Parsed total rows: ${allRows.length}`);
  const header = allRows[0];
  console.log('Header:', header);

  // Filter 120 questions
  const questionRows = allRows.slice(1).filter((r) => {
    const stt = parseInt(r[0], 10);
    return !isNaN(stt) && stt >= 1 && stt <= 120;
  });

  console.log(`Found exactly ${questionRows.length} valid question rows.`);

  // 1. Fetch competencies from DB
  const { data: competencies, error: compErr } = await supabase
    .from('competencies')
    .select('id, skill_code, domain_id, competency_domains(code)')
    .order('skill_code');

  if (compErr || !competencies) {
    throw new Error(`Failed to fetch competencies: ${compErr?.message}`);
  }

  // Create competency map by domain code: '01' -> array of competencies
  const compMap: Record<string, string[]> = {
    '01': [],
    '02': [],
    '03': [],
    '04': [],
    '05': [],
  };

  competencies.forEach((c: any) => {
    const dom = Array.isArray(c.competency_domains) ? c.competency_domains[0] : c.competency_domains;
    const code = dom?.code || '01';
    if (compMap[code]) {
      compMap[code].push(c.id);
    }
  });

  console.log('Competency count per domain:', {
    '01': compMap['01'].length,
    '02': compMap['02'].length,
    '03': compMap['03'].length,
    '04': compMap['04'].length,
    '05': compMap['05'].length,
  });

  const benchmarkId = 'a0000000-0000-0000-0000-000000000002';

  // 2. Clear old items for this assessment
  console.log('Deleting previous items for benchmark assessment...');
  await supabase.from('item_options').delete().filter('item_id', 'in', `(${
    Array.from({ length: 120 }, (_, i) => `'a0000000-0000-0000-0002-${String(i + 1).padStart(12, '0')}'`).join(',')
  })`);
  await supabase.from('assessment_items').delete().eq('assessment_id', benchmarkId);

  // 3. Prepare 120 assessment items and 480 options
  const assessmentItems: any[] = [];
  const itemOptions: any[] = [];

  questionRows.forEach((row, idx) => {
    const stt = parseInt(row[0], 10); // 1 to 120
    const rawGroup = row[1]; // "Nhóm 1", "Nhóm 2", etc.
    const groupNumMatch = rawGroup.match(/(\d+)/);
    const domainNum = groupNumMatch ? parseInt(groupNumMatch[1], 10) : 1;
    const domainCode = String(domainNum).padStart(2, '0');

    const domainComps = compMap[domainCode] || compMap['01'];
    // Distribute among skills in this domain
    const compId = domainComps[(stt - 1) % domainComps.length];

    const questionText = row[3].trim();
    const optA = row[4].trim();
    const optB = row[5].trim();
    const optC = row[6].trim();
    const optD = row[7].trim();
    const rawCorrectKey = (row[8] || 'A').trim().toUpperCase(); // In CSV, usually 'A'

    const itemId = `a0000000-0000-0000-0002-${String(stt).padStart(12, '0')}`;

    assessmentItems.push({
      id: itemId,
      assessment_id: benchmarkId,
      competency_id: compId,
      type: 'MCQ',
      prompt: questionText,
      points: 1,
      order_index: stt,
      difficulty_level: stt % 3 === 0 ? 'HARD' : stt % 2 === 0 ? 'MEDIUM' : 'EASY',
    });

    // Rotate options so correct answer is balanced across A, B, C, D
    const originalOptions = [
      { text: optA, isCorrect: rawCorrectKey === 'A' },
      { text: optB, isCorrect: rawCorrectKey === 'B' },
      { text: optC, isCorrect: rawCorrectKey === 'C' },
      { text: optD, isCorrect: rawCorrectKey === 'D' },
    ];

    // Shift offset: (stt % 4)
    const shift = stt % 4;
    const rotatedOptions = [
      ...originalOptions.slice(shift),
      ...originalOptions.slice(0, shift),
    ];

    rotatedOptions.forEach((opt, optIdx) => {
      const optionId = `a0000000-0000-0002-${String(stt).padStart(8, '0')}-${String(optIdx + 1).padStart(4, '0')}`;
      itemOptions.push({
        id: optionId,
        item_id: itemId,
        content: opt.text,
        is_correct: opt.isCorrect,
        order_index: optIdx + 1,
        explanation: opt.isCorrect
          ? 'Đáp án chính xác theo khung chuẩn hóa kiến thức và kỹ năng số thực chứng.'
          : 'Lựa chọn chưa phù hợp với nguyên tắc xử lý an toàn và hiệu quả trong môi trường số.',
      });
    });
  });

  console.log(`Prepared ${assessmentItems.length} items and ${itemOptions.length} options.`);

  // 4. Batch insert assessment items (batches of 30)
  for (let i = 0; i < assessmentItems.length; i += 30) {
    const batch = assessmentItems.slice(i, i + 30);
    const { error } = await supabase.from('assessment_items').insert(batch);
    if (error) {
      throw new Error(`Failed to insert assessment_items batch ${i}: ${error.message}`);
    }
    console.log(`Inserted items ${i + 1} to ${Math.min(i + 30, assessmentItems.length)}`);
  }

  // 5. Batch insert item options (batches of 60)
  for (let i = 0; i < itemOptions.length; i += 60) {
    const batch = itemOptions.slice(i, i + 60);
    const { error } = await supabase.from('item_options').insert(batch);
    if (error) {
      throw new Error(`Failed to insert item_options batch ${i}: ${error.message}`);
    }
    console.log(`Inserted options ${i + 1} to ${Math.min(i + 60, itemOptions.length)}`);
  }

  // 6. Update Benchmark Assessment properties
  const { error: updateErr } = await supabase
    .from('assessments')
    .update({
      title: 'Khảo Thí Đánh Giá Năng Lực Số Toàn Diện 5 Miền (Bộ Chuẩn 120 Câu)',
      description: 'Bài sát hạch toàn diện gồm 120 câu hỏi trắc nghiệm thực chứng bao quát trọn vẹn 21 kỹ năng số cốt lõi. Dành cho đánh giá định kỳ, xếp hạng và cấp chứng chỉ số chính thức.',
      duration_minutes: 90,
      passing_score: 70,
      point_reward: 150,
      is_published: true,
      access_tier: 'VIP',
      is_vip: true,
      visibility: 'PUBLIC',
      system_code: 'BENCHMARK_120_5DOMAINS',
    })
    .eq('id', benchmarkId);

  if (updateErr) {
    console.error('Failed to update assessment record:', updateErr);
  } else {
    console.log('Successfully updated benchmark assessment to published!');
  }

  console.log('✅ SEED 120 BENCHMARK QUESTIONS COMPLETED SUCCESSFULLY!');
}

run().catch((e) => {
  console.error('Execution error:', e);
  process.exit(1);
});
