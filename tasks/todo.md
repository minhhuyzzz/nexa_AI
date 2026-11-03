# Danh Sách Nhiệm Vụ Triển Khai: NEXA SaaS Business v3.0 & Khắc Phục Toàn Diện Review (03/11/2026)

> **Tài liệu nguồn:** [`tasks/plan.md`](file:///c:/nexa/tasks/plan.md)  
> **Căn cứ đánh giá:** [`c:\Users\CPS\Downloads\NEXA_REVIEW_2026-11-03.md`](file:///c:/Users/CPS/Downloads/NEXA_REVIEW_2026-11-03.md) & [`c:\Users\CPS\Downloads\NEXA_ORG_ANALYTICS_UI_UX_SPEC.md`](file:///c:/Users/CPS/Downloads/NEXA_ORG_ANALYTICS_UI_UX_SPEC.md)  
> **Quy chuẩn thực thi:** [`AGENTS.md`](file:///c:/nexa/AGENTS.md), [`security-and-hardening`](file:///c:/nexa/.agents/skills/security-and-hardening/SKILL.md), [`planning-and-task-breakdown`](file:///c:/nexa/.agents/skills/planning-and-task-breakdown/SKILL.md).

---

## Phase 0: Khắc Phục Khẩn Cấp Các Lỗ Hổng P0 (Security & Concurrency)

- [x] **Task 0.1: Migration 39 Vá Lỗ Hổng Bảo Mật RPC AI Credits (P0-02)**
  - **Mô tả:** Viết file `src/database/migrations/39_secure_ai_credits_rpc.sql`:
    1. Thu hồi quyền EXECUTE khỏi `PUBLIC`, `anon`, `authenticated` trên hàm `deduct_organization_ai_credits`.
    2. Chỉ cấp EXECUTE cho `service_role`.
    3. Thêm ràng buộc `p_amount > 0` (chặn `p_amount <= 0`).
    4. Thiết lập rõ `SET search_path = public, pg_temp;`.
    5. Viết thêm hàm RPC an toàn `refund_organization_ai_credits` với row-locking tương tự.
    6. Tạo bảng `ai_credit_reservations` lưu trữ ledger giữ trước để bảo đảm idempotency.
  - **Tiêu chí chấp nhận:**
    - [x] Role `anon` và `authenticated` không thể gọi RPC qua REST/Supabase client.
    - [x] Gọi hàm với `p_amount <= 0` văng exception rõ ràng, không làm giảm `ai_credits_used`.
  - **Tệp:** `src/database/migrations/39_secure_ai_credits_rpc.sql`.

- [x] **Task 0.2: Triệt Tiêu Read-Modify-Write Fallback & Idempotent Ledger (P0-03)**
  - **Mô tả:** Trong `src/features/billing/services/quota-enforcement.service.ts`:
    1. Xóa bỏ hoàn toàn fallback read-modify-write (`select` -> `nextUsed = used + amount` -> `update`) trong cả `deductOrgAICredits` và `deductPersonalAICredits`.
    2. Áp dụng nguyên tắc **Fail-Closed**: nếu RPC lỗi thì trả về thất bại ngay.
    3. Thống nhất `refundOrgAICredits` và `refundPersonalAICredits` gọi RPC SQL nguyên tử.
  - **Tiêu chí chấp nhận:**
    - [x] Không còn cập nhật số dư bằng `update` client-side không có lock.
    - [x] Fail-closed an toàn khi RPC gặp sự cố.
  - **Tệp:** `src/features/billing/services/quota-enforcement.service.ts`.

- [x] **Task 0.3: Áp Dụng Migration 38 & Chuẩn Hóa FSM Inquiries (P0-01)**
  - **Mô tả:** Đồng bộ triệt để check constraint của `business_inquiries` và route `approve/route.ts`:
    1. Migration 38 đã mở rộng `CHECK (status IN ('NEW', 'CONTACTED', 'IN_PROGRESS', 'PROPOSAL_SENT', 'ACTIVATED', 'APPROVED', 'REJECTED', 'CLOSED', 'NEEDS_INFO'))`.
    2. Sửa `approve/route.ts` lock `IN_PROGRESS` từ các trạng thái cho phép (`NEW | IN_PROGRESS | CONTACTED | PROPOSAL_SENT`) và cập nhật sang `ACTIVATED`.
    3. Sửa mock test `business-inquiry.service.test.ts` sang trạng thái `NEW`.
  - **Tiêu chí chấp nhận:**
    - [x] Không còn vi phạm DB CHECK constraint khi phê duyệt Business.
  - **Tệp:** `src/database/migrations/38_business_inquiries_and_renewals_v3.sql`, `src/app/api/admin/organizations/approve/route.ts`.

---

## Phase 1: Toàn Vẹn AI Grading & Quyền Lợi Khảo Thí P1

- [x] **Task 1.1: Sửa Bug `itemId` Rubric Query trong `/api/ai/grade-submission` (P1-01)**
  - **Mô tả:** Trong `src/app/api/ai/grade-submission/route.ts`:
    1. Đổi dòng 189 `.eq('item_id', itemId)` thành `.eq('item_id', targetItemId)`.
  - **Tiêu chí chấp nhận:**
    - [x] Chấm bài tự luận thành công khi request omit `itemId`.
    - [x] Không bị lỗi 400 Rubric missing khi câu hỏi có Rubric hợp lệ.
  - **Tệp:** `src/app/api/ai/grade-submission/route.ts`.

- [x] **Task 1.2: Xử Lý `saveError` Fail-Closed & Hoàn Credits Cho AI Grading (P1-02)**
  - **Mô tả:** Trong `src/app/api/ai/grade-submission/route.ts`:
    1. Nếu `ai_evaluations.insert` gặp `saveError`:
       - Gọi `settleOrReleaseCredits(..., 'RELEASE')` để hoàn trả 1 credit.
       - Không cập nhật `grading_status = 'AI_DRAFT'`.
       - Trả về HTTP 500 `{ error: 'Lỗi lưu bản ghi chấm bài AI...' }`.
  - **Tiêu chí chấp nhận:**
    - [x] Tuyệt đối không trả `success: true` khi DB không lưu được kết quả chấm.
    - [x] Hoàn credit an toàn cho người dùng khi xảy ra lỗi hệ thống.
  - **Tệp:** `src/app/api/ai/grade-submission/route.ts`.

- [x] **Task 1.3: Cung Cấp Phân Hệ Gia Hạn Gói Business (P1-03a)**
  - **Mô tả:** Hoàn thiện:
    1. Tạo API `POST /api/organizations/[orgId]/renewal-requests` (status: `PENDING`).
    2. Tạo API `POST /api/admin/business/renewals/[id]/approve` với thuật toán nối dài hạn dùng an toàn $\max(\text{now}, \text{current}) + \text{period}$.
    3. Tạo giao diện `/org/[slug]/plan` và modal gia hạn thực tế.
  - **Tệp:** `src/app/api/organizations/[orgId]/renewal-requests/route.ts`, `src/app/api/admin/business/renewals/`.

- [x] **Task 1.4: Bổ Sung Nút "Gia Hạn / Nâng Cấp" Trên `/personal/billing` (P1-03b)**
  - **Mô tả:** Trong `src/app/(dashboard)/personal/billing/page.tsx`:
    1. Thay thế nút disabled "Đang sử dụng" bằng nút "Gia hạn gói" khi người dùng đang có gói PRO trả phí.
    2. Kết nối tới luồng thanh toán payOS gia hạn cộng dồn an toàn.
  - **Tệp:** `src/app/(dashboard)/personal/billing/page.tsx`.

- [x] **Task 1.5: Đóng Gói Transaction Kích Hoạt Tổ Chức (P1-04)**
  - **Mô tả:** Đảm bảo toàn bộ quá trình phê duyệt tổ chức (Inquiry -> Org -> Entitlement -> Invitation) có khả năng phục hồi hoàn toàn hoặc rollback an toàn.
  - **Tệp:** `src/app/api/admin/organizations/approve/route.ts`.

---

## Phase 2: Toàn Vẹn Dữ Liệu Personal Dashboard (P1-05)

- [x] **Task 2.1: Xóa Bỏ Baseline ID Giả & Điều Kiện Hóa Hero Banner (P1-05a)**
  - **Mô tả:** Trong `src/app/(dashboard)/personal/dashboard/page.tsx`:
    1. Xóa bỏ fallback `assessments[0]?.id || 'baseline-assessment'`.
    2. Nếu không có bài khảo thí đầu vào published, hiển thị thông báo "Chưa mở đợt khảo thí", disable nút.
    3. Chỉ hiển thị Hero Banner "Thiết lập Hồ sơ Năng lực Số Ban Đầu" khi `competencyProfile?.hasTakenAssessment === false`. Khi đã đánh giá, chuyển sang Hero "Tiếp tục Lộ trình Bồi dưỡng Năng lực Số".
  - **Tệp:** `src/app/(dashboard)/personal/dashboard/page.tsx`.

- [x] **Task 2.2: Động Hóa Stepper 5 Miền Theo Kết Quả RadarData Thực (P1-05b)**
  - **Mô tả:** Trong `src/app/(dashboard)/personal/dashboard/page.tsx`:
    1. Xóa bỏ mảng stepper hardcode D1 `active: true`.
    2. Tính toán động từ `currentRadarData`: miền $\ge 70\%$ đánh dấu Đạt chuẩn, miền điểm thấp nhất/chưa đạt đánh dấu Cần ưu tiên (`active`).
  - **Tệp:** `src/app/(dashboard)/personal/dashboard/page.tsx`.

- [x] **Task 2.3: Chuẩn Hóa Milestone Học Tập & Filter Leaderboard Theo Kỳ (P1-05c)**
  - **Mô tả:**
    1. Mốc học tập `m2`: kiểm tra số bài đánh giá/học phần hoàn thành thực tế (`totalAssessmentsCompleted > 0`), tuyệt đối không dùng `stats.points > 1`.
    2. Leaderboard: truyền query `?period=${leaderboardTab}` (`week`, `month`, `all`) vào API `/api/leaderboard` và lọc dữ liệu thật từ DB.
  - **Tệp:**
    - `src/app/(dashboard)/personal/dashboard/page.tsx`
    - `src/app/api/leaderboard/route.ts`.

---

## Phase 3: Tinh Gọn UI Components (P2-01) & Chuẩn Hóa Tài Liệu (P2-02)

- [x] **Task 3.1: Tinh Gọn & Đảm Bảo Tính Toàn Vẹn Personal Dashboard (P2-01)**
  - **Mô tả:** Refactor các hook và state của `personal/dashboard/page.tsx`, đảm bảo code sạch sẽ, tuân thủ bảng màu Cobalt/Neutral AA (4 KPI cards trung tính, loại bỏ màu cầu vồng không cần thiết).
  - **Tệp:** `src/app/(dashboard)/personal/dashboard/page.tsx`.

- [x] **Task 3.2: Chuẩn Hóa Tài Liệu `AGENTS.md` & Cập Nhật Mô Hình Sản Phẩm (P2-02)**
  - **Mô tả:**
    1. Cập nhật `AGENTS.md` loại bỏ yêu cầu "hợp đồng bắt buộc", chuyển sang mô hình SaaS B2B Entitlements & Subscription tự động.
    2. Tạo file `docs/PRODUCT_MODEL.md` ghi nhận mô hình SaaS 3 không gian chuẩn mực.
  - **Tệp:** `AGENTS.md`, `docs/PRODUCT_MODEL.md`.

- [x] **Task 3.3: Verification Suite Toàn Diện & Quality Gates**
  - **Mô tả:** Chạy typecheck và toàn bộ unit & integration tests.
  - **Tiêu chí chấp nhận:** 100% tests passed.

---

## Phase 4: Tái Thiết Kế Trang Báo Cáo Năng Lực Tổ Chức (Organization Analytics v3.0)

> **Căn cứ đặc tả:** [`c:\Users\CPS\Downloads\NEXA_ORG_ANALYTICS_UI_UX_SPEC.md`](file:///c:/Users/CPS/Downloads/NEXA_ORG_ANALYTICS_UI_UX_SPEC.md) & [`NEXA_ORG_ANALYTICS_REVIEW.md`](file:///C:/Users/CPS/.gemini/antigravity/brain/5967b905-56c1-43f9-aed6-d8983c518bc7/NEXA_ORG_ANALYTICS_REVIEW.md)

- [x] **Task 4.1: Mở Rộng Service & Types Cho Phân Tích Đa Chiều**
  - **Mô tả:** Mở rộng `src/features/analytics/services/org-competency-analytics.service.ts` và tạo `src/features/analytics/types/org-analytics.types.ts`:
    1. Định nghĩa types: `UnitCompetencyMetric`, `CampaignCompetencyMetric`, `TimeSeriesTrendPoint`, `OrgAnalyticsFilters`.
    2. Thêm phương thức `aggregateByUnit(...)`: gom bài nộp theo lớp/đơn vị, tính điểm TB, tỷ lệ đạt, số bài.
    3. Thêm phương thức `aggregateByCampaign(...)`: gom bài nộp theo từng chiến dịch/kỳ đánh giá.
    4. Thêm phương thức `aggregateTimeSeriesTrend(...)`: tạo chuỗi thời gian xu hướng theo kỳ/tháng, chỉ tạo mốc khi có dữ liệu thật (không nội suy 0% giả).
    5. Viết unit test bao phủ toàn bộ các phương thức mới.
  - **Tệp:** `src/features/analytics/types/org-analytics.types.ts`, `src/features/analytics/services/org-competency-analytics.service.ts`, `src/features/analytics/services/org-competency-analytics.service.test.ts`.

- [x] **Task 4.2: Xây Dựng UI Components Báo Cáo Chuẩn B2B SaaS**
  - **Mô tả:** Xây dựng các component giao diện theo phong cách SaaS tối giản, bảng màu trung tính, xanh Cobalt `#245FE5` / `#2563EB`, hỗ trợ dark mode:
    1. `DomainCompetencyTable.tsx`: Bảng dữ liệu 5 miền cốt lõi (D1-D5) thay cho 5 thanh tiến độ lặp lại; click dòng mở Drawer.
    2. `DomainDetailDrawer.tsx`: Slide-out Drawer hiển thị chi tiết miền năng lực, hỗ trợ đóng phím Escape/X/Backdrop.
    3. `UnitComparisonTable.tsx`: Bảng so sánh năng lực giữa các đơn vị/lớp.
    4. `CampaignAnalyticsView.tsx`: Thống kê danh sách các đợt đánh giá.
    5. `TrendAnalysisView.tsx`: Biểu đồ/bảng xu hướng năng lực theo thời gian nét mảnh.
    6. `ExportReportModal.tsx`: Modal xuất báo cáo (PDF/CSV) có preview, vô hiệu hóa khi 0 bài hợp lệ.
    7. `OrgAnalyticsFilterDrawer.tsx`: Drawer trượt quản lý bộ lọc theo đợt và đơn vị.
    8. `OrgAnalyticsDashboard.tsx`: Container điều phối tabs, drawers, filters và empty state tập trung.
  - **Tệp:** `src/features/analytics/components/*`.

- [x] **Task 4.3: Tái Cấu Trúc Trang `/org/[slug]/analytics/page.tsx`**
  - **Mô tả:** Tích hợp toàn diện các thành phần vào trang quản trị:
    1. Đọc URL `searchParams` (`tab`, `campaignId`, `classId`).
    2. Query dữ liệu tổ chức: `evaluator_classes` với `class_members`, `assessment_campaigns`, `assessment_submissions`.
    3. Empty State tập trung chuẩn mực khi chưa có bài thi nào được duyệt.
    4. 3 KPI metrics chính xác: Lượt đánh giá hợp lệ, Điểm trung bình, Tỷ lệ đạt chuẩn (loại bỏ hoàn toàn thẻ tĩnh "Khung chuẩn DigComp").
    5. Thanh Tab 4 chế độ: Tổng quan, Theo đơn vị, Theo đợt đánh giá, Xu hướng.
    6. Tích hợp thanh lọc chung và modal xuất báo cáo.
  - **Tệp:** `src/app/(dashboard)/org/[slug]/analytics/page.tsx`.

- [x] **Task 4.4: Xây Dựng Endpoint Server-Side Xuất Báo Cáo An Toàn**
  - **Mô tả:** Tạo `/api/org/[slug]/analytics/export/route.ts` với bảo vệ phân quyền `requireOrgPagePermission(slug, 'VIEW_ANALYTICS')` và query scoped theo `organization_id`, sinh file CSV có UTF-8 BOM chuẩn tiếng Việt.
  - **Tệp:** `src/app/api/org/[slug]/analytics/export/route.ts`, `src/app/api/org/[slug]/analytics/export/route.test.ts`.

- [x] **Task 4.5: Kiểm Thử Toàn Diện & Typecheck**
  - **Mô tả:** Chạy `npm test` và `npm run typecheck`, kiểm tra tính toàn vẹn và độ tương thích giao diện.
  - **Kết quả:** 47 test files passed (269 tests 100% green), typecheck 0 lỗi.
