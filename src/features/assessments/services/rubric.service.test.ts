import { describe, it, expect, vi } from 'vitest';
import { RubricService } from './rubric.service';
import { RubricDefinition } from '../types/rubric.types';

describe('RubricService - Unit Tests', () => {
  const sampleValidRubric: RubricDefinition = {
    itemId: 'c0a80101-0000-0000-0000-000000000001',
    title: 'Rubric Đánh Giá Kỹ Năng Tìm Kiếm Thông Tin',
    description: 'Đánh giá khả năng tìm kiếm, phân loại và bảo mật thông tin',
    criteria: [
      {
        name: 'Độ chính xác thông tin',
        maxPoints: 6,
        weightPercent: 60,
        orderIndex: 0,
        levels: [
          { levelName: 'Xuất sắc', scorePercent: 100, description: 'Tìm đúng 100% nguồn uy tín' },
          { levelName: 'Đạt', scorePercent: 75, description: 'Tìm được đa số nguồn uy tín' },
          { levelName: 'Chưa đạt', scorePercent: 25, description: 'Dùng nguồn không kiểm chứng' },
        ],
      },
      {
        name: 'Trích dẫn nguồn hợp lệ',
        maxPoints: 4,
        weightPercent: 40,
        orderIndex: 1,
        levels: [
          { levelName: 'Đạt', scorePercent: 100, description: 'Trích dẫn chuẩn APA/IEEE' },
          { levelName: 'Chưa đạt', scorePercent: 0, description: 'Không ghi nguồn' },
        ],
      },
    ],
  };

  describe('validateRubricStructure', () => {
    it('should validate a correct rubric matching item maxScore', () => {
      const res = RubricService.validateRubricStructure(sampleValidRubric, 10);
      expect(res.valid).toBe(true);
      expect(res.errors).toHaveLength(0);
    });

    it('should reject when criteria maxPoints sum does not match expectedItemMaxScore', () => {
      // criteria sum is 6 + 4 = 10, expected is 15
      const res = RubricService.validateRubricStructure(sampleValidRubric, 15);
      expect(res.valid).toBe(false);
      expect(res.errors[0]).toContain('Tổng điểm các tiêu chí (10) phải bằng điểm tối đa của câu hỏi (15)');
    });

    it('should reject criteria with fewer than 2 levels', () => {
      const invalidRubric: RubricDefinition = {
        ...sampleValidRubric,
        criteria: [
          {
            name: 'Tiêu chí 1 mức',
            maxPoints: 10,
            weightPercent: 100,
            levels: [{ levelName: 'Duy nhất', scorePercent: 100, description: 'Chỉ 1 mức' }],
          },
        ],
      };

      const res = RubricService.validateRubricStructure(invalidRubric, 10);
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('phải có ít nhất 2 mức độ'))).toBe(true);
    });

    it('should reject level with scorePercent outside [0, 100]', () => {
      const invalidRubric: RubricDefinition = {
        ...sampleValidRubric,
        criteria: [
          {
            name: 'Tiêu chí điểm âm',
            maxPoints: 10,
            weightPercent: 100,
            levels: [
              { levelName: 'Âm', scorePercent: -10, description: 'Âm điểm' },
              { levelName: 'Chuẩn', scorePercent: 100, description: 'Chuẩn' },
            ],
          },
        ],
      };

      const res = RubricService.validateRubricStructure(invalidRubric, 10);
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes('phần trăm điểm không hợp lệ') || e.includes('Phần trăm điểm phải >='))).toBe(true);
    });
  });

  describe('Database Operations: getRubricByItemId & saveRubricForItem', () => {
    it('should fetch and assemble full rubric structure correctly', async () => {
      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'rubrics') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: 'rubric-uuid-1',
                  item_id: 'item-uuid-1',
                  title: 'Rubric Test',
                  description: 'Desc',
                  created_at: '2026-10-31T00:00:00Z',
                },
                error: null,
              }),
            };
          }
          if (table === 'rubric_criteria') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              order: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: 'crit-uuid-1',
                    rubric_id: 'rubric-uuid-1',
                    name: 'Tiêu chí 1',
                    weight_percent: '100.00',
                    max_points: '10.00',
                    order_index: 0,
                  },
                ],
                error: null,
              }),
            };
          }
          if (table === 'rubric_levels') {
            return {
              select: vi.fn().mockReturnThis(),
              in: vi.fn().mockReturnThis(),
              order: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: 'lvl-uuid-1',
                    criterion_id: 'crit-uuid-1',
                    level_name: 'Xuất sắc',
                    score_percent: '100.00',
                    description: 'Tốt',
                  },
                  {
                    id: 'lvl-uuid-2',
                    criterion_id: 'crit-uuid-1',
                    level_name: 'Chưa đạt',
                    score_percent: '0.00',
                    description: 'Kém',
                  },
                ],
                error: null,
              }),
            };
          }
          return { select: vi.fn().mockReturnThis() };
        }),
      };

      const result = await RubricService.getRubricByItemId(mockSupabase, 'item-uuid-1');
      expect(result).not.toBeNull();
      expect(result?.title).toBe('Rubric Test');
      expect(result?.criteria).toHaveLength(1);
      expect(result?.criteria[0].maxPoints).toBe(10);
      expect(result?.criteria[0].levels).toHaveLength(2);
      expect(result?.criteria[0].levels[0].scorePercent).toBe(100);
    });

    it('should save a valid rubric and cascade through tables', async () => {
      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'rubrics') {
            return {
              delete: vi.fn().mockReturnThis(),
              eq: vi.fn().mockResolvedValue({ error: null }),
              insert: vi.fn().mockReturnThis(),
              select: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'new-rub-1',
                  item_id: sampleValidRubric.itemId,
                  title: sampleValidRubric.title,
                  description: sampleValidRubric.description,
                  created_at: '2026-10-31T00:00:00Z',
                },
                error: null,
              }),
            };
          }
          if (table === 'rubric_criteria') {
            return {
              insert: vi.fn().mockReturnThis(),
              select: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'new-crit-1',
                  rubric_id: 'new-rub-1',
                  name: 'Tiêu chí',
                  weight_percent: 60,
                  max_points: 6,
                  order_index: 0,
                },
                error: null,
              }),
            };
          }
          if (table === 'rubric_levels') {
            return {
              insert: vi.fn().mockReturnThis(),
              select: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: 'new-lvl-1',
                    criterion_id: 'new-crit-1',
                    level_name: 'Xuất sắc',
                    score_percent: 100,
                    description: 'Tốt',
                  },
                  {
                    id: 'new-lvl-2',
                    criterion_id: 'new-crit-1',
                    level_name: 'Đạt',
                    score_percent: 75,
                    description: 'Ổn',
                  },
                ],
                error: null,
              }),
            };
          }
          return { select: vi.fn().mockReturnThis() };
        }),
      };

      const res = await RubricService.saveRubricForItem(
        mockSupabase,
        sampleValidRubric.itemId!,
        sampleValidRubric,
        10
      );

      expect(res.success).toBe(true);
      expect(res.rubric?.title).toBe(sampleValidRubric.title);
      expect(res.rubric?.criteria).toHaveLength(2);
    });
  });
});
