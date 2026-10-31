# Danh Sách Nhiệm Vụ Triển Khai (Todo List) — Hệ Thống AI Toàn Diện NEXA

> **Căn cứ kế hoạch:** [`tasks/plan.md`](file:///c:/nexa/tasks/plan.md)  
> **Tài liệu đặc tả:** [`docs/NEXA_AI_SPEC_HE_THONG_AI_TOAN_DIEN.md`](file:///c:/nexa/docs/NEXA_AI_SPEC_HE_THONG_AI_TOAN_DIEN.md)  
> **Quy chuẩn:** [`AGENTS.md`](file:///c:/nexa/AGENTS.md)

---

## Giai Đoạn 1: Rubric Engine & Structured Authoring (`MOD-01`)

- [x] **Task 1.1: Quản Trị Schema & Service Rubric 3 Tầng**
  - **Mô tả:** Xây dựng `RubricService` thao tác với các bảng `rubrics`, `rubric_criteria`, `rubric_levels`. Hỗ trợ tạo, đọc, cập nhật và clone rubric khi nhân bản đề. Đảm bảo tính toàn vẹn: tổng `maxPoints` các tiêu chí khớp điểm câu hỏi, tổng `weightPercent` = 100%.
  - **Tiêu chuẩn nghiệm thu:**
    1. Kiểm tra validation logic: tổng max points các tiêu chí bắt buộc bằng max score câu hỏi.
    2. Ràng buộc `score_percent` từng level nằm trong khoảng `[0, 100]`.
    3. Hỗ trợ clone rubric đầy đủ khi nhân bản câu hỏi hoặc đề thi.
  - **Lệnh kiểm chứng:** `npm run typecheck`
  - **Phụ thuộc:** Không
  - **Files:** `src/features/assessments/services/rubric.service.ts`, `src/features/assessments/types/rubric.types.ts`
  - **Size:** M (~120 dòng)

- [x] **Task 1.2: API Soạn Đề Tích Hợp Rubric Cấu Trúc (Sửa `AI-09`)**
  - **Mô tả:** Cập nhật endpoint `POST /api/admin/assessments/[id]/items` và `POST /api/personal/assessments/[id]/items`: tiếp nhận rubric cấu trúc thay vì chỉ nhận chuỗi text `rubric_guide`. Kiểm tra Zod schema, lưu nguyên tử cả câu hỏi và danh sách tiêu chí/mức độ.
  - **Tiêu chuẩn nghiệm thu:**
    1. Tạo câu hỏi tự luận/thực hành có thể kèm payload rubric đầy đủ tiêu chí và mức độ.
    2. Schema Zod xác thực toàn bộ tiêu chí trước khi ghi database.
  - **Lệnh kiểm chứng:** `npm run typecheck`
  - **Phụ thuộc:** Task 1.1
  - **Files:** `src/app/api/admin/assessments/[id]/items/route.ts`, `src/app/api/personal/assessments/[id]/items/route.ts`
  - **Size:** M (~110 dòng)

- [x] **Task 1.3: Giao Diện Rubric Builder Cho Câu Hỏi Tự Luận & Thực Hành**
  - **Mô tả:** Xây dựng component `RubricBuilder` trong trang tạo câu hỏi: cho phép thêm tiêu chí, gán mã miền (`D1`-`D5`), chọn trọng số, định nghĩa các mức độ (Xuất sắc, Đạt, Cần cải thiện, Chưa đạt) kèm mô tả hành vi. Tự động kiểm tra tổng điểm trực tiếp trên UI.
  - **Tiêu chuẩn nghiệm thu:**
    1. UI cho phép thêm/xóa/sửa tiêu chí và mức độ trực quan.
    2. Hiển thị cảnh báo trực tiếp nếu tổng điểm tiêu chí chưa khớp điểm câu hỏi.
    3. Hỗ trợ đầy đủ Light Mode và Dark Mode chuẩn quy cách.
  - **Lệnh kiểm chứng:** `npm run typecheck`
  - **Phụ thuộc:** Task 1.2
  - **Files:** `src/components/dashboard/assessments/RubricBuilder.tsx`
  - **Size:** M (~150 dòng)

- [x] **Checkpoint 1: Hoàn Tất Rubric Engine & Authoring**
  - Chạy `npm run typecheck`
  - Đảm bảo câu hỏi có thể lưu trữ rubric đa tầng thành công vào database.

---

## Giai Đoạn 2: Lõi AI Gateway, Quota Reservation & Bảo Mật PII (`MOD-02`)

- [x] **Task 2.1: Quota Reservation Nguyên Tử & Idempotency Key Theo Request ID (Sửa `AI-07`, `AI-12`)**
  - **Mô tả:** Cập nhật `QuotaEnforcementService`: bổ sung cơ chế `reserveCredits({ workspaceType, workspaceId, amount, requestId })` và `settleOrReleaseCredits()`. Kiểm tra xem `requestId` đã tồn tại chưa để trả về kết quả cũ thay vì trừ tiếp. Xóa bỏ fallback cấp 1.000 credits mặc định nếu Org không có hợp đồng hợp lệ.
  - **Tiêu chuẩn nghiệm thu:**
    1. Request có `requestId` trùng lặp trả về kết quả đang xử lý hoặc kết quả cũ, không trừ quota 2 lần.
    2. Model lỗi hoặc JSON hỏng tự động giải phóng (release) khoản giữ trước, không thất thoát credits.
    3. Org không có hợp đồng hoạt động bị chặn fail-closed ngay lập tức.
  - **Lệnh kiểm chứng:** `npm test src/features/billing/services/quota-enforcement.service.test.ts`
  - **Phụ thuộc:** Không
  - **Files:** `src/features/billing/services/quota-enforcement.service.ts`, `src/features/billing/services/quota-reservation.service.ts`
  - **Size:** M (~130 dòng)

- [x] **Task 2.2: PII Scrubber Đa Lớp & API Status Trung Thực (Sửa `AI-10`, `AI-11`)**
  - **Mô tả:** Nâng cấp `PIIScrubberService` để khử định danh (họ tên, email, số điện thoại, CCCD/CMND) trên bài làm của thí sinh trước khi chuyển vào prompt của adapter. Sửa API `/api/ai/status`: khi provider lỗi 503 hoặc thiếu key, trả `connected: false` kèm mã lỗi thực, không trả `connected: true` giả.
  - **Tiêu chuẩn nghiệm thu:**
    1. Chuỗi chứa email, SĐT, số định danh bị thay thế bằng placeholder `[ĐÃ_ẨN_THÔNG_TIN]` trước khi gửi AI.
    2. Endpoint `/api/ai/status` phản ánh chính xác kết nối tới Gemini, latency thực tế và trạng thái cấu hình.
  - **Lệnh kiểm chứng:** `npm test src/features/ai-gateway/services/pii-scrubber.service.test.ts`
  - **Phụ thuộc:** Không
  - **Files:** `src/features/ai-gateway/services/pii-scrubber.service.ts`, `src/app/api/ai/status/route.ts`
  - **Size:** S (~80 dòng)

- [x] **Task 2.3: Provider Adapter Routing & Guard Năng Lực Model (Sửa `AI-01`)**
  - **Mô tả:** Cập nhật `src/features/ai-gateway/adapters/index.ts`: kiểm tra cấu hình provider hiện tại. Chỉ định tuyến tới adapter thực sự có implementation (`GeminiAdapter`). Nếu cấu hình là OpenAI/Anthropic nhưng chưa có file adapter thì trả lỗi rõ ràng `PROVIDER_ADAPTER_NOT_IMPLEMENTED`.
  - **Files:** `src/features/ai-gateway/adapters/index.ts`
  - **Tiêu chuẩn nghiệm thu:**
    1. Adapter factory chỉ khởi tạo model có adapter hoạt động.
    2. Lựa chọn model chưa hỗ trợ bị chặn với mã lỗi cấu hình tường minh.
  - **Lệnh kiểm chứng:** `npm run typecheck`
  - **Phụ thuộc:** Không
  - **Size:** S (~60 dòng)

- [x] **Checkpoint 2: Hoàn Tất Lõi AI Gateway & Quota**
  - Chạy `npm test` cho các suite `quota-enforcement`, `pii-scrubber`.
  - Xác nhận tính nguyên tử của giữ trước / hoàn trả credits.

---

## Giai Đoạn 3: Bàn Chấm Bài NEXA Assess & Human-in-the-loop Gate (`MOD-03`)

- [x] **Task 3.1: Tách Biệt Tuyệt Đối AI Draft — Xóa Bỏ Ghi Đè Điểm Tự Động (Sửa `AI-06`)**
  - **Mô tả:** Trong `POST /api/ai/grade-submission/route.ts`, xóa bỏ hoàn toàn đoạn code cập nhật `submission_answers.score_awarded`. Lưu đề xuất AI vào bảng `ai_evaluations` với `status: 'DRAFT'`. Điểm chính thức của thí sinh vẫn giữ nguyên là `null` hoặc điểm chưa duyệt.
  - **Tiêu chuẩn nghiệm thu:**
    1. Gọi AI chấm bài thành công tạo bản ghi trong `ai_evaluations` với `status = 'DRAFT'`.
    2. `submission_answers.score_awarded` và `assessment_submissions.final_score` không bị thay đổi.
  - **Lệnh kiểm chứng:** `npm test src/features/assessments/services/assessment-validator.service.test.ts`
  - **Phụ thuộc:** Task 1.1, 2.1
  - **Files:** `src/app/api/ai/grade-submission/route.ts`
  - **Size:** S (~50 dòng)

- [x] **Task 3.2: Tái Tính Điểm Phía Server & Xác Minh Trích Dẫn Thực Tế**
  - **Mô tả:** Trong pipeline nhận JSON từ model: server đọc `levelId` và `criterionId`, tự tính điểm tiêu chí. Bổ sung hàm kiểm tra `verifyEvidenceQuote(studentResponse, evidenceQuote)`: nếu model tạo trích dẫn không có thật trong bài, gắn cờ `INVALID_CITATION` để người chấm lưu ý.
  - **Tiêu chuẩn nghiệm thu:**
    1. Điểm từng tiêu chí do server tự nhân `maxPoints * scorePercent / 100`, không lấy số tự do từ JSON.
    2. Trích dẫn giả mạo (hallucinated quote) bị gắn cờ cảnh báo `INVALID_CITATION`.
  - **Lệnh kiểm chứng:** `npm run typecheck`
  - **Phụ thuộc:** Task 3.1
  - **Files:** `src/features/ai-gateway/services/grading-validator.service.ts`, `src/app/api/ai/grade-submission/route.ts`
  - **Size:** M (~100 dòng)

- [x] **Task 3.3: Đồng Bộ Hợp Đồng Bàn Chấm Org & Xóa Bỏ Điểm Fallback Ảo (Sửa `AI-03`, `AI-04`, `AI-05`)**
  - **Mô tả:** Sửa `OrgGradingClientView.tsx`: truyền đủ `submissionId` và `itemId` khi gọi API chấm AI, đọc đúng `evaluation.totalScore`. Xóa bỏ hoàn toàn giá trị fallback 75 điểm và 0.94 confidence trong `InContextGradingDrawer.tsx` và `personal/grading/page.tsx`. Khi API lỗi, hiển thị thông báo lỗi thật và hướng dẫn chấm thủ công.
  - **Tiêu chuẩn nghiệm thu:**
    1. Org AI Grading truyền đủ `itemId` và `submissionId`, đọc đúng cấu trúc trả về.
    2. Xóa bỏ hoàn toàn giá trị giả lập `confidence: 0.94`, `suggestedScore: 75`, `setTimeout` mock.
    3. Khi API lỗi, giao diện hiển thị thông báo lỗi thật và nút chấm thủ công.
  - **Lệnh kiểm chứng:** `npm run typecheck`
  - **Phụ thuộc:** Task 3.2
  - **Files:** `src/app/(dashboard)/org/[slug]/grading/OrgGradingClientView.tsx`, `src/components/dashboard/grading/InContextGradingDrawer.tsx`, `src/app/(dashboard)/personal/grading/page.tsx`
  - **Size:** M (~110 dòng)

- [x] **Task 3.4: Luồng Phê Duyệt Điểm Chính Thức (Human Review Gate & Audit)**
  - **Mô tả:** Cập nhật endpoint `POST /api/evaluator/grade/route.ts` và `POST /api/personal/grading/approve`: khi người chấm xem xét đề xuất AI và bấm "Phê duyệt kết quả", điểm được ghi nhận chính thức vào `submission_answers`, cập nhật trạng thái bài nộp `EVALUATED`, tạo bản ghi kiểm toán `grading_reviews` và đồng bộ bằng chứng năng lực.
  - **Tiêu chuẩn nghiệm thu:**
    1. Chỉ khi người chấm bấm "Phê duyệt kết quả" thì điểm bài thi mới chuyển sang chính thức (`EVALUATED`).
    2. Bản ghi audit `grading_reviews` lưu lại thông tin ai đã duyệt, thời điểm, điểm AI gợi ý và điểm người chấm chốt.
  - **Lệnh kiểm chứng:** `npm test`
  - **Phụ thuộc:** Task 3.3
  - **Files:** `src/app/api/evaluator/grade/route.ts`, `src/app/api/personal/grading/route.ts`
  - **Size:** M (~90 dòng)

- [x] **Checkpoint 3: Hoàn Tất Bàn Chấm & Human Review**
  - Kiểm tra toàn bộ luồng: Thí sinh nộp tự luận -> Trạng thái PENDING_REVIEW -> Assessor gọi AI -> Tạo AI_DRAFT -> Assessor duyệt -> Trạng thái EVALUATED.

---

## Giai Đoạn 4: Cố Vấn NEXA Guide 5 Miền & Admin AI Control Center (`MOD-04`, `MOD-05`)

- [x] **Task 4.1: Xóa Bỏ Fallback Điểm Trung Bình Toàn Bài Trong Analytics (Sửa `AI-08`)**
  - **Mô tả:** Trong `org-competency-analytics.service.ts` và `src/app/(dashboard)/org/[slug]/analytics/page.tsx`: xóa bỏ logic tự động gán điểm trung bình toàn bài cho miền bị thiếu dữ liệu. Nếu miền chưa có bài làm đánh giá hợp lệ, trả về `score: null` và hiển thị nhãn "Chưa đủ dữ liệu".
  - **Tiêu chuẩn nghiệm thu:**
    1. Miền chưa có bài làm đánh giá hợp lệ hiển thị `score: null` ("Chưa đủ dữ liệu"), không gán trung bình toàn bài.
    2. Radar chart không vẽ 0% giả cho miền chưa đánh giá.
  - **Lệnh kiểm chứng:** `npm test src/features/analytics/services/org-competency-analytics.service.test.ts`
  - **Phụ thuộc:** Không
  - **Files:** `src/features/analytics/services/org-competency-analytics.service.ts`, `src/app/(dashboard)/org/[slug]/analytics/page.tsx`
  - **Size:** S (~70 dòng)

- [x] **Task 4.2: Lộ Trình Học NEXA Guide Với Curated Catalog & On-demand Credit Check**
  - **Mô tả:** Cập nhật `POST /api/ai/analyze-competency/route.ts`: chỉ gợi ý khóa học có `courseId` nằm trong bảng `course_catalog` có trạng thái `review_status = 'APPROVED'`. Trên giao diện `/personal/learning-path`, hiển thị nút "Phân tích bằng NEXA Guide" kèm số credits dự kiến và xác nhận của người dùng.
  - **Tiêu chuẩn nghiệm thu:**
    1. Khóa học do AI đề xuất bắt buộc phải tồn tại trong bảng `course_catalog` đã được duyệt.
    2. Nút "Phân tích bằng NEXA Guide" hiển thị rõ chi phí credits và hỏi xác nhận người dùng trước khi gọi model.
  - **Lệnh kiểm chứng:** `npm run typecheck`
  - **Phụ thuộc:** Task 2.1
  - **Files:** `src/app/api/ai/analyze-competency/route.ts`, `src/app/(dashboard)/personal/learning-path/page.tsx`
  - **Size:** M (~120 dòng)

- [x] **Task 4.3: Nâng Cấp Admin AI Control Center & Chặn Provider Chưa Hỗ Trợ**
  - **Mô tả:** Trên trang `/admin/ai-gateway`, bổ sung bảng hiển thị tỷ lệ lỗi, độ trễ P95, số token và chi phí thực tế. Tại dropdown chọn Model, vô hiệu hóa các provider chưa có adapter hoạt động (OpenAI, Anthropic) với nhãn "Chưa hỗ trợ", chỉ cho phép lưu cấu hình Gemini hợp lệ.
  - **Tiêu chuẩn nghiệm thu:**
    1. Dashboard Admin AI Gateway hiển thị số liệu token, chi phí và độ trễ thực tế.
    2. Chặn việc lưu cấu hình provider chưa có adapter.
  - **Lệnh kiểm chứng:** `npm run build`
  - **Phụ thuộc:** Task 2.3
  - **Files:** `src/app/(dashboard)/admin/ai-gateway/page.tsx`, `src/features/ai-gateway/services/ai-config.service.ts`
  - **Size:** M (~100 dòng)

- [x] **Checkpoint 4: Master Verification & Knowledge Graph Sync**
  - Chạy `npm test` (đảm bảo toàn bộ 27+ test suites pass).
  - Chạy `npm run build` (kiểm tra toàn bộ 86+ routes biên dịch thành công không lỗi type/build).
  - Chạy `graphify update .` để đồng bộ đồ thị tri thức mã nguồn.
