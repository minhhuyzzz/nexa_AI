import type { SupabaseClient } from '@supabase/supabase-js';

export type CanonicalQuestionType =
  | 'MCQ'
  | 'SCENARIO'
  | 'DIGITAL_EVIDENCE'
  | 'PRACTICE_FILE'
  | 'PRACTICE_URL';

export type CanonicalDifficultyLevel =
  | 'FOUNDATION'
  | 'INTERMEDIATE'
  | 'ADVANCED'
  | 'HIGHLY_SPECIALIZED';

export interface QuestionBankOptionInput {
  id?: string;
  content: string;
  is_correct: boolean;
  explanation?: string | null;
  order_index?: number;
}

export interface SaveQuestionBankItemInput {
  id?: string;
  code?: string;
  prompt: string;
  type: string;
  difficulty_level: string;
  default_points?: number;
  domain_id?: string;
  sub_competence_code?: string;
  status?: 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'ARCHIVED';
  rubric_definition?: Record<string, any> | null;
  options?: QuestionBankOptionInput[];
  owner_user_id?: string;
  scope?: 'PERSONAL' | 'ORGANIZATION' | 'PLATFORM';
}

export function normalizeDifficulty(diff?: string | null): CanonicalDifficultyLevel {
  if (!diff) return 'INTERMEDIATE';
  const clean = diff.trim().toUpperCase();
  if (['BEGINNER', 'FOUNDATION', 'EASY', 'CO_BAN'].includes(clean)) return 'FOUNDATION';
  if (['INTERMEDIATE', 'MEDIUM', 'TRUNG_BINH'].includes(clean)) return 'INTERMEDIATE';
  if (['ADVANCED', 'HARD', 'NANG_CAO'].includes(clean)) return 'ADVANCED';
  if (['EXPERT', 'HIGHLY_SPECIALIZED', 'CHUYEN_GIA'].includes(clean)) return 'HIGHLY_SPECIALIZED';
  return 'INTERMEDIATE';
}

export function normalizeQuestionType(type?: string | null): CanonicalQuestionType {
  if (!type) return 'MCQ';
  const clean = type.trim().toUpperCase();
  if (clean === 'MCQ' || clean === 'TRAC_NGHIEM') return 'MCQ';
  if (clean === 'SCENARIO' || clean === 'TINH_HUONG') return 'SCENARIO';
  if (['PRACTICAL_FILE', 'PRACTICE_FILE'].includes(clean)) return 'PRACTICE_FILE';
  if (['DIGITAL_LINK', 'PRACTICE_URL'].includes(clean)) return 'PRACTICE_URL';
  if (clean === 'DIGITAL_EVIDENCE') return 'DIGITAL_EVIDENCE';
  return 'MCQ';
}

/**
 * Service ghi câu hỏi vào Ngân hàng câu hỏi (Canonical Question Bank Writer)
 * Đảm bảo ghi tách bạch giữa question_bank_items và question_bank_options
 * Tuân thủ tuyệt đối schema constraint migration 13 & 34
 */
export async function saveQuestionBankItem(
  supabase: SupabaseClient,
  input: SaveQuestionBankItemInput
) {
  const normType = normalizeQuestionType(input.type);
  const normDiff = normalizeDifficulty(input.difficulty_level);

  if (!input.prompt || !input.prompt.trim()) {
    throw new Error('Nội dung câu hỏi không được để trống');
  }

  const validOptions = (input.options || []).filter((o) => o.content && o.content.trim().length > 0);
  if (normType === 'MCQ') {
    if (validOptions.length < 2) {
      throw new Error('Câu hỏi trắc nghiệm cần có ít nhất 2 phương án trả lời');
    }
    const hasCorrect = validOptions.some((o) => o.is_correct === true);
    if (!hasCorrect) {
      throw new Error('Câu hỏi trắc nghiệm phải có ít nhất một đáp án đúng');
    }
  }

  const itemPayload: Record<string, any> = {
    code: input.code?.trim() || `QB-${Date.now().toString(36).toUpperCase()}`,
    prompt: input.prompt.trim(),
    type: normType,
    difficulty_level: normDiff,
    default_points: Number(input.default_points) || 10,
    status: input.status || 'APPROVED',
    scope: input.scope || 'PERSONAL',
    updated_at: new Date().toISOString(),
  };

  if (input.owner_user_id) {
    itemPayload.owner_user_id = input.owner_user_id;
    itemPayload.created_by = input.owner_user_id;
  }

  if (normType !== 'MCQ' && input.rubric_definition) {
    itemPayload.rubric_definition = input.rubric_definition;
  }

  let savedItemId: string = (input.id && input.id !== 'new') ? input.id : '';

  if (!savedItemId) {
    // 1. Insert new item
    const { data: insertedItem, error: insertItemErr } = await supabase
      .from('question_bank_items')
      .insert(itemPayload)
      .select()
      .single();

    if (insertItemErr) {
      throw new Error(`Lỗi tạo câu hỏi: ${insertItemErr.message}`);
    }
    savedItemId = insertedItem.id;
  } else {
    // 2. Update existing item
    const { error: updateItemErr } = await supabase
      .from('question_bank_items')
      .update(itemPayload)
      .eq('id', savedItemId);

    if (updateItemErr) {
      throw new Error(`Lỗi cập nhật câu hỏi: ${updateItemErr.message}`);
    }
  }

  // 3. Handle options in question_bank_options table
  if (normType === 'MCQ' && validOptions.length > 0) {
    // Clean old options on update
    if (input.id && input.id !== 'new') {
      await supabase.from('question_bank_options').delete().eq('item_id', savedItemId);
    }

    const optionsToInsert = validOptions.map((opt, idx) => ({
      item_id: savedItemId,
      content: opt.content.trim(),
      is_correct: Boolean(opt.is_correct),
      explanation: opt.explanation?.trim() || null,
      order_index: typeof opt.order_index === 'number' ? opt.order_index : idx,
    }));

    const { error: insertOptErr } = await supabase
      .from('question_bank_options')
      .insert(optionsToInsert);

    if (insertOptErr) {
      throw new Error(`Lỗi lưu danh sách đáp án: ${insertOptErr.message}`);
    }
  }

  return {
    success: true,
    itemId: savedItemId,
  };
}

/**
 * Nhập câu hỏi hàng loạt có kiểm soát lỗi chi tiết từng dòng (Fault-tolerant Batch Importer)
 */
export async function batchImportQuestionBankItems(
  supabase: SupabaseClient,
  items: SaveQuestionBankItemInput[]
) {
  const results = {
    total: items.length,
    successCount: 0,
    failedCount: 0,
    errors: [] as Array<{ index: number; code?: string; error: string }>,
    createdIds: [] as string[],
  };

  for (let i = 0; i < items.length; i++) {
    const itemInput = items[i];
    try {
      const res = await saveQuestionBankItem(supabase, itemInput);
      results.successCount++;
      results.createdIds.push(res.itemId);
    } catch (err: any) {
      results.failedCount++;
      results.errors.push({
        index: i + 1,
        code: itemInput.code,
        error: err.message || 'Lỗi không xác định khi lưu',
      });
    }
  }

  return results;
}
