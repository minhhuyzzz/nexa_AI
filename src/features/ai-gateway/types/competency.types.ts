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

export const RecommendedCourseSchema = z.object({
  id: z.string(),
  competencyId: z.string(),
  domainCode: z.string(),
  title: z.string(),
  provider: z.string(),
  durationMinutes: z.number(),
  level: z.enum(['Basic', 'Intermediate', 'Advanced', 'Highly Advanced']),
  format: z.string(),
  description: z.string(),
  actionUrl: z.string(),
  recommendationReason: z.string(),
});

export const CompetencyAnalysisOutputSchema = z.object({
  overallLevel: z.enum(['BASIC', 'FOUNDATION', 'INTERMEDIATE', 'ADVANCED', 'HIGHLY_ADVANCED', 'HIGHLY_SPECIALIZED']),
  overallSummary: z.string(),
  radarData: z.array(RadarDataItemSchema).length(5),
  skillGaps: z.array(SkillGapSchema),
  strengths: z.string(),
  weaknesses: z.string(),
  pedagogicalFeedback: z.string(),
  learningPathway: z.array(PathwayStepSchema).length(4),
  recommendedCourses: z.array(RecommendedCourseSchema).default([]),
});

export type RadarDataItem = z.infer<typeof RadarDataItemSchema>;
export type SkillGap = z.infer<typeof SkillGapSchema>;
export type PathwayStep = z.infer<typeof PathwayStepSchema>;
export type RecommendedCourse = z.infer<typeof RecommendedCourseSchema>;
export type CompetencyAnalysisOutput = z.infer<typeof CompetencyAnalysisOutputSchema>;
