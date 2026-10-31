# Implementation Plan: Triển Khai Hệ Thống AI Toàn Diện (NEXA Intelligence, Assess, Guide & Control)

> **Căn cứ đặc tả:** [`docs/NEXA_AI_SPEC_HE_THONG_AI_TOAN_DIEN.md`](file:///c:/nexa/docs/NEXA_AI_SPEC_HE_THONG_AI_TOAN_DIEN.md)  
> **Tài liệu phân tích:** [`c:\Users\CPS\Downloads\NEXA_AI_HE_THONG_AI_LUONG_PERSONAL_ORG_ADMIN_UX_2026-10-31_VI.md`](file:///c:/Users/CPS/Downloads/NEXA_AI_HE_THONG_AI_LUONG_PERSONAL_ORG_ADMIN_UX_2026-10-31_VI.md)  
> **Quy chuẩn lập trình:** [`AGENTS.md`](file:///c:/nexa/AGENTS.md)  
> **Mục tiêu:** Chuyển hóa toàn bộ kiến trúc đặc tả AI thành các lát cắt chức năng hoàn chỉnh (Vertical Slices), giải quyết triệt để 12 phát hiện trong mã nguồn (`AI-01` đến `AI-12`), bảo đảm tính toàn vẹn khảo thí và kiểm soát chi phí.

---

## 1. Kiến Trúc & Quyết Định Then Chốt (Architecture Decisions - ADR)

### ADR-01: Định Vị NEXA Intelligence là Applied AI Layer
- **Quyết định:** Không xây dựng hoặc tự huấn luyện Foundation Model. Tận dụng Google Gemini API qua `@google/genai` làm engine ngôn ngữ.
- **Lý do:** Tập trung 100% nguồn lực vào khung chuẩn 5 miền, ngân hàng đề, rubric có cấu trúc, thuật toán tổng hợp năng lực tất định và quy trình con người phê duyệt.

### ADR-02: Human-in-the-loop & Draft Isolation
- **Quyết định:** Kết quả AI chấm bài chỉ được ghi vào bảng `ai_evaluations` với trạng thái `status: 'DRAFT'`, gắn cờ `reviewRequired: true`.
- **Lý do:** Tuyệt đối không để AI tự ý ghi đè vào `submission_answers.score_awarded` hoặc `assessment_submissions.final_score` (giải quyết lỗi `AI-06`). Chỉ người chấm có thẩm quyền mới được duyệt điểm chính thức.

### ADR-03: Server Recalculation & Citation Verification
- **Quyết định:** Không chấp nhận `totalScore` trực tiếp từ JSON của AI. Server lấy `levelId` và `criterionId`, đối chiếu thang điểm và tự động tính toán $score = maxPoints \times scorePercent / 100$.
- **Lý do:** Chống ảo giác (hallucination) của LLM về số học và phát hiện trích dẫn bịa đặt qua việc kiểm tra chuỗi `evidenceQuote` có nằm trong bài làm thật hay không.

### ADR-04: Quota Reservation & Idempotency theo Request ID
- **Quyết định:** Mọi tác vụ AI phải có `requestId`. Trước khi gọi model, hệ thống giữ trước credits bằng giao dịch nguyên tử (`RESERVED`). Khi thành công chuyển thành `SETTLED`; khi lỗi hoặc gián đoạn mạng thì tự động giải phóng (`RELEASED`).
- **Lý do:** Chống trừ tiền trùng lặp khi người dùng bấm liên tiếp hoặc khi retry mạng (giải quyết `AI-07`, `AI-12`).

### ADR-05: Chuẩn Hóa 5 Miền & Không Giả Lập Dữ Liệu (Zero Fake Data)
- **Quyết định:** Loại bỏ hoàn toàn fallback lấy điểm trung bình toàn bài gán cho các miền thiếu dữ liệu (`AI-08`). Xóa bỏ toàn bộ mock điểm ảo (`75 điểm`, `90% confidence giả`, `AI-03`, `AI-04`, `AI-05`).
- **Lý do:** `null` = chưa có bằng chứng; `0` = đã làm nhưng 0 điểm. Không làm sai lệch radar năng lực thực tế của người học và báo cáo tổ chức.

---

## 2. Danh Sách Các Giai Đoạn Triển Khai (Phased Roadmap)

```
GIAI ĐOẠN 1: Rubric Engine & Structured Authoring (MOD-01)
     │
     ▼
GIAI ĐOẠN 2: Lõi AI Gateway, Quota Reservation & Bảo Mật PII (MOD-02)
     │
     ▼
GIAI ĐOẠN 3: Bàn Chấm Bài NEXA Assess & Human-in-the-loop Gate (MOD-03)
     │
     ▼
GIAI ĐOẠN 4: Cố Vấn NEXA Guide 5 Miền & Admin AI Control Center (MOD-04, MOD-05)
```

---

## 3. Phân Rã Công Việc Chi Tiết (Task List)

### Giai Đoạn 1: Rubric Engine & Structured Authoring (`MOD-01`)
*Trọng tâm: Xây dựng nền tảng Rubric 3 tầng (`rubrics -> criteria -> levels`), API kiểm định thang điểm và UI Rubric Builder cho người tạo đề.*

- [ ] **Task 1.1: Quản Trị Schema & Service Rubric 3 Tầng**
  - **Mô tả:** Xây dựng service `RubricService` thao tác với các bảng `rubrics`, `rubric_criteria`, `rubric_levels`. Hỗ trợ tạo, đọc, cập nhật và clone rubric khi nhân bản đề. Đảm bảo tính toàn vẹn: tổng `maxPoints` các tiêu chí khớp điểm câu hỏi, tổng `weightPercent` = 100%.
  - **Files:** `src/features/assessments/services/rubric.service.ts`, `src/features/assessments/types/rubric.types.ts`
  - **Size:** M (~120 dòng)

- [ ] **Task 1.2: API Soạn Đề Tích Hợp Rubric Cấu Trúc (Sửa `AI-09`)**
  - **Mô tả:** Cập nhật endpoint `POST /api/admin/assessments/[id]/items` và `POST /api/personal/assessments/[id]/items`: tiếp nhận rubric cấu trúc thay vì chỉ nhận chuỗi text `rubric_guide`. Kiểm tra Zod schema, lưu nguyên tử cả câu hỏi và danh sách tiêu chí/mức độ.
  - **Files:** `src/app/api/admin/assessments/[id]/items/route.ts`, `src/app/api/personal/assessments/[id]/items/route.ts`
  - **Size:** M (~110 dòng)

- [ ] **Task 1.3: Giao Diện Rubric Builder Cho Câu Hỏi Tự Luận & Thực Hành**
  - **Mô tả:** Xây dựng component `RubricBuilderModal` hoặc tab `Rubric` trong trang tạo câu hỏi: cho phép thêm tiêu chí, gán mã miền (`D1`-`D5`), chọn trọng số, định nghĩa các mức độ (Xuất sắc, Đạt, Cần cải thiện, Chưa đạt) kèm mô tả hành vi. Tự động kiểm tra tổng điểm trực tiếp trên UI.
  - **Files:** `src/components/dashboard/assessments/RubricBuilder.tsx`
  - **Size:** M (~150 dòng)

- [ ] **Checkpoint 1: Kiểm Tra Rubric Engine & Soạn Đề**
  - Đảm bảo `npm run typecheck` và unit test cho `rubric.service.ts` vượt qua 100%.

---

### Giai Đoạn 2: Lõi AI Gateway, Quota Reservation & Bảo Mật PII (`MOD-02`)
*Trọng tâm: Hoàn thiện lớp gateway an toàn, chống trừ credits trùng, che chắn PII và trả về trạng thái service trung thực.*

- [ ] **Task 2.1: Quota Reservation Nguyên Tử & Idempotency Key Theo Request ID (Sửa `AI-07`, `AI-12`)**
  - **Mô tả:** Cập nhật `QuotaEnforcementService`: bổ sung cơ chế `reserveCredits({ workspaceType, workspaceId, amount, requestId })` và `settleOrReleaseCredits()`. Kiểm tra xem `requestId` đã tồn tại chưa để trả về kết quả cũ thay vì trừ tiếp. Xóa bỏ fallback cấp 1.000 credits mặc định nếu Org không có hợp đồng hợp lệ.
  - **Files:** `src/features/billing/services/quota-enforcement.service.ts`, `src/features/billing/services/quota-reservation.service.ts`
  - **Size:** M (~130 dòng)

- [ ] **Task 2.2: PII Scrubber Đa Lớp & API Status Trung Thực (Sửa `AI-10`, `AI-11`)**
  - **Mô tả:** Nâng cấp `PIIScrubberService` để khử định danh (họ tên, email, số điện thoại, CCCD/CMND) trên bài làm của thí sinh trước khi chuyển vào prompt của adapter. Sửa API `/api/ai/status`: khi provider lỗi 503 hoặc thiếu key, trả `connected: false` kèm mã lỗi thực, không trả `connected: true` giả.
  - **Files:** `src/features/ai-gateway/services/pii-scrubber.service.ts`, `src/app/api/ai/status/route.ts`
  - **Size:** S (~80 dòng)

- [ ] **Task 2.3: Provider Adapter Routing & Guard Năng Lực Model (Sửa `AI-01`)**
  - **Mô tả:** Cập nhật `src/features/ai-gateway/adapters/index.ts`: kiểm tra cấu hình provider hiện tại. Chỉ định tuyến tới adapter thực sự có implementation (`GeminiAdapter`). Nếu cấu hình là OpenAI/Anthropic nhưng chưa có file adapter thì trả lỗi rõ ràng `PROVIDER_ADAPTER_NOT_IMPLEMENTED`.
  - **Files:** `src/features/ai-gateway/adapters/index.ts`
  - **Size:** S (~60 dòng)

- [ ] **Checkpoint 2: Kiểm Tra Gateway, PII Scrubber & Quota Reservation**
  - Đảm bảo các test case cho PII Scrubber, Quota Reservation và Adapter Factory đều xanh.

---

### Giai Đoạn 3: Bàn Chấm Bài NEXA Assess & Human-in-the-loop Gate (`MOD-03`)
*Trọng tâm: Tách biệt hoàn toàn AI Draft, kiểm tra trích dẫn, tính lại điểm trên máy chủ và đồng bộ hợp đồng chấm bài.*

- [ ] **Task 3.1: Tách Biệt Tuyệt Đối AI Draft — Xóa Bỏ Ghi Đè Điểm Tự Động (Sửa `AI-06`)**
  - **Mô tả:** Trong `POST /api/ai/grade-submission/route.ts`, xóa bỏ hoàn toàn đoạn code cập nhật `submission_answers.score_awarded`. Lưu đề xuất AI vào bảng `ai_evaluations` với `status: 'DRAFT'`. Điểm chính thức của thí sinh vẫn giữ nguyên là `null` hoặc điểm chưa duyệt.
  - **Files:** `src/app/api/ai/grade-submission/route.ts`
  - **Size:** S (~50 dòng)

- [ ] **Task 3.2: Tái Tính Điểm Phía Server & Xác Minh Trích Dẫn Thực Tế**
  - **Mô tả:** Trong pipeline nhận JSON từ model: server đọc `levelId` và `criterionId`, tự tính điểm tiêu chí. Bổ sung hàm kiểm tra `verifyEvidenceQuote(studentResponse, evidenceQuote)`: nếu model tạo trích dẫn không có thật trong bài, gắn cờ `INVALID_CITATION` để người chấm lưu ý.
  - **Files:** `src/features/ai-gateway/services/grading-validator.service.ts`, `src/app/api/ai/grade-submission/route.ts`
  - **Size:** M (~100 dòng)

- [ ] **Task 3.3: Đồng Bộ Hợp Đồng Bàn Chấm Org & Xóa Bỏ Điểm Fallback Ảo (Sửa `AI-03`, `AI-04`, `AI-05`)**
  - **Mô tả:** Sửa `OrgGradingClientView.tsx`: truyền đủ `submissionId` và `itemId` khi gọi API chấm AI, đọc đúng `evaluation.totalScore`. Xóa bỏ hoàn toàn giá trị fallback 75 điểm và 0.94 confidence trong `InContextGradingDrawer.tsx` và `personal/grading/page.tsx`. Khi API lỗi, hiển thị thông báo lỗi thật và hướng dẫn chấm thủ công.
  - **Files:** `src/app/(dashboard)/org/[slug]/grading/OrgGradingClientView.tsx`, `src/components/dashboard/grading/InContextGradingDrawer.tsx`, `src/app/(dashboard)/personal/grading/page.tsx`
  - **Size:** M (~110 dòng)

- [ ] **Task 3.4: Luồng Phê Duyệt Điểm Chính Thức (Human Review Gate & Audit)**
  - **Mô tả:** Cập nhật endpoint `POST /api/evaluator/grade/route.ts` và `POST /api/personal/grading/approve`: khi người chấm xem xét đề xuất AI và bấm "Phê duyệt kết quả", điểm được ghi nhận chính thức vào `submission_answers`, cập nhật trạng thái bài nộp `EVALUATED`, tạo bản ghi kiểm toán `grading_reviews` và đồng bộ bằng chứng năng lực.
  - **Files:** `src/app/api/evaluator/grade/route.ts`, `src/app/api/personal/grading/route.ts`
  - **Size:** M (~90 dòng)

- [ ] **Checkpoint 3: Kiểm Tra Luồng Chấm Bài End-to-End**
  - Kiểm tra toàn bộ luồng: Thí sinh nộp bài tự luận -> Assessor bấm gọi AI -> Nhận AI Draft -> Assessor duyệt -> Điểm chính thức được cập nhật.

---

### Giai Đoạn 4: Cố Vấn NEXA Guide 5 Miền & Admin AI Control Center (`MOD-04`, `MOD-05`)
*Trọng tâm: Chuẩn hóa hiển thị 5 miền, đề xuất học liệu từ catalog được duyệt và hoàn thiện bảng điều khiển Admin.*

- [ ] **Task 4.1: Xóa Bỏ Fallback Điểm Trung Bình Toàn Bài Trong Analytics (Sửa `AI-08`)**
  - **Mô tả:** Trong `org-competency-analytics.service.ts` và `src/app/(dashboard)/org/[slug]/analytics/page.tsx`: xóa bỏ logic tự động gán điểm trung bình toàn bài cho miền bị thiếu dữ liệu. Nếu miền chưa có bài làm đánh giá hợp lệ, trả về `score: null` và hiển thị nhãn "Chưa đủ dữ liệu".
  - **Files:** `src/features/analytics/services/org-competency-analytics.service.ts`, `src/app/(dashboard)/org/[slug]/analytics/page.tsx`
  - **Size:** S (~70 dòng)

- [ ] **Task 4.2: Lộ Trình Học NEXA Guide Với Curated Catalog & On-demand Credit Check**
  - **Mô tả:** Cập nhật `POST /api/ai/analyze-competency/route.ts`: chỉ gợi ý khóa học có `courseId` nằm trong bảng `course_catalog` có trạng thái `review_status = 'APPROVED'`. Trên giao diện `/personal/learning-path`, hiển thị nút "Phân tích bằng NEXA Guide" kèm số credits dự kiến và xác nhận của người dùng.
  - **Files:** `src/app/api/ai/analyze-competency/route.ts`, `src/app/(dashboard)/personal/learning-path/page.tsx`
  - **Size:** M (~120 dòng)

- [ ] **Task 4.3: Nâng Cấp Admin AI Control Center & Chặn Provider Chưa Hỗ Trợ**
  - **Mô tả:** Trên trang `/admin/ai-gateway`, bổ sung bảng hiển thị tỷ lệ lỗi, độ trễ P95, số token và chi phí thực tế. Tại dropdown chọn Model, vô hiệu hóa các provider chưa có adapter hoạt động (OpenAI, Anthropic) với nhãn "Chưa hỗ trợ", chỉ cho phép lưu cấu hình Gemini hợp lệ.
  - **Files:** `src/app/(dashboard)/admin/ai-gateway/page.tsx`, `src/features/ai-gateway/services/ai-config.service.ts`
  - **Size:** M (~100 dòng)

- [ ] **Checkpoint 4: Master Verification & Knowledge Graph Sync**
  - Chạy `npm test` (đảm bảo 100% test suites pass).
  - Chạy `npm run build` (kiểm tra toàn bộ 86+ routes biên dịch thành công).
  - Chạy `graphify update .` để đồng bộ đồ thị tri thức mã nguồn.

---

## 4. Bảng Ma Trận Sửa Đổi Lỗ Hổng Codebase (Traceability Matrix)

| Mã trong Review | Vấn đề được phát hiện | Task giải quyết tương ứng |
|---|---|---|
| `AI-01` | Adapter factory chỉ có Gemini nhưng UI cho chọn Claude/OpenAI | **Task 2.3 & Task 4.3** |
| `AI-02` | `AIConfigService` lưu JSON vào filesystem serverless | **Task 4.3** (Lưu bền vững vào DB) |
| `AI-03` | Personal grading tạo điểm AI giả khi API lỗi | **Task 3.3** (Xóa fake score fallback) |
| `AI-04` | `InContextGradingDrawer` dùng `setTimeout` sinh 0.94 confidence giả | **Task 3.3** (Xóa mock timer & fake confidence) |
| `AI-05` | Org grading thiếu `itemId`, đọc sai `suggestedScore`, fallback 75 | **Task 3.3** (Đồng bộ hợp đồng API) |
| `AI-06` | AI Draft tự động ghi đè điểm chính thức trong `submission_answers` | **Task 3.1 & Task 3.4** (Draft Isolation) |
| `AI-07` | AI chấm & phân tích không rollback credits khi thất bại | **Task 2.1** (Atomic Quota Reservation) |
| `AI-08` | Org Analytics lấy điểm trung bình toàn bài gán cho 5 miền thiếu dữ liệu | **Task 4.1** (Trả về `score: null` trung thực) |
| `AI-09` | Tạo đề chỉ nhận text `rubric_guide`, thiếu bảng cấu trúc | **Task 1.1, 1.2, 1.3** (Rubric 3-Tier Builder) |
| `AI-10` | AI usage logger tính giá hardcode, status trả connected true khi lỗi | **Task 2.2 & Task 4.3** (Real Metrics & Status) |
| `AI-11` | Bộ lọc PII sơ sài, không áp dụng tại mọi ranh giới AI | **Task 2.2** (PII Scrubber toàn diện) |
| `AI-12` | Fallback cấp hợp đồng & 1.000 credits mặc định cho Org | **Task 2.1** (Chặn quota rỗng giả mạo) |
