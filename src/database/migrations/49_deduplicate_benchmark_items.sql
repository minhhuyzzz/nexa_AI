-- Migration 49: Deduplicate Benchmark Assessment Items (120 Questions)
-- Cleans up duplicated assessment_items in benchmark assessment a0000000-0000-0000-0000-000000000002

DELETE FROM assessment_items
WHERE assessment_id = 'a0000000-0000-0000-0000-000000000002'
  AND (
    prompt = 'Câu hỏi chưa có nội dung'
    OR id IN (
      SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY prompt ORDER BY created_at ASC, id ASC) as rn
        FROM assessment_items
        WHERE assessment_id = 'a0000000-0000-0000-0000-000000000002'
      ) t
      WHERE t.rn > 1
    )
  );

-- Re-index order_index 0..119 sequentially
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC) - 1 as new_index
  FROM assessment_items
  WHERE assessment_id = 'a0000000-0000-0000-0000-000000000002'
)
UPDATE assessment_items
SET order_index = ranked.new_index
FROM ranked
WHERE assessment_items.id = ranked.id;
