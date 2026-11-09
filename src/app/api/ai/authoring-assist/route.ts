import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { GeminiAdapter } from '@/features/ai-gateway/adapters/gemini.adapter';
import { AIUsageLoggerService } from '@/features/ai-gateway/services/ai-usage-logger.service';

/**
 * AI Authoring Assistant API Route
 * Implements 8-Layer AI Architecture:
 * - Layer 5: Authentication & Authorization (RBAC)
 * - Layer 6: Guardrails (Input validation & sanitization)
 * - Layer 2: System Prompt (5 Digital Competency Domains Specialist)
 * - Layer 1: Model Execution (Google Gemini via AI Gateway)
 * - Layer 4: Structured Output (Strict JSON schema)
 * - Layer 8: Logging & Observability
 */

const AssistRequestSchema = z.object({
  action: z.enum(['SIMILAR_QUESTION', 'EXPLAIN_OPTIONS', 'GENERATE_BY_DOMAIN']),
  domainCode: z.string().optional(),
  domainTitle: z.string().optional(),
  currentQuestion: z
    .object({
      prompt: z.string().optional(),
      domainCode: z.string().optional(),
      domainTitle: z.string().optional(),
      options: z
        .array(
          z.object({
            id: z.string().optional(),
            text: z.string(),
            isCorrect: z.boolean(),
          })
        )
        .optional(),
    })
    .optional(),
  topic: z.string().optional(),
  difficulty: z.enum(['BASIC', 'INTERMEDIATE', 'ADVANCED']).optional().default('INTERMEDIATE'),
});

const DOMAIN_MAP: Record<string, string> = {
  '01': 'Dữ liệu và Thông tin số',
  '02': 'Giao tiếp và Hợp tác trong môi trường số',
  '03': 'Sáng tạo nội dung số',
  '04': 'An toàn và Bảo mật số',
  '05': 'Giải quyết vấn đề trong môi trường số',
  D1: 'Dữ liệu và Thông tin số',
  D2: 'Giao tiếp và Hợp tác trong môi trường số',
  D3: 'Sáng tạo nội dung số',
  D4: 'An toàn và Bảo mật số',
  D5: 'Giải quyết vấn đề trong môi trường số',
};

