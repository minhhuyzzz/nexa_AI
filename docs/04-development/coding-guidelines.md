# HƯỚNG DẪN VIẾT MÃ NGUỒN CHUẨN MỰC (CODING GUIDELINES)

## DỰ ÁN: NỀN TẢNG ĐÁNH GIÁ VÀ CHỨNG NHẬN PHÁT TRIỂN NĂNG LỰC SỐ DỰA TRÊN TRÍ TUỆ NHÂN TẠO (NEXA)

---

- **Mã tài liệu:** `SPEC-NEXA-CODING-GUIDELINES`
- **Phiên bản:** `v3.2.0`
- **Ngôn ngữ chuẩn:** TypeScript 5.x (`strict: true`, Zero-any Policy)

---

## 1. TIÊU CHUẨN TYPESCRIPT & XÁC THỰC DỮ LIỆU HAI CHIỀU (ZOD VALIDATION)

### 1.1. Chính sách "Tuyệt đối Không dùng `any`" (Zero-any Policy)

- Mọi dữ liệu đầu vào từ API, Webhook thanh toán, hoặc phản hồi JSON từ mô hình AI bắt buộc định kiểu là `unknown` và xác thực qua **Zod Schema** trước khi đưa vào xử lý nghiệp vụ.

```typescript
// ĐÚNG CHUẨN: Kiểm tra chặt chẽ bài nộp sản phẩm minh chứng số qua Zod
import { z } from 'zod';

export const DigitalEvidenceSubmissionSchema = z.object({
  questionId:z.string().uuid(),
  evidenceUrl: z.string().url('Đường dẫn tệp hoặc liên kết minh chứng không hợp lệ'),
  rationaleText: z
    .string()
    .refine((val) => val.trim().split(/\s+/).length >= 30, {
      message: 'Văn bản giải trình phương án bắt buộc tối thiểu 30 từ (BR-EXAM-04)',
    }),
});
```

---

## 2. QUY ƯỚC ĐẶT TÊN MÃ NGUỒN (NAMING CONVENTIONS)

| Thành phần | Quy ước đặt tên | Ví dụ chuẩn trong NEXA |
| :--- | :--- | :--- |
| **React Component** | `PascalCase.tsx` | `ExamPlayer.tsx`, `RadarChart.tsx`, `LeaderboardTable.tsx` |
| **Custom Hook** | `useCamelCase.ts` | `useAutoSaveDraft.ts`, `useServerClock.ts` |
| **Domain Service** | `kebab-case.service.ts` | `ai-orchestrator.service.ts`, `research-export.service.ts` |
| **AI Model Adapter** | `kebab-case.adapter.ts` | `gemini.adapter.ts`, `openai.adapter.ts`, `claude.adapter.ts` |
| **Zod Validator** | `kebab-case.schema.ts` | `question-format.schema.ts`, `rubric.schema.ts` |
| **Hằng số hệ thống** | `UPPER_SNAKE_CASE` | `AUTO_SAVE_INTERVAL_MS = 15000`, `DEFAULT_CONFIDENCE_THRESHOLD = 0.85` |

---

## 3. QUY CHUẨN LẬP TRÌNH GIAO DIỆN (KHỬ MÙI AI & TỐI ƯU HIỆU NĂNG)

1. **Ưu tiên React Server Components (RSC First):**
   - Toàn bộ các trang danh sách bài thi, báo cáo kết quả, bảng xếp hạng Top 100+ và trang xác thực chứng chỉ `/verify/[credentialId]` mặc định là Server Component để tải trang tức thì.
   - Chỉ gắn `'use client'` cho các thành phần tương tác trực tiếp: khung làm bài Zen Mode (`ExamPlayer.tsx`), biểu đồ SVG (`RadarChart.tsx`), và khung chấm bài Split-view.
2. **Sáu Mẫu chống (Anti-patterns) Nghiêm cấm trong Giao diện & Mã nguồn:**
   - ❌ **Anti-pattern 1:** Cấm dùng màu tím neon (`violet-*`, `purple-*`, `indigo-*`), dải màu chuyển sắc lòe loẹt (`bg-gradient-to-*`) hoặc tô 5 màu cầu vồng lên thẻ năng lực. Chỉ dùng bảng màu trung tính `slate`/`zinc` kết hợp màu nhấn `--primary` (`#0284C7`).
   - ❌ **Anti-pattern 2:** Cấm dùng biểu tượng cảm xúc (Emoji) trong mã JSX; bắt buộc dùng icon vector nét mảnh từ `lucide-react`.
   - ❌ **Anti-pattern 3:** Cấm viết chung một `Sidebar.tsx` hoặc `Topbar.tsx` có câu lệnh `if (role === ...)` cho cả 3 Dashboard.
   - ❌ **Anti-pattern 4:** Cấm đặt ô "Tra cứu chứng chỉ QR" lên Landing Page hoặc `PublicHeader.tsx`.
   - ❌ **Anti-pattern 5:** Cấm gọi trực tiếp SDK của một hãng AI (như `@google/genai`) ở tầng giao diện hoặc ngoài thư mục `src/features/ai-gateway/adapters/`.
   - ❌ **Anti-pattern 6:** Cấm viết cứng (hardcode) danh sách tên miền năng lực hoặc kỹ năng trong giao diện; bắt buộc đọc động từ bảng `competency_domains` và `competencies` của phiên bản khung đang kích hoạt.
