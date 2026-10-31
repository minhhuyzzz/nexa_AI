# Danh Sách Công Việc Triển Khai (Todo List) — Chuẩn Hóa 3 Dashboard & Toàn Vẹn Khảo Thí NEXA

> **Căn cứ kế hoạch:** [`tasks/plan.md`](file:///c:/nexa/tasks/plan.md)  
> **Tài liệu nguồn:** [`NEXA_AI_REVIEW_3_DASHBOARD_SO_DO_LUONG_2026-10-31_VI.md`](file:///c:/Users/CPS/Downloads/NEXA_AI_REVIEW_3_DASHBOARD_SO_DO_LUONG_2026-10-31_VI.md)  
> **Quy chuẩn:** [`AGENTS.md`](file:///c:/nexa/AGENTS.md)

---

## Đợt 1: Bảo Mật, Nộp Bài, Điểm Rubric & AI Draft (P0 Security Gate)

- [x] **Task 1.1: Xây Dựng Helper Server-Side `requireOrgPermission` & Áp Dụng Cho Mọi Server Page Organization (SEC-01)**
  - **Mô tả:** Tạo helper `requireOrgPermission({ userId, orgId, action, resourceId })` trong `src/lib/auth/org-guard.ts`. Cưỡng chế gọi hàm này tại server layout `src/app/(dashboard)/org/[slug]/layout.tsx` và toàn bộ các server page (`members/page.tsx`, `grading/page.tsx`, `classes/[classId]/page.tsx`, `analytics/page.tsx`, `ai-quota/page.tsx`, `campaigns/page.tsx`). Đảm bảo `MEMBER` không được đọc dữ liệu chấm thi hoặc danh sách học viên khác bằng cách gõ URL trực tiếp.
  - **Tiêu chuẩn nghiệm thu:**
    1. Người dùng không có membership `ACTIVE` trong tổ chức bị redirect/chặn ngay với mã lỗi 403 hoặc quay về trang chọn workspace.
    2. Học viên với vai trò `MEMBER` truy cập `/org/[slug]/grading` bị chặn truy cập và không nhận được dữ liệu điểm/email.
    3. Giảng viên `ASSESSOR` chỉ truy cập được các chức năng được phân quyền.
  - **Lệnh kiểm chứng:** `npm run typecheck`
  - **Phụ thuộc:** Không
  - **Files:** `src/lib/auth/org-guard.ts`, `src/app/(dashboard)/org/[slug]/layout.tsx`, `src/app/(dashboard)/org/[slug]/grading/page.tsx`, `src/app/(dashboard)/org/[slug]/members/page.tsx`, `src/app/(dashboard)/org/[slug]/classes/[classId]/page.tsx`
  - **Size:** M (5 files, ~120 dòng)

- [x] **Task 1.2: Tách Biệt AI Draft — Không Ghi Đè Điểm Chính Thức Khi Chưa Duyệt (GRADE-01)**
  - **Mô tả:** Trong `POST /api/ai/grade-submission/route.ts`, chỉ lưu kết quả AI chấm vào bảng `ai_evaluations` với trạng thái `DRAFT`, `suggested_score`, `evidence_quote`, và `confidence_score`. Loại bỏ hoàn toàn lệnh ghi đè trực tiếp vào `submission_answers.score_awarded` và `assessment_submissions.final_score`.
  - **Tiêu chuẩn nghiệm thu:**
    1. Gọi API chấm AI không làm thay đổi điểm chính thức của bài nộp (`score_awarded` vẫn giữ nguyên giá trị trước đó hoặc null).
    2. Bàn chấm bài hiển thị gợi ý của AI dưới dạng nháp (Draft Badge) để Người chấm xem xét.
  - **Lệnh kiểm chứng:** `npm run typecheck`
  - **Phụ thuộc:** Task 1.1
  - **Files:** `src/app/api/ai/grade-submission/route.ts`, `src/features/grading/components/GradingRubricEvaluation.tsx`
  - **Size:** S (2 files, ~60 dòng)

- [x] **Task 1.3: Kiểm Định Thang Điểm Rubric Tại Máy Chủ Trong `api/evaluator/grade` (SEC-02)**
  - **Mô tả:** Trong `POST /api/evaluator/grade/route.ts`, tải định nghĩa Rubric chính thức của câu hỏi từ database. Kiểm tra từng tiêu chí trong `criterionScores`: điểm gửi lên phải nằm trong khoảng `[0, criterion.max_score]`. Tính toán lại tổng điểm tại server, kiểm tra quyền chấm của assessor đối với bài thi tương ứng.
  - **Tiêu chuẩn nghiệm thu:**
    1. Gửi điểm vượt mức tối đa của tiêu chí hoặc gửi tiêu chí lạ bị trả lỗi 400 Bad Request.
    2. Người không được phân công chấm bài nộp bị trả lỗi 403 Forbidden.
    3. Điểm chính thức được tính toán chính xác và ghi nhận nhật ký kiểm toán.
  - **Lệnh kiểm chứng:** `npm run typecheck`
  - **Phụ thuộc:** Task 1.2
  - **Files:** `src/app/api/evaluator/grade/route.ts`
  - **Size:** S (1 file, ~90 dòng)

- [x] **Task 1.4: Nộp Bài Nguyên Tử & Chống Gửi Lặp (SEC-03)**
  - **Mô tả:** Trong `POST /api/assessments/[id]/submit/route.ts`, bổ sung kiểm tra trạng thái: nếu bài nộp đã ở trạng thái `SUBMITTED` hoặc `EVALUATED` thì chặn nộp lại với mã 400/409. Bọc việc cập nhật submission, lưu đáp án trắc nghiệm khách quan và chuyển trạng thái vào một giao dịch nguyên tử. Kiểm tra `classAssignmentId` hợp lệ thuộc đúng người nộp và lớp được giao.
  - **Tiêu chuẩn nghiệm thu:**
    1. Không thể nộp lại bài thi đã hoàn tất.
    2. Bấm nộp bài nhiều lần liên tiếp (double click) không sinh kết quả trùng lặp.
    3. Chặn hoàn toàn việc giả mạo `classAssignmentId` của người học hoặc tổ chức khác.
  - **Lệnh kiểm chứng:** `npm run typecheck`
  - **Phụ thuộc:** Task 1.3
  - **Files:** `src/app/api/assessments/[id]/submit/route.ts`
  - **Size:** M (1 file, ~100 dòng)

- [x] **Task 1.5: Duyệt Điểm Nguyên Tử & Chống Nhân Đôi Minh Chứng Năng Lực (GRADE-02)**
  - **Mô tả:** Hợp nhất logic lưu kết quả chấm chính thức giữa Personal và Organization. Khi người chấm xác nhận duyệt điểm: cập nhật trạng thái `assessment_submissions.status = 'EVALUATED'`, ghi `final_score`, và sinh bản ghi `competency_evidence` với cơ chế upsert (on conflict do update) để đảm bảo không nhân đôi bằng chứng năng lực khi lưu lại điểm.
  - **Tiêu chuẩn nghiệm thu:**
    1. Lưu điểm nhiều lần cho cùng một bài thi không sinh ra các bản ghi `competency_evidence` trùng lặp.
    2. Điểm số của bài thi chuyển sang chính thức và đồng bộ vào hồ sơ năng lực của học viên.
  - **Lệnh kiểm chứng:** `npm run typecheck`
  - **Phụ thuộc:** Task 1.3, 1.4
  - **Files:** `src/app/api/evaluator/grade/route.ts`, `src/features/grading/services/in-context-grading.service.ts`
  - **Size:** M (2 files, ~110 dòng)

- [x] **Checkpoint 1: Hoàn Tất Đợt 1 (Security & Grading Gate)**
  - Chạy `npm run build` và kiểm thử luồng nộp bài, phân quyền và duyệt điểm.

---

## Đợt 2: Cá Nhân & Lộ Trình Tiến Bộ Thật (Personal Journey)

- [x] **Task 2.1: Sửa Endpoint Xóa Đề Personal — Tách Riêng Quyền Sở Hữu (PERS-01)**
  - **Mô tả:** Trong `src/app/(dashboard)/personal/authoring/page.tsx`, thay thế lệnh gọi `DELETE /api/admin/assessments/[id]` bằng `DELETE /api/personal/assessments/[id]`. Tạo route API `src/app/api/personal/assessments/[id]/route.ts` cho phép chủ đề xóa/lưu trữ đề nháp của chính mình (kiểm tra `author_id = user.id`), không cho phép xóa đề đã có học viên làm bài.
  - **Tiêu chuẩn nghiệm thu:**
    1. Người dùng Personal xóa được đề nháp do chính mình tạo mà không gặp lỗi 403 từ Admin API.
    2. Không thể xóa đề của người dùng khác. Đề đã có bài nộp được chuyển sang trạng thái lưu trữ (`ARCHIVED`) thay vì xóa cứng.
  - **Lệnh kiểm chứng:** `npm run build`
  - **Phụ thuộc:** Checkpoint 1
  - **Files:** `src/app/(dashboard)/personal/authoring/page.tsx`, `src/app/api/personal/assessments/[id]/route.ts`
  - **Size:** S (2 files, ~80 dòng)

- [x] **Task 2.2: Chuẩn Hóa Service Báo Cáo 5 Miền `DomainAssessmentSummary` (PERS-02)**
  - **Mô tả:** Xây dựng service dùng chung `DomainAssessmentSummaryService` tại `src/features/competency/services/domain-assessment-summary.service.ts`. Đảm bảo cả Personal Dashboard, Hồ sơ năng lực và Lộ trình đều lấy cùng một kết quả điểm cho đúng 5 miền chuẩn (`D1`..`D5`). Miền chưa có bài thi/bằng chứng trả về `null` (hiển thị "Chưa đánh giá"), loại bỏ các chỉ số KPI 21 kỹ năng gây nhiễu trên UI.
  - **Tiêu chuẩn nghiệm thu:**
    1. Ba trang Personal Dashboard, Hồ sơ và Lộ trình hiển thị đồng nhất 5 điểm miền năng lực.
    2. Miền chưa có đánh giá hiển thị nhãn "Chưa đánh giá" / `null`, không bị gán 0% giả.
  - **Lệnh kiểm chứng:** `npm run build`
  - **Phụ thuộc:** Task 2.1
  - **Files:** `src/features/competency/services/domain-assessment-summary.service.ts`, `src/app/(dashboard)/personal/competency/page.tsx`, `src/app/(dashboard)/personal/dashboard/page.tsx`
  - **Size:** M (3 files, ~140 dòng)

- [x] **Task 2.3: Thiết Lập Bài Đánh Giá Baseline & Khép Kín CTA Người Mới (PERS-03, UX-01)**
  - **Mô tả:** Đảm bảo khi người mới đăng nhập Personal Dashboard chưa có dữ liệu, hiển thị CTA nổi bật "Bắt đầu đánh giá năng lực đầu vào". Nút này điều hướng trực tiếp đến một bài thi baseline có sẵn câu hỏi hợp lệ trong hệ thống.
  - **Tiêu chuẩn nghiệm thu:**
    1. Người dùng mới thấy CTA bắt đầu rõ ràng, bấm vào mở bài làm trực tiếp không bị lỗi 404 hoặc trang trống.
    2. Sau khi hoàn thành bài baseline, Dashboard cập nhật ngay kết quả 5 miền.
  - **Lệnh kiểm chứng:** `npm run build`
  - **Phụ thuộc:** Task 2.2
  - **Files:** `src/app/(dashboard)/personal/dashboard/page.tsx`, `src/features/assessments/services/baseline-assessment.service.ts`
  - **Size:** M (2 files, ~100 dòng)

- [x] **Task 2.4: Đồng Bộ Gói Cá Nhân, Đăng Ký & Quota Chung Nguồn Dữ Liệu (PERS-04)**
  - **Mô tả:** Cập nhật `src/app/(dashboard)/personal/billing/page.tsx` và `src/features/billing/services/quota-enforcement.service.ts` để đọc thông tin gói từ bảng `service_plans` và `user_subscriptions` thay vì hardcode so sánh `profiles.plan_tier`. Đồng bộ hạn mức lượt thi và AI credits theo định nghĩa gói thật.
  - **Tiêu chuẩn nghiệm thu:**
    1. Trang Billing hiển thị đúng gói hiện tại của người dùng kèm ngày hết hạn.
    2. Hạn mức quota được áp dụng chính xác theo gói người dùng đang sở hữu.
  - **Lệnh kiểm chứng:** `npm run build`
  - **Phụ thuộc:** Task 2.1
  - **Files:** `src/app/(dashboard)/personal/billing/page.tsx`, `src/features/billing/services/quota-enforcement.service.ts`
  - **Size:** S (2 files, ~80 dòng)

- [x] **Task 2.5: Lưu Vết Lộ Trình 4 Bước Bền Vững & Theo Dõi Tiến Độ (PERS-05)**
  - **Mô tả:** Trong `src/app/(dashboard)/personal/learning-path/page.tsx` và `src/app/api/personal/learning-path/route.ts`, lưu snapshot lộ trình cá nhân vào cơ sở dữ liệu (`user_learning_paths`). Lưu trữ trạng thái hoàn thành từng bước học, không bị mất tiến độ khi F5 tải lại trang.
  - **Tiêu chuẩn nghiệm thu:**
    1. Khi tải lại trang Lộ trình, các bước học đã đánh dấu hoàn thành vẫn giữ nguyên trạng thái.
    2. Đánh giá lại năng lực cập nhật lộ trình mới nhưng vẫn lưu trữ lịch sử lộ trình trước đó.
  - **Lệnh kiểm chứng:** `npm run build`
  - **Phụ thuộc:** Task 2.2
  - **Files:** `src/app/(dashboard)/personal/learning-path/page.tsx`, `src/app/api/personal/learning-path/route.ts`
  - **Size:** M (2 files, ~120 dòng)

- [x] **Task 2.6: Lọc Danh Mục Khóa Học Đã Kiểm Duyệt & Loại Bỏ Khóa Giả (PERS-06)**
  - **Mô tả:** Trong `src/app/api/courses/route.ts` và `src/app/api/ai/analyze-competency/route.ts`, chỉ gợi ý các khóa học có trạng thái `is_active = true` và `approval_status = 'APPROVED'` từ cơ sở dữ liệu. Loại bỏ fallback hardcode trong mã nguồn, giải thích rõ ràng trên UI khi chưa có khóa học phù hợp cho miền năng lực đó.
  - **Tiêu chuẩn nghiệm thu:**
    1. Không hiển thị các URL hoặc khóa học tự sinh không có trong danh mục hệ thống.
    2. Khi DB chưa có khóa học phù hợp, UI hiển thị thông báo "Đang cập nhật học liệu" thay vì sinh khóa học giả.
  - **Lệnh kiểm chứng:** `npm run build`
  - **Phụ thuộc:** Task 2.5
  - **Files:** `src/app/api/courses/route.ts`, `src/app/api/ai/analyze-competency/route.ts`
  - **Size:** S (2 files, ~70 dòng)

- [x] **Task 2.7: Chuẩn Hóa Trạng Thái Công Việc Được Giao Trên Personal Dashboard (PERS-07)**
  - **Mô tả:** Cập nhật bảng công việc và bài nộp trên Personal Dashboard theo trạng thái chuẩn: `ASSIGNED → IN_PROGRESS → SUBMITTED → EVALUATED`. Hiển thị rõ hạn chót nộp bài và kết quả điểm chính thức khi đã được chấm.
  - **Tiêu chuẩn nghiệm thu:**
    1. Danh sách bài được giao hiển thị đúng trạng thái thực tế từ database.
    2. Không có bộ đếm ảo hoặc trạng thái cũ sai lệch.
  - **Lệnh kiểm chứng:** `npm run build`
  - **Phụ thuộc:** Task 2.3
  - **Files:** `src/app/(dashboard)/personal/dashboard/page.tsx`, `src/app/(dashboard)/personal/groups/page.tsx`
  - **Size:** S (2 files, ~60 dòng)

- [x] **Checkpoint 2: Hoàn Tất Đợt 2 (Personal Journey Gate)**
  - Chạy `npm run build` kiểm tra toàn bộ trải nghiệm cá nhân: Đăng ký → Baseline → 5 Miền → Lộ trình → Khóa học.

---

## Đợt 3: Vòng Đời Tổ Chức & Đợt Đánh Giá B2B (Organization Lifecycle)

- [x] **Task 3.1: Sửa URL Sinh Mã Tham Gia & Mã Hóa Token An Toàn (ORG-01, ORG-03)**
  - **Mô tả:** Trong `src/app/api/organizations/[orgId]/join-codes/route.ts`, sửa URL tạo mã từ `/join?code=...` thành `/join/org/[joinCode]`. Sử dụng `crypto.randomBytes` hoặc `crypto.randomUUID` để tạo mã không thể đoán quy luật. Thêm rate limit chống brute-force mã tham gia.
  - **Tiêu chuẩn nghiệm thu:**
    1. Nút sao chép link tham gia sao chép đúng định dạng `/join/org/[joinCode]`.
    2. Mã tham gia sinh ngẫu nhiên an toàn, chặn các yêu cầu thử mã liên tục.
  - **Lệnh kiểm chứng:** `npm run build`
  - **Phụ thuộc:** Checkpoint 1
  - **Files:** `src/app/api/organizations/[orgId]/join-codes/route.ts`, `src/app/join/org/[joinCode]/page.tsx`
  - **Size:** S (2 files, ~70 dòng)

- [x] **Task 3.2: Bộ Đếm Lượt Dùng Mã Tham Gia Nguyên Tử (ORG-02)**
  - **Mô tả:** Thống nhất duy nhất một thời điểm tiêu thụ lượt dùng mã: khi người học được Org Admin duyệt tham gia (chấp thuận `membership_requests`). Tăng `used_count` bằng câu lệnh atomic SQL `SET used_count = used_count + 1 WHERE id = ... AND used_count < max_uses` để chống xung đột nhiều yêu cầu cùng lúc.
  - **Tiêu chuẩn nghiệm thu:**
    1. Một người tham gia thành công chỉ làm tăng `used_count` đúng 1 lần.
    2. Khi mã đã đạt `max_uses`, các yêu cầu xin vào tiếp theo bị chặn thông báo mã đã hết lượt.
  - **Lệnh kiểm chứng:** `npm run build`
  - **Phụ thuộc:** Task 3.1
  - **Files:** `src/app/api/organizations/[orgId]/membership-requests/route.ts`, `src/app/api/join/org/[joinCode]/route.ts`
  - **Size:** S (2 files, ~80 dòng)

- [x] **Task 3.3: Xây Dựng Campaign Wizard & Tạo Đợt Đánh Giá Nguyên Tử (ORG-04, UX-02)**
  - **Mô tả:** Tạo Campaign Wizard đa bước tại `src/app/(dashboard)/org/[slug]/campaigns/new/page.tsx`: 1. Thông tin đợt → 2. Chọn đề thi → 3. Chọn nhóm lớp/học viên → 4. Phân công người chấm → 5. Xem trước & Xác nhận. Gọi API tạo chiến dịch nguyên tử: nếu bước sinh bài giao thất bại thì tự động rollback, không để lại đợt đánh giá dở dang.
  - **Tiêu chuẩn nghiệm thu:**
    1. Org Admin có thể bấm "Tạo đợt đánh giá mới" mở wizard trực tiếp trên trang Campaign.
    2. Đợt đánh giá được tạo hoàn chỉnh kèm đầy đủ bài giao cho học viên các lớp đã chọn.
  - **Lệnh kiểm chứng:** `npm run build`
  - **Phụ thuộc:** Task 1.1
  - **Files:** `src/app/(dashboard)/org/[slug]/campaigns/new/page.tsx`, `src/app/api/organizations/[orgId]/campaigns/route.ts`, `src/app/(dashboard)/org/[slug]/campaigns/page.tsx`
  - **Size:** M (3 files, ~160 dòng)

- [x] **Task 3.4: Chuẩn Hóa State Machine & Enum Trạng Thái Campaign (ORG-05)**
  - **Mô tả:** Đồng bộ enum trạng thái Campaign trên toàn bộ DB, API và giao diện: `SCHEDULED`, `ACTIVE`, `GRADING`, `COMPLETED`, `ARCHIVED`. Sửa thống kê tại `src/app/(dashboard)/org/[slug]/page.tsx` đếm đúng các đợt đang `ACTIVE`.
  - **Tiêu chuẩn nghiệm thu:**
    1. Các đợt đánh giá đang diễn ra (`ACTIVE`) hiển thị chính xác trên Widget Tổng quan và danh sách Campaigns.
    2. Không có sự sai lệch giữa số lượng đợt hiển thị ở Dashboard và trang quản lý Đợt.
  - **Lệnh kiểm chứng:** `npm run build`
  - **Phụ thuộc:** Task 3.3
  - **Files:** `src/app/(dashboard)/org/[slug]/page.tsx`, `src/features/assessments/types/campaign.types.ts`
  - **Size:** S (2 files, ~50 dòng)

- [x] **Task 3.5: Báo Cáo 5 Miền Tổ Chức Trung Thực — Không Suy Diễn Điểm Toàn Bài (ORG-06)**
  - **Mô tả:** Trong `src/features/analytics/services/org-competency-analytics.service.ts`, tính toán điểm từng miền dựa trên câu hỏi và bằng chứng đã được thẩm định. Tuyệt đối không lấy trung bình điểm bài thi gán vào toàn bộ các miền khi thiếu dữ liệu riêng. Miền không được đo trả về `null`.
  - **Tiêu chuẩn nghiệm thu:**
    1. Đề thi chỉ đo miền D1 thì báo cáo lớp/tổ chức chỉ hiển thị điểm D1, các miền D2..D5 hiển thị `null` ("Chưa đo").
    2. Điểm số thể hiện số lượng học viên thực tế tham gia (mẫu số rõ ràng).
  - **Lệnh kiểm chứng:** `npm run build`
  - **Phụ thuộc:** Task 2.2
  - **Files:** `src/features/analytics/services/org-competency-analytics.service.ts`, `src/app/(dashboard)/org/[slug]/analytics/page.tsx`
  - **Size:** M (2 files, ~110 dòng)

- [x] **Task 3.6: Chặn Quota Hợp Đồng Ảo Khi Tổ Chức Chưa Có Entitlement (ORG-07)**
  - **Mô tả:** Trong `src/features/billing/services/quota-enforcement.service.ts`, loại bỏ nhánh code tự tạo thông tin hợp đồng giả (50 seats/500 assessments/1000 credits). Khi tổ chức chưa có bản ghi `organization_entitlements` hợp lệ hoặc hợp đồng hết hạn, trả về trạng thái từ chối quyền thực tế và yêu cầu liên hệ Admin.
  - **Tiêu chuẩn nghiệm thu:**
    1. Tổ chức chưa ký hợp đồng không thể tạo đề vượt quyền hoặc sử dụng AI credits miễn phí.
    2. Giao diện trang Quota hiển thị đúng thông báo "Chưa kích hoạt hợp đồng" thay vì hiển thị hạn mức ảo.
  - **Lệnh kiểm chứng:** `npm run build`
  - **Phụ thuộc:** Task 1.1
  - **Files:** `src/features/billing/services/quota-enforcement.service.ts`, `src/app/(dashboard)/org/[slug]/ai-quota/page.tsx`
  - **Size:** S (2 files, ~70 dòng)

- [x] **Task 3.7: Phân Quyền Điều Hướng Member & Giới Hạn Bàn Chấm Theo Phân Công (ORG-08)**
  - **Mô tả:** Sửa `OrgSidebar.tsx`: đối với `MEMBER`, menu "Kết quả của tôi" dẫn về trang kết quả cá nhân trong tổ chức `/org/[slug]/my-results`, không dẫn vào báo cáo toàn tổ chức. Sửa API Bàn chấm bài `/api/organizations/[orgId]/grading`: chỉ trả về bài thi của các lớp/chiến dịch mà assessor đó được phân công phụ trách.
  - **Tiêu chuẩn nghiệm thu:**
    1. Học viên Member xem được kết quả cá nhân của mình, không xem được bảng phân tích của đơn vị.
    2. Giảng viên chỉ nhìn thấy bài cần chấm của lớp mình phụ trách.
  - **Lệnh kiểm chứng:** `npm run build`
  - **Phụ thuộc:** Task 1.1, 3.3
  - **Files:** `src/components/dashboard/org/OrgSidebar.tsx`, `src/app/api/organizations/[orgId]/grading/route.ts`, `src/app/(dashboard)/org/[slug]/my-results/page.tsx`
  - **Size:** M (3 files, ~130 dòng)

- [x] **Checkpoint 3: Hoàn Tất Đợt 3 (Organization Lifecycle Gate)**
  - Chạy `npm run build` và kiểm thử toàn bộ vòng đời tổ chức B2B từ Mời → Tham gia → Đợt thi → Chấm bài → Báo cáo 5 miền.

---

## Đợt 4: Quản Trị Nền Tảng, Cấu Hình AI & Vận Hành (Admin Control Plane)

- [x] **Task 4.1: Phê Duyệt Business Inquiry & Cấp Hạn Mức Nguyên Tử (ADM-01)**
  - **Mô tả:** Trong `src/app/api/admin/organizations/approve/route.ts`, bọc toàn bộ quá trình duyệt hợp đồng: chuyển trạng thái inquiry sang `APPROVED`, tạo tổ chức `ACTIVE`, cấp `organization_entitlements` thật, và sinh lời mời cho Owner vào một giao dịch hoặc cơ chế kiểm soát lỗi nghiêm ngặt. Nếu có lỗi ở bước tạo entitlement, rollback trạng thái tổ chức.
  - **Tiêu chuẩn nghiệm thu:**
    1. Một inquiry duyệt thành công tạo ra đúng 1 tổ chức kèm entitlement thật và lời mời Owner.
    2. Bấm duyệt đồng thời nhiều lần không sinh ra các tổ chức trùng lặp (idempotent).
  - **Lệnh kiểm chứng:** `npm run build`
  - **Phụ thuộc:** Checkpoint 1
  - **Files:** `src/app/api/admin/organizations/approve/route.ts`
  - **Size:** M (1 file, ~100 dòng)

- [x] **Task 4.2: Chuẩn Hóa Phản Hồi Lỗi & Phân Tách Vai Trò Tại Admin Users (ADM-02)**
  - **Mô tả:** Trong `src/app/api/admin/users/route.ts` và `src/app/(dashboard)/admin/users/page.tsx`, khi truy vấn database lỗi, trả về HTTP 500 kèm thông báo rõ ràng (không trả về `users: []` giả vờ thành công). Phân tách rõ ràng giữa quyền Platform Superadmin và các vai trò thành viên trong tổ chức.
  - **Tiêu chuẩn nghiệm thu:**
    1. Lỗi kết nối CSDL hiển thị thông báo lỗi trên UI, không bị hiểu nhầm là hệ thống có 0 người dùng.
    2. Giao diện thể hiện đúng cấu trúc vai trò của người dùng trên toàn hệ thống.
  - **Lệnh kiểm chứng:** `npm run build`
  - **Phụ thuộc:** Task 1.1
  - **Files:** `src/app/api/admin/users/route.ts`, `src/app/(dashboard)/admin/users/page.tsx`
  - **Size:** S (2 files, ~80 dòng)

- [x] **Task 4.3: Chặn Checkout Business Tự Phục Vụ & Chuẩn Hóa Đối Soát (ADM-03)**
  - **Mô tả:** Trong `src/app/api/billing/create-intent/route.ts`, chặn hoàn toàn việc gửi yêu cầu thanh toán gói Business qua luồng checkout cá nhân. Kiểm soát API đối soát thủ công tại `/api/admin/transactions`: kiểm tra tính duy nhất của mã giao dịch ngân hàng, chỉ cấp quyền lợi một lần duy nhất.
  - **Tiêu chuẩn nghiệm thu:**
    1. Không thể tạo checkout gói Business qua API thanh toán cá nhân.
    2. Duyệt giao dịch thủ công nhiều lần chỉ cộng gói/credits 1 lần duy nhất (chống duplicate credits).
  - **Lệnh kiểm chứng:** `npm run build`
  - **Phụ thuộc:** Task 2.4
  - **Files:** `src/app/api/billing/create-intent/route.ts`, `src/app/api/admin/transactions/route.ts`
  - **Size:** S (2 files, ~70 dòng)

- [x] **Task 4.4: Versioning Khung Năng Lực & Đề Thi Đã Phát Hành (ADM-04)**
  - **Mô tả:** Cập nhật quản lý Khung năng lực tại `src/app/api/admin/frameworks/route.ts`: khi khung năng lực hoặc đề thi đã có bài thi lịch sử, khóa sửa đổi trực tiếp. Mọi thay đổi phải tạo phiên bản mới (`v1.1`, `v2.0`). Các bài thi lịch sử gắn chặt với phiên bản tại thời điểm làm bài.
  - **Tiêu chuẩn nghiệm thu:**
    1. Chỉnh sửa khung năng lực mới không làm thay đổi điểm số và bằng chứng của các bài thi trong quá khứ.
    2. Bài thi hiển thị rõ phiên bản khung năng lực áp dụng.
  - **Lệnh kiểm chứng:** `npm run build`
  - **Phụ thuộc:** Task 2.2
  - **Files:** `src/app/api/admin/frameworks/route.ts`, `src/features/framework/services/framework.service.ts`
  - **Size:** M (2 files, ~90 dòng)

- [x] **Task 4.5: Lưu Cấu Hình AI Gateway Bền Vững Vào Database & Đồng Bộ Adapter (AI-02, AI-03)**
  - **Mô tả:** Thay thế việc đọc ghi file `ai-config.json` trong `src/features/ai-gateway/services/ai-config.service.ts` bằng việc lưu vào bảng `platform_settings` trong PostgreSQL. Trong `src/features/ai-gateway/adapters/index.ts`, hiển thị đúng trạng thái nhà cung cấp: chỉ định tuyến tới Gemini Adapter đang hoạt động, nếu chọn provider chưa tích hợp thì báo lỗi cấu hình rõ ràng.
  - **Tiêu chuẩn nghiệm thu:**
    1. Thay đổi cấu hình AI Gateway trong Admin được lưu vào DB, không bị mất khi restart server hoặc deploy serverless.
    2. Báo lỗi trung thực nếu lưu thất bại, không trả về thành công giả.
  - **Lệnh kiểm chứng:** `npm run build`
  - **Phụ thuộc:** Task 1.2
  - **Files:** `src/features/ai-gateway/services/ai-config.service.ts`, `src/features/ai-gateway/adapters/index.ts`, `src/app/api/admin/ai-gateway/route.ts`
  - **Size:** M (3 files, ~120 dòng)

- [x] **Task 4.6: Trừ AI Credits Nguyên Tử Theo Đúng Chủ Thể Chi Trả (AI-01)**
  - **Mô tả:** Trong `src/app/api/ai/grade-submission/route.ts` và `src/app/api/ai/analyze-competency/route.ts`, xác định chính xác tài khoản chịu phí: nếu tác vụ diễn ra trong tổ chức thì trừ credit của Organization Entitlement; nếu là cá nhân thì trừ của Personal Profile. Khi RPC trừ credit thất bại thì báo lỗi thực tế, không trả về số dư ước đoán.
  - **Tiêu chuẩn nghiệm thu:**
    1. Thao tác chấm bài trong lớp tổ chức trừ đúng quota của tổ chức đó.
    2. Hết credit bị chặn thực tế kèm thông báo rõ ràng, không có số dư ảo.
  - **Lệnh kiểm chứng:** `npm run build`
  - **Phụ thuộc:** Task 3.6, 4.5
  - **Files:** `src/app/api/ai/grade-submission/route.ts`, `src/app/api/ai/analyze-competency/route.ts`, `src/features/billing/services/quota-enforcement.service.ts`
  - **Size:** M (3 files, ~100 dòng)

- [x] **Task 4.7: Thống Kê AI Có Kỳ Thời Gian & Nâng Cấp Dashboard Ưu Tiên Hàng Đợi (ADM-05, ADM-06, ADM-07, UX-03)**
  - **Mô tả:** Cập nhật `src/app/api/admin/ai-gateway/route.ts` để lọc thống kê theo kỳ thời gian và ghi rõ phạm vi mẫu dữ liệu. Nâng cấp `src/app/(dashboard)/admin/dashboard/page.tsx` thành trung tâm xử lý công việc: hiển thị hàng đợi hồ sơ B2B mới, giao dịch cần đối soát, cảnh báo vượt quota, thay thế các số liệu mặc định `|| 1` bằng số liệu thực tế `?? 0`.
  - **Tiêu chuẩn nghiệm thu:**
    1. Số liệu AI thể hiện rõ kỳ thời gian và model thực tế đã xử lý.
    2. Dashboard Admin ưu tiên các tác vụ cần phê duyệt và cảnh báo hệ thống thật.
  - **Lệnh kiểm chứng:** `npm run build`
  - **Phụ thuộc:** Task 4.1, 4.2, 4.5
  - **Files:** `src/app/api/admin/ai-gateway/route.ts`, `src/app/(dashboard)/admin/dashboard/page.tsx`, `src/app/(dashboard)/admin/ai-gateway/page.tsx`
  - **Size:** M (3 files, ~120 dòng)

- [x] **Checkpoint 4: Hoàn Tất Toàn Bộ Hệ Thống (Master Launch Checkpoint)**
  - Chạy `npm run build`, `npm run lint`, và quét `graphify update .` để đồng bộ toàn bộ đồ thị tri thức mã nguồn.
