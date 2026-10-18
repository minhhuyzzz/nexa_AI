import { z } from 'zod';

// ==============================================================================
// INPUT TYPES FOR COMPETENCY ANALYSIS (APPS 2, 3, 4, 5)
// ==============================================================================

export interface DomainScoreInput {
  domainCode: string;
  domainName: string;
  score: number;
  maxScore: number;
  percentage: number;
}

export interface SkillScoreInput {
  skillCode: string;
  skillName: string;
  domainCode: string;
  score: number;
  maxScore: number;
  percentage: number;
}

export interface QuestionMistakeInput {
  prompt: string;
  studentAnswer: string;
  correctExplanation?: string;
  skillCode: string;
}

export interface CompetencyAnalysisInput {
  candidateName?: string;
  assessmentTitle: string;
  overallPercentage: number;
  totalScore: number;
  maxScore: number;
  domainScores: DomainScoreInput[];
  skillScores: SkillScoreInput[];
  mistakes?: QuestionMistakeInput[];
}

// ==============================================================================
// ZOD SCHEMAS & OUTPUT TYPES (STRICT ZERO-ANY)
// ==============================================================================

export const RadarDataItemSchema = z.object({
  domainCode: z.string(),
  domainName: z.string(),
  score: z.number().min(0).max(100),
  benchmark: z.number().min(0).max(100).default(70),
});

export const SkillGapSchema = z.object({
  skillCode: z.string(),
  skillName: z.string(),
  domainCode: z.string(),
  percentage: z.number().min(0).max(100),
  rootCause: z.string(),
  riskImpact: z.string(),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']),
});

export const PathwayStepSchema = z.object({
  stepNumber: z.number().int().min(1).max(4),
  title: z.string(),
  targetSkill: z.string(),
  durationHours: z.number().min(0.5),
  objective: z.string(),
  actionText: z.string(),
  recommendedSkillCode: z.string(),
});

export const CompetencyAnalysisOutputSchema = z.object({
  overallLevel: z.enum(['FOUNDATION', 'INTERMEDIATE', 'ADVANCED', 'HIGHLY_SPECIALIZED']),
  overallSummary: z.string(),
  radarData: z.array(RadarDataItemSchema).length(5),
  skillGaps: z.array(SkillGapSchema),
  strengths: z.string(),
  weaknesses: z.string(),
  pedagogicalFeedback: z.string(),
  learningPathway: z.array(PathwayStepSchema).length(4),
});

export type RadarDataItem = z.infer<typeof RadarDataItemSchema>;
export type SkillGap = z.infer<typeof SkillGapSchema>;
export type PathwayStep = z.infer<typeof PathwayStepSchema>;
export type CompetencyAnalysisOutput = z.infer<typeof CompetencyAnalysisOutputSchema>;
