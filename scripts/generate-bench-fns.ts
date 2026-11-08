import fs from 'fs';
import path from 'path';

function wrapInFunction(chunkFile: string, fnName: string, outFile: string) {
  let content = fs.readFileSync(path.resolve(process.cwd(), 'src', 'database', 'seeds', chunkFile), 'utf-8');
  // Strip outer DO $$ ... BEGIN
  content = content.replace(/^DO \$\$[\s\S]*?BEGIN/m, '');
  content = content.replace(/END \$\$;\s*$/m, '');
  content = content.replace(/DELETE FROM public\.assessment_items[^;]+;/g, '');

  const fnSql = `
CREATE OR REPLACE FUNCTION public.${fnName}()
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

${content.trim()}

END;
$BODY$;
`;

  fs.writeFileSync(path.resolve(process.cwd(), 'src', 'database', 'seeds', outFile), fnSql.trim(), 'utf-8');
  console.log(`Generated ${outFile}, length: ${fnSql.length}`);
}

wrapInFunction('chunk2_bench_1_40.sql', 'seed_bench_part1', 'fn_seed_bench_1.sql');
wrapInFunction('chunk3_bench_41_80.sql', 'seed_bench_part2', 'fn_seed_bench_2.sql');
wrapInFunction('chunk4_bench_81_120.sql', 'seed_bench_part3', 'fn_seed_bench_3.sql');
