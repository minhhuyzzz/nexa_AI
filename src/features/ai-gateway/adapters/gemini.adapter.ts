import { GoogleGenAI } from '@google/genai';
import { AIProviderAdapter } from './ai-adapter.interface';
import { PIIScrubberService } from '../services/pii-scrubber.service';
import {
  RubricGradingInput,
  RubricGradingOutput,
  RubricGradingOutputSchema,
} from '../types/grading.types';
import {
  CompetencyAnalysisInput,
  CompetencyAnalysisOutput,
  CompetencyAnalysisOutputSchema,
} from '../types/competency.types';

import { AIConfigService } from '../services/ai-config.service';

export class GeminiAdapter implements AIProviderAdapter {
  public readonly providerName = 'GOOGLE_GEMINI';
  public readonly defaultModel: string;

  private ai: GoogleGenAI;

  constructor(customModel?: string) {
    const config = AIConfigService.getConfig();
    const apiKey = config.apiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Chưa thiết lập khóa API. Vui lòng cấu hình GEMINI_API_KEY tại trang Quản trị AI Gateway.');
    }
    this.defaultModel = customModel || config.defaultModel || process.env.GEMINI_MODEL || 'gemini-3.5-flash';
    this.ai = new GoogleGenAI({ apiKey });
  }

  public async ping(): Promise<{ ok: boolean; latencyMs: number; model: string }> {
    const start = performance.now();
    const candidateModels = [
      this.defaultModel,
      'gemini-3.5-flash',
      'gemini-3.8-flash',
    ];
    // Deduplicate
    const models = Array.from(new Set(candidateModels));
    let lastError: unknown = null;

    for (const model of models) {
      try {
        await this.ai.models.generateContent({
          model,
          contents: 'Respond with JSON only: {"status": "ok"}',
          config: {
            responseMimeType: 'application/json',
          },
        });
        const latencyMs = Math.round(performance.now() - start);
        return {
          ok: true,
          latencyMs,
          model,
        };
      } catch (err) {
        lastError = err;
        continue;
      }
    }

    // If all models hit transient errors, return error details
    const errMsg = lastError instanceof Error ? lastError.message : String(lastError);
    throw new Error(errMsg);
  }

  public async gradeRubricSubmission(input: RubricGradingInput): Promise<RubricGradingOutput> {
    // 1. Scrub PII before sending to external LLM (Decree 13/2023 compliance)
    const sanitizedStudentResponse = PIIScrubberService.scrub(input.studentResponse);

    // 2. Build system instructions and prompt
    const rubricPrompt = JSON.stringify(input.rubric, null, 2);

    const systemInstruction = `
Bạn là Chuyên gia Khảo thí Cấp cao (Senior Academic Evaluator) của Nền tảng Đánh giá Năng lực Số NEXA.
Nhiệm vụ của bạn: Thẩm định bài làm tự luận/tình huống của thí sinh dựa trên Rubric chuẩn 100%.

QUY TẮC BẮT BUỘC:
1. Đánh giá khách quan, trung thực và chính xác dựa trên từng tiêu chí trong Rubric.
2. Với mỗi tiêu chí:
   - Chọn đúng cấp độ (selectedLevel) tương ứng trong Rubric.
   - Tính điểm chính xác: score = (scorePercent / 100) * maxPoints.
   - BẮT BUỘC trích dẫn trực tiếp một câu văn từ bài làm của thí sinh làm bằng chứng minh chứng (evidenceQuote).
3. Tính totalScore = tổng điểm các tiêu chí.
4. Đánh giá độ tin cậy (confidenceScore từ 0 đến 100):
   - >= 85: confidenceFlag = 'GREEN' (Độ tin cậy cao, bằng chứng rõ ràng).
   - 60 - 84: confidenceFlag = 'AMBER' (Cần lưu ý, câu trả lời còn mơ hồ).
   - < 60: confidenceFlag = 'RED' (Độ tin cậy thấp, cần Chuyên gia người chấm lại thủ công).
5. Trả về đúng định dạng JSON thuần, không bọc markdown \`\`\`json.
`;

    const userPrompt = `
ĐỀ BÀI TÌNH HUỐNG:
${input.taskPrompt}

BÀI LÀM CỦA THÍ SINH (ĐÃ KHỬ DỮ LIỆU CÁ NHÂN):
"${sanitizedStudentResponse}"

RUBRIC CHẤM ĐIỂM:
${rubricPrompt}

YÊU CẦU ĐỊNH DẠNG JSON ĐẦU RA:
{
  "totalScore": number,
  "maxScore": number,
  "confidenceScore": number,
  "confidenceFlag": "GREEN" | "AMBER" | "RED",
  "evidenceQuote": "Trích dẫn tiêu biểu nhất từ bài làm",
  "strengths": "Điểm mạnh của thí sinh trong bài làm",
  "weaknesses": "Điểm thiếu sót hoặc chưa chuẩn xác",
  "feedback": "Lời khuyên cải thiện cụ thể theo chuẩn DigComp 3.0",
  "criterionScores": [
    {
      "criterionId": "id của tiêu chí",
      "criterionName": "tên tiêu chí",
      "selectedLevel": "tên cấp độ (XUẤT SẮC / ĐẠT CHUẨN...)",
      "score": number,
      "maxPoints": number,
      "justification": "Lý do cho điểm",
      "evidenceQuote": "Trích dẫn câu từ bài làm"
    }
  ]
}
`;

    // 3. Invoke Gemini Model with structured output
    const config = AIConfigService.getConfig();
    if (!config.flows.rubricGrading.enabled) {
      throw new Error('Tính năng chấm điểm bằng AI hiện đang tạm tắt theo chính sách quản trị hệ thống.');
    }
    const modelToUse = config.flows.rubricGrading.model || this.defaultModel;

    const response = await this.ai.models.generateContent({
      model: modelToUse,
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.1, // Low temperature for academic consistency
      },
    });

    const responseText = response.text?.trim() || '';

    // 4. Validate output with Zod (Zero-any enforcement)
    try {
      const parsedJson = JSON.parse(responseText);
      const validated = RubricGradingOutputSchema.parse(parsedJson);
      return validated;
    } catch (parseError) {
      console.error('Failed to validate AI output with schema:', responseText, parseError);
      throw new Error('Dữ liệu chấm điểm từ AI không đúng định dạng quy chuẩn Zod');
    }
  }

  public async analyzeCompetencyProfile(
    input: CompetencyAnalysisInput
  ): Promise<CompetencyAnalysisOutput> {
    // 1. Scrub PII from mistakes or candidate inputs
    const sanitizedCandidateName = input.candidateName
      ? PIIScrubberService.scrub(input.candidateName)
      : 'Thí sinh';

    const systemInstruction = `
Bạn là Cố vấn Sư phạm Năng lực Số Cấp cao (Chief Digital Competency Pedagogical Advisor) tại NEXA.
Hệ thống đánh giá dựa trên Khung Năng lực Số DigComp 3.0 (European Digital Competence Framework) và Quy chuẩn Việt Nam (Nghị định 13/2023/NĐ-CP).

Nhiệm vụ của bạn (Ứng dụng AI 2, 3, 4, 5):
1. [Ứng dụng 2]: Phân tích tổng thể và xác định cấp độ năng lực chung theo DigComp 3.0 (giữ nguyên chuẩn tiếng Anh):
   - 'BASIC' (< 50%)
   - 'INTERMEDIATE' (50% - 69.9%)
   - 'ADVANCED' (70% - 89.9%)
   - 'HIGHLY_ADVANCED' (>= 90%)
   Cung cấp dữ liệu 5 trục biểu đồ Radar đúng chuẩn cho 5 Miền năng lực số (tên miền tiếng Việt):
   - DOMAIN_1: Tìm kiếm, đánh giá và quản lý thông tin
   - DOMAIN_2: Giao tiếp và hợp tác
   - DOMAIN_3: Sáng tạo nội dung số
   - DOMAIN_4: An toàn, sức khỏe và trách nhiệm
   - DOMAIN_5: Nhận diện và giải quyết vấn đề
   Mỗi miền có benchmark chuẩn là 70.0.

2. [Ứng dụng 3]: Phát hiện Khoảng trống Năng lực (Competency Gaps):
   - Quét tất cả các kỹ năng thành phần có tỷ lệ đạt < 60%.
   - Phân tích nguyên nhân gốc rễ (rootCause), nguy cơ rủi ro số (riskImpact) và mức ưu tiên khắc phục (HIGH / MEDIUM / LOW).

3. [Ứng dụng 4]: Phản hồi sư phạm cá nhân hóa:
   - Nêu bật điểm mạnh vượt trội của thí sinh.
   - Chỉ rõ điểm yếu tư duy, thiếu sót kỹ thuật trong xử lý sự cố hoặc an toàn dữ liệu.
   - Đưa ra lời khuyên định hướng sư phạm rõ ràng, mang tính xây dựng cao.

4. [Ứng dụng 5]: Đề xuất Lộ trình Phát triển 4 Bước (BẮT BUỘC ĐÚNG 4 BƯỚC):
   - Bước 1: Khắc phục lỗ hổng an toàn số / kỹ năng khẩn cấp (Basic gap fix).
   - Bước 2: Nâng cao năng lực phân tích & trực quan hóa nội dung số (Skill enrichment).
   - Bước 3: Ứng dụng thực tiễn trong tình huống công việc & tương tác đa nền tảng (Practical application).
   - Bước 4: Kiểm tra đánh giá lại năng lực và sẵn sàng cấp chứng chỉ (Re-assessment & certification).

YÊU CẦU BẮT BUỘC:
- Trả về JSON thuần tuân thủ 100% schema quy định, không kèm bất kỳ markdown nào.
`;

    const userPrompt = `
KẾT QUẢ ĐÁNH GIÁ NĂNG LỰC SỐ CỦA THÍ SINH:
- Thí sinh: ${sanitizedCandidateName}
- Đề thi: ${input.assessmentTitle}
- Điểm tổng: ${input.totalScore.toFixed(1)} / ${input.maxScore.toFixed(1)} (${input.overallPercentage.toFixed(1)}%)

ĐIỂM THEO 5 MIỀN NĂNG LỰC SỐ:
${JSON.stringify(input.domainScores, null, 2)}

ĐIỂM THEO CÁC KỸ NĂNG THÀNH PHẦN (COMPETENCIES):
${JSON.stringify(input.skillScores, null, 2)}

CHI TIẾT CÂU SAI HOẶC ĐIỂM CHƯA ĐẠT (NẾU CÓ):
${JSON.stringify(input.mistakes || [], null, 2)}

HÃY PHÂN TÍCH VÀ XUẤT RA JSON CHUẨN XÁC:
{
  "overallLevel": "BASIC" | "INTERMEDIATE" | "ADVANCED" | "HIGHLY_ADVANCED",
  "overallSummary": "Đoạn văn ngắn tổng quan năng lực số",
  "radarData": [
    { "domainCode": "DOMAIN_1", "domainName": "Tìm kiếm, đánh giá và quản lý thông tin", "score": number, "benchmark": 70 },
    { "domainCode": "DOMAIN_2", "domainName": "Giao tiếp và hợp tác", "score": number, "benchmark": 70 },
    { "domainCode": "DOMAIN_3", "domainName": "Sáng tạo nội dung số", "score": number, "benchmark": 70 },
    { "domainCode": "DOMAIN_4", "domainName": "An toàn, sức khỏe và trách nhiệm", "score": number, "benchmark": 70 },
    { "domainCode": "DOMAIN_5", "domainName": "Nhận diện và giải quyết vấn đề", "score": number, "benchmark": 70 }
  ],
  "skillGaps": [
    {
      "skillCode": "mã kỹ năng ví dụ 4.2",
      "skillName": "tên kỹ năng",
      "domainCode": "DOMAIN_4",
      "percentage": number,
      "rootCause": "nguyên nhân gốc rễ",
      "riskImpact": "nguy cơ rủi ro",
      "priority": "HIGH" | "MEDIUM" | "LOW"
    }
  ],
  "strengths": "Điểm mạnh vượt trội của người học",
  "weaknesses": "Lỗ hổng kiến thức hoặc kỹ năng cần bổ khuyết",
  "pedagogicalFeedback": "Lời khuyên sư phạm cá nhân hóa từ chuyên gia",
  "learningPathway": [
    {
      "stepNumber": 1,
      "title": "Tiêu đề bước 1",
      "targetSkill": "Kỹ năng mục tiêu",
      "durationHours": 2,
      "objective": "Mục tiêu đạt được",
      "actionText": "Hành động thực hiện cụ thể",
      "recommendedSkillCode": "4.2"
    },
    {
      "stepNumber": 2,
      "title": "Tiêu đề bước 2",
      "targetSkill": "Kỹ năng mục tiêu",
      "durationHours": 3,
      "objective": "Mục tiêu đạt được",
      "actionText": "Hành động thực hiện cụ thể",
      "recommendedSkillCode": "1.2"
    },
    {
      "stepNumber": 3,
      "title": "Tiêu đề bước 3",
      "targetSkill": "Kỹ năng mục tiêu",
      "durationHours": 4,
      "objective": "Mục tiêu đạt được",
      "actionText": "Hành động thực hiện cụ thể",
      "recommendedSkillCode": "3.2"
    },
    {
      "stepNumber": 4,
      "title": "Tiêu đề bước 4",
      "targetSkill": "Kỹ năng mục tiêu",
      "durationHours": 2,
      "objective": "Mục tiêu đạt được",
      "actionText": "Hành động thực hiện cụ thể",
      "recommendedSkillCode": "5.2"
    }
  ]
}
`;

    // 2. Invoke Gemini Model
    const config = AIConfigService.getConfig();
    if (!config.flows.competencyAnalysis.enabled) {
      throw new Error('Tính năng phân tích năng lực bằng AI hiện đang tạm tắt theo chính sách quản trị hệ thống.');
    }
    const modelToUse = config.flows.competencyAnalysis.model || this.defaultModel;

    const response = await this.ai.models.generateContent({
      model: modelToUse,
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.15,
      },
    });

    const responseText = response.text?.trim() || '';

    // 3. Validate with Zod Schema
    try {
      const parsedJson = JSON.parse(responseText);

      // Chuẩn hóa danh sách khóa học đề xuất nếu AI chưa cung cấp
      if (!Array.isArray(parsedJson.recommendedCourses)) {
        parsedJson.recommendedCourses = [];
      }

      const validated = CompetencyAnalysisOutputSchema.parse(parsedJson);
      return validated;
    } catch (parseError) {
      console.error('Failed to validate Competency Analysis AI output:', responseText, parseError);
      throw new Error('Dữ liệu phân tích năng lực từ AI không đúng định dạng quy chuẩn Zod');
    }
  }
}