export async function POST(req: NextRequest) {
  const startTime = performance.now();
  try {
    // 1. Layer 5: Authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    // 2. Layer 6: Guardrails & Schema validation
    const rawBody = await req.json();
    const parsed = AssistRequestSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dữ liệu yêu cầu không hợp lệ', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { action, domainCode, domainTitle, currentQuestion, topic, difficulty } = parsed.data;

    // Resolve target domain
    const resolvedDomainCode = domainCode || currentQuestion?.domainCode || '01';
    const cleanDomainKey = resolvedDomainCode.replace(/^0+/, '');
    const resolvedDomainTitle =
      domainTitle ||
      currentQuestion?.domainTitle ||
      DOMAIN_MAP[resolvedDomainCode] ||
      DOMAIN_MAP[`0${cleanDomainKey}`] ||
      '5 miền năng lực số';

    // 3. Layer 2: System Prompt & Layer 1: Model execution
    const adapter = new GeminiAdapter();

    let systemInstruction = `
Bạn là Chuyên gia Khảo thí và Thiết kế Câu hỏi Đánh giá Năng lực Số hàng đầu (Senior Educational Assessment Specialist) của Nền tảng NEXA.
Hệ thống đánh giá dựa trên Khung năng lực số 5 miền:
- Miền 1: Dữ liệu và Thông tin số (Tìm kiếm, định vị, lọc, đánh giá độ tin cậy và quản lý dữ liệu).
- Miền 2: Giao tiếp và Hợp tác trong môi trường số (Tương tác công nghệ số, chia sẻ, tham gia công dân số, quy tắc ứng xử Netiquette).
- Miền 3: Sáng tạo nội dung số (Phát triển nội dung, tích hợp đa phương tiện số, bản quyền và giấy phép sở hữu trí tuệ).
- Miền 4: An toàn và Bảo mật số (Bảo vệ thiết bị, dữ liệu cá nhân, nhận diện lừa đảo trực tuyến phishing, sức khỏe công nghệ).
- Miền 5: Giải quyết vấn đề trong môi trường số (Xử lý sự cố kỹ thuật, lựa chọn công cụ số phù hợp, tư duy chuyển đổi số).

Quy tắc biên soạn:
1. Nội dung chuẩn mực học thuật, câu hỏi thực tiễn gắn với tình huống công việc/đời sống số, tránh lý thuyết suông.
2. Tuyệt đối không nhắc đến mã kỹ thuật "DigComp" trong văn bản sinh ra, chỉ dùng tên "5 miền năng lực số" hoặc tên cụ thể của từng miền.
3. Trả về định dạng JSON thuần túy (Structured JSON). Không bọc bằng Markdown backticks hay văn bản dẫn nhập.
`;

    let prompt = '';

    if (action === 'SIMILAR_QUESTION') {
      const qPrompt = currentQuestion?.prompt || 'Câu hỏi trắc nghiệm năng lực số';
      const qOptions = currentQuestion?.options?.map((o) => `[${o.isCorrect ? 'ĐÚNG' : 'SAI'}] ${o.text}`).join('\n') || '';

      prompt = `
Nhiệm vụ: Tạo một câu hỏi trắc nghiệm MỚI TƯƠNG TỰ nhưng KHÔNG TRÙNG LẶP về mặt ngữ cảnh với câu hỏi gốc dưới đây.
Đảm bảo đánh giá cùng miền năng lực: [${resolvedDomainTitle}] (Mã miền: ${resolvedDomainCode}).

Câu hỏi gốc:
${qPrompt}
Các phương án gốc:
${qOptions}

Yêu cầu định dạng đầu ra (JSON Object):
{
  "prompt": "Nội dung câu hỏi mới (rõ ràng, có tình huống thực tế)",
  "domainCode": "${resolvedDomainCode}",
  "domainTitle": "${resolvedDomainTitle}",
  "points": 10,
  "options": [
    { "text": "Phương án A", "isCorrect": false, "explanation": "Giải thích vì sao phương án này chưa chính xác" },
    { "text": "Phương án B (Đáp án đúng)", "isCorrect": true, "explanation": "Giải thích chi tiết vì sao đây là đáp án đúng" },
    { "text": "Phương án C", "isCorrect": false, "explanation": "Giải thích lỗi sai thường gặp" },
    { "text": "Phương án D", "isCorrect": false, "explanation": "Giải thích vì sao không phù hợp" }
  ]
}
`;
    } else if (action === 'EXPLAIN_OPTIONS') {
      const qPrompt = currentQuestion?.prompt || 'Câu hỏi năng lực số';
      const qOptions = currentQuestion?.options?.map((o, idx) => `Phương án ${idx + 1}: ${o.text} (Đáp án: ${o.isCorrect ? 'Đúng' : 'Sai'})`).join('\n') || '';

      prompt = `
Nhiệm vụ: Viết lời giải thích sư phạm chi tiết cho từng phương án trả lời của câu hỏi sau để hỗ trợ thí sinh hiểu sâu bản chất.
Miền năng lực: [${resolvedDomainTitle}].

Câu hỏi:
${qPrompt}
Các phương án:
${qOptions}

Yêu cầu định dạng đầu ra (JSON Object):
{
  "explanations": [
    { "optionIndex": 0, "explanation": "Lời giải thích ngắn gọn, rõ ràng, giàu tính sư phạm" },
    { "optionIndex": 1, "explanation": "Lời giải thích ngắn gọn, rõ ràng, giàu tính sư phạm" },
    { "optionIndex": 2, "explanation": "Lời giải thích ngắn gọn, rõ ràng, giàu tính sư phạm" },
    { "optionIndex": 3, "explanation": "Lời giải thích ngắn gọn, rõ ràng, giàu tính sư phạm" }
  ]
}
`;
    } else {
      // GENERATE_BY_DOMAIN
      const searchTopic = topic ? `Chủ đề cụ thể: ${topic}` : '';
      prompt = `
Nhiệm vụ: Soạn một câu hỏi trắc nghiệm chuẩn hóa 4 phương án thuộc Miền năng lực: [${resolvedDomainTitle}] (Mã miền: ${resolvedDomainCode}).
Mức độ: ${difficulty}.
${searchTopic}

Yêu cầu định dạng đầu ra (JSON Object):
{
  "prompt": "Tình huống và câu hỏi trắc nghiệm năng lực số thực tế",
  "domainCode": "${resolvedDomainCode}",
  "domainTitle": "${resolvedDomainTitle}",
  "points": 10,
  "options": [
    { "text": "Phương án đúng", "isCorrect": true, "explanation": "Giải thích vì sao đúng" },
    { "text": "Phương án sai 1", "isCorrect": false, "explanation": "Giải thích tại sao sai" },
    { "text": "Phương án sai 2", "isCorrect": false, "explanation": "Giải thích tại sao sai" },
    { "text": "Phương án sai 3", "isCorrect": false, "explanation": "Giải thích tại sao sai" }
  ]
}
`;
    }

    // Call LLM
    const geminiInstance = (adapter as any).ai;
    const response = await geminiInstance.models.generateContent({
      model: adapter.defaultModel,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    });

    const rawText = response.text?.trim() || '{}';
    let resultJson: any = {};
    try {
      resultJson = JSON.parse(rawText);
    } catch {
      // Strip possible markdown fences if returned
      const cleaned = rawText.replace(/```json\n?|\n?```/g, '').trim();
      resultJson = JSON.parse(cleaned);
    }

    const latencyMs = Math.round(performance.now() - startTime);

    // Layer 8: Log AI Usage
    await AIUsageLoggerService.logUsage(supabase, {
      userId: user.id,
      feature: 'AUTHORING_ASSIST',
      model: adapter.defaultModel,
      provider: 'GOOGLE_GEMINI',
      promptTokens: Math.round(prompt.length / 4),
      completionTokens: Math.round(rawText.length / 4),
      latencyMs,
      status: 'SUCCESS',
    });

    return NextResponse.json({
      success: true,
      action,
      data: resultJson,
      latencyMs,
    });
  } catch (err: unknown) {
    const latencyMs = Math.round(performance.now() - startTime);
    const errorMsg = err instanceof Error ? err.message : 'Lỗi hệ thống AI';

    try {
      const supabase = await createClient();
      await AIUsageLoggerService.logUsage(supabase, {
        feature: 'AUTHORING_ASSIST',
        model: 'gemini-3.5-flash',
        provider: 'GOOGLE_GEMINI',
        promptTokens: 0,
        completionTokens: 0,
        latencyMs,
        status: 'FAILED',
        errorMessage: errorMsg,
      });
    } catch {}

    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
