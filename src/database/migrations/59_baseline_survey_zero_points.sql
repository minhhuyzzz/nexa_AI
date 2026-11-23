-- ==============================================================================
-- NEXA MIGRATION 59: BASELINE SURVEY ZERO POINTS
-- ==============================================================================
-- Sets point_reward = 0 for baseline diagnostic assessments.
-- Diagnostic baseline surveys are used purely to establish initial competence (T0)
-- and generate the learning path; they do not award XP / PTS point rewards.

UPDATE public.assessments
SET point_reward = 0
WHERE is_system_baseline = TRUE
   OR id = 'a0000000-0000-0000-0000-000000000001'
   OR baseline_group = 'INTAKE'
   OR title ILIKE '%đầu vào%';
