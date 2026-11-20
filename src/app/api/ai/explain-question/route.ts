import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { GeminiAdapter } from '@/features/ai-gateway/adapters/gemini.adapter';
import { AIUsageLoggerService } from '@/features/ai-gateway/services/ai-usage-logger.service';
import { AiCreditsService } from '@/features/billing/services/ai-credits.service';

/**
 * Personal AI Question Explanation Route
 *
 * Requirements (Phase P3):
 * 1. Authenticate user.
 * 2. Entitlement / Assessment verification:
 *    - submission_id must belong to user (submission.user_id === user.id)
 *    - Submission status must be 'EVALUATED' or 'SUBMITTED' (completed/published assessment)
 *    - Verify question exists and belongs to the assessment/submission
 * 3. Cache check:
 *    - Query ai_question_explanations for (user_id, question_id, question_version)
 *    - If valid cached record found -> return 200 with cached explanation (0 credits deducted, isCached: true)
 * 4. Cache miss:
 *    - Reserve 1 credit using AiCreditsService.reserve() with taskType: 'EXPLAIN_QUESTION', payer: 'PERSONAL'
 *    - Call AI Gateway / Gemini to generate clear, pedagogical Vietnamese explanation
 *    - Persist record in ai_question_explanations via admin client
 *    - Settle credit using AiCreditsService.settle()
 *    - On error: release reserved credit via AiCreditsService.release()
 * 5. Guarantee:
 *    - Strictly readonly on submission scores/status. NEVER modify assessment score or answers!
 */

const requestSchema = z.object({
  question_id: z.string().uuid('Mã câu hỏi (question_id) không hợp lệ'),
  submission_id: z.string().uuid('Mã bài nộp (submission_id) không hợp lệ').optional(),
  question_version: z.number().int().positive().optional().default(1),
  access_context: z.record(z.any()).optional().default({}),
});

