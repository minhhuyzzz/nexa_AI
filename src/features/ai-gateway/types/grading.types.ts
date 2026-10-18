import { z } from 'zod';

export const RubricLevelDefSchema = z.object({
  levelName: z.string(),
  scorePercent: z.number(),
  description: z.string(),
});

export const RubricCriterionDefSchema = z.object({
  id: z.string(),
  name: z.string(),
  weightPercent: z.number(),
  maxPoints: z.number(),
  levels: z.array(RubricLevelDefSchema),
});

export const RubricDefSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  criteria: z.array(RubricCriterionDefSchema),
});

export const CriterionScoreSchema = z.object({
  criterionId: z.string(),
  criterionName: z.string(),
  selectedLevel: z.string(),
  score: z.number().min(0),
  maxPoints: z.number().min(0),
  justification: z.string(),
  evidenceQuote: z.string(),
});

export const RubricGradingOutputSchema = z.object({
  totalScore: z.number().min(0),
  maxScore: z.number().min(0),
  confidenceScore: z.number().min(0).max(100),
  confidenceFlag: z.enum(['GREEN', 'AMBER', 'RED']),
  evidenceQuote: z.string(),
  strengths: z.string(),
  weaknesses: z.string(),
  feedback: z.string(),
  criterionScores: z.array(CriterionScoreSchema),
});

export type RubricDef = z.infer<typeof RubricDefSchema>;
export type RubricCriterionDef = z.infer<typeof RubricCriterionDefSchema>;
export type RubricLevelDef = z.infer<typeof RubricLevelDefSchema>;
export type CriterionScore = z.infer<typeof CriterionScoreSchema>;
export type RubricGradingOutput = z.infer<typeof RubricGradingOutputSchema>;

export interface RubricGradingInput {
  taskPrompt: string;
  studentResponse: string;
  rubric: RubricDef;
}
