import { NextResponse } from 'next/server';
import { getOrgAuthContext } from '@/lib/auth/org-guard';
import { GoogleGenAI } from '@google/genai';
import { AIConfigService } from '@/features/ai-gateway/services/ai-config.service';

export const dynamic = 'force-dynamic';

interface AiInsightRequestBody {
  orgName: string;
  evaluatedCount: number;
  overallScore: number | null;
  passRate: number | null;
  domains: Array<{
    domainCode: string;
    name: string;
    score: number | null;
    coverageRate: number | null;
  }>;
  priorityGapDomain: {
    domainCode: string;
    name: string;
    score: number;
  } | null;
  bestDomain: {
    domainCode: string;
    name: string;
    score: number;
  } | null;
  timeRangeText?: string;
}

export interface OrgAiInsightResult {
  executiveSummary: string;
  strengthsAnalysis: string;
  gapIntervention: string;
  strategicRoadmap: string[];
  recommendedWorkshops: Array<{
    topic: string;
    targetDomain: string;
    targetAudience: string;
    rationale: string;
  }>;
  generatedAt: string;
  modelUsed: string;
  isSimulatedFallback?: boolean;
}

function generateFallbackInsights(body: AiInsightRequestBody): OrgAiInsightResult {
  const { orgName, overallScore, passRate, bestDomain, priorityGapDomain, evaluatedCount } = body;

  const scoreText = overallScore !== null ? `${overallScore}/100` : 'chưa đủ dữ liệu';
  const passText = passRate !== null ? `${passRate}%` : 'đang cập nhật';
  const bestText = bestDomain ? `${bestDomain.domainCode} — ${bestDomain.name} (${bestDomain.score} điểm)` : 'Đồng đều giữa các miền';
  const gapText = priorityGapDomain
    ? `${priorityGapDomain.domainCode} — ${priorityGapDomain.name} (${priorityGapDomain.score} điểm)`
    : 'Chưa ghi nhận khoảng trống đáng kể';

  const gapCode = priorityGapDomain?.domainCode || 'D5';

  return {
    executiveSummary: `Dựa trên kết quả khảo thí của ${evaluatedCount} thành viên tại ${orgName}, tổ chức đạt điểm năng lực số trung bình ${scoreText} với tỷ lệ đạt chuẩn ${passText}. Mức độ phát triển phản ánh tinh thần chủ động số, tuy nhiên có sự phân hóa rõ giữa các kỹ năng tác nghiệp cơ bản và khả năng xử lý vấn đề phức tạp.`,
    strengthsAnalysis: `Thế mạnh nổi bật của tổ chức tập trung tại ${bestText}. Thành viên thể hiện khả năng thích ứng nhanh, sử dụng thành thạo các tiện ích số và duy trì kỷ luật tương tác trực tuyến an toàn.`,
    gapIntervention: `Điểm nghẽn cần ưu tiên can thiệp là ${gapText}. Khi đối mặt với các tình huống số phi cấu trúc hoặc sự cố quy trình, tỷ lệ lúng túng còn cao, đòi hỏi tổ chức cần có chuyên đề đào tạo thực hành chuyên sâu.`,
    strategicRoadmap: [
      `Giai đoạn 1 (Ngay lập tức): Tổ chức hội thảo chia sẻ tình huống điển hình về ${priorityGapDomain?.name || 'xử lý sự cố số'}.`,
      `Giai đoạn 2 (30 ngày tiếp theo): Tích hợp bài tập tình huống thực tế vào các đợt bồi dưỡng nội bộ của các nhóm có điểm dưới 70.`,
      `Giai đoạn 3 (Cuối quý): Khảo thí đánh giá lại để đo lường mức độ thu hẹp khoảng cách năng lực số toàn đơn vị.`,
    ],
    recommendedWorkshops: [
      {
        topic: `Chuyên đề: Ứng dụng công nghệ giải quyết vấn đề thực tế (${gapCode})`,
        targetDomain: gapCode,
        targetAudience: 'Toàn thể thành viên, ưu tiên các đơn vị có điểm dưới 70',
        rationale: 'Rèn luyện tư duy phân tích nguyên nhân sự cố công nghệ và chọn giải pháp tối ưu.',
      },
      {
        topic: 'Chuyên đề: Tối ưu quy trình cộng tác và an toàn dữ liệu số (D2 & D4)',
        targetDomain: 'D4',
        targetAudience: 'Cán bộ điều phối, giảng viên và quản lý nhóm',
        rationale: 'Bảo đảm an toàn thông tin và nâng cao hiệu suất làm việc nhóm trong không gian số.',
      },
    ],
    generatedAt: new Date().toISOString(),
    modelUsed: 'NEXA Heuristic Engine (Deterministic)',
    isSimulatedFallback: true,
  };
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const authContext = await getOrgAuthContext(slug);

    if (!authContext || !authContext.isAuthorized) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập hoặc không đủ quyền' }, { status: 401 });
    }

    const { role, isSuperadmin } = authContext;
    const canView = isSuperadmin || role === 'ORG_OWNER' || role === 'ORG_ADMIN' || role === 'ASSESSOR';
    if (!canView) {
      return NextResponse.json({ error: 'Bạn không có quyền yêu cầu phân tích chuyên sâu' }, { status: 403 });
    }

    const body: AiInsightRequestBody = await req.json();

    if (!body.evaluatedCount || body.evaluatedCount <= 0) {
      return NextResponse.json(
        { error: 'Chưa có đủ kết quả khảo thí được phê duyệt để phân tích AI.' },
        { status: 400 }
      );
    }

    // 1. Kiểm tra cấu hình AI Gateway
    const config = AIConfigService.getConfig();
    const apiKey = config.apiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Fallback Engine nếu chưa cấu hình GEMINI_API_KEY
      const fallbackResult = generateFallbackInsights(body);
      return NextResponse.json(fallbackResult);
    }

    // 2. Gọi Google Gemini thông qua @google/genai
    try {
      const ai = new GoogleGenAI({ apiKey });
      const modelToUse = config.defaultModel || process.env.GEMINI_MODEL || 'gemini-2.5-flash';

      const systemInstruction = `
Bạn là Cố vấn Sư phạm Năng lực Số Cấp cao (Senior Pedagogical Advisor) tại Nền tảng Đánh giá Năng lực Số NEXA AI.
Nhiệm vụ của bạn: Đọc dữ liệu khảo thí 5 miền năng lực số của một tổ chức (trường học hoặc doanh nghiệp), đưa ra nhận định quản trị và đề xuất hành động sư phạm cụ thể.

QUY TẮC BẮT BUỘC (TUÂN THỦ AGENTS.MD):
1. TUYỆT ĐỐI KHÔNG dùng từ "DigComp" hay "DigComp 2.2 / 3.0" trong nội dung. Luôn gọi tự nhiên là "5 miền năng lực số" hoặc "Khung năng lực số 5 miền".
2. Mọi nhận định phải dựa trên dữ liệu thật được truyền vào (điểm trung bình, miền mạnh nhất, miền cần bồi dưỡng, độ phủ). Không tự bịa số liệu.
3. Ngôn ngữ: Tiếng Việt sư phạm chuẩn mực, cô đọng, súc tích, chuyên nghiệp cho cấp quản lý/ban giám hiệu.
4. Trả về đúng định dạng JSON thuần tuân thủ schema, không bọc markdown.
`;

      const userPrompt = `
DỮ LIỆU KHẢO THÍ TỔ CHỨC:
- Tổ chức: ${body.orgName}
- Phạm vi thời gian: ${body.timeRangeText || 'Toàn bộ thời gian'}
- Số người có bằng chứng đánh giá: ${body.evaluatedCount}
- Điểm trung bình toàn tổ chức: ${body.overallScore !== null ? body.overallScore + '/100' : 'Chưa có'}
- Tỷ lệ đạt chuẩn (>=70 điểm): ${body.passRate !== null ? body.passRate + '%' : 'Chưa có'}
- Miền mạnh nhất: ${body.bestDomain ? `${body.bestDomain.domainCode} — ${body.bestDomain.name} (${body.bestDomain.score} điểm)` : 'N/A'}
- Miền cần bồi dưỡng ưu tiên: ${body.priorityGapDomain ? `${body.priorityGapDomain.domainCode} — ${body.priorityGapDomain.name} (${body.priorityGapDomain.score} điểm)` : 'N/A'}

CHI TIẾT 5 MIỀN:
${JSON.stringify(body.domains, null, 2)}

HÃY XUẤT RA JSON CHUẨN XÁC:
{
  "executiveSummary": "2-3 câu tóm lược quản trị về hiện trạng năng lực số của tổ chức.",
  "strengthsAnalysis": "Phân tích giá trị và cách phát huy miền năng lực mạnh nhất.",
  "gapIntervention": "Phân tích nguyên nhân gốc rễ và rủi ro của miền còn yếu, cần can thiệp.",
  "strategicRoadmap": [
    "Hành động ngắn hạn (1-2 tuần)",
    "Hành động trung hạn (1-2 tháng)",
    "Hành động dài hạn (cuối chu kỳ)"
  ],
  "recommendedWorkshops": [
    {
      "topic": "Tên chuyên đề bồi dưỡng gợi ý",
      "targetDomain": "Mã miền (VD: D5)",
      "targetAudience": "Đối tượng ưu tiên tham gia",
      "rationale": "Lý do sư phạm chọn chuyên đề này"
    }
  ]
}
`;

      const response = await ai.models.generateContent({
        model: modelToUse,
        contents: userPrompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const responseText = response.text?.trim() || '';
      const parsed = JSON.parse(responseText);

      const result: OrgAiInsightResult = {
        executiveSummary: parsed.executiveSummary || '',
        strengthsAnalysis: parsed.strengthsAnalysis || '',
        gapIntervention: parsed.gapIntervention || '',
        strategicRoadmap: Array.isArray(parsed.strategicRoadmap) ? parsed.strategicRoadmap : [],
        recommendedWorkshops: Array.isArray(parsed.recommendedWorkshops) ? parsed.recommendedWorkshops : [],
        generatedAt: new Date().toISOString(),
        modelUsed: modelToUse,
        isSimulatedFallback: false,
      };

      return NextResponse.json(result);
    } catch (aiError) {
      console.warn('AI Gateway generation encountered an issue, serving deterministic pedagogical fallback:', aiError);
      const fallbackResult = generateFallbackInsights(body);
      return NextResponse.json(fallbackResult);
    }
  } catch (error) {
    console.error('Error generating org analytics AI insights:', error);
    return NextResponse.json(
      { error: 'Không thể khởi tạo nhận định phân tích từ hệ thống' },
      { status: 500 }
    );
  }
}
