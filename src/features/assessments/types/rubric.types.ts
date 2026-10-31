import { z } from 'zod';

// ==============================================================================
// RUBRIC VALIDATION SCHEMAS & TYPES (STRICT ZERO-ANY)
// ==============================================================================

export const RubricLevelSchema = z.object({
  id: z.string().uuid().optional(),
  levelName: z.string().min(1, 'Tên mức độ không được để trống'),
  scorePercent: z.number().min(0, 'Phần trăm điểm phải >= 0').max(100, 'Phần trăm điểm tối đa là 100'),
  description: z.string().min(1, 'Mô tả tiêu chí mức độ không được để trống'),
});

export const RubricCriterionSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Tên tiêu chí không được để trống'),
  weightPercent: z.number().min(0).max(100).default(100).optional(),
  maxPoints: z.number().positive('Điểm tối đa của tiêu chí phải > 0'),
  orderIndex: z.number().int().min(0).default(0).optional(),
  levels: z.array(RubricLevelSchema).min(2, 'Mỗi tiêu chí phải có ít nhất 2 mức độ đánh giá'),
});

export const RubricDefinitionSchema = z.object({
  id: z.string().uuid().optional(),
  itemId: z.string().uuid('ID câu hỏi không hợp lệ').optional(),
  title: z.string().min(1, 'Tiêu đề rubric không được để trống'),
  description: z.string().optional(),
  criteria: z.array(RubricCriterionSchema).min(1, 'Rubric phải có ít nhất 1 tiêu chí'),
});

export type RubricLevel = z.infer<typeof RubricLevelSchema>;
export type RubricCriterion = z.infer<typeof RubricCriterionSchema>;
export type RubricDefinition = z.infer<typeof RubricDefinitionSchema>;

export interface FullRubricDetail {
  id: string;
  itemId: string;
  title: string;
  description?: string | null;
  createdAt?: string;
  criteria: Array<{
    id: string;
    rubricId: string;
    name: string;
    weightPercent: number;
    maxPoints: number;
    orderIndex: number;
    levels: Array<{
      id: string;
      criterionId: string;
      levelName: string;
      scorePercent: number;
      description: string;
    }>;
  }>;
}

export interface RubricValidationResult {
  valid: boolean;
  errors: string[];
}
