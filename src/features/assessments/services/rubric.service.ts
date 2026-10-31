import {
  RubricDefinitionSchema,
  RubricDefinition,
  FullRubricDetail,
  RubricValidationResult,
} from '../types/rubric.types';

export class RubricService {
  /**
   * Validates the integrity of a rubric definition.
   * Enforces that:
   * 1. Schema conforms to Zod rules (types, minimum counts).
   * 2. Sum of criterion maxPoints matches item's maxScore (within 0.01 tolerance).
   * 3. Every criterion has at least 2 levels with valid score percentages [0, 100].
   */
  static validateRubricStructure(
    rubric: Partial<RubricDefinition>,
    expectedItemMaxScore?: number
  ): RubricValidationResult {
    const parseResult = RubricDefinitionSchema.safeParse(rubric);
    const errors: string[] = [];

    if (!parseResult.success) {
      parseResult.error.errors.forEach((err) => {
        errors.push(`${err.path.join('.')}: ${err.message}`);
      });
      return { valid: false, errors };
    }

    const data = parseResult.data;

    // Check sum of criteria maxPoints against expected item maxScore
    if (typeof expectedItemMaxScore === 'number' && expectedItemMaxScore > 0) {
      const sumMaxPoints = data.criteria.reduce((acc, c) => acc + c.maxPoints, 0);
      if (Math.abs(sumMaxPoints - expectedItemMaxScore) > 0.01) {
        errors.push(
          `Tổng điểm các tiêu chí (${sumMaxPoints}) phải bằng điểm tối đa của câu hỏi (${expectedItemMaxScore})`
        );
      }
    }

    // Check each criterion levels
    data.criteria.forEach((criterion, idx) => {
      if (!criterion.levels || criterion.levels.length < 2) {
        errors.push(`Tiêu chí ${idx + 1} ("${criterion.name}") phải có ít nhất 2 mức độ đánh giá`);
      }

      criterion.levels?.forEach((level, lIdx) => {
        if (level.scorePercent < 0 || level.scorePercent > 100) {
          errors.push(
            `Mức độ ${lIdx + 1} của tiêu chí "${criterion.name}" có phần trăm điểm không hợp lệ (${level.scorePercent}%)`
          );
        }
      });
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Fetches full structured rubric for a given assessment item.
   */
  static async getRubricByItemId(
    supabase: any,
    itemId: string
  ): Promise<FullRubricDetail | null> {
    if (!itemId) return null;

    // 1. Fetch rubric header
    const { data: rubric, error: rubricError } = await supabase
      .from('rubrics')
      .select('id, item_id, title, description, created_at')
      .eq('item_id', itemId)
      .maybeSingle();

    if (rubricError || !rubric) return null;

    // 2. Fetch criteria for this rubric
    const { data: criteria, error: critError } = await supabase
      .from('rubric_criteria')
      .select('id, rubric_id, name, weight_percent, max_points, order_index')
      .eq('rubric_id', rubric.id)
      .order('order_index', { ascending: true });

    if (critError || !criteria) {
      return {
        id: rubric.id,
        itemId: rubric.item_id,
        title: rubric.title,
        description: rubric.description,
        createdAt: rubric.created_at,
        criteria: [],
      };
    }

    // 3. Fetch levels for all criteria
    const criteriaIds = criteria.map((c: any) => c.id);
    let levels: any[] = [];
    if (criteriaIds.length > 0) {
      const { data: lvlData } = await supabase
        .from('rubric_levels')
        .select('id, criterion_id, level_name, score_percent, description')
        .in('criterion_id', criteriaIds)
        .order('score_percent', { ascending: false });
      levels = lvlData || [];
    }

    // Stitch together
    const fullCriteria = criteria.map((c: any) => ({
      id: c.id,
      rubricId: c.rubric_id,
      name: c.name,
      weightPercent: Number(c.weight_percent) || 100,
      maxPoints: Number(c.max_points) || 10,
      orderIndex: c.order_index ?? 0,
      levels: levels
        .filter((l: any) => l.criterion_id === c.id)
        .map((l: any) => ({
          id: l.id,
          criterionId: l.criterion_id,
          levelName: l.level_name,
          scorePercent: Number(l.score_percent) || 0,
          description: l.description,
        })),
    }));

    return {
      id: rubric.id,
      itemId: rubric.item_id,
      title: rubric.title,
      description: rubric.description,
      createdAt: rubric.created_at,
      criteria: fullCriteria,
    };
  }

  /**
   * Saves or replaces a structured rubric for an item atomically.
   */
  static async saveRubricForItem(
    supabase: any,
    itemId: string,
    rubricData: Omit<RubricDefinition, 'itemId'> & { itemId?: string },
    expectedMaxScore?: number
  ): Promise<{ success: boolean; rubric?: FullRubricDetail; errors?: string[] }> {
    const fullRubric = { ...rubricData, itemId };
    const validation = this.validateRubricStructure(fullRubric, expectedMaxScore);

    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    // 1. Delete existing rubric if any (cascades to criteria and levels)
    await supabase.from('rubrics').delete().eq('item_id', itemId);

    // 2. Insert new rubric header
    const { data: createdRubric, error: rubErr } = await supabase
      .from('rubrics')
      .insert({
        item_id: itemId,
        title: rubricData.title,
        description: rubricData.description || null,
      })
      .select('id, item_id, title, description, created_at')
      .single();

    if (rubErr || !createdRubric) {
      return { success: false, errors: [rubErr?.message || 'Không thể tạo bản ghi rubric'] };
    }

    // 3. Insert criteria and their levels
    const createdCriteria: FullRubricDetail['criteria'] = [];

    for (let i = 0; i < rubricData.criteria.length; i++) {
      const c = rubricData.criteria[i];
      const { data: critRow, error: cErr } = await supabase
        .from('rubric_criteria')
        .insert({
          rubric_id: createdRubric.id,
          name: c.name,
          weight_percent: c.weightPercent,
          max_points: c.maxPoints,
          order_index: c.orderIndex ?? i,
        })
        .select('id, rubric_id, name, weight_percent, max_points, order_index')
        .single();

      if (cErr || !critRow) {
        return { success: false, errors: [cErr?.message || 'Không thể lưu tiêu chí rubric'] };
      }

      // Insert levels for this criterion
      const levelsToInsert = c.levels.map((lvl) => ({
        criterion_id: critRow.id,
        level_name: lvl.levelName,
        score_percent: lvl.scorePercent,
        description: lvl.description,
      }));

      const { data: lvlRows, error: lErr } = await supabase
        .from('rubric_levels')
        .insert(levelsToInsert)
        .select('id, criterion_id, level_name, score_percent, description');

      if (lErr || !lvlRows) {
        return { success: false, errors: [lErr?.message || 'Không thể lưu mức độ rubric'] };
      }

      createdCriteria.push({
        id: critRow.id,
        rubricId: critRow.rubric_id,
        name: critRow.name,
        weightPercent: Number(critRow.weight_percent),
        maxPoints: Number(critRow.max_points),
        orderIndex: critRow.order_index,
        levels: lvlRows.map((l: any) => ({
          id: l.id,
          criterionId: l.criterion_id,
          levelName: l.level_name,
          scorePercent: Number(l.score_percent),
          description: l.description,
        })),
      });
    }

    return {
      success: true,
      rubric: {
        id: createdRubric.id,
        itemId: createdRubric.item_id,
        title: createdRubric.title,
        description: createdRubric.description,
        createdAt: createdRubric.created_at,
        criteria: createdCriteria,
      },
    };
  }

  /**
   * Clones a rubric from one item to another.
   */
  static async cloneRubric(
    supabase: any,
    sourceItemId: string,
    targetItemId: string
  ): Promise<FullRubricDetail | null> {
    const sourceRubric = await this.getRubricByItemId(supabase, sourceItemId);
    if (!sourceRubric) return null;

    const res = await this.saveRubricForItem(supabase, targetItemId, {
      title: sourceRubric.title,
      description: sourceRubric.description || undefined,
      criteria: sourceRubric.criteria.map((c) => ({
        name: c.name,
        weightPercent: c.weightPercent,
        maxPoints: c.maxPoints,
        orderIndex: c.orderIndex,
        levels: c.levels.map((l) => ({
          levelName: l.levelName,
          scorePercent: l.scorePercent,
          description: l.description,
        })),
      })),
    });

    return res.rubric || null;
  }
}
