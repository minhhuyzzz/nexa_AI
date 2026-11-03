# Danh Sách Nhiệm Vụ: Đồng Bộ Assessment Authoring V2 & Tối Ưu Toàn Diện Organization Dashboard

> **Căn cứ kế hoạch:** [`tasks/plan.md`](file:///c:/nexa/tasks/plan.md)  
> **Quy chuẩn:** [`AGENTS.md`](file:///c:/nexa/AGENTS.md) — Không số liệu giả/ID giả, Thang điểm /100, Light `#FFFFFF`, Dark `#000000`/`#111114`, Cobalt `#2563EB`, zero AI slop.

---

## Giai đoạn P0: Vá Các Lỗ Hổng & Điểm Nghẽn Nghiệp Vụ Nghiêm Trọng (Stop-the-line)

- [x] **Task P0.1: Xóa bỏ fallback ID giả `a1`, `a2` trong `AssignAssessmentModal.tsx`**
  - **Mô tả:** Loại bỏ hoàn toàn mảng mock `DEFAULT_ASSESSMENTS` với ID `a1`, `a2`. Nếu tổ chức chưa có đề nào sẵn sàng (`availableAssessments.length === 0`), hiển thị empty state có hướng dẫn tạo đề mới thay vì đưa ra ID giả gây lỗi khi lưu bài.
  - **Acceptance criteria:**
    - [x] Xóa bỏ `DEFAULT_ASSESSMENTS` (`a1`, `a2`).
    - [x] Khi danh sách đề rỗng, hiển thị empty state thông báo rõ ràng kèm link tạo đề.
    - [x] Không còn bất kỳ ID giả nào được gửi lên server.
  - **Verification:** `npm run typecheck`
  - **Files:** `src/components/dashboard/org/classes/AssignAssessmentModal.tsx`

- [x] **Task P0.2: Sửa lỗi điểm 0 bị biến thành 70 trong Bàn chấm bài**
  - **Mô tả:** Trong `OrgGradingClientView.tsx`, sửa phép toán `sub.total_score || 70` thành `sub.total_score ?? null`. Giữ nguyên điểm 0 hợp lệ và điểm `null` khi chưa chấm.
  - **Acceptance criteria:**
    - [x] `sub.total_score` bằng 0 phải hiển thị đúng là 0 điểm, không bị fallback thành 70.
    - [x] Khi chưa chấm (`null` hoặc `undefined`), hiển thị trạng thái "Chờ chấm" hoặc "—".
  - **Verification:** `npm run typecheck`
  - **Files:** `src/app/(dashboard)/org/[slug]/grading/OrgGradingClientView.tsx`

- [x] **Task P0.3: Sửa query bài nộp đề công khai trong Bàn chấm bài**
  - **Mô tả:** Trong `src/app/(dashboard)/org/[slug]/grading/page.tsx`, mở rộng truy vấn bài nộp để lấy cả các bài làm của đề chuẩn công khai được giao trong các đợt (`assessment_campaigns`) hoặc lớp học của tổ chức.
  - **Acceptance criteria:**
    - [x] Bài nộp của học viên trong tổ chức làm đề công khai vẫn xuất hiện đầy đủ trong bàn chấm bài của tổ chức.
  - **Verification:** `npm run typecheck`
  - **Files:** `src/app/(dashboard)/org/[slug]/grading/page.tsx`

- [x] **Task P0.4: Sửa logic trạng thái đợt đánh giá theo thời gian thực**
  - **Mô tả:** Trong `src/app/api/organizations/[orgId]/campaigns/route.ts` và các truy vấn liên quan, đợt có `starts_at > now()` phải được gán trạng thái `UPCOMING`, chỉ gán `ACTIVE` khi `starts_at <= now() <= ends_at`.
  - **Acceptance criteria:**
    - [x] Đợt thi có ngày bắt đầu tương lai không tự động kích hoạt `ACTIVE`.
  - **Verification:** `npm run typecheck`
  - **Files:** `src/app/api/organizations/[orgId]/campaigns/route.ts`

---

## Giai đoạn P1: Nâng Cấp Trình Soạn Thảo Đề (Assessment Authoring V2) & Grading Engine

- [x] **Task P1.1: Chuẩn hóa TypeScript Types cho Authoring V2**
  - **Mô tả:** Cập nhật `src/features/assessments/types/authoring-v2.types.ts` để hỗ trợ 2 loại câu hỏi: `CHOICE` và `OPEN_RESPONSE`. Thêm trường `context?: string` (bối cảnh tình huống tùy chọn), `submission_modes: ('TEXT' | 'FILE' | 'URL')[]`, và `rubric?: AuthoringRubricCriterion[]`.
  - **Acceptance criteria:**
    - [x] Định nghĩa đầy đủ kiểu dữ liệu theo đặc tả `NEXA_ASSESSMENT_AUTHORING_UX_PRODUCT_SPEC.md`.
    - [x] Duy trì tương thích ngược với dữ liệu cũ trong Supabase.
  - **Verification:** `npm run typecheck`
  - **Files:** `src/features/assessments/types/authoring-v2.types.ts`

- [x] **Task P1.2: Thiết kế lại Editor 2 cột (`AuthoringEditorTwoPane.tsx`)**
  - **Mô tả:** Chuyển bộ chọn loại câu hỏi thành 2 loại rõ ràng (Trắc nghiệm & Tự luận / Thực hành). Thêm công tắc bối cảnh tình huống cho mọi loại câu hỏi. Xây dựng form cấu hình phương thức nộp bài và tiêu chí Rubric cho câu tự luận/thực hành.
  - **Acceptance criteria:**
    - [x] Chỉ hiển thị 2 loại câu hỏi: Trắc nghiệm và Tự luận / Thực hành.
    - [x] Có thể bật/tắt trường "Bối cảnh tình huống" (Context) cho từng câu.
    - [x] Câu tự luận/thực hành cho phép chọn hình thức nộp (Text, File, URL) và thiết lập tiêu chí Rubric.
    - [x] Hiển thị tổng điểm /100 kèm cảnh báo và nút "Cân bằng về 100", không tự ý cân bằng ngầm.
  - **Verification:** `npm run typecheck`
  - **Files:** `src/components/dashboard/authoring/AuthoringEditorTwoPane.tsx`

- [x] **Task P1.3: Cập nhật Trình xem bài nộp & Grading Engine cho câu hỏi mở**
  - **Mô tả:** Hỗ trợ giao diện nộp bài cho học viên (Personal) tiếp nhận Text, tải tệp, hoặc nhập URL. Phân tách logic chấm: Trắc nghiệm tự chấm điểm ngay; Tự luận/Thực hành chuyển trạng thái `PENDING` và điểm `null`.
  - **Acceptance criteria:**
    - [x] Giao diện làm bài hiển thị đúng input tương ứng với `submission_modes`.
    - [x] Điểm trắc nghiệm tự chấm ngay khi nộp.
    - [x] Câu tự luận để điểm `null` chờ thẩm định qua Rubric.
  - **Verification:** `npm run typecheck` & `npm test`
  - **Files:** `src/components/dashboard/submissions/`, `src/features/assessments/`

---

## Giai đoạn P2: Thống Nhất Luồng Giao Đánh Giá / Tạo Đợt Khảo Thí (1 Form Duy Nhất)

- [x] **Task P2.1: Tinh gọn Form Tạo Đợt Khảo Thí (Loại bỏ Wizard 5 bước)**
  - **Mô tả:** Thay thế `CampaignWizardClient.tsx` bằng 1 form duy nhất trên 1 trang gồm: Tên đợt (tùy biến), Chọn đề, Chọn lớp/nhóm, Thời gian & Ngưỡng đạt, kèm xem trước tóm tắt và nút Phát hành.
  - **Acceptance criteria:**
    - [x] Không còn phân trang 5 bước phức tạp.
    - [x] Admin nhập tên đợt tự do (không áp đặt Kỳ 1/Kỳ 2).
    - [x] Chọn được đề và nhiều lớp học cùng lúc.
  - **Verification:** `npm run typecheck`
  - **Files:** `src/app/(dashboard)/org/[slug]/campaigns/new/page.tsx`, `src/app/(dashboard)/org/[slug]/campaigns/CampaignWizardClient.tsx`

- [x] **Task P2.2: Đồng bộ hành động "Giao đề" từ Lớp và Thư viện đề**
  - **Mô tả:** Khi bấm "Giao đánh giá" từ trang Lớp (`/org/[slug]/classes/[id]`), điều hướng sang form tạo đợt với lớp đã được chọn sẵn. Khi bấm "Tạo đợt từ đề" từ thư viện đề, điều hướng sang form tạo đợt với đề đã được chọn sẵn.
  - **Acceptance criteria:**
    - [x] Điều hướng mượt mà, query params điền sẵn đúng thông tin.
    - [x] Không còn luồng tạo giao đề rời rạc không gắn với chiến dịch.
  - **Verification:** `npm run typecheck`
  - **Files:** `src/components/dashboard/org/classes/OrgClassDetailView.tsx`, `src/app/(dashboard)/org/[slug]/assessments/page.tsx`

---

## Giai đoạn P3: Hoàn Thiện Bàn Chấm Bài 3 Cột & Báo Cáo Năng Lực 5 Miền

- [x] **Task P3.1: Hoàn thiện Bàn chấm bài 3 cột (`/org/[slug]/grading`)**
  - **Mô tả:** Tối ưu hóa giao diện 3 cột: Cột 1 = Hàng đợi chỉ chứa bài nộp có câu tự luận/thực hành; Cột 2 = Trình xem minh chứng đa phương tiện (văn bản, tệp, link); Cột 3 = Bảng chấm điểm Rubric theo tiêu chí /100.
  - **Acceptance criteria:**
    - [x] Bài 100% trắc nghiệm tự hoàn tất, không bị đưa vào hàng đợi chấm thủ công.
    - [x] Xem rõ ràng văn bản, tệp đính kèm và link nộp bài của học viên.
    - [x] Chấm theo từng tiêu chí Rubric và phê duyệt điểm chính thức.
  - **Verification:** `npm run typecheck`
  - **Files:** `src/app/(dashboard)/org/[slug]/grading/OrgGradingClientView.tsx`

- [x] **Task P3.2: Báo cáo năng lực trung thực theo 5 miền DigComp (`/org/[slug]/analytics`)**
  - **Mô tả:** Cập nhật trang báo cáo: bộ lọc theo Đợt thi & Lớp/Nhóm, hiển thị điểm trung bình 5 miền chuẩn DigComp, loại bỏ các biểu đồ xu hướng giả lập. Khi chưa có dữ liệu, hiển thị empty state trung thực.
  - **Acceptance criteria:**
    - [x] Báo cáo hiển thị 5 miền năng lực số DigComp.
    - [x] Điểm số trung bình /100 chuẩn xác.
    - [x] Không tạo số liệu giả khi chưa có bài nộp.
  - **Verification:** `npm run typecheck`
  - **Files:** `src/features/analytics/components/OrgAnalyticsDashboard.tsx`, `src/app/(dashboard)/org/[slug]/analytics/page.tsx`

---

## Giai đoạn P4: Tối Ưu Hóa Các Trang Còn Lại (Tổng Quan, Thành Viên, Gói, Cài Đặt) & Kiểm Thử Toàn Diện

- [x] **Task P4.1: Tinh chỉnh Màn 1 Tổng Quan, Màn 2 Thành Viên, Màn 8 Gói & Màn 9 Cài Đặt**
  - **Mô tả:** Đảm bảo toàn bộ 9 màn hình tuân thủ tuyệt đối quy tắc giao diện trong `AGENTS.md`: không AI slop, màu Cobalt `#2563EB`, Dark mode `#000000`, hiển thị dữ liệu thật và các empty state đúng nghĩa.
  - **Acceptance criteria:**
    - [x] Tổng quan: hàng chờ công việc và trạng thái vận hành rõ ràng, sửa lỗi query `assessment_submissions` không có `organization_id`.
    - [x] Thành viên: bảng thành viên toàn màn hình, drawer chi tiết, sửa query `class_code` chuẩn xác.
    - [x] Gói sử dụng & Cài đặt: rõ ràng hạn mức, không mập mờ `0/0`.
  - **Verification:** `npm run typecheck`
  - **Files:** `src/app/(dashboard)/org/[slug]/page.tsx`, `src/app/(dashboard)/org/[slug]/members/page.tsx`, `src/app/(dashboard)/org/[slug]/plan/page.tsx`, `src/app/(dashboard)/org/[slug]/settings/page.tsx`

- [x] **Task P4.2: Chạy toàn bộ Test Suites & Kiểm Tra Hồi Quy**
  - **Mô tả:** Chạy `npm run typecheck` và `npm test` để xác nhận toàn bộ hệ thống kiểm thử tự động vượt qua 100% với 0 lỗi.
  - **Acceptance criteria:**
    - [x] `tsc --noEmit` hoàn thành với 0 lỗi.
    - [x] `vitest` pass toàn bộ các bộ test (47/47 suites, 271/271 tests).
  - **Verification:** `npm run typecheck` && `npm test`
