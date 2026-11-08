import fs from 'fs';
import path from 'path';

// Let's create the PL/pgSQL function code for Baseline
const chunk1Path = path.resolve(process.cwd(), 'src', 'database', 'seeds', 'chunk1_baseline.sql');
let chunk1Content = fs.readFileSync(chunk1Path, 'utf-8');

// Remove DO $$ and END $$;
chunk1Content = chunk1Content.replace(/^DO \$\$/m, '').replace(/END \$\$;\s*$/m, '');
// Remove any DELETE statement because we already ran reset_assessment_items
chunk1Content = chunk1Content.replace(/DELETE FROM public\.assessment_items[^;]+;/g, '');

const baselineFunctionSql = `
CREATE OR REPLACE FUNCTION public.seed_baseline_assessment()
RETURNS VOID
LANGUAGE plpgsql
AS $BODY$
DECLARE
    v_framework_id UUID;
    v_item_id UUID;
BEGIN
    SELECT id INTO v_framework_id FROM public.assessment_frameworks WHERE code = 'NEXA_CORE_FRAMEWORK_V1' LIMIT 1;
    IF v_framework_id IS NULL THEN
        SELECT id INTO v_framework_id FROM public.assessment_frameworks LIMIT 1;
    END IF;

    UPDATE public.assessments SET
        title = 'Đánh Giá Năng Lực Số Chuẩn 5 Miền (Khảo Thí Đầu Vào)',
        description = 'Bài khảo thí chẩn đoán năng lực số ban đầu gồm 25 câu hỏi trắc nghiệm chuẩn hóa chọn lọc bao quát trọn vẹn 5 miền năng lực số. Hoàn thành để tự động xác lập Hồ sơ năng lực và kích hoạt lộ trình học tập cá nhân hóa.',
        framework_id = v_framework_id,
        duration_minutes = 25,
        passing_score = 70.00,
        point_reward = 50,
        is_published = TRUE,
        visibility = 'PUBLIC',
        access_tier = 'FREE',
        is_system_baseline = TRUE,
        system_code = 'BASELINE_5DOMAINS'
    WHERE id = 'a0000000-0000-0000-0000-000000000001';

${chunk1Content.substring(chunk1Content.indexOf('-- Baseline Question 1'))}

END;
$BODY$;
`;

fs.writeFileSync(path.resolve(process.cwd(), 'src', 'database', 'seeds', 'fn_seed_baseline.sql'), baselineFunctionSql.trim(), 'utf-8');
console.log('fn_seed_baseline.sql written successfully, length:', baselineFunctionSql.length);
