-- Migration 48: Expand numeric precision for total_score, max_score, and points columns
-- Resolves "numeric field overflow" when assessments have >= 100 questions or total points >= 1000

ALTER TABLE public.assessment_submissions
  ALTER COLUMN total_score TYPE NUMERIC(10,2),
  ALTER COLUMN max_score TYPE NUMERIC(10,2);

ALTER TABLE public.submission_answers
  ALTER COLUMN score_awarded TYPE NUMERIC(10,2);

ALTER TABLE public.assessment_items
  ALTER COLUMN points TYPE NUMERIC(10,2);

ALTER TABLE public.credentials
  ALTER COLUMN total_score TYPE NUMERIC(10,2),
  ALTER COLUMN max_score TYPE NUMERIC(10,2);

ALTER TABLE public.ai_evaluations
  ALTER COLUMN total_score TYPE NUMERIC(10,2),
  ALTER COLUMN max_score TYPE NUMERIC(10,2);