export async function POST(req: NextRequest) {
  const startTime = performance.now();
  let reservationId: string | null = null;
  const adminSupabase = createAdminClient();

  try {
    const rawBody = await req.json();
    const validated = requestSchema.safeParse(rawBody);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || 'Dữ liệu yêu cầu không hợp lệ' },
        { status: 400 }
      );
    }

    const { question_id, submission_id, question_version, access_context } = validated.data;

    // 1. Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập để sử dụng trợ lý giải thích AI' }, { status: 401 });
    }

    // 2. Auth & Entitlement Check
    // If submission_id is provided, verify ownership and completion status
    let verifiedItemId: string | null = null;
    let questionPrompt: string = '';
    let questionOptions: Array<{ content: string; isCorrect: boolean; explanation?: string }> = [];
    let selectedOptionText: string | null = null;
    let candidateTextResponse: string | null = null;

    if (submission_id) {
      const { data: submission, error: subError } = await adminSupabase
        .from('assessment_submissions')
        .select('id, user_id, status, assessment_id')
        .eq('id', submission_id)
        .single();

      if (subError || !submission) {
        return NextResponse.json({ error: 'Không tìm thấy bài nộp' }, { status: 404 });
      }

      if (submission.user_id !== user.id) {
        return NextResponse.json(
          { error: 'Bạn không có quyền xem giải thích cho bài làm của người khác' },
          { status: 403 }
        );
      }

      // Check if assessment is submitted or published (EVALUATED or SUBMITTED)
      const allowedStatuses = ['SUBMITTED', 'EVALUATED'];
      if (!allowedStatuses.includes(submission.status)) {
        return NextResponse.json(
          { error: 'Bài thi chưa hoàn thành hoặc chưa được công bố kết quả. Không thể xem giải thích lúc này.' },
          { status: 403 }
        );
      }

      // Fetch the answer & question details for this question_id (item_id)
      const { data: answerRecord } = await adminSupabase
        .from('submission_answers')
        .select(`
          id,
          item_id,
          selected_option_id,
          text_response,
          assessment_items (
            id,
            prompt,
            item_options (
              id,
              content,
              is_correct,
              explanation
            )
          )
        `)
        .eq('submission_id', submission.id)
        .eq('item_id', question_id)
        .maybeSingle();

      if (answerRecord && answerRecord.assessment_items) {
        const item: any = answerRecord.assessment_items;
        verifiedItemId = item.id;
        questionPrompt = item.prompt || '';
        const rawOptions = item.item_options || [];
        questionOptions = rawOptions.map((opt: any) => ({
          content: opt.content,
          isCorrect: Boolean(opt.is_correct),
          explanation: opt.explanation,
        }));

        if (answerRecord.selected_option_id) {
          const selectedOpt = rawOptions.find((o: any) => o.id === answerRecord.selected_option_id);
          if (selectedOpt) {
            selectedOptionText = selectedOpt.content;
          }
        }
        candidateTextResponse = answerRecord.text_response;
      }
    }

    // If verifiedItemId not found via submission_answers, query assessment_items directly
    if (!verifiedItemId) {
      const { data: itemData, error: itemError } = await adminSupabase
        .from('assessment_items')
        .select(`
          id,
          prompt,
          item_options (
            id,
            content,
            is_correct,
            explanation
          )
        `)
        .eq('id', question_id)
        .maybeSingle();

      if (itemError || !itemData) {
        return NextResponse.json({ error: 'Không tìm thấy câu hỏi tương ứng' }, { status: 404 });
      }

      verifiedItemId = itemData.id;
      questionPrompt = itemData.prompt || '';
      const rawOptions = itemData.item_options || [];
      questionOptions = rawOptions.map((opt: any) => ({
        content: opt.content,
        isCorrect: Boolean(opt.is_correct),
        explanation: opt.explanation,
      }));
    }

    // 3. Cache check: Query ai_question_explanations for (user_id, question_id, question_version)
    const { data: cachedExplanation } = await adminSupabase
      .from('ai_question_explanations')
      .select('*')
      .eq('user_id', user.id)
      .eq('question_id', question_id)
      .eq('question_version', question_version)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cachedExplanation) {
      // Check expires_at if set
      const isExpired = cachedExplanation.expires_at && new Date(cachedExplanation.expires_at) < new Date();
      if (!isExpired) {
        return NextResponse.json({
          success: true,
          explanation: cachedExplanation.explanation_text,
          modelUsed: cachedExplanation.model_used,
          creditsDeducted: 0,
          isCached: true,
          cachedAt: cachedExplanation.created_at,
        });
      }
    }

    // 4. Cache Miss: Reserve Credit
    const reserveResult = await AiCreditsService.reserve(
      supabase,
      {
        type: 'PERSONAL',
        id: user.id,
        userId: user.id,
      },
      'EXPLAIN_QUESTION',
      1,
      undefined,
      {
        submissionId: submission_id || null,
        itemId: question_id,
      }
    );

    if (!reserveResult.success) {
      return NextResponse.json(
        {
          error: reserveResult.error || 'Số dư AI Credits không đủ để thực hiện giải thích câu hỏi',
          code: 'INSUFFICIENT_CREDITS',
          remainingCredits: reserveResult.remainingCredits,
        },
        { status: 402 }
      );
    }

    reservationId = reserveResult.reservationId;

    // 5. Call AI service to generate pedagogical explanation in Vietnamese
    const adapter = new GeminiAdapter();
    const systemInstruction = `Bạn là Chuyên gia Khảo thí và Cố vấn Sư phạm Năng lực số NEXA AI.
Nhiệm vụ của bạn là phân tích và giải thích cặn kẽ câu hỏi bài thi năng lực số cho thí sinh, giúp người học hiểu rõ bản chất vấn đề và học hỏi từ lỗi sai.

Quy tắc trình bày:
- Sử dụng tiếng Việt chuẩn mực, sư phạm, giàu tính khích lệ, chuyên nghiệp.
- Không dùng đại từ nhân xưng rập khuôn chatbot (như "Tôi là AI...", "Là một mô hình ngôn ngữ...").
- Cấu trúc rõ ràng:
  1. **Bản chất kiến thức**: Khái niệm then chốt mà câu hỏi đánh giá.
  2. **Phân tích chi tiết**: Vì sao đáp án đúng là chính xác nhất; vì sao các phương án khác chưa chính xác hoặc là bẫy tư duy thường gặp.
  3. **Lời khuyên ứng dụng**: Cách tư duy hoặc hành động đúng trong thực tiễn môi trường số.
- Không phô trương thuật ngữ kỹ thuật khó hiểu nếu không cần thiết; tuyệt đối tuân thủ chuẩn năng lực số của NEXA.`;

    const optionsText = questionOptions
      .map((opt, idx) => `Phương án ${idx + 1}: ${opt.content} [${opt.isCorrect ? 'Đáp án đúng' : 'Sai'}]${opt.explanation ? ` (Ghi chú: ${opt.explanation})` : ''}`)
      .join('\n');

    const prompt = `Hãy giải thích chi tiết câu hỏi sau:
Nội dung câu hỏi:
${questionPrompt}

${optionsText ? `Các phương án lựa chọn:\n${optionsText}` : ''}
${selectedOptionText ? `Phương án thí sinh đã chọn: ${selectedOptionText}` : ''}
${candidateTextResponse ? `Câu trả lời tự luận của thí sinh: ${candidateTextResponse}` : ''}

Hãy cung cấp lời giải thích toàn diện, chi tiết theo định hướng sư phạm để thí sinh nâng cao năng lực số.`;

    const geminiInstance = (adapter as any).ai;
    const response = await geminiInstance.models.generateContent({
      model: adapter.defaultModel,
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.4,
      },
    });

    const explanationText = response.text?.trim() || 'Không có phản hồi giải thích từ mô hình.';
    const promptTokens = Math.round(prompt.length / 4);
    const completionTokens = Math.round(explanationText.length / 4);
    const totalTokens = promptTokens + completionTokens;

    // 6. Persist explanation to ai_question_explanations cache
    const { data: insertedExplanation, error: insertError } = await adminSupabase
      .from('ai_question_explanations')
      .insert({
        question_id,
        item_id: verifiedItemId,
        question_version,
        user_id: user.id,
        explanation_text: explanationText,
        model_used: adapter.defaultModel,
        tokens_used: totalTokens,
        credit_cost: 1,
        access_context,
        request_id: reservationId,
      })
      .select('id, created_at')
      .single();

    if (insertError) {
      console.error('[explain-question] Failed to persist cache:', insertError);
      // Even if cache insert fails, release or settle credits appropriately
      await AiCreditsService.release(supabase, reservationId, 'Lỗi lưu cache giải thích');
      return NextResponse.json({ error: 'Lỗi hệ thống khi lưu trữ giải thích' }, { status: 500 });
    }

    // 7. Settle credits
    await AiCreditsService.settle(supabase, reservationId, 1);

    // 8. Log AI Usage
    const latencyMs = Math.round(performance.now() - startTime);
    await AIUsageLoggerService.logUsage(supabase, {
      userId: user.id,
      feature: 'EXPLAIN_QUESTION',
      model: adapter.defaultModel,
      provider: 'GOOGLE_GEMINI',
      promptTokens,
      completionTokens,
      latencyMs,
      status: 'SUCCESS',
    });

    return NextResponse.json({
      success: true,
      explanation: explanationText,
      modelUsed: adapter.defaultModel,
      creditsDeducted: 1,
      isCached: false,
      explanationId: insertedExplanation.id,
      createdAt: insertedExplanation.created_at,
    });
  } catch (err: any) {
    console.error('[explain-question] Internal server error:', err);
    if (reservationId) {
      try {
        const supabase = await createClient();
        await AiCreditsService.release(supabase, reservationId, err.message || 'Lỗi không xác định');
      } catch (releaseErr) {
        console.error('[explain-question] Failed to release credit reservation:', releaseErr);
      }
    }

    return NextResponse.json(
      { error: err.message || 'Lỗi hệ thống khi tạo giải thích câu hỏi' },
      { status: 500 }
    );
  }
}
