import { RubricGradingInput, RubricGradingOutput } from '../types/grading.types';
import { CompetencyAnalysisInput, CompetencyAnalysisOutput } from '../types/competency.types';

export interface AIProviderAdapter {
  readonly providerName: string;
  readonly defaultModel: string;

  /**
   * Evaluates student submission against multi-criteria rubrics.
   * Enforces zero-any, PII scrubbing, and Zod output validation.
   */
  gradeRubricSubmission(input: RubricGradingInput): Promise<RubricGradingOutput>;

  /**
   * Generates comprehensive competency diagnosis (Apps 2, 3, 4, 5):
   * Radar chart data, Skill Gaps < 60%, Pedagogical Feedback, 4-Step Pathway.
   */
  analyzeCompetencyProfile(input: CompetencyAnalysisInput): Promise<CompetencyAnalysisOutput>;
}
